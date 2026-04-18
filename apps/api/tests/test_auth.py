"""Tests for authentication endpoints."""
from unittest.mock import patch, MagicMock


class TestRegister:
    def test_register_success(self, client, mock_supabase_response):
        mock_resp = mock_supabase_response(200, {
            "access_token": "tok123",
            "user": {"id": "u1", "email": "a@test.com"},
        })
        with patch("httpx.Client") as MockClient:
            MockClient.return_value.__enter__ = lambda s: s
            MockClient.return_value.__exit__ = MagicMock(return_value=False)
            MockClient.return_value.post.return_value = mock_resp

            res = client.post("/api/v1/auth/register", json={
                "email": "a@test.com", "password": "pass123"
            })
        assert res.status_code == 200
        assert "access_token" in res.json()

    def test_register_duplicate_email(self, client, mock_supabase_response):
        mock_resp = mock_supabase_response(400, {"error": "already registered"})
        with patch("httpx.Client") as MockClient:
            MockClient.return_value.__enter__ = lambda s: s
            MockClient.return_value.__exit__ = MagicMock(return_value=False)
            MockClient.return_value.post.return_value = mock_resp

            res = client.post("/api/v1/auth/register", json={
                "email": "dup@test.com", "password": "pass123"
            })
        assert res.status_code == 400


class TestLogin:
    def test_login_success(self, client, mock_supabase_response):
        mock_resp = mock_supabase_response(200, {
            "access_token": "tok456",
            "user": {"id": "u2", "email": "b@test.com"},
        })
        with patch("httpx.Client") as MockClient:
            MockClient.return_value.__enter__ = lambda s: s
            MockClient.return_value.__exit__ = MagicMock(return_value=False)
            MockClient.return_value.post.return_value = mock_resp

            res = client.post("/api/v1/auth/login", json={
                "email": "b@test.com", "password": "pass123"
            })
        assert res.status_code == 200
        assert "access_token" in res.json()

    def test_login_wrong_password(self, client, mock_supabase_response):
        mock_resp = mock_supabase_response(401, {"error": "invalid"})
        with patch("httpx.Client") as MockClient:
            MockClient.return_value.__enter__ = lambda s: s
            MockClient.return_value.__exit__ = MagicMock(return_value=False)
            MockClient.return_value.post.return_value = mock_resp

            res = client.post("/api/v1/auth/login", json={
                "email": "b@test.com", "password": "wrong"
            })
        assert res.status_code == 401


class TestMe:
    def test_me_valid_token(self, client, mock_supabase_response):
        mock_resp = mock_supabase_response(200, {
            "id": "u1", "email": "a@test.com"
        })
        with patch("httpx.Client") as MockClient:
            MockClient.return_value.__enter__ = lambda s: s
            MockClient.return_value.__exit__ = MagicMock(return_value=False)
            MockClient.return_value.get.return_value = mock_resp

            res = client.get("/api/v1/auth/me", headers={
                "Authorization": "Bearer valid-token"
            })
        assert res.status_code == 200
        assert res.json()["email"] == "a@test.com"

    def test_me_missing_token(self, client):
        res = client.get("/api/v1/auth/me")
        assert res.status_code == 401

    def test_me_invalid_token(self, client, mock_supabase_response):
        mock_resp = mock_supabase_response(401, {"error": "invalid"})
        with patch("httpx.Client") as MockClient:
            MockClient.return_value.__enter__ = lambda s: s
            MockClient.return_value.__exit__ = MagicMock(return_value=False)
            MockClient.return_value.get.return_value = mock_resp

            res = client.get("/api/v1/auth/me", headers={
                "Authorization": "Bearer bad-token"
            })
        assert res.status_code == 401
