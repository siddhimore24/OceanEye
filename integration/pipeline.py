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


def run_pipeline(
    input_path="data/sample/CASE_001.tif",
    output_path="data/sample/spill.geojson",
    spill_id=DEMO_CASE,
):
    """
    Run the real satellite pipeline and validate its output.
    """

    from satellite.pipeline import run_satellite_pipeline

    try:
        satellite_result = run_satellite_pipeline(
            input_path=input_path,
            output_path=output_path,
            spill_id=spill_id,
        )

    except Exception as exc:
        return {
            "status": PIPELINE_STATUS_ERROR,
            "stage": "satellite",
            "error": str(exc),
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
        "message": "Satellite pipeline completed successfully",
        "satellite_output": satellite_result,
    }