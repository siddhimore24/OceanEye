"""
spill_attribution.py
---------------------
Member 3 pipeline stage 2: turns cleaned AIS positions (from clean_ais.py)
into a ranked list of "suspect" vessels for a given oil-spill detection.

GENERALIZATION NOTE (this is the file that plugs into any future input):
Everything specific to one spill/one dataset lives in a single SpillEvent
object below (lat, lon, timestamp, optional drift-zone polygon from
Member 4, search radius, lookback window) and a single --positions path.
Nothing else needs to change to run this on:
  - the real spill location/time once Member 2 delivers it
  - a totally different AIS extract (e.g. an Indian Ocean dataset), as
    long as it was produced by clean_ais.py (same column names)
  - a real drift/hindcast polygon from Member 4, once available

Usage:
    python3 spill_attribution.py \
        --positions ais_cleaned_positions.csv \
        --lat 59.55 --lon 24.75 --time 2022-09-08T11:30:00 \
        --radius-km 25 --lookback-hours 12 \
        [--drift-polygon drift_zone.geojson] \
        --out vessel_ranking.csv

Or import SpillEvent + rank_vessels() directly from another script/notebook.
"""

import argparse
import json
from dataclasses import dataclass, field
from typing import Optional

import numpy as np
import pandas as pd

EARTH_RADIUS_KM = 6371.0

# Scoring weights - sum to 1.0. If no drift polygon is supplied, its weight
# is redistributed proportionally across the remaining components.
WEIGHTS = {
    "proximity": 0.35,
    "drift_zone": 0.25,
    "loitering": 0.15,
    "gap_near_spill": 0.20,
    "vessel_type": 0.05,
}

# Vessel types (AIS ship_type codes) that loiter near ports/harbours for
# entirely innocent reasons - down-weighted in the loitering component so
# they don't drown out genuine suspects near busy traffic areas.
BENIGN_LOITERING_TYPES = {
    30, 31, 32,          # fishing, towing
    50, 51, 52, 53,      # pilot, SAR, tug, port tender
    35,                   # military ops (often stationary)
}


@dataclass
class SpillEvent:
    lat: float
    lon: float
    timestamp: str                      # ISO 8601
    radius_km: float = 25.0
    lookback_hours: float = 12.0
    polygon_geojson: Optional[dict] = field(default=None)  # Member 4's drift/source zone


def haversine_km(lat1, lon1, lat2, lon2):
    lat1, lon1, lat2, lon2 = map(np.radians, [lat1, lon1, lat2, lon2])
    dlat, dlon = lat2 - lat1, lon2 - lon1
    a = np.sin(dlat / 2) ** 2 + np.cos(lat1) * np.cos(lat2) * np.sin(dlon / 2) ** 2
    return 2 * EARTH_RADIUS_KM * np.arcsin(np.sqrt(a))


def point_in_polygon(lat, lon, polygon_geojson):
    """Ray-casting point-in-polygon. Accepts a GeoJSON Polygon geometry
    (single ring, [ [lon, lat], ... ]). No external deps required."""
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


def load_positions(path: str) -> pd.DataFrame:
    df = pd.read_csv(path, parse_dates=["timestamp"])
    return df


def suspect_pool(positions: pd.DataFrame, spill: SpillEvent) -> pd.DataFrame:
    t0 = pd.Timestamp(spill.timestamp)
    window_start = t0 - pd.Timedelta(hours=spill.lookback_hours)

    df = positions[(positions["timestamp"] >= window_start) & (positions["timestamp"] <= t0)].copy()
    df["dist_km"] = haversine_km(df["lat"], df["lon"], spill.lat, spill.lon)
    df = df[df["dist_km"] <= spill.radius_km]
    return df


