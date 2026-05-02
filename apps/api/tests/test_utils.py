"""Tests for utility functions (haversine, database matching score, gender filtering)."""
import math
from src.main import (
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


class TestMatchCompatibility:
    def test_database_score_defaults_to_zero_without_rpc_score(self):
        class Settings:
            supabase_url = "https://fake.supabase.co"
            supabase_key = "fake-key"

        result = get_match_compatibility_score(Settings(), "tok", "alice", "bob")
        assert result == 0.0

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
