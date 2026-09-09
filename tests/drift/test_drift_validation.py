from integration.drift_validation import (
    validate_drift_output,
)


def valid_drift_output():
    return {
        "spill_id": "CASE_001",
        "geometry": {},
        "release_time_window": {
            "start": "2026-09-07T08:00:00",
            "end": "2026-09-07T10:00:00",
        },
        "uncertainty": {
            "radius_km": 5.0,
        },
    }


def test_valid_drift_output():
    valid, error = validate_drift_output(
        valid_drift_output()
    )

    assert valid is True
    assert error is None


def test_missing_drift_field():
    data = valid_drift_output()
    del data["geometry"]

    valid, error = validate_drift_output(data)

    assert valid is False
    assert "missing_fields" in error


def test_empty_release_time_window():
    data = valid_drift_output()
    data["release_time_window"] = {}

    valid, error = validate_drift_output(data)

    assert valid is False


def test_missing_uncertainty():
    data = valid_drift_output()
    data["uncertainty"] = None

    valid, error = validate_drift_output(data)

    assert valid is False