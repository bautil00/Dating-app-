"""Tests for profile endpoints."""

from unittest.mock import patch, MagicMock

from src.main import build_profile_rpc_payload


def _mock_httpx(get_returns=None, post_returns=None, patch_returns=None):
    """Setup mock httpx.Client context manager."""
    mock_client = MagicMock()
    mock_client.__enter__ = lambda s: s
    mock_client.__exit__ = MagicMock(return_value=False)

    if get_returns:
        mock_client.get.side_effect = get_returns
    if post_returns:
        mock_client.post.side_effect = post_returns
    if patch_returns:
        mock_client.patch.side_effect = patch_returns

    return mock_client


def _make_resp(status=200, data=None):
    r = MagicMock()
    r.status_code = status
    r.json.return_value = data if data is not None else {}
    r.text = str(data)
    return r


class TestProfileEnumPayload:
    def test_uses_live_supabase_enum_labels(self):
        payload = build_profile_rpc_payload(
            {
                "display_name": "Casey",
                "gender": "Non-Binary",
                "pronouns": "They/Them",
                "interests": ["Swimming", "Books/Reading"],
            },
            "user-1",
        )

        assert payload["p_gender"] == "non binary"
        assert payload["p_pronouns"] == "they them"
        assert payload["p_interests"] == ["swmiming", "books reading"]


class TestGetMyProfile:
    def test_returns_profile(self, client, fake_profile):
        user_resp = _make_resp(200, {"id": "aaaa-bbbb-cccc-dddd"})
        profile_resp = _make_resp(200, [fake_profile])

        mock = _mock_httpx(get_returns=[user_resp, profile_resp])
        with patch("httpx.Client", return_value=mock):
            res = client.get(
                "/api/v1/profiles/me", headers={"Authorization": "Bearer tok"}
            )
        assert res.status_code == 200
        assert res.json()["Name"] == "TestUser"
        assert res.json()["is_complete"] is True

    def test_no_profile_yet(self, client):
        user_resp = _make_resp(200, {"id": "new-user"})
        profile_resp = _make_resp(200, [])

        mock = _mock_httpx(get_returns=[user_resp, profile_resp])
        with patch("httpx.Client", return_value=mock):
            res = client.get(
                "/api/v1/profiles/me", headers={"Authorization": "Bearer tok"}
            )
        assert res.status_code == 200
        assert res.json()["is_complete"] is False

    def test_requires_auth(self, client):
        res = client.get("/api/v1/profiles/me")
        assert res.status_code == 401


class TestGetProfileByUserId:
    def test_returns_public_profile_for_user_id(self, client):
        profile_resp = _make_resp(
            200,
            [
                {
                    "user_id": "bob",
                    "name": "Bob",
                    "age": 27,
                    "is_complete": True,
                }
            ],
        )

        mock = _mock_httpx(get_returns=[profile_resp])
        with patch("httpx.Client", return_value=mock):
            res = client.get(
                "/api/v1/profiles/bob", headers={"Authorization": "Bearer tok"}
            )

        assert res.status_code == 200
        assert res.json()["Name"] == "Bob"

    def test_profile_by_user_id_not_found(self, client):
        profile_resp = _make_resp(200, [])

        mock = _mock_httpx(get_returns=[profile_resp])
        with patch("httpx.Client", return_value=mock):
            res = client.get(
                "/api/v1/profiles/missing", headers={"Authorization": "Bearer tok"}
            )

        assert res.status_code == 404