def rank_vessels(positions: pd.DataFrame, spill: SpillEvent) -> pd.DataFrame:
    pool = suspect_pool(positions, spill)
    if pool.empty:
        return pd.DataFrame(columns=[
            "mmsi", "shipname", "ship_type", "score", "min_dist_km",
            "loiter_minutes", "had_gap_near_spill", "in_drift_zone", "evidence",
        ])

    t0 = pd.Timestamp(spill.timestamp)
    has_polygon = spill.polygon_geojson is not None

    rows = []
    for mmsi, g in pool.groupby("mmsi"):
        g = g.sort_values("timestamp")
        min_dist = g["dist_km"].min()
        shipname = g["shipname"].iloc[-1]
        ship_type = g["ship_type"].iloc[-1]

        # loitering: time spent slow (<3kt) and within radius
        slow = g[g["speed"] < 3.0]
        if len(slow) >= 2:
            loiter_minutes = (slow["timestamp"].max() - slow["timestamp"].min()).total_seconds() / 60.0
        else:
            loiter_minutes = 0.0

        # AIS gap ending close (<=90min) to spill time = suspicious "went dark"
        gaps = g[g["ais_gap_flag"] == True]  # noqa: E712
        had_gap_near_spill = False
        if not gaps.empty:
            had_gap_near_spill = bool(((t0 - gaps["timestamp"]).abs() <= pd.Timedelta(minutes=90)).any())

        in_zone = False
        if has_polygon:
            in_zone = bool(g.apply(lambda r: point_in_polygon(r["lat"], r["lon"], spill.polygon_geojson), axis=1).any())

        rows.append({
            "mmsi": mmsi, "shipname": shipname, "ship_type": ship_type,
            "min_dist_km": round(min_dist, 3),
            "loiter_minutes": round(loiter_minutes, 1),
            "had_gap_near_spill": had_gap_near_spill,
            "in_drift_zone": in_zone,
        })

    out = pd.DataFrame(rows)

    # --- component scores, each normalized to [0, 1] ---
    out["s_proximity"] = 1 - (out["min_dist_km"] / spill.radius_km).clip(0, 1)

    max_loiter = out["loiter_minutes"].max() or 1.0
    benign = out["ship_type"].isin(BENIGN_LOITERING_TYPES)
    out["s_loitering"] = (out["loiter_minutes"] / max_loiter).clip(0, 1)
    out.loc[benign, "s_loitering"] *= 0.3  # down-weight harbour craft

    out["s_gap"] = out["had_gap_near_spill"].astype(float)
    out["s_drift"] = out["in_drift_zone"].astype(float)

    # simple vessel-type prior: tankers/cargo score slightly higher than
    # passenger/fishing/pilot craft, purely as a tie-breaker
    high_risk_types = set(range(70, 90))  # cargo (70-79) & tanker (80-89)
    out["s_vessel_type"] = out["ship_type"].apply(lambda t: 1.0 if t in high_risk_types else 0.3)

    weights = dict(WEIGHTS)
    if not has_polygon:
        # redistribute the drift-zone weight across the remaining components
        drift_w = weights.pop("drift_zone")
        total_remaining = sum(weights.values())
        for k in weights:
            weights[k] += drift_w * (weights[k] / total_remaining)
        out["s_drift"] = 0.0

    out["score"] = (
        out["s_proximity"] * weights["proximity"]
        + out.get("s_drift", 0) * weights.get("drift_zone", 0)
        + out["s_loitering"] * weights["loitering"]
        + out["s_gap"] * weights["gap_near_spill"]
        + out["s_vessel_type"] * weights["vessel_type"]
    ).round(4)

    def evidence(r):
        bits = [f"{r['min_dist_km']:.1f} km from spill at closest approach"]
        if r["loiter_minutes"] > 0:
            bits.append(f"{r['loiter_minutes']:.0f} min loitering (<3kt) nearby")
        if r["had_gap_near_spill"]:
            bits.append("AIS signal gap ending near spill time")
        if r["in_drift_zone"]:
            bits.append("track intersects drift/source zone")
        return "; ".join(bits)

    out["evidence"] = out.apply(evidence, axis=1)

    out = out.sort_values("score", ascending=False).reset_index(drop=True)
    cols = ["mmsi", "shipname", "ship_type", "score", "min_dist_km",
            "loiter_minutes", "had_gap_near_spill", "in_drift_zone", "evidence"]
    return out[cols]


def _parse_args():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--positions", required=True, help="ais_cleaned_positions.csv from clean_ais.py")
    ap.add_argument("--lat", type=float, required=True)
    ap.add_argument("--lon", type=float, required=True)
    ap.add_argument("--time", required=True, help="ISO timestamp of spill detection")
    ap.add_argument("--radius-km", type=float, default=25.0)
    ap.add_argument("--lookback-hours", type=float, default=12.0)
    ap.add_argument("--drift-polygon", default=None, help="GeoJSON file with a Polygon geometry from Member 4")
    ap.add_argument("--out", default="vessel_ranking.csv")
    return ap.parse_args()


if __name__ == "__main__":
    args = _parse_args()
    polygon = None
    if args.drift_polygon:
        with open(args.drift_polygon) as f:
            gj = json.load(f)
            polygon = gj.get("geometry", gj)  # accept bare geometry or Feature

    spill = SpillEvent(
        lat=args.lat, lon=args.lon, timestamp=args.time,
        radius_km=args.radius_km, lookback_hours=args.lookback_hours,
        polygon_geojson=polygon,
    )

    positions = load_positions(args.positions)
    ranking = rank_vessels(positions, spill)
    ranking.to_csv(args.out, index=False)
    print(f"{len(ranking)} candidate vessels within {spill.radius_km}km / "
          f"{spill.lookback_hours}h of spill.")
    if not ranking.empty:
        print(ranking.head(10).to_string(index=False))
