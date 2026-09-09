from integration.status import create_pipeline_status


def test_pipeline_status_in_progress():

    result = create_pipeline_status(
        satellite="success",
        drift="pending",
        ais="pending",
        scoring="pending",
    )

    assert result["status"] == "in_progress"
    assert result["completed_stages"] == ["satellite"]


def test_pipeline_status_success():

    result = create_pipeline_status(
        satellite="success",
        drift="success",
        ais="success",
        scoring="success",
    )

    assert result["status"] == "success"
    assert len(result["completed_stages"]) == 4


def test_pipeline_status_error():

    result = create_pipeline_status(
        satellite="success",
        drift="error",
        ais="pending",
        scoring="pending",
    )

    assert result["status"] == "error"
    assert result["failed_stages"] == ["drift"]