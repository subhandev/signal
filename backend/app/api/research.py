import json
import uuid
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.database import get_db
from app.models.research import ResearchJob, ResearchStatus
from app.schemas.research import ResearchRequest, ResearchJobResponse
from app.agent.executor import run_research_agent

router = APIRouter(prefix="/api/research", tags=["research"])
limiter = Limiter(key_func=get_remote_address)


@router.post("", response_model=ResearchJobResponse)
@limiter.limit("10/hour")
async def start_research(request: Request, body: ResearchRequest, db: AsyncSession = Depends(get_db)):
    job_id = str(uuid.uuid4())
    job = ResearchJob(id=job_id, query=body.query, mode=body.mode, status=ResearchStatus.PENDING)
    db.add(job)
    await db.commit()
    await db.refresh(job)

    return ResearchJobResponse(
        job_id=job.id,
        status=job.status,
        query=job.query,
        mode=job.mode,
        created_at=job.created_at,
    )


@router.get("/{job_id}/stream")
@limiter.limit("20/hour")
async def stream_research(request: Request, job_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(ResearchJob).where(ResearchJob.id == job_id))
    job = result.scalar_one_or_none()

    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    async def generate():
        async for event in run_research_agent(job, db):
            yield event

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@router.get("/{job_id}", response_model=ResearchJobResponse)
async def get_research_job(job_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(ResearchJob).where(ResearchJob.id == job_id))
    job = result.scalar_one_or_none()

    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    report = json.loads(job.report) if job.report else None

    return ResearchJobResponse(
        job_id=job.id,
        status=job.status,
        query=job.query,
        mode=job.mode,
        created_at=job.created_at,
        report=report,
    )


@router.get("", response_model=list[ResearchJobResponse])
async def list_research_jobs(db: AsyncSession = Depends(get_db), limit: int = 20):
    result = await db.execute(
        select(ResearchJob).order_by(ResearchJob.created_at.desc()).limit(limit)
    )
    jobs = result.scalars().all()

    return [
        ResearchJobResponse(
            job_id=j.id,
            status=j.status,
            query=j.query,
            mode=j.mode,
            created_at=j.created_at,
        )
        for j in jobs
    ]
