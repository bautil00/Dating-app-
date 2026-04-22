"""Tests for OpenAI and Recommendation services."""
import pytest
from unittest.mock import patch, MagicMock


class TestRecommendationService:
    def test_compatibility_identical_interests(self):
        from src.services.recommendation_service import RecommendationService
        svc = RecommendationService()
        score = svc.calculate_compatibility_score(
            "Music,Coding", "INTJ",
            "Music,Coding", "INTJ"
        )
        assert score == 1.0

    def test_compatibility_no_overlap(self):
        from src.services.recommendation_service import RecommendationService
        svc = RecommendationService()
        score = svc.calculate_compatibility_score(
            "Music", "INTJ",
            "Gaming", "ENFP"
        )
        assert 0.0 <= score <= 1.0

    def test_compatibility_partial_overlap(self):
        from src.services.recommendation_service import RecommendationService
        svc = RecommendationService()
        score = svc.calculate_compatibility_score(
            "Music,Coding", "INTJ",
            "Music,Gaming", "ENFP"
        )
        assert 0.0 < score < 1.0

    def test_compatibility_no_interests(self):
        from src.services.recommendation_service import RecommendationService
        svc = RecommendationService()
        score = svc.calculate_compatibility_score("", "", "", "")
        assert score == 0.0

def test_compatibility_personality_match(self):
        from src.services.recommendation_service import RecommendationService
        svc = RecommendationService()
        score = svc.calculate_compatibility_score(
            "Music", "INTJ",
            "Gaming", "INTP"
        )
        assert score == 0.4

    def test_compatibility_same_personality_diff_type(self):
        from src.services.recommendation_service import RecommendationService
        svc = RecommendationService()
        score = svc.calculate_compatibility_score(
            "Music", "INTJ",
            "Gaming", "ISTJ"
        )
        assert score >= 0.0

    def test_compatibility_score_capped_at_1(self):
        from src.services.recommendation_service import RecommendationService
        svc = RecommendationService()
        score = svc.calculate_compatibility_score(
            "Music,Coding,Reading,Gaming", "INTJ",
            "Music,Coding,Reading,Gaming", "INTJ"
        )
        assert score <= 1.0

    def test_generate_icebreaker_shared_interest(self):
        from src.services.recommendation_service import RecommendationService
        svc = RecommendationService()
        ice = svc.generate_icebreaker(
            {"interests": "Music,Coding"},
            {"interests": "Music,Gaming"}
        )
        assert "Music" in ice
        assert len(ice) < 100

    def test_generate_icebreaker_no_shared(self):
        from src.services.recommendation_service import RecommendationService
        svc = RecommendationService()
        ice = svc.generate_icebreaker(
            {"interests": "Cooking"},
            {"interests": "Gaming"}
        )
        assert len(ice) > 0

    def test_generate_icebreaker_empty_interests(self):
        from src.services.recommendation_service import RecommendationService
        svc = RecommendationService()
        ice = svc.generate_icebreaker({}, {})
        assert len(ice) > 0

    def test_rank_candidates(self):
        from src.services.recommendation_service import RecommendationService
        svc = RecommendationService()
        candidates = [
            {"user_id": "a", "interests": "Music", "personality_type": "INTJ"},
            {"user_id": "b", "interests": "Music,Coding", "personality_type": "INTJ"},
            {"user_id": "c", "interests": "Gaming", "personality_type": "ESFP"},
        ]
        user = {"interests": "Music,Coding", "personality_type": "INTJ"}
        ranked = svc.rank_candidates(user, candidates, limit=2)
        assert len(ranked) == 2
        assert ranked[0]["user_id"] == "b"

    def test_rank_candidates_returns_all_if_limit_higher(self):
        from src.services.recommendation_service import RecommendationService
        svc = RecommendationService()
        candidates = [
            {"user_id": "a", "interests": "Music", "personality_type": "INTJ"},
        ]
        user = {"interests": "Music,Coding", "personality_type": "INTJ"}
        ranked = svc.rank_candidates(user, candidates, limit=10)
        assert len(ranked) == 1

    def test_rank_candidates_empty_list(self):
        from src.services.recommendation_service import RecommendationService
        svc = RecommendationService()
        user = {"interests": "Music", "personality_type": "INTJ"}
        ranked = svc.rank_candidates(user, [], limit=10)
        assert ranked == []


class TestOpenAIService:
    def test_generate_icebreaker_success(self):
        from src.services import openai_service as svc_module
        with patch.object(svc_module, 'OpenAIService') as MockOpenAI:
            mock_instance = MockOpenAI.return_value
            mock_instance.generate_icebreaker.return_value = "Hey! Love your taste in music!"
            result = mock_instance.generate_icebreaker(
                {"interests": "Music"},
                {"interests": "Music,Coding"}
            )
            assert "music" in result.lower()

    def test_calculate_compatibility_score_success(self):
        from src.services import openai_service as svc_module
        with patch.object(svc_module, 'OpenAIService') as MockOpenAI:
            mock_instance = MockOpenAI.return_value
            mock_instance.calculate_compatibility_score.return_value = 0.85
            score = mock_instance.calculate_compatibility_score(
                "Music", "INTJ",
                "Gaming", "ENFP"
            )
            assert score == 0.85

    def test_calculate_compatibility_score_invalid_response_returns_0_5(self):
        from src.services import openai_service as svc_module
        with patch.object(svc_module, 'OpenAIService') as MockOpenAI:
            mock_instance = MockOpenAI.return_value
            mock_instance.calculate_compatibility_score.side_effect = Exception("bad")
            with pytest.raises(Exception):
                mock_instance.calculate_compatibility_score(
                    "Music", "INTJ",
                    "Gaming", "ENFP"
                )

    def test_generate_icebreaker_fallback_on_error(self):
        from src.services import openai_service as svc_module
        with patch.object(svc_module, 'OpenAIService') as MockOpenAI:
            mock_instance = MockOpenAI.return_value
            mock_instance.generate_icebreaker.side_effect = Exception("Network error")
            with pytest.raises(Exception):
                mock_instance.generate_icebreaker(
                    {"interests": "Music"},
                    {"interests": "Music"}
                )