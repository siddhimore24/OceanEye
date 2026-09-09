def create_pipeline_status(
    satellite="pending",
    drift="pending",
    ais="pending",
    scoring="pending",
):
    """Create a simple frontend-ready pipeline status."""

    stages = {
        "satellite": satellite,
        "drift": drift,
        "ais": ais,
        "scoring": scoring,
    }

    completed = [
        stage
        for stage, status in stages.items()
        if status == "success"
    ]

    failed = [
        stage
        for stage, status in stages.items()
        if status == "error"
    ]

    if failed:
        overall_status = "error"
    elif len(completed) == len(stages):
        overall_status = "success"
    else:
        overall_status = "in_progress"

    return {
        "status": overall_status,
        "stages": stages,
        "completed_stages": completed,
        "failed_stages": failed,
    }