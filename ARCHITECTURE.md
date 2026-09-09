# ARCHITECTURE.md

## Pipeline

Sentinel-1 SAR
↓
Preprocessing
↓
Oil-like candidate segmentation
↓
Spill mask + geometry + confidence
↓
spill.geojson
↓
Drift / Hindcast
↓
Backward particle ensemble
↓
Source probability zone + uncertainty
↓
source_zone.geojson
↓
AIS processing
↓
Spatial + temporal filtering
↓
Trajectory / behavior features
↓
vessels.json
↓
Evidence scoring
↓
ranking.json
↓
Streamlit + Folium/PyDeck
↓
Analyst dashboard

## Important principle

The system should output a probability/uncertainty zone and
ranked candidate vessels. It should not claim that one vessel
is definitely guilty.

## MVP technology

Python
PyTorch / suitable segmentation model
OpenCV
Rasterio
NumPy
Pandas
GeoPandas
Shapely
PyProj
Streamlit
Folium or PyDeck
Plotly

## Storage

GeoJSON
GeoTIFF
CSV/Parquet
SQLite when useful

## Optional after MVP

FastAPI
PostgreSQL/PostGIS
Docker
Live data ingestion
Large-scale model inference