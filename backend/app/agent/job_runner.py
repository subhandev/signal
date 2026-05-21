"""Run research on the SSE stream so work stays tied to the open HTTP connection (Railway-safe)."""

import asyncio
import json
from typing import AsyncGenerator

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.agent.executor import run_research_agent, sse
from app.database import AsyncSessionLocal
from app.models.research import ResearchJob, ResearchStatus

_running_jobs: set[str] = set()
_locks: dict[str, asyncio.Lock] = {}


def _lock_for(job_id: str) -> asyncio.Lock:
    if job_id not in _locks:
        _locks[job_id] = asyncio.Lock()
    return _locks[job_id]


async def ensure_research_started(job_id: str) -> None:
    """No-op: research runs when the client opens the SSE stream."""
    return


async def stream_job_events(job_id: str, db: AsyncSession) -> AsyncGenerator[str, None]:
    result = await db.execute(select(ResearchJob).where(ResearchJob.id == job_id))
    job = result.scalar_one_or_none()
    if not job:
        yield sse("error", "Job not found")
        return

    if job.status == ResearchStatus.COMPLETE:
        report = json.loads(job.report) if job.report else {}
        yield sse("complete", "Research complete", report=report)
        return

    if job.status == ResearchStatus.FAILED:
        yield sse("error", job.error or "Research failed")
        return

    if job_id in _running_jobs:
        yield sse(
            "error",
            "Research is already running — keep this tab open or wait for it to finish.",
        )
        return

    async with _lock_for(job_id):
        if job_id in _running_jobs:
            yield sse("error", "Research is already running")
            return

        result = await db.execute(select(ResearchJob).where(ResearchJob.id == job_id))
        job = result.scalar_one_or_none()
        if not job:
            yield sse("error", "Job not found")
            return

        if job.status == ResearchStatus.COMPLETE:
            report = json.loads(job.report) if job.report else {}
            yield sse("complete", "Research complete", report=report)
            return

        if job.status == ResearchStatus.FAILED:
            yield sse("error", job.error or "Research failed")
            return

        # Stale RUNNING (e.g. server restart or dropped SSE) — allow a fresh run
        if job.status == ResearchStatus.RUNNING:
            job.status = ResearchStatus.PENDING
            await db.commit()

        _running_jobs.add(job_id)

    try:
        async with AsyncSessionLocal() as agent_db:
            result = await agent_db.execute(
                select(ResearchJob).where(ResearchJob.id == job_id)
            )
            job = result.scalar_one_or_none()
            if not job:
                yield sse("error", "Job not found")
                return
            if job.status in (ResearchStatus.COMPLETE, ResearchStatus.FAILED):
                if job.status == ResearchStatus.COMPLETE:
                    report = json.loads(job.report) if job.report else {}
                    yield sse("complete", "Research complete", report=report)
                else:
                    yield sse("error", job.error or "Research failed")
                return

            async for event in run_research_agent(job, agent_db):
                yield event
    finally:
        _running_jobs.discard(job_id)
