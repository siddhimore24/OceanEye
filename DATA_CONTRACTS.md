# DATA_CONTRACTS.md
## Satellite → Drift
File: spill.geojson

Required information:
• spill_id
• geometry
• centroid
• area_km2
• confidence
• detection_timestamp
## Drift → AIS
File: source_zone.geojson
Required information:
• spill_id
• probability/source zone geometry
• release-time window
• uncertainty information
## AIS → Scoring
File: vessels.json
Each candidate should contain:
• MMSI
• timestamp
• latitude
• longitude
• SOG
• COG
• distance_to_source
• temporal_score
• trajectory-related features

## Scoring → Frontend
File: ranking.json
Each candidate should contain:
• MMSI
• rank
• overall_score
• score components
• reasons/evidence
• confidence/uncertainty
• data provenance
## Contract rule
Do not silently rename fields or change formats.
If a contract must change, update this document and notify
the integration owner first.


Also required: distance_score (0-1 normalized), temporal_score (0-1),
trajectory_score (0-1) � these are what scoring/scoring.py actually reads.
distance_to_source remains as the raw distance in km for display.
