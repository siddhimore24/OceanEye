from integration.ais_validation import validate_ais_candidate
from integration.drift_validation import validate_drift_output
from integration.scoring_validation import validate_ranking_candidate
from integration.pipeline import validate_satellite_output


def run_qa_pipeline(
    satellite_output,
    drift_output,
    ais_candidate,
    ranking_candidate,
):
    """Validate every major pipeline handoff."""

    valid, error = validate_satellite_output(
        satellite_output
    )

    if not valid:
        return {
            "status": "error",
            "stage": "satellite",
            "error": error,
        }

    valid, error = validate_drift_output(
        drift_output
    )

    if not valid:
        return {
            "status": "error",
            "stage": "drift",
            "error": error,
        }

    valid, error = validate_ais_candidate(
        ais_candidate
    )

    if not valid:
        return {
            "status": "error",
            "stage": "ais",
            "error": error,
        }

    valid, error = validate_ranking_candidate(
        ranking_candidate
    )

    if not valid:
        return {
            "status": "error",
            "stage": "scoring",
            "error": error,
        }

    return {
        "status": "success",
        "message": "All pipeline handoffs passed QA",
    }