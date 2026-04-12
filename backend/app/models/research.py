import enum
from sqlalchemy import Column, String, DateTime, Text, Enum
from sqlalchemy.sql import func
from app.database import Base


class ResearchStatus(str, enum.Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETE = "complete"
    FAILED = "failed"


class ResearchMode(str, enum.Enum):
    QUICK = "quick"
    STANDARD = "standard"
    DEEP = "deep"


class ResearchJob(Base):
    __tablename__ = "research_jobs"

    id = Column(String, primary_key=True)
    query = Column(String, nullable=False)
    mode = Column(Enum(ResearchMode), default=ResearchMode.STANDARD, nullable=False)
    status = Column(Enum(ResearchStatus), default=ResearchStatus.PENDING, nullable=False)
    report = Column(Text, nullable=True)
    error = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
