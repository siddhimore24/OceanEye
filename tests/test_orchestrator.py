from integration.orchestrator import run_end_to_end


def test_end_to_end_pipeline_success():

    satellite = {
        "spill_id": "CASE_001",
        "area_km2": 1.0,
        "centroid": {
            "longitude": 72.8,
            "latitude": 18.5,
        },
        "confidence": 0.85,
        "output_path": "data/sample/spill.geojson",
    }

    drift = {
        "spill_id": "CASE_001",
        "geometry": {},
        "release_time_window": {
            "start": "2026-09-07T08:00:00",
            "end": "2026-09-07T10:00:00",
        },
        "uncertainty": {},
    }

    ais = {
        "mmsi": "123456789",
        "timestamp": "2026-09-07T09:00:00",
        "latitude": 18.50,
        "longitude": 72.80,
        "sog": 12.5,
        "cog": 180.0,
        "distance_to_source": 5.2,
        "temporal_score": 0.8,
    }

    ranking = {
        "mmsi": "123456789",
        "rank": 1,
        "overall_score": 0.85,
        "score_components": {},
        "reasons": [],
        "confidence": 0.85,
        "uncertainty": {},
        "data_provenance": {},
    }

    result = run_end_to_end(
        satellite,
        drift,
        ais,
        ranking,
    )

    assert result["status"] == "success"
    assert result["stages_completed"] == [
        "satellite",
        "drift",
        "ais",
        "scoring",
    ]
    assert result["ranking"]["mmsi"] == "123456789"