"""
ais/ais.py
----------
AIS module — Member 3's work, adapted to the OceanEye data contracts.

Reuses clean_ais.py's cleaned-positions output and spill_attribution.py's
suspect-pool / component logic, but STOPS before computing a final weighted
score. That step now belongs only to scoring/scoring.py (which already
implements the contract-compliant rank_vessel_candidates()), so we don't
score the same vessel twice with two different formulas.

Output of filter_ais_candidates(): a list of dicts, one per candidate
vessel, matching DATA_CONTRACTS.md's "AIS -> Scoring" contract:
    mmsi, timestamp, latitude, longitude, sog, cog, distance_to_source,
    temporal_score, trajectory_score
plus distance_score, which scoring/scoring.py actually reads (see note
below) and which DATA_CONTRACTS.md should be updated to include.

NOTE FOR THE INTEGRATION OWNER:
DATA_CONTRACTS.md currently lists "distance_to_source" as the AIS->Scoring
field, but scoring/scoring.py reads "distance_score" (a normalized 0-1
value). This adapter emits BOTH: distance_to_source (raw km, for evidence/
display) and distance_score (normalized, for scoring). Recommend updating
DATA_CONTRACTS.md to document distance_score explicitly rather than
silently relying on this adapter to paper over it.
"""

from typing import Optional

import numpy as np
import pandas as pd

EARTH_RADIUS_KM = 6371.0

BENIGN_LOITERING_TYPES = {30, 31, 32, 50, 51, 52, 53, 35}
HIGH_RISK_TYPES = set(range(70, 90))  # cargo (70-79) & tanker (80-89)


def _haversine_km(lat1, lon1, lat2, lon2):
    lat1, lon1, lat2, lon2 = map(np.radians, [lat1, lon1, lat2, lon2])
    dlat, dlon = lat2 - lat1, lon2 - lon1
    a = np.sin(dlat / 2) ** 2 + np.cos(lat1) * np.cos(lat2) * np.sin(dlon / 2) ** 2
    return 2 * EARTH_RADIUS_KM * np.arcsin(np.sqrt(a))


def _point_in_polygon(lat, lon, polygon_geojson):
    if polygon_geojson is None:
        return False
    coords = polygon_geojson["coordinates"][0]
    x, y = lon, lat
    inside = False
    n = len(coords)
    j = n - 1
    for i in range(n):
        xi, yi = coords[i]
        xj, yj = coords[j]
        if ((yi > y) != (yj > y)) and (
            x < (xj - xi) * (y - yi) / (yj - yi + 1e-15) + xi
        ):
            inside = not inside
        j = i
    return inside


def filter_ais_candidates(
    positions_csv: str,
    spill_lat: float,
    spill_lon: float,
    spill_time: str,
    radius_km: float = 25.0,
    lookback_hours: float = 12.0,
    drift_polygon: Optional[dict] = None,
) -> list:
    """
    Load clean_ais.py's cleaned-positions CSV, filter to candidate vessels
    near a spill, and return contract-shaped candidate dicts ready for
    scoring/scoring.py.rank_vessel_candidates().
    """
    positions = pd.read_csv(positions_csv, parse_dates=["timestamp"])

    t0 = pd.Timestamp(spill_time)
    window_start = t0 - pd.Timedelta(hours=lookback_hours)

    df = positions[
        (positions["timestamp"] >= window_start) & (positions["timestamp"] <= t0)
    ].copy()
    df["dist_km"] = _haversine_km(df["lat"], df["lon"], spill_lat, spill_lon)
    pool = df[df["dist_km"] <= radius_km]

    has_polygon = drift_polygon is not None
    max_loiter = 1.0
    if not pool.empty:
        loiter_by_vessel = {}
        for mmsi, g in pool.groupby("mmsi"):
            slow = g[g["speed"] < 3.0]
            loiter_by_vessel[mmsi] = (
                (slow["timestamp"].max() - slow["timestamp"].min()).total_seconds() / 60.0
                if len(slow) >= 2 else 0.0
            )
        max_loiter = max(loiter_by_vessel.values() or [1.0]) or 1.0

    candidates = []
    for mmsi, g in pool.groupby("mmsi"):
        g = g.sort_values("timestamp")
        closest = g.loc[g["dist_km"].idxmin()]
        ship_type = g["ship_type"].iloc[-1]

        slow = g[g["speed"] < 3.0]
        loiter_minutes = (
            (slow["timestamp"].max() - slow["timestamp"].min()).total_seconds() / 60.0
            if len(slow) >= 2 else 0.0
        )

        gaps = g[g["ais_gap_flag"] == True]  # noqa: E712
        had_gap_near_spill = bool(
            ((t0 - gaps["timestamp"]).abs() <= pd.Timedelta(minutes=90)).any()
        ) if not gaps.empty else False

        in_zone = False
        if has_polygon:
            in_zone = bool(
                g.apply(lambda r: _point_in_polygon(r["lat"], r["lon"], drift_polygon), axis=1).any()
            )

        s_loitering = min(loiter_minutes / max_loiter, 1.0)
        if ship_type in BENIGN_LOITERING_TYPES:
            s_loitering *= 0.3

        # temporal_score: how well this vessel's timing near the spill
        # matches suspicious behaviour (loitering + a gap ending near spill)
        temporal_score = round(0.5 * s_loitering + 0.5 * float(had_gap_near_spill), 4)

        # trajectory_score: drift-zone intersection + vessel-type prior
        s_drift = 1.0 if in_zone else 0.0
        s_vessel_type = 1.0 if ship_type in HIGH_RISK_TYPES else 0.3
        trajectory_score = round(
            (0.7 * s_drift if has_polygon else 0.0) + 0.3 * s_vessel_type, 4
        )

        candidates.append({
            "mmsi": str(mmsi),
            "timestamp": closest["timestamp"].isoformat(),
            "latitude": float(closest["lat"]),
            "longitude": float(closest["lon"]),
            "sog": float(closest["speed"]),
            "cog": float(closest["course"]),
            "distance_to_source": round(float(closest["dist_km"]), 3),
            "distance_score": round(1 - min(closest["dist_km"] / radius_km, 1.0), 4),
            "temporal_score": temporal_score,
            "trajectory_score": trajectory_score,
            # extra evidence fields, not in the strict contract but useful
            # for the frontend's evidence cards:
            "shipname": closest.get("shipname", "UNKNOWN VESSEL"),
            "loiter_minutes": round(loiter_minutes, 1),
            "had_gap_near_spill": had_gap_near_spill,
            "in_drift_zone": in_zone,
        })

    candidates.sort(key=lambda c: c["distance_to_source"])
    return candidates
