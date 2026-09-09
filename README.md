# Member 3 — AIS / Vessel Analytics pipeline

Two scripts, run in sequence. Nothing in either one is hardcoded to this
particular date or the Gulf of Finland — swap the input file and/or the
spill parameters and the same code produces correct output.

```
clean_ais.py            raw decoded AIS log  -> cleaned positions + registry
spill_attribution.py    cleaned positions + spill info -> ranked suspect list
```

## 1. `clean_ais.py`

```
python3 clean_ais.py --input 2022-09-08.csv --outdir out/
```

Input: a raw decoded AIVDM/NMEA log, one row per decoded sentence
(pyais-style columns: date, msg_type, mmsi, lat, lon, speed, course,
heading, turn, status, shipname, ship_type, imo, callsign, to_bow,
to_stern, to_port, to_starboard, draught, destination, ...).

What it does, in order:
1. **Loads the file robustly.** The source format has a known quirk: every
   fully-decoded row has one more tab-separated field than the header
   (a trailing empty column), and rows from unreassembled multi-part
   sentences are short. The loader detects the true field count from the
   data itself rather than assuming, so it won't silently misalign columns
   if a future export doesn't have this quirk.
2. **Keeps only position (types 1/2/3/18/19) and static (types 5/24)
   messages** — the rest (base station, binary, safety messages, etc.)
   aren't needed for vessel tracking.
3. **Converts AIS "not available" sentinels to real nulls**: lat=91,
   lon=181, heading=511, turn=-128, speed≥102.3kt, course=360.
4. **Interpolates missing lat/lon per vessel** from that vessel's own
   track over time only (never from other vessels, never zero-filled —
   zero-filling would misplace a ship at 0°N,0°E). Vessels with zero valid
   fixes all day are dropped since there's nothing to interpolate from.
5. **Cleans ship names**: strips AIS's `@`/space padding, collapses
   whitespace, upper-cases, and forward/back-fills each vessel's name
   across the day from its static-data (type 5/24) broadcasts.
6. **Computes SOG/COG/heading**, per-vessel **AIS-gap flags** (silence
   > 15 min) and **speed-drop anomaly flags** (sudden drop ≥ 5 kt).
7. **Fills remaining nulls**: `0` for numeric fields, `UNKNOWN` /
   `UNKNOWN VESSEL` for identity fields (so a missing name/callsign can't
   be confused with a real "0" value). No existing valid value is touched.

Output:
- `ais_cleaned_positions.csv` — one row per (vessel, timestamp) fix.
- `ais_vessel_registry.csv` — one row per vessel (MMSI): identity,
  dimensions, first/last seen, message/gap/anomaly counts.

On the provided `2022-09-08.csv` (Gulf of Finland, 425,952 raw rows):
286,058 cleaned position rows, 214 vessels, 339 AIS gaps > 15 min,
44 speed-drop anomalies, zero remaining nulls in the output.

**To reuse on a different dataset** (a different day, a different sea,
e.g. an Indian Ocean AIS extract): just point `--input` at the new file.
If a future extract uses different column names, edit the
`COLUMN_ALIASES` dict at the top of the script — no other logic changes.

## 2. `spill_attribution.py`

Everything about *one specific spill* is one object:

```python
SpillEvent(
    lat=59.55, lon=24.75,
    timestamp="2022-09-08T11:30:00",
    radius_km=25, lookback_hours=12,
    polygon_geojson=None,   # Member 4's drift/source zone, once available
)
```

or via CLI:

```
python3 spill_attribution.py \
    --positions ais_cleaned_positions.csv \
    --lat 59.55 --lon 24.75 --time 2022-09-08T11:30:00 \
    --radius-km 25 --lookback-hours 12 \
    [--drift-polygon drift_zone.geojson] \
    --out vessel_ranking.csv
```

**When the real spill comes in (from Member 2) and/or the real drift zone
(from Member 4), only these arguments change — the rest of the pipeline
is untouched.** This also means: new region, new date, new CSV — as long
as it went through `clean_ais.py`, the same command works.

What it does:
1. Filters cleaned positions to vessels within `radius_km` of the spill,
   in the `lookback_hours` before detection time.
2. Per candidate vessel, computes:
   - **proximity** — closest approach distance to the spill
   - **loitering** — minutes spent under 3 kt near the spill (down-weighted
     for inherently loitering vessel types — pilot boats, tugs, SAR —
     so normal harbour traffic doesn't drown out real suspects)
   - **AIS gap near spill** — a >15 min signal gap ending within 90 min
     of spill time ("went dark" near the event)
   - **drift-zone intersection** — did the track cross Member 4's
     backward-drift polygon (skipped, weight redistributed, if no
     polygon is supplied yet)
   - **vessel type prior** — small tie-breaker favoring cargo/tanker types
3. Combines these into a 0–1 score (proximity 35%, drift-zone 25%,
   loitering 15%, AIS-gap 20%, vessel-type 5% — weights sum to 1;
   drift-zone weight is redistributed across the rest when no polygon
   is available yet) and writes a ranked CSV with a plain-English
   evidence string per vessel, ready for Member 5's ranking table /
   evidence cards.

Two example runs included (placeholder spill: 59.55°N 24.75°E,
2022-09-08 11:30, 25 km / 12 h):
- `vessel_ranking_example.csv` — no drift zone yet (134 candidates,
  top suspects flagged mainly on proximity + loitering + AIS gap).
- `vessel_ranking_with_driftzone_example.csv` — same spill with a
  toy rectangular polygon (`example_drift_zone.geojson`) showing the
  drift-zone-intersection scoring path working end to end.

### Known caveat to flag to the team
With a 25 km radius near a busy port, harbour craft can still score
moderately high just from routine loitering even after the down-weight.
Once the real spill location is known, if it's far from port, consider
shrinking `radius_km` or excluding `ship_type` categories like pilot/tug
entirely rather than just down-weighting them.

## Files
- `clean_ais.py`, `spill_attribution.py` — the two pipeline stages
- `ais_cleaned_positions.csv` (+ `.gz`), `ais_vessel_registry.csv` — outputs
  of stage 1 on the provided data
- `vessel_ranking_example.csv`, `vessel_ranking_with_driftzone_example.csv`,
  `example_drift_zone.geojson` — stage 2 demo outputs
