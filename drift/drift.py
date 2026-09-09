from datetime import datetime, timedelta


def estimate_release_time_window(
    detection_timestamp,
    hours_before=2,
    hours_after=2,
):
    """
    Estimate a possible oil-spill release time window
    around the satellite detection time.
    """

    if isinstance(detection_timestamp, str):
        detection_timestamp = datetime.fromisoformat(
            detection_timestamp
        )

    start_time = detection_timestamp - timedelta(
        hours=hours_before
    )

    end_time = detection_timestamp + timedelta(
        hours=hours_after
    )

    return {
        "start": start_time.isoformat(),
        "end": end_time.isoformat(),
    }


def estimate_source_zone(
    spill_id,
    geometry,
    detection_timestamp,
    uncertainty_radius_km=5.0,
):
    """
    Generate a basic source-zone estimate for a detected spill.
    """

    release_time_window = estimate_release_time_window(
        detection_timestamp
    )

    return {
        "spill_id": spill_id,
        "geometry": geometry,
        "release_time_window": release_time_window,
        "uncertainty": {
            "radius_km": uncertainty_radius_km
        },
    }


def run_drift_pipeline(
    spill_id,
    geometry,
    detection_timestamp,
    uncertainty_radius_km=5.0,
):
    """
    Run the Drift stage and return a contract-compliant output.
    """

    return estimate_source_zone(
        spill_id=spill_id,
        geometry=geometry,
        detection_timestamp=detection_timestamp,
        uncertainty_radius_km=uncertainty_radius_km,
    )