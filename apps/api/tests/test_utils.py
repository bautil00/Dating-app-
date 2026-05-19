"""Tests for utility functions (haversine, database matching score, gender filtering)."""

from unittest.mock import MagicMock, patch

from src.config import Settings
from src.main import (
    build_profile_rest_payload,
    build_profile_rpc_payload,
    get_match_compatibility_score,
    haversine_distance,
    filter_by_gender,
)


class TestHaversineDistance:
    def test_same_location(self):
        result = haversine_distance(47.6, -122.3, 47.6, -122.3)
        assert result == 0.0

    def test_same_latitude_different_longitude(self):
        result = haversine_distance(47.0, -122.0, 47.0, -121.0)
        assert result > 0

    def test_same_longitude_different_latitude(self):
        result = haversine_distance(47.0, -122.0, 48.0, -122.0)
        assert result > 0

    def test_equator_north_pole(self):
        result = haversine_distance(0, 0, 90, 0)
        assert 9900 < result < 10100

    def test_result_is_km(self):
        result = haversine_distance(0, 0, 1, 0)
        assert 100 < result < 115

    def test_antipodal_points(self):
        result = haversine_distance(0, 0, 0, 180)
        assert 19500 < result < 20500


class TestFilterByGender:
    def test_everyone_returns_all(self):
        profiles = [
            {"gender": "Male"},
            {"gender": "Female"},
            {"gender": "Non-binary"},
        ]
        result = filter_by_gender(profiles, "everyone")
        assert len(result) == 3

    def test_empty_seeking_returns_all(self):
        profiles = [{"gender": "Male"}, {"gender": "Female"}]
        result = filter_by_gender(profiles, "")
        assert len(result) == 2

    def test_none_seeking_returns_all(self):
        profiles = [{"gender": "Male"}]
        result = filter_by_gender(profiles, None)
        assert len(result) == 1

    def test_both_returns_male_and_female(self):
        profiles = [
            {"gender": "Male"},
            {"gender": "Female"},
            {"gender": "Non-binary"},
        ]
        result = filter_by_gender(profiles, "both")
        assert len(result) == 2
        assert all(p["gender"] in ["Male", "Female"] for p in result)

    def test_both_ignores_missing_gender(self):
        profiles = [{"gender": "male"}, {"gender": None}, {}]
        result = filter_by_gender(profiles, "both")
        assert result == [{"gender": "male"}]

    def test_filter_male(self):
        profiles = [
            {"gender": "Male"},
            {"gender": "Female"},
            {"gender": "Male"},
        ]
        result = filter_by_gender(profiles, "male")
        assert len(result) == 2
        assert all(p["gender"].lower() == "male" for p in result)

    def test_filter_female(self):
        profiles = [
            {"gender": "Male"},
            {"gender": "Female"},
            {"gender": "Female"},
        ]
        result = filter_by_gender(profiles, "Female")
        assert len(result) == 2

    def test_filter_case_insensitive(self):
        profiles = [{"gender": "Female"}]
        result = filter_by_gender(profiles, "FEMALE")
        assert len(result) == 1

    def test_empty_profiles_list(self):
        result = filter_by_gender([], "male")
        assert result == []

    def test_no_matching_gender(self):
        profiles = [{"gender": "Female"}]
        result = filter_by_gender(profiles, "male")
        assert result == []

    def test_specific_filter_ignores_missing_gender(self):
        profiles = [{"gender": None}, {}, {"gender": "Male"}]
        result = filter_by_gender(profiles, "male")
        assert result == [{"gender": "Male"}]


class TestMatchCompatibility:
    def test_database_score_defaults_to_zero_without_rpc_score(self):
        class Settings:
            supabase_url = "https://fake.supabase.co"
            supabase_key = "fake-key"

        result = get_match_compatibility_score(Settings(), "tok", "alice", "bob")
        assert result == 0.0

    def test_llm_score_is_used_when_profiles_are_available(self):
        class Settings:
            supabase_url = "https://fake.supabase.co"
            supabase_key = "fake-key"
            openrouter_api_key = "openrouter-key"

        with (
            patch("src.main.get_llm_compatibility_score", return_value=87.0) as llm,
            patch("src.main.get_database_compatibility_score") as db_score,
        ):
            result = get_match_compatibility_score(
                Settings(),
                "tok",
                "alice",
                "bob",
                {"user_id": "alice", "interests": "Music", "age": 25},
                {"user_id": "bob", "interests": "Music", "age": 26},
            )

        assert result == 87.0
        llm.assert_called_once()
        db_score.assert_not_called()

    def test_database_score_is_fallback_when_llm_is_unavailable(self):
        class Settings:
            supabase_url = "https://fake.supabase.co"
            supabase_key = "fake-key"
            openrouter_api_key = "openrouter-key"

        with (
            patch("src.main.get_llm_compatibility_score", return_value=None),
            patch("src.main.get_database_compatibility_score", return_value=42.0),
        ):
            result = get_match_compatibility_score(
                Settings(),
                "tok",
                "alice",
                "bob",
                {"user_id": "alice", "interests": "Music", "age": 25},
                {"user_id": "bob", "interests": "Gaming", "age": 30},
            )

        assert result == 42.0


