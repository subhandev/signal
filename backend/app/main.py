import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from app.database import init_db
from app.api.research import router as research_router
from app.config import settings

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

limiter = Limiter(key_func=get_remote_address, default_limits=["100/hour"])


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    logger.info(f"SIGNAL API started — {settings.APP_NAME}")
    logger.info(f"Database: {settings.DATABASE_URL[:30]}...")
    logger.info(f"Model: {settings.OPENAI_MODEL}")
    yield
    logger.info("SIGNAL API shutting down")


app = FastAPI(
    title="SIGNAL API",
    description="Autonomous Research & Intelligence Agent",
    version="1.0.0",
    lifespan=lifespan,
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(research_router)


@app.get("/health")
async def health():
    return {"status": "ok", "service": settings.APP_NAME}
