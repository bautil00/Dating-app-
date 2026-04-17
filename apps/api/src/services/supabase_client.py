from supabase import create_client, Client
from functools import lru_cache


@lru_cache()
def get_settings():
    from ..config import get_settings as _get_settings

    return _get_settings()


@lru_cache()
def get_supabase() -> Client:
    settings = get_settings()
    return create_client(settings.supabase_url, settings.supabase_key)
