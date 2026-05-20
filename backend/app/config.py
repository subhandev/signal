from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    APP_NAME: str = "SIGNAL"
    DEBUG: bool = False

    DATABASE_URL: str = "sqlite+aiosqlite:///./signal.db"

    OPENAI_API_KEY: str
    OPENAI_MODEL: str = "gpt-4o"

    TAVILY_API_KEY: str

    AGENT_MAX_ITERATIONS_QUICK: int = 15
    AGENT_MAX_ITERATIONS_STANDARD: int = 25
    AGENT_MAX_ITERATIONS_DEEP: int = 40

    AGENT_MAX_SCRAPES_QUICK: int = 2
    AGENT_MAX_SCRAPES_STANDARD: int = 4
    AGENT_MAX_SCRAPES_DEEP: int = 8

    RESEARCH_TIMEOUT_QUICK: int = 90
    RESEARCH_TIMEOUT_STANDARD: int = 180
    RESEARCH_TIMEOUT_DEEP: int = 360

    ALLOWED_ORIGINS: str = "*"

    class Config:
        env_file = ".env"


settings = Settings()
