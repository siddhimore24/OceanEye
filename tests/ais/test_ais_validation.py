from integration.ais_validation import (
    validate_ais_candidate,
)


def valid_candidate():
    return {
        "mmsi": "123456789",
        "timestamp": "2026-09-07T10:00:00",
        "latitude": 18.50,
        "longitude": 72.80,
        "sog": 12.5,
        "cog": 180.0,
        "distance_to_source": 5.2,
        "temporal_score": 0.8,
    }


def test_valid_ais_candidate():
    valid, error = validate_ais_candidate(
        valid_candidate()
    )

    assert valid is True
    assert error is None


def test_missing_ais_field():
    candidate = valid_candidate()
    del candidate["mmsi"]

    valid, error = validate_ais_candidate(candidate)

    assert valid is False
    assert "missing_fields" in error


def test_invalid_latitude():
    candidate = valid_candidate()
    candidate["latitude"] = 100

    valid, error = validate_ais_candidate(candidate)

    assert valid is False


def test_invalid_longitude():
    candidate = valid_candidate()
    candidate["longitude"] = 200

    valid, error = validate_ais_candidate(candidate)

    assert valid is False


def test_negative_distance():
    candidate = valid_candidate()
    candidate["distance_to_source"] = -5

    valid, error = validate_ais_candidate(candidate)

    assert valid is False


def test_invalid_temporal_score():
    candidate = valid_candidate()
    candidate["temporal_score"] = 1.5

    valid, error = validate_ais_candidate(candidate)

    assert valid is False