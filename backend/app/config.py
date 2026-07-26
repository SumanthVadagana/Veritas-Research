from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    APP_NAME: str = "Veritas Research"
    DEBUG: bool = False

    # Database — SQLite for dev, PostgreSQL for prod
    DATABASE_URL: str = "sqlite+aiosqlite:///./veritas.db"

    # Google Gemini — Active Gemini models & Key Failover (Keys 1, 2, 3)
    GEMINI_API_KEY: str = ""
    GEMINI_API_KEY_2: str = ""
    GEMINI_API_KEY_3: str = ""
    GEMINI_FLASH_MODEL: str = "gemini-2.0-flash"
    GEMINI_PRO_MODEL: str = "gemini-2.0-flash"

    def get_all_gemini_keys(self) -> list:
        """Return list of configured non-empty Gemini API keys."""
        keys = []
        for k in [self.GEMINI_API_KEY, self.GEMINI_API_KEY_2, self.GEMINI_API_KEY_3]:
            if k and k.strip() and k.strip() != "demo":
                keys.append(k.strip())
        return keys



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
