"""
clean_ais.py
------------
Member 3 (AIS / Vessel Analytics Engineer) pipeline stage 1.

Turns a raw decoded AIVDM/NMEA AIS log (one row per decoded sentence, tab
separated, pyais-style column names) into two analysis-ready tables:

  1. <outdir>/ais_cleaned_positions.csv
       One row per (vessel, timestamp) position fix, with SOG/COG/heading,
       AIS-gap flags and speed-drop anomaly flags. This is the file
       Member 4 (drift) and the spill-attribution step consume.

  2. <outdir>/ais_vessel_registry.csv
       One row per vessel (MMSI): name, type, IMO, callsign, dimensions,
       first/last seen, message counts. Lookup table for the UI.

GENERALIZATION NOTE (why this file is safe to reuse on new data):
This script makes no assumption about which sea/region/date it is run on.
Everything region-specific (spill location, time, search radius) lives in
spill_attribution.py instead. To process a different day, a different area
(e.g. an Indian Ocean AIS extract), or a different AOI, just run:

    python3 clean_ais.py --input <new_file.csv> --outdir <new_outdir>

The only hard requirement is that the input is a decoded AIS table with (at
least) these pyais-style columns: date, msg_type, mmsi, lat, lon, speed,
course, heading, turn, status, shipname, ship_type, imo, callsign,
to_bow, to_stern, to_port, to_starboard, draught, destination.
If a future dataset uses different column names, edit COLUMN_ALIASES below
rather than rewriting the logic.
"""

import argparse
import sys
import numpy as np
import pandas as pd

# ---- tunable constants (AIS spec "not available" sentinels + our thresholds)
LAT_NA = 91.0
LON_NA = 181.0
HEADING_NA = 511
TURN_NA = -128
SPEED_NA_THRESHOLD = 102.3          # >= this means "not available" per AIS spec
COURSE_NA = 360.0
GAP_MINUTES = 15                     # silence longer than this -> flagged gap
SPEED_DROP_KNOTS = 5.0               # sudden drop >= this -> flagged anomaly

POSITION_TYPES = {"1", "2", "3", "18", "19"}
STATIC_TYPES = {"5", "24"}

# If a future input CSV uses different header names, map them here:
# {expected_name: actual_name_in_file}
COLUMN_ALIASES = {}


def load_raw(path: str) -> pd.DataFrame:
    """Robustly load a decoded-AIS tab-separated file, tolerant of the common
    'N+1 fields vs N header columns' quirk (a stray trailing tab in every
    fully-decoded row) and of short/fragment rows from unreassembled
    multi-part sentences (which pandas pads with NaN rather than dropping)."""
    with open(path, "r", encoding="utf-8", errors="replace") as f:
        header = f.readline().rstrip("\n").split("\t")

    # Detect whether data rows carry one extra (trailing, always-empty) field
    # vs the header by peeking at the first data line.
    with open(path, "r", encoding="utf-8", errors="replace") as f:
        f.readline()
        first_data = f.readline().rstrip("\n").split("\t")
    extra = max(0, len(first_data) - len(header))
    names = header + [f"_extra{i}" for i in range(extra)]

    df = pd.read_csv(
        path, sep="\t", names=names, header=0, dtype=str,
        on_bad_lines="skip", engine="c", low_memory=False,
    )
    df = df.rename(columns=COLUMN_ALIASES)
    drop_cols = [c for c in df.columns if c.startswith("_extra")]
    if drop_cols:
        df = df.drop(columns=drop_cols)
    return df


def to_num(s):
    return pd.to_numeric(s, errors="coerce")


def clean_enum(series: pd.Series) -> pd.Series:
    """pyais renders enum fields as 'EnumClass.Value' strings; keep just the
    human-readable Value, leave already-plain values untouched."""
    return series.astype(str).str.split(".").str[-1].replace({"nan": np.nan, "None": np.nan})


