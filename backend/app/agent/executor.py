import json
import asyncio
import logging
import re
from datetime import datetime, timezone
from typing import AsyncGenerator

from langchain.agents import AgentExecutor, create_openai_tools_agent
from langchain_openai import ChatOpenAI
from langchain.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain.callbacks.base import BaseCallbackHandler
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models.research import ResearchJob, ResearchStatus, ResearchMode
from app.schemas.research import StructuredReport
from app.tools.search import create_search_tool
from app.tools.scraper import create_scraper_tool
from app.tools.summariser import create_summariser_tool
from app.agent.prompts import SYSTEM_PROMPT, QUICK_ADDENDUM, STANDARD_ADDENDUM, DEEP_ADDENDUM

logger = logging.getLogger(__name__)


def _client_safe_error(e: Exception) -> str:
    """Map an internal exception to a message safe to show end users.

    Provider SDK errors (e.g. OpenAI auth failures) embed the API key —
    even masked — in their message text, so raw str(e) must never reach
    the client. Full detail still goes to the server logs.
    """
    name = type(e).__name__
    msg = str(e)
    if "AuthenticationError" in name or "Incorrect API key" in msg or "invalid_api_key" in msg:
        return "The research service is temporarily unavailable (upstream authentication issue). Please try again later."
    if "RateLimitError" in name or "insufficient_quota" in msg or "429" in msg:
        return "The research service is rate-limited or out of quota right now. Please try again later."
    if isinstance(e, asyncio.TimeoutError) or "timeout" in msg.lower():
        return "Research timed out. Try Quick mode for faster results."
    return "Research failed due to an internal error. Please try again."


def sse(type: str, message: str, **kwargs) -> str:
    payload = {"type": type, "message": message, **kwargs}
    return f"data: {json.dumps(payload)}\n\n"


def get_mode_config(mode: ResearchMode) -> tuple[int, int, str]:
    configs = {
        ResearchMode.QUICK: (
            settings.AGENT_MAX_ITERATIONS_QUICK,
            settings.AGENT_MAX_SCRAPES_QUICK,
            QUICK_ADDENDUM,
        ),
        ResearchMode.STANDARD: (
            settings.AGENT_MAX_ITERATIONS_STANDARD,
            settings.AGENT_MAX_SCRAPES_STANDARD,
            STANDARD_ADDENDUM,
        ),
        ResearchMode.DEEP: (
            settings.AGENT_MAX_ITERATIONS_DEEP,
            settings.AGENT_MAX_SCRAPES_DEEP,
            DEEP_ADDENDUM,
        ),
    }
    return configs[mode]


