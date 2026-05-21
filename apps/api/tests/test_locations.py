from unittest.mock import MagicMock, patch

from src.main import LOCATION_SEARCH_CACHE, _map_nominatim_result


def _mock_httpx(get_returns=None):
    mock_client = MagicMock()
    mock_client.__enter__ = lambda s: s
    mock_client.__exit__ = MagicMock(return_value=False)
    if get_returns:
        mock_client.get.side_effect = get_returns
    return mock_client


def _make_resp(status=200, data=None):
    response = MagicMock()
    response.status_code = status
    response.json.return_value = data if data is not None else {}
    response.text = str(data)
    return response


def test_maps_nominatim_result_to_app_shape():
    result = _map_nominatim_result(
        {
            "place_id": 123,
            "lat": "47.6062",
            "lon": "-122.3321",
            "address": {
                "city": "Seattle",
                "state": "Washington",
                "country": "United States",
            },
        }
    )

    assert result == {
        "label": "Seattle, Washington, United States",
        "city": "Seattle",
        "region": "Washington",
        "country": "United States",
        "latitude": 47.6062,
        "longitude": -122.3321,
        "source_id": "123",
    }


def test_location_search_rejects_short_query(client):
    res = client.get(
        "/api/v1/locations/search?q=s", headers={"Authorization": "Bearer tok"}
    )

    assert res.status_code == 422


def test_location_search_requires_auth(client):
    res = client.get("/api/v1/locations/search?q=Seattle")

    assert res.status_code == 401


def test_location_search_uses_authenticated_nominatim_proxy(client):
    LOCATION_SEARCH_CACHE.clear()
    auth_resp = _make_resp(200, {"id": "u1"})
    search_resp = _make_resp(
        200,
        [
            {
                "place_id": 123,
                "lat": "47.6062",
                "lon": "-122.3321",
                "address": {
                    "city": "Seattle",
                    "state": "Washington",
                    "country": "United States",
                },
            }
        ],
    )
    mock = _mock_httpx(get_returns=[auth_resp, search_resp])

    with patch("httpx.Client", return_value=mock):
        res = client.get(
            "/api/v1/locations/search?q=Seattle",
            headers={"Authorization": "Bearer tok"},
        )

    assert res.status_code == 200
    assert res.json()[0]["label"] == "Seattle, Washington, United States"
    nominatim_call = mock.get.call_args_list[1]
    assert nominatim_call.args[0] == "https://nominatim.openstreetmap.org/search"
    assert nominatim_call.kwargs["params"]["featureType"] == "settlement"
    assert "User-Agent" in nominatim_call.kwargs["headers"]
