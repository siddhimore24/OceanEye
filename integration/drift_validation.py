from integration.validation import validate_required_fields


def validate_drift_output(data):
    """Validate Drift output before passing it to AIS."""

    required_fields = [
        "spill_id",
        "geometry",
        "release_time_window",
        "uncertainty",
    ]

    missing_fields = validate_required_fields(
        data,
        required_fields,
    )

    if missing_fields:
        return False, {
            "stage": "drift",
            "missing_fields": missing_fields,
        }

    if not data["release_time_window"]:
        return False, {
            "stage": "drift",
            "message": "Release time window is empty",
        }

    if data["uncertainty"] is None:
        return False, {
            "stage": "drift",
            "message": "Uncertainty information is missing",
        }

    return True, None