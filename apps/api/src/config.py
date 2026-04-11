from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    app_name: str = "BLOWTORCH API"
    debug: bool = True
    database_url: str = "postgresql://user:pass@localhost:5432/blowtorch"
    secret_key: str = "change-me-in-production"
    access_token_expire_minutes: int = 30

    class Config:
        env_file = ".env"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
