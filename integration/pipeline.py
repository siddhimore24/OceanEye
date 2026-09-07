from config.settings import (
    DEMO_CASE,
    PIPELINE_STATUS_SUCCESS,
)


def run_pipeline():
    """
    Starter end-to-end pipeline for the OceanEye MVP.
    """

    return {
        "status": PIPELINE_STATUS_SUCCESS,
        "case_id": DEMO_CASE,
        "message": "Pipeline integration is working",
    }