class TestCreateProfile:
    def test_create_new_profile(self, client):
        user_resp = _make_resp(200, {"id": "u1"})
        existing_resp = _make_resp(200, [])
        create_resp = _make_resp(201, [{"id": 1, "Name": "Alice", "user_id": "u1"}])

        mock = _mock_httpx(
            get_returns=[user_resp, existing_resp],
            post_returns=[create_resp],
        )
        with patch("httpx.Client", return_value=mock):
            res = client.post(
                "/api/v1/profiles/",
                json={
                    "display_name": "Alice",
                    "age": 24,
                    "gender": "Female",
                    "interests": "Music",
                },
                headers={"Authorization": "Bearer tok"},
            )
        assert res.status_code == 200

    def test_update_existing_profile(self, client, fake_profile):
        user_resp = _make_resp(200, {"id": "aaaa-bbbb-cccc-dddd"})
        existing_resp = _make_resp(200, [fake_profile])
        patch_resp = _make_resp(200)

        mock = _mock_httpx(
            get_returns=[user_resp, existing_resp],
            patch_returns=[patch_resp],
        )
        with patch("httpx.Client", return_value=mock):
            res = client.post(
                "/api/v1/profiles/",
                json={
                    "display_name": "Updated",
                    "age": 26,
                    "gender": "Male",
                    "interests": "Gaming",
                },
                headers={"Authorization": "Bearer tok"},
            )
        assert res.status_code == 200
        assert res.json()["status"] == "updated"

    def test_patch_me_updates_existing_profile(self, client, fake_profile):
        user_resp = _make_resp(200, {"id": "aaaa-bbbb-cccc-dddd"})
        existing_resp = _make_resp(200, [fake_profile])
        patch_resp = _make_resp(200)

        mock = _mock_httpx(
            get_returns=[user_resp, existing_resp],
            patch_returns=[patch_resp],
        )
        with patch("httpx.Client", return_value=mock):
            res = client.patch(
                "/api/v1/profiles/me",
                json={
                    "display_name": "Updated",
                    "age": 26,
                    "gender": "Male",
                    "interests": "Gaming",
                },
                headers={"Authorization": "Bearer tok"},
            )
        assert res.status_code == 200
        assert res.json()["status"] == "updated"

    def test_create_requires_auth(self, client):
        res = client.post("/api/v1/profiles/", json={"display_name": "No Auth"})
        assert res.status_code == 401

    def test_location_name_and_coordinates_are_saved(self, client):
        user_resp = _make_resp(200, {"id": "u1"})
        existing_resp = _make_resp(200, [])
        create_resp = _make_resp(201, [{"id": 1}])
        patch_resp = _make_resp(200, [{"id": 1}])

        mock = _mock_httpx(
            get_returns=[user_resp, existing_resp],
            post_returns=[create_resp],
            patch_returns=[patch_resp],
        )
        with patch("httpx.Client", return_value=mock):
            res = client.post(
                "/api/v1/profiles/",
                json={
                    "display_name": "Loc",
                    "location_name": "Seattle, Washington, United States",
                    "latitude": "47.6062",
                    "longitude": "-122.3321",
                    "gender": "Male",
                    "interests": "Music",
                },
                headers={"Authorization": "Bearer tok"},
            )
        assert res.status_code == 200
        rpc_json = mock.post.call_args.kwargs.get("json", {})
        patch_json = mock.patch.call_args.kwargs.get("json", {})
        assert rpc_json["p_location"] == 47.6062
        assert patch_json["location_name"] == "Seattle, Washington, United States"
        assert patch_json["latitude"] == 47.6062
        assert patch_json["longitude"] == -122.3321

    def test_free_text_location_is_not_saved_as_display_name(self, client):
        user_resp = _make_resp(200, {"id": "u1"})
        existing_resp = _make_resp(200, [])
        create_resp = _make_resp(201, [{"id": 1}])
        patch_resp = _make_resp(200, [{"id": 1}])

        mock = _mock_httpx(
            get_returns=[user_resp, existing_resp],
            post_returns=[create_resp],
            patch_returns=[patch_resp],
        )
        with patch("httpx.Client", return_value=mock):
            res = client.post(
                "/api/v1/profiles/",
                json={
                    "display_name": "Bad Loc",
                    "location": "Seattle",
                    "gender": "Male",
                    "interests": "Music",
                },
                headers={"Authorization": "Bearer tok"},
            )
        assert res.status_code == 200
        assert "location_name" not in mock.patch.call_args.kwargs.get("json", {})


