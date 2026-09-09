from integration.qa_pipeline import run_qa_pipeline


def valid_satellite():
    return {
        "spill_id": "CASE_001",
        "area_km2": 1.5,
        "centroid": {
            "longitude": 72.8,
            "latitude": 18.5,
        },
        "confidence": 0.85,
        "output_path": "data/sample/spill.geojson",
    }


def valid_drift():
    return {
        "spill_id": "CASE_001",
        "geometry": {},
        "release_time_window": {
            "start": "2026-09-07T08:00:00",
            "end": "2026-09-07T10:00:00",
        },
        "uncertainty": {
            "radius_km": 5.0,
        },
    }


def valid_ais():
    return {
        "mmsi": "123456789",
        "timestamp": "2026-09-07T10:00:00",
        "latitude": 18.50,
        "longitude": 72.80,
        "sog": 12.5,
        "cog": 180.0,
        "distance_to_source": 5.2,
        "temporal_score": 0.8,
    }


def valid_ranking():
    return {
        "mmsi": "123456789",
        "rank": 1,
        "overall_score": 0.85,
        "score_components": {},
        "reasons": [],
        "confidence": 0.85,
        "uncertainty": {},
        "data_provenance": {},
    }


def test_complete_qa_pipeline():
    result = run_qa_pipeline(
        valid_satellite(),
        valid_drift(),
        valid_ais(),
        valid_ranking(),
    )

    assert result["status"] == "success"


def test_qa_pipeline_detects_drift_failure():
    drift = valid_drift()
    drift["uncertainty"] = None

    result = run_qa_pipeline(
        valid_satellite(),
        drift,
        valid_ais(),
        valid_ranking(),
    )

    assert result["status"] == "error"
    assert result["stage"] == "drift"


def test_qa_pipeline_detects_ais_failure():
    ais = valid_ais()
    ais["latitude"] = 100

    result = run_qa_pipeline(
        valid_satellite(),
        valid_drift(),
        ais,
        valid_ranking(),
    )

    assert result["status"] == "error"
    assert result["stage"] == "ais"


def test_qa_pipeline_detects_scoring_failure():
    ranking = valid_ranking()
    ranking["overall_score"] = 1.5

    result = run_qa_pipeline(
        valid_satellite(),
        valid_drift(),
        valid_ais(),
        ranking,
    )

    assert result["status"] == "error"
    assert result["stage"] == "scoring"