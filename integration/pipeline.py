from pathlib import Path

from config.settings import (
    DEMO_CASE,
    PIPELINE_STATUS_SUCCESS,
    PIPELINE_STATUS_ERROR,
)

from integration.validation import (
    validate_required_fields,
    validate_confidence,
)


def validate_satellite_output(data):
    """Validate the required satellite output fields."""

    required_fields = [
        "spill_id",
        "area_km2",
        "centroid",
        "confidence",
        "output_path",
    ]

    missing_fields = validate_required_fields(
        data,
        required_fields,
    )

    if missing_fields:
        return False, {
            "stage": "satellite",
            "missing_fields": missing_fields,
        }

    if not validate_confidence(data["confidence"]):
        return False, {
            "stage": "satellite",
            "message": "Invalid confidence value",
        }

    if data["area_km2"] < 0:
        return False, {
            "stage": "satellite",
            "message": "Invalid area value",
        }

    if not Path(data["output_path"]).exists():
        return False, {
            "stage": "satellite",
            "message": "Satellite output file does not exist",
        }

    return True, None


def run_pipeline(satellite_result=None):
    """
    M6 integration entry point.

    Validates the output received from the satellite module.
    """

    if satellite_result is None:
        satellite_result = {
            "spill_id": DEMO_CASE,
            "area_km2": 1.0,
            "centroid": {
                "longitude": 72.8,
                "latitude": 18.5,
            },
            "confidence": 0.85,
            "output_path": "data/sample/spill.geojson",
        }

    valid, error = validate_satellite_output(
        satellite_result
    )

    if not valid:
        return {
            "status": PIPELINE_STATUS_ERROR,
            "error": error,
        }

    return {
        "status": PIPELINE_STATUS_SUCCESS,
        "case_id": satellite_result["spill_id"],
        "message": "Satellite output successfully validated",
        "satellite_output": satellite_result,
    }