import sys
import os
from dotenv import load_dotenv
from supabase import create_client, Client

# Add src to python path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from src.services.recommendation_service import RecommendationService

class ProdUser:
    def __init__(self, data):
        self.user_id = data.get("user_id") or str(data.get("id"))
        self.name = data.get("Name") or data.get("display_name") or f"User {self.user_id}"
        
        # Gender setup
        gender_val = data.get("gender", "unknown")
        self.gender = type('Gender', (), {'value': gender_val})()
        self.seeking_gender = data.get("seeking_gender", "everyone")
        
        # Parse arrays (Supabase might return them as lists or comma-separated strings)
        interests_raw = data.get("interests")
        if isinstance(interests_raw, str):
            self.interests = [i.strip() for i in interests_raw.split(",")]
        else:
            self.interests = interests_raw or []
            
        languages_raw = data.get("languages")
        if isinstance(languages_raw, str):
            self.languages = [l.strip() for l in languages_raw.split(",")]
        else:
            self.languages = languages_raw or []
            
        # Other preferences
        self.mbti = data.get("mbti")
        self.relationship = data.get("relationship")
        self.pets = data.get("pets", False)
        self.kids = data.get("kids", False)
        self.drives = data.get("drives", False)
        self.zodiac = data.get("zodiac")
        self.education = data.get("education")

    def __str__(self):
        return f"{self.name} ({self.gender.value}, seeking: {self.seeking_gender})"

def run_prod_test():
    print("==================================================")
    print("🌍 BLOWTORCH PRODUCTION DB MATCHING TEST 🌍")
    print("==================================================\n")

    # Load environment variables
    load_dotenv()
    supabase_url = os.environ.get("SUPABASE_URL")
    supabase_key = os.environ.get("SUPABASE_SERVICE_KEY") or os.environ.get("SUPABASE_KEY")
    
    if not supabase_url or not supabase_key:
        print("❌ Error: SUPABASE_URL and SUPABASE_KEY must be set in apps/api/.env")
        print("Please configure your apps/api/.env file with production credentials first.")
        sys.exit(1)
        
    print(f"🔌 Connecting to Supabase at {supabase_url}...")
    supabase: Client = create_client(supabase_url, supabase_key)
    
    # 1. Fetch Users
    print("📡 Fetching completed user profiles from 'UserData' (or 'profiles')...")
    # Trying "UserData" first, as that was in setup_database.sql
    users_data = []
    try:
        response = supabase.table("UserData").select("*").eq("is_complete", True).execute()
        users_data = response.data
    except Exception as e:
        print(f"⚠️ Could not fetch from 'UserData' (Error: {e}). Trying 'profiles' table...")
        try:
            response = supabase.table("profiles").select("*").execute()
            users_data = response.data
        except Exception as e2:
            print(f"❌ Failed to fetch users: {e2}")
            sys.exit(1)
            
    if not users_data:
        print("⚠️ No users found in the database. Ensure there is seed data!")
        sys.exit(0)
        
    users = [ProdUser(u) for u in users_data]
    print(f"👥 Found {len(users)} users in the system:")
    for u in users:
        print(f" - {u}")
    print("\n")

    print("🔍 RUNNING MATCHMAKING ALGORITHM...\n")
    
    # We temporarily replace get_supabase in the service so match_all_users uses our real client
    import src.services.recommendation_service as rec_svc
    original_get_supabase = getattr(rec_svc, "get_supabase", None)
    rec_svc.get_supabase = lambda: supabase
    
    try:
        # Run the matching
        results = RecommendationService.match_all_users(users)
        
        print("✅ NEW MATCHES GENERATED & INSERTED INTO DB:")
        if not results:
            print("No new matches found (they may already exist in the database, or preferences didn't align).")
        for match in results:
            user1 = next((u.name for u in users if str(u.user_id) == str(match["user1"])), match["user1"])
            user2 = next((u.name for u in users if str(u.user_id) == str(match["user2"])), match["user2"])
            print(f" 💖 {user1} & {user2} -> Compatibility Score: {match['match_percent']}%")
            
        print("\n🎉 Match generation complete. Check your Supabase 'matches' table to see the new rows!")
        
    finally:
        # Restore the original function
        if original_get_supabase:
            rec_svc.get_supabase = original_get_supabase

if __name__ == "__main__":
    run_prod_test()
