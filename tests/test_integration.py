from integration.pipeline import run_pipeline


def test_pipeline_runs():
    result = run_pipeline()

    assert result["status"] == "success"


def test_pipeline_uses_demo_case():
    result = run_pipeline()

    assert result["case_id"] == "CASE_001"