"""Tests for AI routes (icebreaker, compatibility)."""
from unittest.mock import patch, MagicMock


def _make_resp(status=200, data=None):
    r = MagicMock()
    r.status_code = status
    r.json.return_value = data if data is not None else {}
    r.text = str(data)
    return r


def _mock_httpx(get_returns=None, post_returns=None):
    mock = MagicMock()
    mock.__enter__ = lambda s: s
    mock.__exit__ = MagicMock(return_value=False)
    if get_returns:
        mock.get.side_effect = get_returns
    if post_returns:
        mock.post.side_effect = post_returns
    return mock


class TestIcebreaker:
    def test_icebreaker_with_ai_fallback(self, client):
        user_resp = _make_resp(200, {"id": "alice"})
        my_profile = _make_resp(200, [{"user_id": "alice", "interests": "Music"}])
        target_profile = _make_resp(200, [{"user_id": "bob", "interests": "Music"}])
        sent_match = _make_resp(200, [{"sender_id": "alice", "receiver_id": "bob", "status": "pending"}])

        mock = _mock_httpx(get_returns=[user_resp, my_profile, target_profile, sent_match, sent_match])
        with patch("httpx.Client", return_value=mock):
            with patch("src.main._generate_ai_icebreaker", return_value=None):
                res = client.get("/api/v1/ai/icebreaker/bob", headers={
                    "Authorization": "Bearer tok"
                })
        assert res.status_code == 200
        assert "icebreaker" in res.json()
        assert len(res.json()["icebreaker"]) > 0

    def test_icebreaker_uses_ai_when_available(self, client):
        user_resp = _make_resp(200, {"id": "alice"})
        my_profile = _make_resp(200, [{"user_id": "alice", "interests": "Gaming"}])
        target_profile = _make_resp(200, [{"user_id": "bob", "interests": "Gaming"}])
        sent_match = _make_resp(200, [{"sender_id": "alice", "receiver_id": "bob", "status": "pending"}])

        mock = _mock_httpx(get_returns=[user_resp, my_profile, target_profile, sent_match, sent_match])
        with patch("httpx.Client", return_value=mock):
            with patch("src.main._generate_ai_icebreaker", return_value="Hey, love gaming!"):
                res = client.get("/api/v1/ai/icebreaker/bob", headers={
                    "Authorization": "Bearer tok"
                })
        assert res.status_code == 200
        assert res.json()["icebreaker"] == "Hey, love gaming!"

    def test_icebreaker_requires_match(self, client):
        user_resp = _make_resp(200, {"id": "alice"})
        my_profile = _make_resp(200, [{"user_id": "alice", "interests": "Music"}])
        target_profile = _make_resp(200, [{"user_id": "bob", "interests": "Music"}])
        no_match = _make_resp(200, [])

        mock = _mock_httpx(get_returns=[user_resp, my_profile, target_profile, no_match, no_match])
        with patch("httpx.Client", return_value=mock):
            res = client.get("/api/v1/ai/icebreaker/bob", headers={
                "Authorization": "Bearer tok"
            })
        assert res.status_code == 403

    def test_icebreaker_requires_profile_first(self, client):
        user_resp = _make_resp(200, {"id": "alice"})
        no_profile = _make_resp(200, [])

        mock = _mock_httpx(get_returns=[user_resp, no_profile])
        with patch("httpx.Client", return_value=mock):
            res = client.get("/api/v1/ai/icebreaker/bob", headers={
                "Authorization": "Bearer tok"
            })
        assert res.status_code == 400

    def test_icebreaker_target_not_found(self, client):
        user_resp = _make_resp(200, {"id": "alice"})
        my_profile = _make_resp(200, [{"user_id": "alice", "interests": "Music"}])
        no_target = _make_resp(200, [])

        mock = _mock_httpx(get_returns=[user_resp, my_profile, no_target])
        with patch("httpx.Client", return_value=mock):
            res = client.get("/api/v1/ai/icebreaker/nonexistent", headers={
                "Authorization": "Bearer tok"
            })
        assert res.status_code == 404

    def test_icebreaker_requires_auth(self, client):
        res = client.get("/api/v1/ai/icebreaker/bob")
        assert res.status_code == 401


class TestCompatibility:
    def test_compatibility_score(self, client):
        user_resp = _make_resp(200, {"id": "alice"})
        my_profile = _make_resp(200, [{"user_id": "alice", "interests": "Music"}])
        target_profile = _make_resp(200, [{"user_id": "bob", "interests": "Music"}])

        mock = _mock_httpx(get_returns=[user_resp, my_profile, target_profile])
        with patch("httpx.Client", return_value=mock):
            res = client.get("/api/v1/ai/compatibility/bob", headers={
                "Authorization": "Bearer tok"
            })
        assert res.status_code == 200
        assert "compatibility_score" in res.json()
        assert res.json()["compatibility_score"] == 100.0

    def test_compatibility_different_interests(self, client):
        user_resp = _make_resp(200, {"id": "alice"})
        my_profile = _make_resp(200, [{"user_id": "alice", "interests": "Music"}])
        target_profile = _make_resp(200, [{"user_id": "bob", "interests": "Gaming"}])

        mock = _mock_httpx(get_returns=[user_resp, my_profile, target_profile])
        with patch("httpx.Client", return_value=mock):
            res = client.get("/api/v1/ai/compatibility/bob", headers={
                "Authorization": "Bearer tok"
            })
        assert res.status_code == 200
        assert res.json()["compatibility_score"] == 30.0

    def test_compatibility_missing_profile(self, client):
        user_resp = _make_resp(200, {"id": "alice"})
        no_profile = _make_resp(200, [])

        mock = _mock_httpx(get_returns=[user_resp, no_profile])
        with patch("httpx.Client", return_value=mock):
            res = client.get("/api/v1/ai/compatibility/bob", headers={
                "Authorization": "Bearer tok"
            })
        assert res.status_code == 400

    def test_compatibility_target_not_found(self, client):
        user_resp = _make_resp(200, {"id": "alice"})
        my_profile = _make_resp(200, [{"user_id": "alice", "interests": "Music"}])
        no_target = _make_resp(200, [])

        mock = _mock_httpx(get_returns=[user_resp, my_profile, no_target])
        with patch("httpx.Client", return_value=mock):
            res = client.get("/api/v1/ai/compatibility/nonexistent", headers={
                "Authorization": "Bearer tok"
            })
        assert res.status_code == 404

    def test_compatibility_requires_auth(self, client):
        res = client.get("/api/v1/ai/compatibility/bob")
        assert res.status_code == 401


class TestFallbackIcebreaker:
    def test_shared_interest(self):
        from src.main import _fallback_icebreaker
        result = _fallback_icebreaker("Music,Coding", "Music,Gaming")
        assert "Music" in result
        assert len(result) < 100

    def test_no_shared_interest(self):
        from src.main import _fallback_icebreaker
        result = _fallback_icebreaker("Cooking", "Gaming")
        assert len(result) > 0
        assert "weekend" in result.lower() or "matched" in result.lower()

    def test_empty_interests(self):
        from src.main import _fallback_icebreaker
        result = _fallback_icebreaker("", "")
        assert len(result) > 0