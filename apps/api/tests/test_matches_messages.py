"""Tests for matches listing and messages endpoints."""

from unittest.mock import patch, MagicMock


def _make_resp(status=200, data=None):
    r = MagicMock()
    r.status_code = status
    r.json.return_value = data if data is not None else {}
    r.text = str(data)
    return r


def _mock_httpx(get_returns=None, post_returns=None, patch_returns=None):
    mock = MagicMock()
    mock.__enter__ = lambda s: s
    mock.__exit__ = MagicMock(return_value=False)
    if get_returns:
        mock.get.side_effect = get_returns
    if post_returns:
        mock.post.side_effect = post_returns
    if patch_returns:
        mock.patch.side_effect = patch_returns
    return mock


class TestGetMatches:
    def test_returns_sent_and_received(self, client):
        user_resp = _make_resp(200, {"id": "alice"})
        sent = _make_resp(
            200,
            [
                {
                    "id": 1,
                    "sender_id": "alice",
                    "receiver_id": "bob",
                    "status": "pending",
                },
            ],
        )
        received = _make_resp(
            200,
            [
                {
                    "id": 2,
                    "sender_id": "carol",
                    "receiver_id": "alice",
                    "status": "matched",
                },
            ],
        )
        profiles = _make_resp(
            200,
            [
                {"user_id": "alice", "name": "Alice"},
                {"user_id": "bob", "name": "Bob"},
                {"user_id": "carol", "name": "Carol"},
            ],
        )

        mock = _mock_httpx(get_returns=[user_resp, sent, received, profiles])
        with patch("httpx.Client", return_value=mock):
            res = client.get(
                "/api/v1/matches/", headers={"Authorization": "Bearer tok"}
            )
        assert res.status_code == 200
        assert len(res.json()) == 2
        assert res.json()[0]["other_profile"]["name"] == "Bob"
        assert res.json()[1]["other_profile"]["name"] == "Carol"

    def test_empty_matches(self, client):
        user_resp = _make_resp(200, {"id": "new-user"})
        empty = _make_resp(200, [])

        mock = _mock_httpx(get_returns=[user_resp, empty, empty])
        with patch("httpx.Client", return_value=mock):
            res = client.get(
                "/api/v1/matches/", headers={"Authorization": "Bearer tok"}
            )
        assert res.status_code == 200
        assert res.json() == []

    def test_requires_auth(self, client):
        res = client.get("/api/v1/matches/")
        assert res.status_code == 401


class TestSendMessage:
    def test_send_message(self, client):
        user_resp = _make_resp(200, {"id": "alice"})
        msg_resp = _make_resp(
            201,
            [
                {
                    "id": 1,
                    "sender_id": "alice",
                    "receiver_id": "bob",
                    "content": "Hello!",
                }
            ],
        )

        mock = _mock_httpx(
            get_returns=[user_resp],
            post_returns=[msg_resp],
        )
        with patch("httpx.Client", return_value=mock):
            res = client.post(
                "/api/v1/messages/",
                json={
                    "receiver_id": "bob",
                    "content": "Hello!",
                },
                headers={"Authorization": "Bearer tok"},
            )
        assert res.status_code == 200
        assert res.json()["content"] == "Hello!"

    def test_missing_content(self, client):
        user_resp = _make_resp(200, {"id": "alice"})
        mock = _mock_httpx(get_returns=[user_resp])
        with patch("httpx.Client", return_value=mock):
            res = client.post(
                "/api/v1/messages/",
                json={
                    "receiver_id": "bob",
                    "content": "",
                },
                headers={"Authorization": "Bearer tok"},
            )
        assert res.status_code == 400

    def test_missing_receiver(self, client):
        user_resp = _make_resp(200, {"id": "alice"})
        mock = _mock_httpx(get_returns=[user_resp])
        with patch("httpx.Client", return_value=mock):
            res = client.post(
                "/api/v1/messages/",
                json={
                    "content": "Hello!",
                },
                headers={"Authorization": "Bearer tok"},
            )
        assert res.status_code == 400


class TestGetConversation:
    def test_returns_messages(self, client):
        user_resp = _make_resp(200, {"id": "alice"})
        sent = _make_resp(
            200,
            [
                {
                    "sender_id": "alice",
                    "receiver_id": "bob",
                    "content": "Hi",
                    "created_at": "2026-01-01T00:00:00",
                },
            ],
        )
        received = _make_resp(
            200,
            [
                {
                    "sender_id": "bob",
                    "receiver_id": "alice",
                    "content": "Hey!",
                    "created_at": "2026-01-01T00:01:00",
                },
            ],
        )

        mock = _mock_httpx(get_returns=[user_resp, sent, received])
        with patch("httpx.Client", return_value=mock):
            res = client.get(
                "/api/v1/messages/conversations/bob",
                headers={"Authorization": "Bearer tok"},
            )
        assert res.status_code == 200
        assert len(res.json()) == 2
        assert res.json()[0]["content"] == "Hi"
        assert res.json()[1]["content"] == "Hey!"


class TestMarkMessageRead:
    def test_marks_received_message_read(self, client):
        user_resp = _make_resp(200, {"id": "alice"})
        message_resp = _make_resp(
            200,
            [
                {
                    "id": 9,
                    "sender_id": "bob",
                    "receiver_id": "alice",
                    "content": "Hey",
                    "is_read": False,
                }
            ],
        )
        patch_resp = _make_resp(
            200,
            [
                {
                    "id": 9,
                    "sender_id": "bob",
                    "receiver_id": "alice",
                    "content": "Hey",
                    "is_read": True,
                }
            ],
        )

        mock = _mock_httpx(
            get_returns=[user_resp, message_resp], patch_returns=[patch_resp]
        )
        with patch("httpx.Client", return_value=mock):
            res = client.patch(
                "/api/v1/messages/9/read",
                headers={"Authorization": "Bearer tok"},
            )

        assert res.status_code == 200
        assert res.json()["is_read"] is True

    def test_cannot_mark_sent_message_read(self, client):
        user_resp = _make_resp(200, {"id": "alice"})
        message_resp = _make_resp(
            200,
            [
                {
                    "id": 9,
                    "sender_id": "alice",
                    "receiver_id": "bob",
                    "content": "Hey",
                    "is_read": False,
                }
            ],
        )

        mock = _mock_httpx(get_returns=[user_resp, message_resp])
        with patch("httpx.Client", return_value=mock):
            res = client.patch(
                "/api/v1/messages/9/read",
                headers={"Authorization": "Bearer tok"},
            )

        assert res.status_code == 403

    def test_mark_read_missing_message(self, client):
        user_resp = _make_resp(200, {"id": "alice"})
        message_resp = _make_resp(200, [])

        mock = _mock_httpx(get_returns=[user_resp, message_resp])
        with patch("httpx.Client", return_value=mock):
            res = client.patch(
                "/api/v1/messages/404/read",
                headers={"Authorization": "Bearer tok"},
            )

        assert res.status_code == 404


class TestHealthAndRoot:
    def test_health(self, client):
        res = client.get("/health")
        assert res.status_code == 200
        assert res.json()["status"] == "healthy"

    def test_root(self, client):
        res = client.get("/")
        assert res.status_code == 200
        assert "BLOWTORCH" in res.json()["message"]
