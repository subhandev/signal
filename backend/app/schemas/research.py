from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from app.models.research import ResearchStatus, ResearchMode


class ResearchRequest(BaseModel):
    query: str
    mode: ResearchMode = ResearchMode.STANDARD


class Source(BaseModel):
    title: str
    url: str
    snippet: Optional[str] = None


class ReportSection(BaseModel):
    heading: str
    content: str


class StructuredReport(BaseModel):
    executive_summary: str
    key_findings: List[str]
    detailed_analysis: List[ReportSection]
    market_context: str
    risks_and_gaps: str
    confidence_level: str
    confidence_rationale: str
    sources: List[Source]
    generated_at: str
    query: str
    mode: str


class ResearchJobResponse(BaseModel):
    job_id: str
    status: ResearchStatus
    query: str
    mode: ResearchMode
    created_at: datetime
    report: Optional[StructuredReport] = None

    class Config:
        from_attributes = True


class GalleryItem(BaseModel):
    job_id: str
    query: str
    mode: str
    confidence_level: Optional[str] = None
    executive_summary: Optional[str] = None
    first_finding: Optional[str] = None
    source_count: int
    created_at: datetime

    class Config:
        from_attributes = True
