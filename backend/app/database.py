from urllib.parse import parse_qs, urlencode, urlparse, urlunparse

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase

from app.config import settings

# libpq query params that asyncpg does not accept in the URL
_ASYNCPG_STRIP_QUERY_KEYS = frozenset({"sslmode", "channel_binding", "options"})


def _prepare_async_engine_url(url: str) -> tuple[str, dict]:
    """Normalize Postgres URLs for SQLAlchemy + asyncpg (driver scheme, SSL via connect_args)."""
    if url.startswith("postgresql://"):
        url = "postgresql+asyncpg://" + url[len("postgresql://") :]
    elif url.startswith("postgres://"):
        url = "postgresql+asyncpg://" + url[len("postgres://") :]

    if not url.startswith("postgresql+asyncpg://"):
        return url, {}

    parsed = urlparse(url)
    if not parsed.query:
        return url, {"ssl": True}

    query = parse_qs(parsed.query, keep_blank_values=True)
    connect_args: dict = {}

    sslmode_values = query.pop("sslmode", [])
    if sslmode_values:
        sslmode = sslmode_values[0].lower()
        connect_args["ssl"] = sslmode not in ("disable", "allow", "prefer")
    else:
        connect_args["ssl"] = True

    for key in _ASYNCPG_STRIP_QUERY_KEYS:
        query.pop(key, None)

    flat_query = urlencode([(k, v[0]) for k, v in query.items() if v], doseq=False)
    clean_url = urlunparse(parsed._replace(query=flat_query))
    return clean_url, connect_args


_db_url, _connect_args = _prepare_async_engine_url(settings.DATABASE_URL)

engine = create_async_engine(
    _db_url,
    echo=settings.DEBUG,
    connect_args=_connect_args,
)

AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


class Base(DeclarativeBase):
    pass


async def get_db():
    async with AsyncSessionLocal() as session:
        yield session


async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
