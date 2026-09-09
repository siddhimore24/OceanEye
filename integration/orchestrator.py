from integration.pipeline import validate_satellite_output
from integration.drift_validation import validate_drift_output
from integration.ais_validation import validate_ais_candidate
from integration.scoring_validation import validate_ranking_candidate


def run_end_to_end(
    satellite_output,
    drift_output,
    ais_candidate,
    ranking_candidate,
):
    """
    Validate and connect all major OceanEye pipeline stages.
    """

    stages = [
        ("satellite", validate_satellite_output, satellite_output),
        ("drift", validate_drift_output, drift_output),
        ("ais", validate_ais_candidate, ais_candidate),
        ("scoring", validate_ranking_candidate, ranking_candidate),
    ]

    for stage_name, validator, data in stages:
        valid, error = validator(data)

        if not valid:
            return {
                "status": "error",
                "failed_stage": stage_name,
                "error": error,
            }

    return {
        "status": "success",
        "message": "End-to-end pipeline validation successful",
        "stages_completed": [
            "satellite",
            "drift",
            "ais",
            "scoring",
        ],
        "ranking": ranking_candidate,
    }