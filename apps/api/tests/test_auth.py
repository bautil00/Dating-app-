"""Tests for authentication endpoints."""

from unittest.mock import patch, MagicMock


class TestRegister:
    def test_register_success(self, client, mock_supabase_response):
        mock_resp = mock_supabase_response(
            200,
            {
                "access_token": "tok123",
                "user": {"id": "u1", "email": "a@test.com"},
            },
        )
        with patch("httpx.Client") as MockClient:
            MockClient.return_value.__enter__ = lambda s: s
            MockClient.return_value.__exit__ = MagicMock(return_value=False)
            MockClient.return_value.post.return_value = mock_resp

            res = client.post(
                "/api/v1/auth/register",
                json={"email": "a@test.com", "password": "pass123"},
            )
        assert res.status_code == 200
        assert "access_token" in res.json()
        assert res.json()["user"]["email"] == "a@test.com"

    def test_register_duplicate_email(self, client, mock_supabase_response):
        mock_resp = mock_supabase_response(400, {"error": "already registered"})
        with patch("httpx.Client") as MockClient:
            MockClient.return_value.__enter__ = lambda s: s
            MockClient.return_value.__exit__ = MagicMock(return_value=False)
            MockClient.return_value.post.return_value = mock_resp

            res = client.post(
                "/api/v1/auth/register",
                json={"email": "dup@test.com", "password": "pass123"},
            )
        assert res.status_code == 400


class TestLogin:
    def test_login_success(self, client, mock_supabase_response):
        mock_resp = mock_supabase_response(
            200,
            {
                "access_token": "tok456",
                "user": {"id": "u2", "email": "b@test.com"},
            },
        )
        with patch("httpx.Client") as MockClient:
            MockClient.return_value.__enter__ = lambda s: s
            MockClient.return_value.__exit__ = MagicMock(return_value=False)
            MockClient.return_value.post.return_value = mock_resp

            res = client.post(
                "/api/v1/auth/login",
                json={"email": "b@test.com", "password": "pass123"},
            )
        assert res.status_code == 200
        assert "access_token" in res.json()
        assert res.json()["user"]["id"] == "u2"

    def test_login_rejects_missing_password(self, client):
        res = client.post("/api/v1/auth/login", json={"email": "b@test.com"})
        assert res.status_code == 422

    def test_login_rejects_invalid_email(self, client):
        res = client.post(
            "/api/v1/auth/login", json={"email": "not-an-email", "password": "pass123"}
        )
        assert res.status_code == 422

    def test_login_wrong_password(self, client, mock_supabase_response):
        mock_resp = mock_supabase_response(401, {"error": "invalid"})
        with patch("httpx.Client") as MockClient:
            MockClient.return_value.__enter__ = lambda s: s
            MockClient.return_value.__exit__ = MagicMock(return_value=False)
            MockClient.return_value.post.return_value = mock_resp

            res = client.post(
                "/api/v1/auth/login", json={"email": "b@test.com", "password": "wrong"}
            )
        assert res.status_code == 401


class TestMe:
    def test_me_valid_token(self, client, mock_supabase_response):
        mock_resp = mock_supabase_response(200, {"id": "u1", "email": "a@test.com"})
        with patch("httpx.Client") as MockClient:
            MockClient.return_value.__enter__ = lambda s: s
            MockClient.return_value.__exit__ = MagicMock(return_value=False)
            MockClient.return_value.get.return_value = mock_resp

            res = client.get(
                "/api/v1/auth/me", headers={"Authorization": "Bearer valid-token"}
            )
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

            res = client.get(
                "/api/v1/auth/me", headers={"Authorization": "Bearer bad-token"}
            )
        assert res.status_code == 401


