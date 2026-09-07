from config.settings import (
    DEMO_CASE,
    PIPELINE_STATUS_SUCCESS,
)

from tests.validation import (
    validate_required_fields,
    validate_confidence,
)


def run_pipeline():
    """
    Starter end-to-end pipeline for the OceanEye MVP.
    """

    sample_data = {
        "spill_id": DEMO_CASE,
        "confidence": 0.85,
    }

    required_fields = [
        "spill_id",
        "confidence",
    ]

    missing_fields = validate_required_fields(
        sample_data,
        required_fields,
    )

    if missing_fields:
        return {
            "status": "error",
            "missing_fields": missing_fields,
        }

    if not validate_confidence(sample_data["confidence"]):
        return {
            "status": "error",
            "message": "Invalid confidence value",
        }

    return {
        "status": PIPELINE_STATUS_SUCCESS,
        "case_id": DEMO_CASE,
        "message": "Pipeline integration is working",
    }