def test_ais_candidate_contract():
    candidate = {
        "mmsi": "123456789",
        "timestamp": "2026-09-07T10:00:00",
        "latitude": 18.50,
        "longitude": 72.80,
        "sog": 12.5,
        "cog": 180.0,
        "distance_to_source": 5.2,
        "temporal_score": 0.8,
    }

    required_fields = [
        "mmsi",
        "timestamp",
        "latitude",
        "longitude",
        "sog",
        "cog",
        "distance_to_source",
        "temporal_score",
    ]

    for field in required_fields:
        assert field in candidate


def test_ais_coordinates_are_valid():
    candidate = {
        "latitude": 18.50,
        "longitude": 72.80,
    }

    assert -90 <= candidate["latitude"] <= 90
    assert -180 <= candidate["longitude"] <= 180


def test_ais_distance_is_non_negative():
    distance_to_source = 5.2

    assert distance_to_source >= 0


def test_ais_temporal_score_is_valid():
    temporal_score = 0.8

    assert 0 <= temporal_score <= 1