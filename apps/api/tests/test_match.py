"""Tests for match/like endpoint."""
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


class TestLikeCandidate:
    def test_like_no_mutual(self, client):
        """First like — no match yet."""
        user_resp = _make_resp(200, {"id": "alice"})
        alice_profile = _make_resp(200, [{"user_id": "alice", "interests": "Music"}])
        bob_profile = _make_resp(200, [{"user_id": "bob", "interests": "Music"}])
        save_resp = _make_resp(201)
        no_existing = _make_resp(200, [])

        mock = _mock_httpx(
            get_returns=[user_resp, alice_profile, bob_profile, no_existing, no_existing],
            post_returns=[save_resp],
        )
        with patch("httpx.Client", return_value=mock):
            with patch("src.main.get_settings") as mock_settings:
                mock_settings.return_value.supabase_url = "https://fake.supabase.co"
                mock_settings.return_value.supabase_key = "fake-key"
                mock_settings.return_value.openrouter_api_key = None
                res = client.post("/api/v1/match/", json={
                    "candidate_id": "bob"
                }, headers={"Authorization": "Bearer tok"})

        assert res.status_code == 200
        assert res.json()["matched"] is False
        assert res.json()["status"] == "liked"

    def test_mutual_like_triggers_match(self, client):
        """Second like — mutual match!"""
        user_resp = _make_resp(200, {"id": "bob"})
        bob_profile = _make_resp(200, [{"user_id": "bob", "interests": "Music"}])
        alice_profile = _make_resp(200, [{"user_id": "alice", "interests": "Music"}])
        save_resp = _make_resp(201)
        no_existing = _make_resp(200, [])
        existing_like = _make_resp(200, [{"sender_id": "alice", "receiver_id": "bob", "status": "pending"}])
        patch_resp = _make_resp(200)

        mock = _mock_httpx(
            get_returns=[user_resp, bob_profile, alice_profile, no_existing, existing_like],
            post_returns=[save_resp],
            patch_returns=[patch_resp, patch_resp],
        )
        with patch("httpx.Client", return_value=mock):
            res = client.post("/api/v1/match/", json={
                "candidate_id": "alice"
            }, headers={"Authorization": "Bearer tok"})

        assert res.status_code == 200
        assert res.json()["matched"] is True
        assert mock.patch.call_count >= 1

    def test_like_requires_auth(self, client):
        res = client.post("/api/v1/match/", json={"candidate_id": "bob"})
        assert res.status_code == 401

    def test_like_requires_candidate_id(self, client):
        user_resp = _make_resp(200, {"id": "alice"})
        mock = _mock_httpx(get_returns=[user_resp])
        with patch("httpx.Client", return_value=mock):
            res = client.post("/api/v1/match/", json={},
                              headers={"Authorization": "Bearer tok"})
        assert res.status_code == 400

    def test_like_candidate_not_found(self, client):
        user_resp = _make_resp(200, {"id": "alice"})
        alice_profile = _make_resp(200, [{"user_id": "alice"}])
        no_candidate = _make_resp(200, [])

        mock = _mock_httpx(get_returns=[user_resp, alice_profile, no_candidate])
        with patch("httpx.Client", return_value=mock):
            res = client.post("/api/v1/match/", json={
                "candidate_id": "nonexistent"
            }, headers={"Authorization": "Bearer tok"})
        assert res.status_code == 404

    def test_compatibility_score_returned(self, client):
        """Score defaults to 50 when OpenRouter is skipped."""
        user_resp = _make_resp(200, {"id": "alice"})
        alice_profile = _make_resp(200, [{"user_id": "alice", "interests": "Music"}])
        bob_profile = _make_resp(200, [{"user_id": "bob", "interests": "Gaming"}])
        save_resp = _make_resp(201)
        no_existing = _make_resp(200, [])

        mock = _mock_httpx(
            get_returns=[user_resp, alice_profile, bob_profile, no_existing, no_existing],
            post_returns=[save_resp],
        )
        with patch("httpx.Client", return_value=mock):
            with patch("src.main.get_settings") as mock_settings:
                mock_settings.return_value.supabase_url = "https://fake.supabase.co"
                mock_settings.return_value.supabase_key = "fake-key"
                mock_settings.return_value.openrouter_api_key = ""
                res = client.post("/api/v1/match/", json={
                    "candidate_id": "bob"
                }, headers={"Authorization": "Bearer tok"})

        assert res.status_code == 200
        assert "compatibility_score" in res.json()
