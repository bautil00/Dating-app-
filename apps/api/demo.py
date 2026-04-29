import sys
import os
from unittest.mock import patch, MagicMock

# Mock supabase module completely so we don't need it installed
sys.modules['supabase'] = MagicMock()

# Add src to python path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from src.services.recommendation_service import RecommendationService

class MockUser:
    def __init__(self, user_id, name, gender, seeking_gender, interests, mbti, relationship, pets, kids, drives, zodiac, education, languages):
        self.user_id = user_id
        self.name = name
        
        # Gender setup
        self.gender = type('Gender', (), {'value': gender})()
        self.seeking_gender = seeking_gender
        
        # Preferences
        self.interests = interests
        self.mbti = mbti
        self.relationship = relationship
        self.pets = pets
        self.kids = kids
        self.drives = drives
        self.zodiac = zodiac
        self.education = education
        self.languages = languages
        
    def __str__(self):
        return f"{self.name} ({self.gender.value}, seeking: {self.seeking_gender})"

def run_demo():
    print("==================================================")
    print("🚀 BLOWTORCH BACKEND MATCHING DEMO 🚀")
    print("==================================================\n")

    users = [
        MockUser(
            user_id="u1", name="Alex", gender="male", seeking_gender="female",
            interests=["coding", "hiking", "music"], mbti="INTJ", relationship="serious",
            pets=True, kids=False, drives=True, zodiac="aries", education="bachelors", languages=["english", "spanish"]
        ),
        MockUser(
            user_id="u2", name="Jordan", gender="female", seeking_gender="male",
            interests=["art", "coffee", "music", "hiking"], mbti="ENFP", relationship="serious",
            pets=True, kids=False, drives=True, zodiac="taurus", education="bachelors", languages=["english"]
        ),
        MockUser(
            user_id="u3", name="Casey", gender="female", seeking_gender="female", # Casey is seeking female, Alex is male (Won't match Alex)
            interests=["gym", "coding", "gaming"], mbti="INTJ", relationship="casual",
            pets=False, kids=False, drives=True, zodiac="gemini", education="masters", languages=["english"]
        ),
        MockUser(
            user_id="u4", name="Taylor", gender="female", seeking_gender="everyone",
            interests=["coding", "art"], mbti="INTP", relationship="serious",
            pets=True, kids=False, drives=False, zodiac="aries", education="none", languages=["english", "spanish"]
        )
    ]

    print("👥 USERS IN THE SYSTEM:")
    for u in users:
        print(f" - {u}")
    print("\n")

    print("🔍 RUNNING MATCHMAKING ALGORITHM...\n")
    
    # We will mock the Supabase client so we can see what it's doing without a real database
    with patch('src.services.recommendation_service.get_supabase') as mock_get_supabase:
        mock_supabase = MagicMock()
        mock_get_supabase.return_value = mock_supabase
        
        # Let's say (u1, u4) is already a match in the database
        print("💾 MOCKING DATABASE STATE: Alex (u1) and Taylor (u4) are ALREADY MATCHED.\n")
        mock_supabase.table.return_value.select.return_value.execute.return_value.data = [
            {"sender_id": "u1", "receiver_id": "u4"}
        ]
        
        # Track what gets inserted
        inserted_matches = []
        def mock_insert(data):
            inserted_matches.append(data)
            return MagicMock()
            
        mock_supabase.table().insert = mock_insert
        
        # Run the matching
        results = RecommendationService.match_all_users(users)
        
        print("✅ NEW MATCHES GENERATED:")
        if not results:
            print("No new matches found.")
        for match in results:
            user1 = next(u.name for u in users if u.user_id == match["user1"])
            user2 = next(u.name for u in users if u.user_id == match["user2"])
            print(f" 💖 {user1} & {user2} -> Compatibility Score: {match['match_percent']}%")
            
        print("\n📥 DATABASE INSERTIONS (New matches saved to Supabase):")
        if not inserted_matches:
            print("No insertions made.")
        for insert in inserted_matches:
            sender = next(u.name for u in users if u.user_id == insert["sender_id"])
            receiver = next(u.name for u in users if u.user_id == insert["receiver_id"])
            print(f" -> INSERT INTO 'matches' (sender: {sender}, receiver: {receiver}, status: {insert['status']})")
            
        print("\n❌ WHY OTHERS DIDN'T MATCH:")
        print(" - Alex & Casey: Casey is seeking 'female', but Alex is 'male' (Mutual preference check failed).")
        print(" - Alex & Taylor: They are already matched in the database (Duplicate check skipped them).")
        print("\n==================================================")

if __name__ == "__main__":
    run_demo()
