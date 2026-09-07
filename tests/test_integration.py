from integration.pipeline import run_pipeline


def test_pipeline_runs():
    result = run_pipeline()

    assert result["status"] == "success"


def test_pipeline_uses_demo_case():
    result = run_pipeline()

    assert result["case_id"] == "CASE_001"


def test_pipeline_has_case_id():
    result = run_pipeline()

    assert "case_id" in result
    assert result["case_id"] == "CASE_001"

def test_pipeline_returns_success_for_valid_data():
    result = run_pipeline()

    assert result["status"] == "success"
    assert result["case_id"] == "CASE_001"


def test_pipeline_has_message():
    result = run_pipeline()

    assert "message" in result
    assert result["message"] == "Pipeline integration is working"