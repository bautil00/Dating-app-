"""Tests for Pydantic schemas and data validation."""
import pytest
from pydantic import ValidationError
from src.schemas.schemas import (
    UserBase, UserCreate, UserLogin, UserResponse,
    ProfileBase, ProfileCreate, ProfileUpdate, ProfileResponse,
    MatchBase, MatchCreate, MatchResponse,
    MessageBase, MessageCreate, MessageResponse,
    Token, TokenData,
)


class TestUserSchemas:
    def test_user_create_valid(self):
        user = UserCreate(email="test@example.com", password="password123")
        assert user.email == "test@example.com"
        assert user.password == "password123"

    def test_user_create_invalid_email(self):
        with pytest.raises(ValidationError):
            UserCreate(email="not-an-email", password="password123")

    def test_user_base_requires_email(self):
        with pytest.raises(ValidationError):
            UserBase(password="nopassword")

    def test_user_login(self):
        user = UserLogin(email="login@test.com", password="secret")
        assert user.email == "login@test.com"

    def test_user_response_model(self):
        resp = UserResponse(
            id=1,
            email="resp@test.com",
            is_active=True,
            created_at="2026-01-01T00:00:00",
        )
        assert resp.id == 1


class TestProfileSchemas:
    def test_profile_create_empty(self):
        profile = ProfileCreate()
        assert profile.display_name is None
        assert profile.bio is None

    def test_profile_create_with_data(self):
        profile = ProfileCreate(
            display_name="Alice",
            bio="Loves hiking",
            age=28,
            gender="Female",
            location="Seattle",
            interests="Hiking,Coding",
        )
        assert profile.display_name == "Alice"
        assert profile.age == 28
        assert profile.interests == "Hiking,Coding"

    def test_profile_update_partial(self):
        update = ProfileUpdate(age=30)
        assert update.age == 30
        assert update.display_name is None

    def test_profile_base_with_all_fields(self):
        profile = ProfileBase(
            display_name="Bob",
            bio="Dev",
            age=25,
            gender="Male",
            location="NYC",
            profile_image_url="http://example.com/img.png",
            interests="Gaming",
        )
        assert profile.gender == "Male"

    def test_profile_response_model(self):
        resp = ProfileResponse(
            id=1,
            user_id=42,
            display_name="Test",
            bio="Bio",
            age=25,
            gender="Male",
            location="LA",
            profile_image_url=None,
            interests="Music",
            personality_type="INTJ",
            compatibility_score=85.5,
            created_at="2026-01-01T00:00:00",
        )
        assert resp.compatibility_score == 85.5


class TestMatchSchemas:
    def test_match_create_valid(self):
        match = MatchCreate(receiver_id=5)
        assert match.receiver_id == 5

    def test_match_create_missing_receiver(self):
        with pytest.raises(ValidationError):
            MatchCreate()

    def test_match_base(self):
        mb = MatchBase(receiver_id=10)
        assert mb.receiver_id == 10

    def test_match_response_model(self):
        resp = MatchResponse(
            id=1,
            sender_id=100,
            receiver_id=200,
            status="pending",
            created_at="2026-01-01T00:00:00",
        )
        assert resp.status == "pending"


class TestMessageSchemas:
    def test_message_create_valid(self):
        msg = MessageCreate(content="Hello!", receiver_id=3)
        assert msg.content == "Hello!"
        assert msg.receiver_id == 3

    def test_message_create_empty_content(self):
        msg = MessageCreate(content="", receiver_id=1)
        assert msg.content == ""

    def test_message_response_model(self):
        resp = MessageResponse(
            id=1,
            sender_id=10,
            receiver_id=20,
            content="Hi there",
            is_read=False,
            created_at="2026-01-01T00:00:00",
        )
        assert resp.is_read is False


class TestTokenSchemas:
    def test_token_model(self):
        token = Token(access_token="abc123", token_type="bearer")
        assert token.access_token == "abc123"
        assert token.token_type == "bearer"

    def test_token_data_optional_user_id(self):
        td = TokenData()
        assert td.user_id is None

    def test_token_data_with_user_id(self):
        td = TokenData(user_id=42)
        assert td.user_id == 42


class TestSchemaFieldValidation:
    def test_email_validator_rejects_invalid(self):
        with pytest.raises(ValidationError):
            UserCreate(email="bad-email", password="pass123")

    def test_email_validator_accepts_valid(self):
        user = UserCreate(email="good@valid.com", password="pass")
        assert user.email == "good@valid.com"

    def test_profile_age_must_be_integer(self):
        profile = ProfileCreate(age=25)
        assert profile.age == 25

    def test_profile_age_cannot_be_negative(self):
        with pytest.raises(ValidationError):
            ProfileCreate(age=-5)

    def test_message_content_max_length(self):
        long_content = "x" * 10000
        msg = MessageCreate(content=long_content, receiver_id=1)
        assert len(msg.content) == 10000