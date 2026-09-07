from tests.validation import (
    validate_required_fields,
    validate_confidence,
    validate_latitude,
    validate_longitude,
    validate_non_negative,
)


def test_validate_complete_data():
    data = {
        "spill_id": "CASE_001",
        "confidence": 0.85,
    }

    required_fields = ["spill_id", "confidence"]

    assert validate_required_fields(data, required_fields) == []


def test_validate_missing_data():
    data = {
        "spill_id": "CASE_001",
    }

    required_fields = ["spill_id", "confidence"]

    assert validate_required_fields(data, required_fields) == ["confidence"]


def test_valid_confidence():
    assert validate_confidence(0.85)


def test_invalid_confidence():
    assert not validate_confidence(1.5)


def test_valid_coordinates():
    assert validate_latitude(18.50)
    assert validate_longitude(72.80)


def test_invalid_coordinates():
    assert not validate_latitude(100)
    assert not validate_longitude(200)


def test_non_negative_value():
    assert validate_non_negative(5.2)
    assert not validate_non_negative(-1)