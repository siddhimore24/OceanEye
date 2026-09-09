import geopandas as gpd

from satellite.pipeline import (
    run_satellite_pipeline
)


def test_satellite_pipeline():

    output_path = (
        "data/sample/spill.geojson"
    )

    result = run_satellite_pipeline(
        input_path="data/sample/CASE_001.tif",
        output_path=output_path,
        spill_id="CASE_001"
    )

    # Basic result checks
    assert result["spill_id"] == "CASE_001"

    assert result["area_km2"] > 0

    assert result["centroid"] is not None

    assert 0 <= result["confidence"] <= 1


    # Check the actual GeoJSON
    gdf = gpd.read_file(
        output_path
    )

    assert len(gdf) == 1

    # Required contract fields
    assert "spill_id" in gdf.columns
    assert "area_km2" in gdf.columns
    assert "confidence" in gdf.columns
    assert "detection_timestamp" in gdf.columns

    # Geometry must exist
    assert gdf.geometry.iloc[0] is not None