def clean_positions(df: pd.DataFrame) -> pd.DataFrame:
    pos = df[df["msg_type"].isin(POSITION_TYPES)].copy()

    pos["timestamp"] = pd.to_datetime(pos["date"], errors="coerce")
    pos["mmsi"] = pos["mmsi"].astype(str).str.strip()
    pos = pos.dropna(subset=["mmsi", "timestamp"])

    for c in ["lat", "lon", "speed", "course", "heading", "turn"]:
        pos[c] = to_num(pos[c])

    # AIS "not available" sentinels -> real nulls
    pos.loc[~pos["lat"].between(-90, 90), "lat"] = np.nan
    pos.loc[pos["lat"] == LAT_NA, "lat"] = np.nan
    pos.loc[~pos["lon"].between(-180, 180), "lon"] = np.nan
    pos.loc[pos["lon"] == LON_NA, "lon"] = np.nan
    pos.loc[pos["heading"] == HEADING_NA, "heading"] = np.nan
    pos.loc[pos["turn"] == TURN_NA, "turn"] = np.nan
    pos.loc[pos["speed"] >= SPEED_NA_THRESHOLD, "speed"] = np.nan
    pos.loc[pos["course"] >= COURSE_NA, "course"] = np.nan

    pos["status"] = clean_enum(pos["status"])

    pos = pos.sort_values(["mmsi", "timestamp"]).drop_duplicates(
        subset=["mmsi", "timestamp", "lat", "lon"]
    )

    # Drop vessels with zero usable fixes all day (nothing to interpolate from)
    has_fix = pos.groupby("mmsi")[["lat", "lon"]].apply(
        lambda g: g.notna().any().any()
    )
    keep_mmsi = has_fix[has_fix].index
    pos = pos[pos["mmsi"].isin(keep_mmsi)]

    # Interpolate missing lat/lon per-vessel from that vessel's own track only
    def interp_vessel(g):
        mmsi_val = g.name
        g = g.set_index("timestamp")
        g[["lat", "lon"]] = g[["lat", "lon"]].interpolate(
            method="time", limit_direction="both"
        )
        g = g.reset_index()
        g["mmsi"] = mmsi_val
        return g

    pos = pos.groupby("mmsi", group_keys=False).apply(interp_vessel)
    pos = pos.dropna(subset=["lat", "lon"])  # safety: still-unresolvable rows

    return pos.reset_index(drop=True)


def clean_names(pos: pd.DataFrame, df: pd.DataFrame) -> pd.DataFrame:
    """Attach cleaned vessel names to the position table by merging in
    static-data broadcasts and forward/back-filling per vessel across time."""
    stat = df[df["msg_type"].isin(STATIC_TYPES)].copy()
    stat["timestamp"] = pd.to_datetime(stat["date"], errors="coerce")
    stat["mmsi"] = stat["mmsi"].astype(str).str.strip()

    def clean_name(s):
        s = s.astype(str).str.replace("@", " ", regex=False)
        s = s.str.strip().str.replace(r"\s+", " ", regex=True)
        s = s.str.upper()
        return s.replace({"": np.nan, "NAN": np.nan})

    stat["shipname_clean"] = clean_name(stat["shipname"])
    stat["ship_type"] = to_num(stat["ship_type"])

    names = stat.dropna(subset=["timestamp"]).sort_values(["timestamp", "mmsi"])[
        ["mmsi", "timestamp", "shipname_clean", "ship_type"]
    ]

    pos = pos.drop(columns=["shipname", "ship_type"], errors="ignore")
    pos = pos.sort_values(["timestamp", "mmsi"])
    pos = pd.merge_asof(
        pos, names, on="timestamp", by="mmsi", direction="nearest",
        tolerance=pd.Timedelta("1D"),
    )
    pos = pos.sort_values(["mmsi", "timestamp"])
    pos["shipname_clean"] = pos.groupby("mmsi")["shipname_clean"].transform(
        lambda s: s.ffill().bfill()
    )
    pos["ship_type"] = pos.groupby("mmsi")["ship_type"].transform(
        lambda s: s.ffill().bfill()
    )
    return pos


def add_gaps_and_anomalies(pos: pd.DataFrame) -> pd.DataFrame:
    pos = pos.sort_values(["mmsi", "timestamp"]).reset_index(drop=True)
    g = pos.groupby("mmsi")

    pos["gap_minutes"] = g["timestamp"].diff().dt.total_seconds() / 60.0
    pos["ais_gap_flag"] = pos["gap_minutes"] > GAP_MINUTES

    pos["speed_drop"] = -g["speed"].diff()  # positive = speed decreased
    pos["speed_anomaly_flag"] = pos["speed_drop"] >= SPEED_DROP_KNOTS

    return pos


