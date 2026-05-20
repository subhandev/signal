"""Delete all research jobs so the database starts fresh.

Usage (from backend/, with DATABASE_URL in .env or the environment):

    python reset_db.py --confirm

Uses the same DATABASE_URL as the API (SQLite locally or Neon in production).
"""
import argparse
import asyncio
import sys

from sqlalchemy import text

from app.config import settings
from app.database import engine


def _db_label() -> str:
    url = settings.DATABASE_URL
    if "sqlite" in url:
        return "SQLite"
    if "neon" in url or "postgres" in url:
        return "PostgreSQL"
    return "database"


async def reset() -> int:
    async with engine.begin() as conn:
        result = await conn.execute(text("DELETE FROM research_jobs"))
        deleted = result.rowcount

    # SQLite often reports -1 for rowcount; re-count is optional
    print(f"Cleared research_jobs on {_db_label()} ({deleted} rows reported deleted).")
    await engine.dispose()
    return 0


def main() -> None:
    parser = argparse.ArgumentParser(description="Wipe all SIGNAL research history.")
    parser.add_argument(
        "--confirm",
        action="store_true",
        help="Required: actually delete all rows.",
    )
    args = parser.parse_args()
    if not args.confirm:
        print("Refusing to run without --confirm (this deletes ALL research jobs).", file=sys.stderr)
        sys.exit(1)
    raise SystemExit(asyncio.run(reset()))


if __name__ == "__main__":
    main()
