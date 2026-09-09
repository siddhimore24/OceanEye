from integration.validation import (
    validate_latitude,
    validate_longitude,
    validate_non_negative,
    validate_confidence,
    validate_required_fields,
)


def validate_ais_candidate(candidate):
    """Validate one AIS vessel candidate against the data contract."""

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

    missing_fields = validate_required_fields(
        candidate,
        required_fields,
    )

    if missing_fields:
        return False, {
            "stage": "ais",
            "missing_fields": missing_fields,
        }

    if not validate_latitude(candidate["latitude"]):
        return False, {
            "stage": "ais",
            "message": "Invalid latitude",
        }

    if not validate_longitude(candidate["longitude"]):
        return False, {
            "stage": "ais",
            "message": "Invalid longitude",
        }

    if not validate_non_negative(candidate["sog"]):
        return False, {
            "stage": "ais",
            "message": "Invalid speed over ground",
        }

    if not validate_non_negative(candidate["distance_to_source"]):
        return False, {
            "stage": "ais",
            "message": "Invalid distance to source",
        }

    if not validate_confidence(candidate["temporal_score"]):
        return False, {
            "stage": "ais",
            "message": "Invalid temporal score",
        }

    return True, None