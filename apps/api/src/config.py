from pydantic_settings import BaseSettings
from functools import lru_cache
from pathlib import Path


class Settings(BaseSettings):
    app_name: str = "BLOWTORCH API"
    debug: bool = True
    supabase_url: str = "https://your-project.supabase.co"
    supabase_key: str = "your-anon-key"
    supabase_service_key: str = "your-service-key"
    database_url: str = ""
    openai_api_key: str = ""
    vercel_token: str = ""

    class Config:
        env_file = str(Path(__file__).parent.parent / ".env")
        env_file_encoding = "utf-8"
        extra = "ignore"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
