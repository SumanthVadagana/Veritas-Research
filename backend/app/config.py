from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    APP_NAME: str = "Veritas Research"
    DEBUG: bool = False

    # Database — SQLite for dev, PostgreSQL for prod
    DATABASE_URL: str = "sqlite+aiosqlite:///./veritas.db"

    # Google Gemini — Updated to valid active Gemini models
    GEMINI_API_KEY: str = ""
    GEMINI_FLASH_MODEL: str = "gemini-2.0-flash"
    GEMINI_PRO_MODEL: str = "gemini-2.0-flash"

    # Tavily
    TAVILY_API_KEY: str = ""
    TAVILY_MAX_RESULTS: int = 3

    # CORS
    FRONTEND_URL: str = "http://localhost:3000"

    # Optional features
    USE_LOCAL_NLP: bool = False

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