class TestLLMCompatibility:
    def test_prompt_uses_live_profile_interests_field(self):
        from src.compatibility import build_compatibility_prompt

        prompt = build_compatibility_prompt(
            {
                "interests": ["music", "programming"],
                "availability": ["fri", "sat"],
                "time_availability": ["7-9pm"],
                "age": 25,
                "job": "programmer",
                "gender": "male",
            },
            {
                "interests": "music,art",
                "availability": "fri,sun",
                "time_availability": "9-11pm",
                "age": 26,
                "job": "artist",
                "gender": "female",
            },
        )

        assert "music, programming" in prompt
        assert "music, art" in prompt
        assert "fri, sat" in prompt
        assert "7-9pm" in prompt

    def test_llm_score_parses_and_clamps_numeric_response(self):
        from src.compatibility import get_llm_compatibility_score

        response = MagicMock()
        response.status_code = 200
        response.json.return_value = {
            "choices": [{"message": {"content": "118%"}}],
        }
        mock = MagicMock()
        mock.__enter__ = lambda s: s
        mock.__exit__ = MagicMock(return_value=False)
        mock.post.return_value = response

        with patch("httpx.Client", return_value=mock):
            result = get_llm_compatibility_score("key", {}, {})

        assert result == 100.0
        assert mock.post.call_args.kwargs["timeout"] == 4.0

    def test_llm_score_tries_next_free_model_after_failure(self):
        from src.compatibility import get_llm_compatibility_score

        failed_response = MagicMock()
        failed_response.status_code = 429
        success_response = MagicMock()
        success_response.status_code = 200
        success_response.json.return_value = {
            "choices": [{"message": {"content": "73"}}],
        }
        mock = MagicMock()
        mock.__enter__ = lambda s: s
        mock.__exit__ = MagicMock(return_value=False)
        mock.post.side_effect = [failed_response, success_response]

        with patch("httpx.Client", return_value=mock):
            result = get_llm_compatibility_score(
                "key", {}, {}, models=["first-free-model", "second-free-model"]
            )

        assert result == 73.0
        assert mock.post.call_count == 2
        assert mock.post.call_args.kwargs["json"]["model"] == "second-free-model"


class TestBuildProfileRpcPayload:
    def test_pronouns_match_database_enum_format(self):
        result = build_profile_rpc_payload({"pronouns": "She/Her"}, "u1")
        assert result["p_pronouns"] == "she her"

    def test_availability_matches_database_enum_format(self):
        result = build_profile_rpc_payload(
            {"availability": ["Monday", "Thursday"]}, "u1"
        )
        assert result["p_availability"] == ["mon", "thur"]

    def test_time_availability_in_rest_payload(self):
        result = build_profile_rest_payload(
            {"time_availability": ["7-9 PM", "11pm-1am"]}, "u1"
        )
        assert result["time_availability"] == ["7-9pm", "11pm-1am"]


class TestSettings:
    def test_secret_values_strip_copy_paste_whitespace(self):
        settings = Settings(
            supabase_url=" https://example.supabase.co\n",
            supabase_key=" anon-key\n",
            openrouter_api_key="\topenrouter-key-test ",
        )

        assert settings.supabase_url == "https://example.supabase.co"
        assert settings.supabase_key == "anon-key"
        assert settings.openrouter_api_key == "openrouter-key-test"


class TestNormalizeInterests:
    def test_normalize_comma_separated(self):
        from src.main import _normalize_interests

        result = _normalize_interests("Music, Gaming, Coding")
        assert result == ["Music", "Gaming", "Coding"]

    def test_normalize_single_value(self):
        from src.main import _normalize_interests

        result = _normalize_interests("Music")
        assert result == ["Music"]

    def test_normalize_list(self):
        from src.main import _normalize_interests

        result = _normalize_interests(["Music", "Gaming"])
        assert result == ["Music", "Gaming"]

    def test_normalize_empty_string(self):
        from src.main import _normalize_interests

        result = _normalize_interests("")
        assert result == []

    def test_normalize_strips_whitespace(self):
        from src.main import _normalize_interests

        result = _normalize_interests("  Music  ,  Gaming  ")
        assert result == ["Music", "Gaming"]

    def test_normalize_filters_empty(self):
        from src.main import _normalize_interests

        result = _normalize_interests("Music,,Gaming,,,")
        assert result == ["Music", "Gaming"]
