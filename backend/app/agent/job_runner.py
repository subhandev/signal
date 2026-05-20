"""Run research in the background; stream endpoint replays live events or final DB state."""

import asyncio
import json
from typing import AsyncGenerator

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.agent.executor import run_research_agent, sse
from app.database import AsyncSessionLocal
from app.models.research import ResearchJob, ResearchStatus

_job_queues: dict[str, asyncio.Queue] = {}
_running_jobs: set[str] = set()
_locks: dict[str, asyncio.Lock] = {}


def _lock_for(job_id: str) -> asyncio.Lock:
    if job_id not in _locks:
        _locks[job_id] = asyncio.Lock()
    return _locks[job_id]


async def ensure_research_started(job_id: str) -> None:
    """Start agent once per job (POST and/or stream may call this)."""
    async with _lock_for(job_id):
        if job_id in _running_jobs:
            return
        _running_jobs.add(job_id)
        queue = _job_queues.setdefault(job_id, asyncio.Queue())
        asyncio.create_task(_run_research(job_id, queue))


async def _run_research(job_id: str, queue: asyncio.Queue) -> None:
    try:
        async with AsyncSessionLocal() as db:
            result = await db.execute(select(ResearchJob).where(ResearchJob.id == job_id))
            job = result.scalar_one_or_none()
            if not job:
                await queue.put(sse("error", "Job not found"))
                return
            if job.status in (ResearchStatus.COMPLETE, ResearchStatus.FAILED):
                return

            async for event in run_research_agent(job, db):
                await queue.put(event)
    finally:
        await queue.put(None)
        _running_jobs.discard(job_id)
        _job_queues.pop(job_id, None)


async def stream_job_events(job_id: str, db: AsyncSession) -> AsyncGenerator[str, None]:
    queue = _job_queues.get(job_id)
    if queue is not None:
        while True:
            event = await queue.get()
            if event is None:
                break
            yield event
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

    if job.status == ResearchStatus.RUNNING:
        if job_id in _running_jobs and job_id in _job_queues:
            queue = _job_queues[job_id]
            while True:
                event = await queue.get()
                if event is None:
                    break
                yield event
            return
        job.status = ResearchStatus.PENDING
        await db.commit()

    await ensure_research_started(job_id)
    queue = _job_queues.get(job_id)
    if queue is None:
        yield sse("error", "Could not start research")
        return

    while True:
        event = await queue.get()
        if event is None:
            break
        yield event
