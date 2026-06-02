"""Tests for user analytics endpoints."""

from unittest.mock import MagicMock, patch


def _make_resp(status=200, data=None):
    resp = MagicMock()
    resp.status_code = status
    resp.json.return_value = data if data is not None else {}
    resp.text = str(data)
    return resp


def _mock_httpx(get_returns=None):
    mock = MagicMock()
    mock.__enter__ = lambda s: s
    mock.__exit__ = MagicMock(return_value=False)
    if get_returns:
        mock.get.side_effect = get_returns
    return mock


class TestUserAnalytics:
    def test_user_analytics_requires_auth(self, client):
        res = client.get("/api/v1/analytics/users/me")

        assert res.status_code == 401

    def test_user_analytics_counts_profile_matches_messages_and_scores(self, client):
        user_resp = _make_resp(200, {"id": "alice"})
        profile_resp = _make_resp(200, [{"user_id": "alice", "is_complete": True}])
        sent_matches_resp = _make_resp(
            200,
            [
                {
                    "sender_id": "alice",
                    "receiver_id": "bob",
                    "status": "accepted",
                    "compatibility_score": 88,
                },
                {
                    "sender_id": "alice",
                    "receiver_id": "carol",
                    "status": "pending",
                },
            ],
        )
        received_matches_resp = _make_resp(
            200,
            [
                {
                    "sender_id": "drew",
                    "receiver_id": "alice",
                    "status": "matched",
                    "compatibility_score": 72,
                },
                {
                    "sender_id": "erin",
                    "receiver_id": "alice",
                    "status": "dismissed",
                },
            ],
        )
        sent_messages_resp = _make_resp(
            200,
            [
                {"sender_id": "alice", "receiver_id": "bob", "content": "Hi"},
                {"sender_id": "alice", "receiver_id": "drew", "content": "Hey"},
            ],
        )
        received_messages_resp = _make_resp(
            200,
            [
                {
                    "sender_id": "bob",
                    "receiver_id": "alice",
                    "content": "Hi back",
                    "is_read": False,
                },
                {
                    "sender_id": "drew",
                    "receiver_id": "alice",
                    "content": "Hello",
                    "is_read": True,
                },
            ],
        )

        mock = _mock_httpx(
            get_returns=[
                user_resp,
                profile_resp,
                sent_matches_resp,
                received_matches_resp,
                sent_messages_resp,
                received_messages_resp,
            ]
        )
        with patch("httpx.Client", return_value=mock):
            res = client.get(
                "/api/v1/analytics/users/me",
                headers={"Authorization": "Bearer tok"},
            )

        body = res.json()
        assert res.status_code == 200
        assert body["user_id"] == "alice"
        assert body["profile_created"] is True
        assert body["profile_complete"] is True
        assert body["matches"] == {
            "sent": 2,
            "received": 2,
            "pending": 1,
            "accepted": 2,
            "rejected": 0,
            "dismissed": 1,
            "total": 4,
        }
        assert body["messages"] == {
            "sent": 2,
            "received": 2,
            "unread": 1,
            "total": 4,
        }
        assert body["compatibility"] == {"scored_matches": 2, "average_score": 80.0}
