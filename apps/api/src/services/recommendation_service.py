from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from typing import List, Optional
import numpy as np


class RecommendationService:
    def __init__(self):
        self.vectorizer = TfidfVectorizer(lowercase=True, stop_words="english")

    def calculate_compatibility_score(
        self,
        user_interests: str,
        user_personality: str,
        candidate_interests: str,
        candidate_personality: str,
    ) -> float:
        score = 0.0
        if user_interests and candidate_interests:
            texts = [user_interests, candidate_interests]
            tfidf_matrix = self.vectorizer.fit_transform(texts)
            interest_score = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])[0][
                0
            ]
            score += interest_score * 0.6

        if user_personality and candidate_personality:
            personality_weights = {
                "INTJ": ["INTJ", "INTP", "ENTJ", "ENTP"],
                "INTP": ["INTJ", "INTP", "ENTJ", "ENTP"],
                "ENTJ": ["ENTJ", "ENTP", "INTJ", "INTP"],
                "ENTP": ["ENTP", "ENTJ", "INTJ", "INTP"],
                "INFJ": ["INFJ", "INFP", "ENFJ", "ENFP"],
                "INFP": ["INFP", "INFJ", "ENFP", "ENFJ"],
                "ENFJ": ["ENFJ", "ENFP", "INFJ", "INFP"],
                "ENFP": ["ENFP", "ENFJ", "INFP", "INFJ"],
                "ISTJ": ["ISTJ", "ISFJ", "ESTJ", "ESFJ"],
                "ISFJ": ["ISFJ", "ISTJ", "ESFJ", "ESTJ"],
                "ESTJ": ["ESTJ", "ESFJ", "ISTJ", "ISFJ"],
                "ESFJ": ["ESFJ", "ESTJ", "ISFJ", "ISTJ"],
                "ISTP": ["ISTP", "ISFP", "ESTP", "ESFP"],
                "ISFP": ["ISFP", "ISTP", "ESFP", "ESTP"],
                "ESTP": ["ESTP", "ESFP", "ISTP", "ISFP"],
                "ESFP": ["ESFP", "ESTP", "ISFP", "ISTP"],
            }
            matches = personality_weights.get(user_personality, [])
            if candidate_personality in matches:
                score += 0.4
            elif user_personality == candidate_personality:
                score += 0.2

        return round(min(score, 1.0), 2)

    def generate_icebreaker(self, user_profile: dict, match_profile: dict) -> str:
        user_interests = user_profile.get("interests", "")
        match_interests = match_profile.get("interests", "")

        if not user_interests or not match_interests:
            return "Hey! What brings you to BLOWTORCH?"

        icebreakers = [
            f"I noticed you like {user_interests.split(',')[0] if ',' in user_interests else user_interests}. Have you always been into that?",
            f"What's your take on {match_interests.split(',')[0] if ',' in match_interests else match_interests}?",
            f"If you could live anywhere, where would you pick?",
            "What's the most spontaneous thing you've done recently?",
            "Tell me about your perfect weekend.",
        ]
        return np.random.choice(icebreakers)

    def rank_candidates(
        self, user_profile: dict, candidate_profiles: List[dict], limit: int = 10
    ) -> List[dict]:
        scored = []
        for candidate in candidate_profiles:
            score = self.calculate_compatibility_score(
                user_profile.get("interests", ""),
                user_profile.get("personality_type", ""),
                candidate.get("interests", ""),
                candidate.get("personality_type", ""),
            )
            candidate["compatibility_score"] = score
            scored.append(candidate)

        scored.sort(key=lambda x: x["compatibility_score"], reverse=True)
        return scored[:limit]


recommendation_service = RecommendationService()
