from satellite.pipeline import run_satellite_pipeline
from drift.drift import run_drift_pipeline
from ais.ais import filter_ais_candidates
from scoring.scoring import score_and_validate


def run_demo():

    # -------------------------
    # 1. SATELLITE
    # -------------------------
    satellite = run_satellite_pipeline(
        input_path="data/sample/CASE_001.tif",
        output_path="data/sample/spill.geojson",
        spill_id="CASE_001",
    )

    # -------------------------
    # 2. DRIFT
    # -------------------------
    drift = run_drift_pipeline(
        spill_id=satellite["spill_id"],
        geometry=satellite["centroid"],
        detection_timestamp="2026-09-07T10:00:00",
    )

    # -------------------------
    # 3. DEMO AIS DATA
    # -------------------------
    ais_records = [
        {
            "mmsi": "123456789",
            "timestamp": "2026-09-07T09:00:00",
            "latitude": 18.98,
            "longitude": 72.03,
            "sog": 12.5,
            "cog": 180.0,
            "temporal_score": 0.9,
        },
        {
            "mmsi": "987654321",
            "timestamp": "2026-09-07T06:00:00",
            "latitude": 19.20,
            "longitude": 72.30,
            "sog": 10.0,
            "cog": 200.0,
            "temporal_score": 0.5,
        },
    ]

    # -------------------------
    # 4. AIS FILTERING
    # -------------------------
    source_latitude = drift["geometry"]["latitude"]
    source_longitude = drift["geometry"]["longitude"]

    ais_candidates = filter_ais_candidates(
        ais_records,
        source_latitude=source_latitude,
        source_longitude=source_longitude,
    )

    # -------------------------
    # 5. SCORING
    # -------------------------
    for candidate in ais_candidates:

        candidate["distance_score"] = (
            1.0
            - min(
                candidate["distance_to_source"] / 50.0,
                1.0,
            )
        )

        candidate["trajectory_score"] = 0.5

    result = score_and_validate(ais_candidates)

    return result


if __name__ == "__main__":

    result = run_demo()

    print("\n=== OceanEye Demo Result ===")

    for candidate in result.get("ranking", []):
        print(
            f"Rank {candidate['rank']} | "
            f"MMSI {candidate['mmsi']} | "
            f"Score {candidate['overall_score']}"
        )