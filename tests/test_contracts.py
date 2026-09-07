def test_satellite_output_required_fields():
    satellite_output = {
        "spill_id": "CASE_001",
        "geometry": {},
        "centroid": {},
        "area_km2": 10.5,
        "confidence": 0.85,
        "detection_timestamp": "2026-09-07T10:00:00",
    }

    required_fields = [
        "spill_id",
        "geometry",
        "centroid",
        "area_km2",
        "confidence",
        "detection_timestamp",
    ]

    for field in required_fields:
        assert field in satellite_output


def test_ais_output_required_fields():
    ais_output = {
        "mmsi": "123456789",
        "timestamp": "2026-09-07T10:00:00",
        "latitude": 18.50,
        "longitude": 72.80,
        "sog": 12.5,
        "cog": 180.0,
        "distance_to_source": 5.2,
        "temporal_score": 0.8,
    }

    required_fields = [
        "mmsi",
        "timestamp",
        "latitude",
        "longitude",
        "sog",
        "cog",
        "distance_to_source",
        "temporal_score",
    ]

    for field in required_fields:
        assert field in ais_output