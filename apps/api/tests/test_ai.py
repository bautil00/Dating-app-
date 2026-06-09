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
    def test_icebreakers_returns_persisted_suggestions(self, client):
        user_resp = _make_resp(200, {"id": "alice"})
        accepted_match = _make_resp(
            200,
            [
                {
                    "sender_id": "alice",
                    "receiver_id": "bob",
                    "status": "accepted",
                    "compatibility_score": 91,
                }
            ],
        )
        suggestions = ["Ask about music.", "Ask about coffee.", "Ask about weekends."]

        mock = _mock_httpx(get_returns=[user_resp, accepted_match])
        with patch("httpx.Client", return_value=mock):
            with patch(
                "src.main.ensure_match_icebreakers",
                return_value={
                    "suggestions": suggestions,
                    "source": "openrouter",
                    "created_at": "2026-06-01T00:00:00Z",
                },
            ) as ensure:
                res = client.get(
                    "/api/v1/ai/icebreakers/bob",
                    headers={"Authorization": "Bearer tok"},
                )
        assert res.status_code == 200
        assert res.json()["suggestions"] == suggestions
        assert res.json()["source"] == "openrouter"
        ensure.assert_called_once()

    def test_single_icebreaker_returns_first_persisted_suggestion(self, client):
        user_resp = _make_resp(200, {"id": "alice"})
        accepted_match = _make_resp(
            200, [{"sender_id": "alice", "receiver_id": "bob", "status": "accepted"}]
        )

        mock = _mock_httpx(get_returns=[user_resp, accepted_match])
        with patch("httpx.Client", return_value=mock):
            with patch(
                "src.main.ensure_match_icebreakers",
                return_value={"suggestions": ["Hey, love gaming!", "Second", "Third"]},
            ):
                res = client.get(
                    "/api/v1/ai/icebreaker/bob", headers={"Authorization": "Bearer tok"}
                )
        assert res.status_code == 200
        assert res.json()["icebreaker"] == "Hey, love gaming!"

    def test_icebreakers_requires_mutual_match(self, client):
        user_resp = _make_resp(200, {"id": "alice"})
        no_match = _make_resp(200, [])

        mock = _mock_httpx(get_returns=[user_resp, no_match, no_match])
        with patch("httpx.Client", return_value=mock):
            res = client.get(
                "/api/v1/ai/icebreakers/bob", headers={"Authorization": "Bearer tok"}
            )
        assert res.status_code == 403

    def test_icebreaker_requires_auth(self, client):
        res = client.get("/api/v1/ai/icebreaker/bob")
        assert res.status_code == 401

    def test_plural_icebreakers_requires_auth(self, client):
        res = client.get("/api/v1/ai/icebreakers/bob")
        assert res.status_code == 401


class TestCompatibility:
    def test_compatibility_score(self, client):
        user_resp = _make_resp(200, {"id": "alice"})
        my_profile = _make_resp(200, [{"user_id": "alice", "interests": "Music"}])
        target_profile = _make_resp(200, [{"user_id": "bob", "interests": "Music"}])

        mock = _mock_httpx(get_returns=[user_resp, my_profile, target_profile])
        with patch("httpx.Client", return_value=mock):
            res = client.get(
                "/api/v1/ai/compatibility/bob", headers={"Authorization": "Bearer tok"}
            )
        assert res.status_code == 200
        assert "compatibility_score" in res.json()
        assert res.json()["compatibility_score"] == 0.0
        assert "compatibility_reason" in res.json()
        assert res.json()["compatibility_factors"] == []

    def test_compatibility_different_interests(self, client):
        user_resp = _make_resp(200, {"id": "alice"})
        my_profile = _make_resp(200, [{"user_id": "alice", "interests": "Music"}])
        target_profile = _make_resp(200, [{"user_id": "bob", "interests": "Gaming"}])

        mock = _mock_httpx(get_returns=[user_resp, my_profile, target_profile])
        with patch("httpx.Client", return_value=mock):
            res = client.get(
                "/api/v1/ai/compatibility/bob", headers={"Authorization": "Bearer tok"}
            )
        assert res.status_code == 200
        assert res.json()["compatibility_score"] == 0.0
        assert res.json()["compatibility_source"] == "fallback"

    def test_compatibility_missing_profile(self, client):
        user_resp = _make_resp(200, {"id": "alice"})
        no_profile = _make_resp(200, [])

        mock = _mock_httpx(get_returns=[user_resp, no_profile])
        with patch("httpx.Client", return_value=mock):
            res = client.get(
                "/api/v1/ai/compatibility/bob", headers={"Authorization": "Bearer tok"}
            )
        assert res.status_code == 400

    def test_compatibility_target_not_found(self, client):
        user_resp = _make_resp(200, {"id": "alice"})
        my_profile = _make_resp(200, [{"user_id": "alice", "interests": "Music"}])
        no_target = _make_resp(200, [])

        mock = _mock_httpx(get_returns=[user_resp, my_profile, no_target])
        with patch("httpx.Client", return_value=mock):
            res = client.get(
                "/api/v1/ai/compatibility/nonexistent",
                headers={"Authorization": "Bearer tok"},
            )
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


class TestPersistedIcebreakers:
    def test_existing_icebreakers_are_reused(self):
        from src.config import Settings
        from src.main import ensure_match_icebreakers

        existing = {
            "user_a_id": "alice",
            "user_b_id": "bob",
            "suggestions": ["One", "Two", "Three"],
            "source": "openrouter",
        }
        mock = _mock_httpx(get_returns=[_make_resp(200, [existing])])

        result = ensure_match_icebreakers(
            mock,
            Settings(supabase_url="https://fake.supabase.co", supabase_key="key"),
            "tok",
            "alice",
            "bob",
        )

        assert result == existing
        assert not mock.post.called

    def test_invalid_ai_response_persists_fallback_suggestions(self):
        from src.config import Settings
        from src.main import ensure_match_icebreakers

        mock = _mock_httpx(
            get_returns=[
                _make_resp(200, []),
                _make_resp(
                    200, [{"user_id": "alice", "name": "Alice", "interests": "Music"}]
                ),
                _make_resp(
                    200, [{"user_id": "bob", "name": "Bob", "interests": "Music"}]
                ),
                _make_resp(200, []),
            ],
            post_returns=[_make_resp(201, [])],
        )

        with patch("src.main._generate_ai_icebreakers", return_value=([], None)):
            result = ensure_match_icebreakers(
                mock,
                Settings(
                    supabase_url="https://fake.supabase.co",
                    supabase_key="key",
                    openrouter_api_key="openrouter-key",
                ),
                "tok",
                "alice",
                "bob",
            )

        assert result["source"] == "fallback"
        assert len(result["suggestions"]) == 3
        assert mock.post.call_args.kwargs["json"]["user_a_id"] == "alice"
        assert mock.post.call_args.kwargs["json"]["user_b_id"] == "bob"


class TestOpenRouterModels:
    def test_ai_icebreaker_uses_fastest_free_model_only(self):
        from src.config import Settings
        from src.main import _generate_ai_icebreaker

        success_response = _make_resp(
            200,
            {"choices": [{"message": {"content": "Music is a great spark."}}]},
        )
        mock = _mock_httpx(post_returns=[success_response])

        with patch("httpx.Client", return_value=mock):
            result = _generate_ai_icebreaker(
                Settings(openrouter_api_key="openrouter-key"), "Music", "Music"
            )

        assert result == "Music is a great spark."
        assert mock.post.call_count == 1
        assert (
            mock.post.call_args.kwargs["json"]["model"]
            == "liquid/lfm-2.5-1.2b-instruct:free"
        )
