from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

_API_ROOT = Path(__file__).resolve().parent.parent


class Settings(BaseSettings):
    app_name: str = "BLOWTORCH"
    
    supabase_url: str = "https://meoeszlzwmjreelusizu.supabase.co"
    supabase_key: str = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1lb2Vzemx6d21qcmVlbHVzaXp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY0NTA3ODYsImV4cCI6MjA5MjAyNjc4Nn0.fc_KhHltSzCMhH46TH9kZA-uIezhQztUqrMvXifs7go"
    
    # Prefer OPENROUTER_API_KEY env (or apps/api/.env locally; GitHub/Vercel in deploy).
    openrouter_api_key: str | None = None
    openai_api_key: str | None = None

    model_config = SettingsConfigDict(
        env_file=str(_API_ROOT / ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )


def get_settings() -> Settings:
    # No lru_cache: serverless warm starts must re-read env (e.g. OPENROUTER_API_KEY from Vercel).
    return Settings()