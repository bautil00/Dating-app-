"""Tests for profile endpoints."""

from unittest.mock import patch, MagicMock


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

    def test_create_requires_auth(self, client):
        res = client.post("/api/v1/profiles/", json={"display_name": "No Auth"})
        assert res.status_code == 401

    def test_location_converted_to_float(self, client):
        user_resp = _make_resp(200, {"id": "u1"})
        existing_resp = _make_resp(200, [])
        create_resp = _make_resp(201, [{"id": 1}])

        mock = _mock_httpx(
            get_returns=[user_resp, existing_resp],
            post_returns=[create_resp],
        )
        with patch("httpx.Client", return_value=mock):
            res = client.post(
                "/api/v1/profiles/",
                json={
                    "display_name": "Loc",
                    "location": "47.6",
                    "gender": "Male",
                    "interests": "Music",
                },
                headers={"Authorization": "Bearer tok"},
            )
        assert res.status_code == 200
        # Verify the POST call used a float for Location
        post_call = mock.post.call_args
        assert post_call is not None
        sent_json = post_call.kwargs.get("json", {})
        if "Location" in sent_json:
            assert isinstance(sent_json["Location"], float)

    def test_invalid_location_ignored(self, client):
        user_resp = _make_resp(200, {"id": "u1"})
        existing_resp = _make_resp(200, [])
        create_resp = _make_resp(201, [{"id": 1}])

        mock = _mock_httpx(
            get_returns=[user_resp, existing_resp],
            post_returns=[create_resp],
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

        mock = _mock_httpx(get_returns=[user_resp, my_profile_resp, all_profiles_resp])
        with patch("httpx.Client", return_value=mock):
            res = client.get(
                "/api/v1/profiles/candidates?limit=5",
                headers={"Authorization": "Bearer tok"},
            )
        assert res.status_code == 200
        data = res.json()
        assert isinstance(data, list)
        assert all(c["user_id"] != "me-id" for c in data)

    def test_requires_profile(self, client):
        user_resp = _make_resp(200, {"id": "no-profile"})
        empty_resp = _make_resp(200, [])

        mock = _mock_httpx(get_returns=[user_resp, empty_resp])
        with patch("httpx.Client", return_value=mock):
            res = client.get(
                "/api/v1/profiles/candidates", headers={"Authorization": "Bearer tok"}
            )
        assert res.status_code == 404
