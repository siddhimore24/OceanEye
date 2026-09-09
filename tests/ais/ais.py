from datetime import datetime


def calculate_distance_score(distance_to_source, max_distance_km=50.0):
    """
    Convert distance from source zone into a score from 0 to 1.

    Closer vessel = higher score.
    """

    if distance_to_source < 0:
        raise ValueError("Distance cannot be negative")

    if distance_to_source >= max_distance_km:
        return 0.0

    score = 1.0 - (distance_to_source / max_distance_km)

    return round(max(0.0, min(1.0, score)), 4)


def calculate_temporal_score(
    vessel_timestamp,
    release_start,
    release_end,
):
    """
    Calculate how well a vessel timestamp matches
    the estimated spill release window.

    Inside the window = 1.0
    Outside the window = 0.0
    """

    if isinstance(vessel_timestamp, str):
        vessel_timestamp = datetime.fromisoformat(vessel_timestamp)

    if isinstance(release_start, str):
        release_start = datetime.fromisoformat(release_start)

    if isinstance(release_end, str):
        release_end = datetime.fromisoformat(release_end)

    if release_start <= vessel_timestamp <= release_end:
        return 1.0

    return 0.0


def create_ais_candidate(
    mmsi,
    timestamp,
    latitude,
    longitude,
    sog,
    cog,
    distance_to_source,
    temporal_score,
):
    """
    Create one AIS candidate following the project data contract.
    """

    return {
        "mmsi": str(mmsi),
        "timestamp": timestamp,
        "latitude": float(latitude),
        "longitude": float(longitude),
        "sog": float(sog),
        "cog": float(cog),
        "distance_to_source": float(distance_to_source),
        "temporal_score": float(
            max(0.0, min(1.0, temporal_score))
        ),
    }


def filter_ais_candidates(
    ais_records,
    source_latitude,
    source_longitude,
    max_distance_km=50.0,
):
    """
    Filter AIS records based on their distance from the
    estimated source location.

    NOTE:
    This is a basic backend implementation for the demo.
    Real deployment should use proper geodesic distance
    calculations and historical AIS datasets.
    """

    candidates = []

    for record in ais_records:
        distance = calculate_approx_distance_km(
            record["latitude"],
            record["longitude"],
            source_latitude,
            source_longitude,
        )

        if distance <= max_distance_km:
            candidates.append(
                create_ais_candidate(
                    mmsi=record["mmsi"],
                    timestamp=record["timestamp"],
                    latitude=record["latitude"],
                    longitude=record["longitude"],
                    sog=record["sog"],
                    cog=record["cog"],
                    distance_to_source=round(distance, 4),
                    temporal_score=record.get(
                        "temporal_score",
                        0.0,
                    ),
                )
            )

    return candidates


def calculate_approx_distance_km(
    lat1,
    lon1,
    lat2,
    lon2,
):
    """
    Approximate geographic distance in kilometres.

    Uses a simple equirectangular approximation,
    sufficient for the initial demo pipeline.
    """

    import math

    lat1 = math.radians(lat1)
    lat2 = math.radians(lat2)
    lon1 = math.radians(lon1)
    lon2 = math.radians(lon2)

    x = (lon2 - lon1) * math.cos(
        (lat1 + lat2) / 2
    )
    y = lat2 - lat1

    earth_radius_km = 6371.0

    return earth_radius_km * math.sqrt(
        x * x + y * y
    )