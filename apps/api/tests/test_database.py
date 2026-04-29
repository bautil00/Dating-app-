import pytest
from unittest.mock import patch, MagicMock
from src.services.recommendation_service import RecommendationService

class DummyUser:
    def __init__(self, user_id, gender_val, seeking_gender_val):
        self.user_id = user_id
        self.seeking_gender = seeking_gender_val
        self.gender = MagicMock()
        self.gender.value = gender_val
        self.interests = []
        self.languages = []
        self.mbti = None
        self.relationship = None
        self.pets = False
        self.kids = False
        self.drives = False
        self.zodiac = None
        self.education = None

class TestDatabaseMatching:
    def test_database_put_matches_into_matches_table(self):
        users = [
            DummyUser("1", "male", "female"),
            DummyUser("2", "female", "male")
        ]
        with patch('src.services.recommendation_service.get_supabase') as mock_get_supabase:
            mock_supabase = MagicMock()
            mock_get_supabase.return_value = mock_supabase
            
            # Mock existing matches to be empty
            mock_supabase.table.return_value.select.return_value.execute.return_value.data = []
            
            matches = RecommendationService.match_all_users(users)
            
            # Verify that match was calculated
            assert len(matches) == 1
            
            # Verify that it tried to insert into matches table
            mock_supabase.table.assert_any_call("matches")
            mock_supabase.table().insert.assert_called()
            inserted_data = mock_supabase.table().insert.call_args[0][0]
            assert inserted_data["sender_id"] == "1"
            assert inserted_data["receiver_id"] == "2"
            assert inserted_data["status"] == "pending"

    def test_database_change_match_function_not_to_make_same_matches(self):
        users = [
            DummyUser("1", "male", "female"),
            DummyUser("2", "female", "male")
        ]
        with patch('src.services.recommendation_service.get_supabase') as mock_get_supabase:
            mock_supabase = MagicMock()
            mock_get_supabase.return_value = mock_supabase
            
            # Mock existing matches to contain ("1", "2")
            mock_supabase.table.return_value.select.return_value.execute.return_value.data = [
                {"sender_id": "1", "receiver_id": "2"}
            ]
            
            matches = RecommendationService.match_all_users(users)
            
            # Verify no matches were made because they already exist
            assert len(matches) == 0
            
            # Ensure insert was not called
            # Since mock_supabase.table is called for select, we check insert
            mock_supabase.table().insert.assert_not_called()

    def test_database_change_match_function_not_to_match_people_without_preferences(self):
        # User 1 seeks female, User 2 is female but seeks female (not male)
        user1 = DummyUser("1", "male", "female")
        user2 = DummyUser("2", "female", "female")
        
        score = RecommendationService.calculate_match(user1, user2)
        
        # Mutual preference fails
        assert score == 0.0
