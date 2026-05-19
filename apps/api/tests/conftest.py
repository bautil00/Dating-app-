import pytest
from unittest.mock import MagicMock
from fastapi.testclient import TestClient


@pytest.fixture
def mock_supabase_response():
    """Factory for mock httpx responses."""

    def _make(status_code=200, json_data=None):
        resp = MagicMock()
        resp.status_code = status_code
        resp.json.return_value = json_data or {}
        resp.text = str(json_data)
        return resp

    return _make


@pytest.fixture
def client():
    """FastAPI test client with mocked settings."""
    from src.main import app

    return TestClient(app)


@pytest.fixture
def mock_user_token():
    """Fake auth header."""
    return "Bearer fake-test-token-123"


@pytest.fixture
def fake_user_id():
    return "aaaa-bbbb-cccc-dddd"


@pytest.fixture
def fake_profile():
    return {
        "id": 1,
        "Name": "TestUser",
        "Age": 25,
        "gender": "Male",
        "interests": "Music",
        "Job": "Programmer",
        "is_complete": True,
        "user_id": "aaaa-bbbb-cccc-dddd",
        "seeking_gender": "everyone",
        "Location": None,
        "compatibility_score": 0,
    }