def build_registry(df: pd.DataFrame, pos: pd.DataFrame) -> pd.DataFrame:
    stat = df[df["msg_type"].isin(STATIC_TYPES)].copy()
    stat["mmsi"] = stat["mmsi"].astype(str).str.strip()
    for c in ["to_bow", "to_stern", "to_port", "to_starboard", "draught", "imo", "ship_type"]:
        if c in stat.columns:
            stat[c] = to_num(stat[c])

    def clean_txt(s):
        s = s.astype(str).str.replace("@", " ", regex=False).str.strip()
        s = s.str.replace(r"\s+", " ", regex=True).str.upper()
        return s.replace({"": np.nan, "NAN": np.nan})

    for c in ["shipname", "callsign", "destination"]:
        if c in stat.columns:
            stat[c] = clean_txt(stat[c])

    agg = stat.groupby("mmsi").agg(
        shipname=("shipname", lambda s: s.dropna().iloc[-1] if s.notna().any() else np.nan),
        ship_type=("ship_type", lambda s: s.dropna().iloc[-1] if s.notna().any() else np.nan),
        imo=("imo", lambda s: s.dropna().iloc[-1] if s.notna().any() else np.nan),
        callsign=("callsign", lambda s: s.dropna().iloc[-1] if s.notna().any() else np.nan),
        to_bow=("to_bow", "max"), to_stern=("to_stern", "max"),
        to_port=("to_port", "max"), to_starboard=("to_starboard", "max"),
        draught=("draught", "max"),
        destination=("destination", lambda s: s.dropna().iloc[-1] if s.notna().any() else np.nan),
    ).reset_index()

    track = pos.groupby("mmsi").agg(
        first_seen=("timestamp", "min"),
        last_seen=("timestamp", "max"),
        n_positions=("timestamp", "count"),
        n_gaps=("ais_gap_flag", "sum"),
        n_speed_anomalies=("speed_anomaly_flag", "sum"),
    ).reset_index()

    reg = track.merge(agg, on="mmsi", how="left")

    reg["shipname"] = reg["shipname"].fillna("UNKNOWN VESSEL")
    reg["callsign"] = reg["callsign"].fillna("UNKNOWN")
    reg["destination"] = reg["destination"].fillna("UNKNOWN")
    for c in ["ship_type", "imo", "to_bow", "to_stern", "to_port", "to_starboard", "draught"]:
        reg[c] = reg[c].fillna(0)

    return reg.sort_values("mmsi").reset_index(drop=True)


def finalize_positions(pos: pd.DataFrame) -> pd.DataFrame:
    out = pos[[
        "mmsi", "timestamp", "lat", "lon", "speed", "course", "heading",
        "turn", "status", "shipname_clean", "ship_type",
        "gap_minutes", "ais_gap_flag", "speed_drop", "speed_anomaly_flag",
    ]].rename(columns={"shipname_clean": "shipname"})

    out["shipname"] = out["shipname"].fillna("UNKNOWN VESSEL")
    out["status"] = out["status"].fillna("UNKNOWN")
    for c in ["speed", "course", "heading", "turn", "ship_type",
              "gap_minutes", "speed_drop"]:
        out[c] = out[c].fillna(0)
    out["ais_gap_flag"] = out["ais_gap_flag"].fillna(False)
    out["speed_anomaly_flag"] = out["speed_anomaly_flag"].fillna(False)

    return out.sort_values(["mmsi", "timestamp"]).reset_index(drop=True)


def run(input_path: str, outdir: str):
    print(f"[1/6] loading {input_path} ...")
    df = load_raw(input_path)
    print(f"      {len(df):,} raw decoded rows")

    print("[2/6] cleaning position fixes ...")
    pos = clean_positions(df)
    print(f"      {len(pos):,} position rows, {pos['mmsi'].nunique():,} vessels")

    print("[3/6] attaching cleaned vessel names ...")
    pos = clean_names(pos, df)

    print("[4/6] computing AIS-gap and speed-drop-anomaly flags ...")
    pos = add_gaps_and_anomalies(pos)
    print(f"      gaps > {GAP_MINUTES}min: {int(pos['ais_gap_flag'].sum())}, "
          f"speed-drop anomalies >= {SPEED_DROP_KNOTS}kt: {int(pos['speed_anomaly_flag'].sum())}")

    print("[5/6] building vessel registry ...")
    reg = build_registry(df, pos)

    print("[6/6] writing outputs ...")
    out_pos = finalize_positions(pos)
    import os
    os.makedirs(outdir, exist_ok=True)
    pos_path = os.path.join(outdir, "ais_cleaned_positions.csv")
    reg_path = os.path.join(outdir, "ais_vessel_registry.csv")
    out_pos.to_csv(pos_path, index=False)
    reg.to_csv(reg_path, index=False)
    print(f"      wrote {pos_path} ({len(out_pos):,} rows, "
          f"{int(out_pos.isna().sum().sum())} nulls)")
    print(f"      wrote {reg_path} ({len(reg):,} vessels)")


if __name__ == "__main__":
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--input", required=True, help="raw decoded AIS csv (tab-separated)")
    ap.add_argument("--outdir", default=".", help="output directory")
    args = ap.parse_args()
    run(args.input, args.outdir)
