import httpx
from ..config import get_settings

settings = get_settings()


class OpenAIService:
    def __init__(self):
        self.api_url = "https://api.openai.com/v1/chat/completions"
        self.api_key = settings.openai_api_key

    def _generate(self, system_prompt: str, user_prompt: str) -> str:
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        payload = {
            "model": "gpt-3.5-turbo",
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            "max_tokens": 150,
            "temperature": 0.7,
        }
        with httpx.Client() as client:
            response = client.post(
                self.api_url, json=payload, headers=headers, timeout=30
            )
            response.raise_for_status()
            data = response.json()
            return data["choices"][0]["message"]["content"].strip()

    def generate_icebreaker(self, user_profile: dict, match_profile: dict) -> str:
        user_interests = user_profile.get("interests", "") or "dating"
        match_interests = match_profile.get("interests", "") or "dating"

        system_prompt = (
            "You are a helpful dating app assistant. Generate a short, engaging icebreaker message "
            "that references shared interests between two users. Keep it under 50 words, casual, "
            "and conversation-starting. No pickup lines."
        )
        user_prompt = (
            f"User 1 interests: {user_interests}\n"
            f"User 2 interests: {match_interests}\n"
            "Generate a conversation-starting icebreaker message based on their shared interests."
        )
        return self._generate(system_prompt, user_prompt)

    def calculate_compatibility_score(
        self,
        user_interests: str,
        user_personality: str,
        candidate_interests: str,
        candidate_personality: str,
    ) -> float:
        system_prompt = (
            "You are a compatibility scoring system. Analyze two user profiles and return a "
            "compatibility score from 0.0 to 1.0 based on shared interests and personality compatibility. "
            "Return only a number between 0.0 and 1.0 with up to 2 decimal places."
        )
        user_prompt = (
            f"User 1 - Interests: {user_interests}, Personality: {user_personality}\n"
            f"User 2 - Interests: {candidate_interests}, Personality: {candidate_personality}\n"
            "What is their compatibility score? (Just return the number)"
        )
        try:
            result = self._generate(system_prompt, user_prompt)
            return float(result)
        except Exception:
            return 0.5


openai_service = OpenAIService()
