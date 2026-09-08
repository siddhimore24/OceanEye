from integration.pipeline import run_pipeline


def test_pipeline_runs():
    result = run_pipeline()

    assert result["status"] == "success"


def test_pipeline_uses_demo_case():
    result = run_pipeline()

    assert result["case_id"] == "CASE_001"


def test_pipeline_returns_satellite_output():
    result = run_pipeline()

    assert "satellite_output" in result


def test_pipeline_validates_satellite_fields():
    result = run_pipeline()

    satellite_output = result["satellite_output"]

    assert "spill_id" in satellite_output
    assert "area_km2" in satellite_output
    assert "centroid" in satellite_output
    assert "confidence" in satellite_output
    assert "output_path" in satellite_output


def test_pipeline_has_message():
    result = run_pipeline()

    assert result["message"] == (
        "Satellite output successfully validated"
    )


def test_pipeline_rejects_invalid_confidence():
    data = {
        "spill_id": "CASE_001",
        "area_km2": 1.0,
        "centroid": {
            "longitude": 72.8,
            "latitude": 18.5,
        },
        "confidence": 1.5,
        "output_path": "data/sample/spill.geojson",
    }

    result = run_pipeline(data)

    assert result["status"] == "error"


def test_pipeline_rejects_missing_field():
    data = {
        "spill_id": "CASE_001",
        "area_km2": 1.0,
        "confidence": 0.85,
        "output_path": "data/sample/spill.geojson",
    }

    result = run_pipeline(data)

    assert result["status"] == "error"