class TestCors:
    def test_allows_loopback_dev_server_ports(self, client):
        res = client.options(
            "/api/v1/auth/register",
            headers={
                "Origin": "http://127.0.0.1:3001",
                "Access-Control-Request-Method": "POST",
                "Access-Control-Request-Headers": "authorization,content-type",
            },
        )

        assert res.status_code == 200
        assert res.headers["access-control-allow-origin"] == "http://127.0.0.1:3001"


class TestDeleteAccount:
    def test_delete_account_cleans_data_and_auth_user(
        self, client, mock_supabase_response
    ):
        settings = MagicMock()
        settings.supabase_url = "https://fake.supabase.co"
        settings.supabase_key = "anon-key"
        settings.supabase_service_key = "service-key"

        mock_http = MagicMock()
        mock_http.get.return_value = mock_supabase_response(
            200, {"id": "user-123", "email": "a@test.com"}
        )
        mock_http.delete.return_value = mock_supabase_response(204, {})

        with patch("src.main.get_settings", return_value=settings), patch(
            "httpx.Client"
        ) as MockClient:
            MockClient.return_value.__enter__ = lambda s: mock_http
            MockClient.return_value.__exit__ = MagicMock(return_value=False)

            res = client.delete(
                "/api/v1/auth/me", headers={"Authorization": "Bearer valid-token"}
            )

        assert res.status_code == 200
        assert res.json() == {"status": "deleted"}
        deleted_urls = [call.args[0] for call in mock_http.delete.call_args_list]
        assert (
            "https://fake.supabase.co/rest/v1/messages?sender_id=eq.user-123"
            in deleted_urls
        )
        assert (
            "https://fake.supabase.co/rest/v1/messages?receiver_id=eq.user-123"
            in deleted_urls
        )
        assert (
            "https://fake.supabase.co/rest/v1/matches?sender_id=eq.user-123"
            in deleted_urls
        )
        assert (
            "https://fake.supabase.co/rest/v1/matches?receiver_id=eq.user-123"
            in deleted_urls
        )
        assert (
            "https://fake.supabase.co/rest/v1/user_data?user_id=eq.user-123"
            in deleted_urls
        )
        assert (
            "https://fake.supabase.co/auth/v1/admin/users/user-123" in deleted_urls
        )

    def test_delete_account_requires_service_key(self, client):
        settings = MagicMock()
        settings.supabase_url = "https://fake.supabase.co"
        settings.supabase_key = "anon-key"
        settings.supabase_service_key = ""

        with patch("src.main.get_settings", return_value=settings):
            res = client.delete(
                "/api/v1/auth/me", headers={"Authorization": "Bearer valid-token"}
            )

        assert res.status_code == 500
        assert "Missing Supabase service key" in res.json()["detail"]

    def test_delete_account_rejects_anon_key_as_service_key(self, client):
        settings = MagicMock()
        settings.supabase_url = "https://fake.supabase.co"
        settings.supabase_key = "anon-key"
        settings.supabase_service_key = "anon-key"

        with patch("src.main.get_settings", return_value=settings):
            res = client.delete(
                "/api/v1/auth/me", headers={"Authorization": "Bearer valid-token"}
            )

        assert res.status_code == 500
        assert "service-role key" in res.json()["detail"]

    def test_delete_account_rejects_invalid_token(
        self, client, mock_supabase_response
    ):
        settings = MagicMock()
        settings.supabase_url = "https://fake.supabase.co"
        settings.supabase_key = "anon-key"
        settings.supabase_service_key = "service-key"

        mock_http = MagicMock()
        mock_http.get.return_value = mock_supabase_response(401, {"error": "invalid"})

        with patch("src.main.get_settings", return_value=settings), patch(
            "httpx.Client"
        ) as MockClient:
            MockClient.return_value.__enter__ = lambda s: mock_http
            MockClient.return_value.__exit__ = MagicMock(return_value=False)

            res = client.delete(
                "/api/v1/auth/me", headers={"Authorization": "Bearer bad-token"}
            )

        assert res.status_code == 401
        assert mock_http.delete.call_count == 0
