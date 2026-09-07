# Oil Spill Detection and Vessel Attribution

## SIH Problem Statement

**PS ID:** 26143

Leveraging satellite imagery to determine oil spills at sea along with AIS data correlations to identify the vessel responsible for the spill.

## Project Overview

This project aims to detect possible oil spills from satellite imagery and correlate the detected spill with AIS vessel data to identify and rank vessels that may be potential sources.

The system combines:

Satellite imagery
→ Oil spill detection
→ Spill geometry
→ Source probability zone
→ AIS vessel tracks
→ Vessel candidate filtering
→ Evidence-based ranking
→ Analyst dashboard

## Important Principle

The system does NOT declare a vessel guilty.

It produces a ranked list of candidate vessels based on available evidence, along with uncertainty and limitations.

## Project Modules

- `satellite/` - Satellite image preprocessing and oil-spill detection
- `ais/` - AIS cleaning, filtering and trajectory analysis
- `drift/` - Forward/backward drift modelling and uncertainty
- `scoring/` - Vessel evidence scoring and ranking
- `frontend/` - Analyst dashboard
- `integration/` - End-to-end pipeline integration
- `tests/` - Automated tests
- `data/` - Sample data and schemas

## Demo Case

The MVP will use a fixed demonstration case:

`CASE_001`

Large datasets should not be committed to GitHub.

## Technology

- Python
- PyTorch
- OpenCV
- Rasterio
- NumPy
- Pandas
- GeoPandas
- Shapely
- PyProj
- Streamlit
- Folium / PyDeck

## Development

Each team member works on their assigned module using a separate Git branch.

Before merging:

1. Pull the latest `main`
2. Test the changes locally
3. Commit the changes
4. Push the branch
5. Create a Pull Request
6. Review and merge

## Data Contracts

All modules must follow the interfaces defined in:

- `AI_INSTRUCTIONS.md`
- `ARCHITECTURE.md`
- `DATA_CONTRACTS.md`

Do not silently change shared field names or data formats.

## Disclaimer

This is an MVP/demo system for detecting and analysing possible oil-spill sources.

Results represent candidate vessels and evidence-based probabilities, not definitive legal attribution.