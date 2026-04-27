from matching import calculate_match
from create_user import UserData

def test_identical_users_high_match():
    user1 = UserData(
        user_id="1",
        interests=["gaming","music"],
        languages=["english"],
        relationship="single",
        mbti="intj"
    )

    user2 = UserData(
        user_id="2",
        interests=["gaming","music"],
        languages=["english"],
        relationship="single",
        mbti="intj"
    )

    score = calculate_match(user1, user2)

    assert score >= 90


def test_no_shared_interests_lower_match():
    user1 = UserData(
        user_id="1",
        interests=["gaming"],
    )

    user2 = UserData(
        user_id="2",
        interests=["sports"],
    )

    score = calculate_match(user1, user2)

    assert score < 50


def test_gender_incompatibility_zero():
    user1 = UserData(
        user_id="1",
        seeking_gender="female"
    )

    user2 = UserData(
        user_id="2",
        gender="male"
    )

    score = calculate_match(user1, user2)

    assert score == 0





from create_user import create_user_profile


def test_default_name():
    user = create_user_profile(
        user_id="100"
    )

    assert user["name"] == "NoName"


def test_multiple_interests():
    user = create_user_profile(
        user_id="101",
        interests=["gaming","music","programming"]
    )

    assert len(user["interests"]) == 3


def test_default_distance():
    user = create_user_profile(
        user_id="102"
    )

    assert user["max_distance_km"] == 50