async def run_research_agent(
    job: ResearchJob,
    db: AsyncSession,
) -> AsyncGenerator[str, None]:

    queue: asyncio.Queue = asyncio.Queue()
    max_iterations, max_scrapes, prompt_addendum = get_mode_config(job.mode)

    class StreamingCallback(BaseCallbackHandler):
        def on_tool_start(self, serialized, input_str, **kwargs):
            name = serialized.get("name", "")
            if name == "web_search":
                queue.put_nowait(sse("search", f"Searching: {input_str}", query=input_str))
            elif name == "scrape_page":
                short_url = input_str[:60] + "..." if len(input_str) > 60 else input_str
                queue.put_nowait(sse("scrape", f"Reading: {short_url}", url=input_str))
            elif name == "summarise_content":
                queue.put_nowait(sse("thinking", "Summarising findings..."))

        def on_llm_start(self, serialized, prompts, **kwargs):
            queue.put_nowait(sse("thinking", "Analysing..."))

        def on_agent_action(self, action, **kwargs):
            queue.put_nowait(sse("thinking", "Deciding next step..."))

    llm = ChatOpenAI(
        model=settings.OPENAI_MODEL,
        api_key=settings.OPENAI_API_KEY,
        temperature=0,
    )

    tools = [
        create_search_tool(),
        create_scraper_tool(max_scrapes=max_scrapes),
        create_summariser_tool(llm),
    ]

    prompt = ChatPromptTemplate.from_messages([
        ("system", SYSTEM_PROMPT + prompt_addendum),
        ("human", "{input}"),
        MessagesPlaceholder(variable_name="agent_scratchpad"),
    ])

    agent = create_openai_tools_agent(llm, tools, prompt)
    executor = AgentExecutor(
        agent=agent,
        tools=tools,
        max_iterations=max_iterations,
        verbose=True,
        callbacks=[StreamingCallback()],
        handle_parsing_errors=True,
    )

    job.status = ResearchStatus.RUNNING
    await db.commit()

    mode_label = job.mode.value if hasattr(job.mode, "value") else job.mode
    yield sse("progress", f"Starting {mode_label} research on: {job.query}")

    timeouts = {
        ResearchMode.QUICK: settings.RESEARCH_TIMEOUT_QUICK,
        ResearchMode.STANDARD: settings.RESEARCH_TIMEOUT_STANDARD,
        ResearchMode.DEEP: settings.RESEARCH_TIMEOUT_DEEP,
    }
    timeout = timeouts.get(job.mode, settings.RESEARCH_TIMEOUT_STANDARD)
    deadline = asyncio.get_event_loop().time() + timeout

    agent_task = asyncio.create_task(_run_agent(executor, job.query))

    while not agent_task.done() or not queue.empty():
        if asyncio.get_event_loop().time() > deadline:
            agent_task.cancel()
            job.status = ResearchStatus.FAILED
            job.error = f"Research timed out after {timeout} seconds"
            await db.commit()
            yield sse("error", f"Research timed out — try Quick mode for faster results")
            return

        try:
            event = queue.get_nowait()
            yield event
        except asyncio.QueueEmpty:
            await asyncio.sleep(0.1)

    try:
        raw_output = await agent_task
        yield sse("synthesising", "Building structured report...")

        report = _parse_report(raw_output, job.query, job.mode)
        job.status = ResearchStatus.COMPLETE
        job.report = json.dumps(report.model_dump())
        await db.commit()

        yield sse("complete", "Research complete", report=report.model_dump())

    except Exception as e:
        logger.exception("Research agent failed for job %s", job.id)
        safe_message = _client_safe_error(e)
        job.status = ResearchStatus.FAILED
        job.error = safe_message
        await db.commit()
        yield sse("error", f"Research failed: {safe_message}")


async def _run_agent(executor: AgentExecutor, query: str) -> str:
    result = await executor.ainvoke({"input": query})
    return result.get("output", "")


def _parse_report(raw: str, query: str, mode: ResearchMode) -> StructuredReport:
    try:
        match = re.search(r'\{.*\}', raw, re.DOTALL)
        if not match:
            raise ValueError("No JSON in agent output")
        data = json.loads(match.group())

        return StructuredReport(
            executive_summary=data.get("executive_summary", ""),
            key_findings=data.get("key_findings", []),
            detailed_analysis=data.get("detailed_analysis", []),
            market_context=data.get("market_context", ""),
            risks_and_gaps=data.get("risks_and_gaps", ""),
            confidence_level=data.get("confidence_level", "Medium"),
            confidence_rationale=data.get("confidence_rationale", ""),
            sources=data.get("sources", []),
            generated_at=datetime.now(timezone.utc).isoformat(),
            query=query,
            mode=mode.value,
        )

    except Exception:
        return StructuredReport(
            executive_summary=raw[:500],
            key_findings=["See detailed analysis"],
            detailed_analysis=[{"heading": "Raw Output", "content": raw}],
            market_context="",
            risks_and_gaps="Report could not be structured — see raw output.",
            confidence_level="Low",
            confidence_rationale="Parsing failed",
            sources=[],
            generated_at=datetime.now(timezone.utc).isoformat(),
            query=query,
            mode=mode.value,
        )
