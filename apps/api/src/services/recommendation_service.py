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
    def calculate_match(user1, user2):
        score = 0
        possible = 0
    
        # -------------------
        # Weighted Categories
        # -------------------
    
        # Interests overlap (30 points)
        possible += 30
        if user1.interests and user2.interests:
            shared = len(set(user1.interests) & set(user2.interests))
            total = len(set(user1.interests) | set(user2.interests))
    
            if total > 0:
                score += (shared / total) * 30
    
        # Languages overlap (10 points)
        possible += 10
        if set(user1.languages) & set(user2.languages):
            score += 10
    
        # MBTI (10 points)
        possible += 10
        if user1.mbti == user2.mbti:
            score += 10
    
        # Relationship goals (15 points)
        possible += 15
        if user1.relationship == user2.relationship:
            score += 15
    
        # Gender preference compatibility (15 points)
        possible += 15
        if (
            user1.seeking_gender == "everyone"
            or user1.seeking_gender == user2.gender.value
        ):
            score += 15
    
        # Lifestyle (10 points)
        possible += 10
        lifestyle_matches = 0
    
        if user1.pets == user2.pets:
            lifestyle_matches += 1
        if user1.kids == user2.kids:
            lifestyle_matches += 1
        if user1.drives == user2.drives:
            lifestyle_matches += 1
    
        score += (lifestyle_matches / 3) * 10
    
        # Zodiac (5 points)
        possible += 5
        if user1.zodiac == user2.zodiac:
            score += 5
    
        # Education (5 points)
        possible += 5
        if user1.education == user2.education:
            score += 5
    
        # -------------------
        # Final Percent
        # -------------------
    
        percent_match = round((score / possible) * 100, 2)

    return percent_match

    def match_all_users(users):
        matches = []
    
        for i in range(len(users)):
            for j in range(i + 1, len(users)):
                percent = calculate_match(users[i], users[j])
    
                matches.append({
                    "user1": users[i].user_id,
                    "user2": users[j].user_id,
                    "match_percent": percent
                })
    
        return sorted(
            matches,
            key=lambda x: x["match_percent"],
            reverse=True
        )
    def create_user_profile(
    user_id,

    name="NoName",
    age=0,

    location=None,
    height=None,
    weight=None,

    interests=None,
    languages=None,
    socials=None,
    availability=None,

    job=None,

    glasses=False,
    kids=False,
    pets=False,
    drives=False,

    sexual_pref=None,
    pronouns=None,
    gender=None,

    living=None,
    zodiac=None,
    education=None,

    hair_color=None,
    eye_color=None,

    race=None,
    body_modification=None,
    body=None,

    nationality=None,
    relationship=None,

    mbti=None,

    seeking_gender="everyone",
    max_distance_km=50
):

    user_data = {
        "user_id": user_id,

        "name": name,
        "age": age,

        "location": location,
        "height": height,
        "weight": weight,

        "interests": interests or [],
        "languages": languages or [],
        "socials": socials or [],
        "availability": availability or [],

        "job": job,

        "glasses": glasses,
        "kids": kids,
        "pets": pets,
        "drives": drives,

        "sexual_pref": sexual_pref,
        "pronouns": pronouns,
        "gender": gender,

        "living": living,
        "zodiac": zodiac,
        "education": education,

        "hair_color": hair_color,
        "eye_color": eye_color,

        "race": race,
        "body_modification": body_modification,
        "body": body,

        "nationality": nationality,
        "relationship": relationship,

        "mbti": mbti,

        "seeking_gender": seeking_gender,
        "max_distance_km": max_distance_km
    }

    result = (
        supabase
        .table("user_data")
        .insert(user_data)
        .execute()
    )

    return result



recommendation_service = RecommendationService()
