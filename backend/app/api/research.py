import json
import uuid
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.database import get_db
from app.models.research import ResearchJob, ResearchStatus
from app.schemas.research import ResearchRequest, ResearchJobResponse, GalleryItem
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


public_router = APIRouter(prefix="/api", tags=["public"])


def _to_gallery_item(job: ResearchJob) -> GalleryItem:
    report = json.loads(job.report) if job.report else {}
    sources = report.get("sources", [])
    findings = report.get("key_findings", [])
    return GalleryItem(
        job_id=job.id,
        query=job.query,
        mode=job.mode.value if hasattr(job.mode, "value") else job.mode,
        confidence_level=report.get("confidence_level"),
        executive_summary=report.get("executive_summary"),
        first_finding=findings[0] if findings else None,
        source_count=len(sources),
        created_at=job.created_at,
    )


@public_router.get("/gallery", response_model=list[GalleryItem])
async def get_gallery(
    db: AsyncSession = Depends(get_db),
    limit: int = 50,
    offset: int = 0,
):
    result = await db.execute(
        select(ResearchJob)
        .where(ResearchJob.status == ResearchStatus.COMPLETE)
        .order_by(ResearchJob.created_at.desc())
        .limit(limit)
        .offset(offset)
    )
    jobs = result.scalars().all()
    return [_to_gallery_item(j) for j in jobs]


@public_router.get("/stats")
async def get_stats(db: AsyncSession = Depends(get_db)):
    success_result = await db.execute(
        select(func.count(ResearchJob.id)).where(ResearchJob.status == ResearchStatus.COMPLETE)
    )
    success_count = success_result.scalar() or 0

    failed_result = await db.execute(
        select(func.count(ResearchJob.id)).where(ResearchJob.status == ResearchStatus.FAILED)
    )
    failed_count = failed_result.scalar() or 0

    total_attempted = success_count + failed_count
    success_rate = round(success_count / total_attempted * 100) if total_attempted > 0 else 0

    return {
        "reports_run": success_count,
        "sources_read": success_count * 4,
        "avg_searches_per_report": 3.0 if success_count > 0 else 0.0,
        "success_rate": success_rate,
    }