class TestGetCandidates:
    def test_returns_candidates(self, client, fake_profile):
        user_resp = _make_resp(200, {"id": "me-id"})
        my_profile_resp = _make_resp(
            200,
            [{"user_id": "me-id", "interests": "Music", "seeking_gender": "everyone"}],
        )
        all_profiles_resp = _make_resp(
            200,
            [
                fake_profile,
                {
                    "user_id": "other",
                    "Name": "Other",
                    "interests": "Music",
                    "gender": "Female",
                    "is_complete": True,
                },
            ],
        )

        sent_matches_resp = _make_resp(200, [])
        received_matches_resp = _make_resp(200, [])

        mock = _mock_httpx(
            get_returns=[
                user_resp,
                my_profile_resp,
                sent_matches_resp,
                received_matches_resp,
                all_profiles_resp,
            ]
        )
        with patch("httpx.Client", return_value=mock):
            res = client.get(
                "/api/v1/profiles/candidates?limit=5",
                headers={"Authorization": "Bearer tok"},
            )
        assert res.status_code == 200
        data = res.json()
        assert isinstance(data, list)
        assert all(c["user_id"] != "me-id" for c in data)

    def test_candidates_are_ranked_by_llm_score(self, client):
        user_resp = _make_resp(200, {"id": "me-id"})
        my_profile_resp = _make_resp(
            200,
            [{"user_id": "me-id", "interests": "Music", "seeking_gender": "everyone"}],
        )
        all_profiles_resp = _make_resp(
            200,
            [
                {
                    "user_id": "lower-score",
                    "name": "Lower",
                    "interests": "Gaming",
                    "gender": "Female",
                    "is_complete": True,
                },
                {
                    "user_id": "higher-score",
                    "name": "Higher",
                    "interests": "Music",
                    "gender": "Female",
                    "is_complete": True,
                },
            ],
        )

        sent_matches_resp = _make_resp(200, [])
        received_matches_resp = _make_resp(200, [])

        mock = _mock_httpx(
            get_returns=[
                user_resp,
                my_profile_resp,
                sent_matches_resp,
                received_matches_resp,
                all_profiles_resp,
            ]
        )

        def fake_llm_score(_key, _profile_a, profile_b):
            return 93.0 if profile_b["user_id"] == "higher-score" else 15.0

        with patch("httpx.Client", return_value=mock):
            with patch(
                "src.main.get_llm_compatibility_score", side_effect=fake_llm_score
            ):
                res = client.get(
                    "/api/v1/profiles/candidates?limit=5",
                    headers={"Authorization": "Bearer tok"},
                )

        assert res.status_code == 200
        assert [row["user_id"] for row in res.json()] == ["higher-score", "lower-score"]

    def test_candidates_exclude_existing_match_relationships(self, client):
        user_resp = _make_resp(200, {"id": "me-id"})
        my_profile_resp = _make_resp(
            200,
            [{"user_id": "me-id", "interests": "Music", "seeking_gender": "everyone"}],
        )
        sent_matches_resp = _make_resp(
            200,
            [
                {
                    "sender_id": "me-id",
                    "receiver_id": "already-liked",
                    "status": "pending",
                }
            ],
        )
        received_matches_resp = _make_resp(
            200,
            [
                {
                    "sender_id": "already-liked-me",
                    "receiver_id": "me-id",
                    "status": "pending",
                }
            ],
        )
        all_profiles_resp = _make_resp(
            200,
            [
                {
                    "user_id": "already-liked",
                    "name": "Already Liked",
                    "interests": "Music",
                    "gender": "Female",
                    "is_complete": True,
                },
                {
                    "user_id": "already-liked-me",
                    "name": "Already Liked Me",
                    "interests": "Music",
                    "gender": "Female",
                    "is_complete": True,
                },
                {
                    "user_id": "fresh-candidate",
                    "name": "Fresh",
                    "interests": "Music",
                    "gender": "Female",
                    "is_complete": True,
                },
            ],
        )

        mock = _mock_httpx(
            get_returns=[
                user_resp,
                my_profile_resp,
                sent_matches_resp,
                received_matches_resp,
                all_profiles_resp,
            ]
        )
        with patch("httpx.Client", return_value=mock):
            res = client.get(
                "/api/v1/profiles/candidates?limit=5",
                headers={"Authorization": "Bearer tok"},
            )

        assert res.status_code == 200
        assert [row["user_id"] for row in res.json()] == ["fresh-candidate"]

    def test_requires_profile(self, client):
        user_resp = _make_resp(200, {"id": "no-profile"})
        empty_resp = _make_resp(200, [])

        mock = _mock_httpx(get_returns=[user_resp, empty_resp])
        with patch("httpx.Client", return_value=mock):
            res = client.get(
                "/api/v1/profiles/candidates", headers={"Authorization": "Bearer tok"}
            )
        assert res.status_code == 404
