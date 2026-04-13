from typing import List
import random


class RecommendationService:
    def calculate_compatibility_score(
        self,
        user_interests: str,
        user_personality: str,
        candidate_interests: str,
        candidate_personality: str,
    ) -> float:
        score = 0.0

        if user_interests and candidate_interests:
            user_set = set(i.strip().lower() for i in user_interests.split(","))
            candidate_set = set(
                i.strip().lower() for i in candidate_interests.split(",")
            )
            if user_set and candidate_set:
                overlap = len(user_set & candidate_set)
                total = len(user_set | candidate_set)
                score += (overlap / total) * 0.6

        if user_personality and candidate_personality:
            personality_weights = {
                "INTJ": ["INTJ", "INTP", "ENTJ", "ENTP"],
                "INTP": ["INTJ", "INTP", "ENTJ", "ENTP"],
                "ENTJ": ["ENTJ", "ENTP", "INTJ", "ENTP"],
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
        user_interests = user_profile.get("interests", "") or ""
        match_interests = match_profile.get("interests", "") or ""

        if user_interests and match_interests:
            user_list = [i.strip() for i in user_interests.split(",")]
            match_list = [i.strip() for i in match_interests.split(",")]
            shared = set(u.lower() for u in user_list) & set(
                m.lower() for m in match_list
            )

            if shared:
                topic = random.choice(list(shared)).capitalize()
                templates = [
                    f"I see you like {topic} too! How did you get into that?",
                    f"Hey! I noticed we both like {topic}. What drew you to it?",
                    f"Someone else who likes {topic}! Have you been into it long?",
                ]
                return random.choice(templates)

        templates = [
            "Hey! What brings you to BLOWTORCH?",
            "What's the most spontaneous thing you've done recently?",
            "Tell me about your perfect weekend.",
            "If you could live anywhere, where would you pick?",
            "What's something on your bucket list?",
            "What kind of music are you into these days?",
            "Any travel plans coming up?",
        ]
        return random.choice(templates)

    def rank_candidates(
        self, user_profile: dict, candidate_profiles: List[dict], limit: int = 10
    ) -> List[dict]:
        scored = []
        for candidate in candidate_profiles:
            score = self.calculate_compatibility_score(
                user_profile.get("interests", "") or "",
                user_profile.get("personality_type", "") or "",
                candidate.get("interests", "") or "",
                candidate.get("personality_type", "") or "",
            )
            candidate["compatibility_score"] = score
            scored.append(candidate)

        scored.sort(key=lambda x: x["compatibility_score"], reverse=True)
        return scored[:limit]


recommendation_service = RecommendationService()
