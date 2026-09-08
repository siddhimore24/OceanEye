import geopandas as gpd

from satellite.pipeline import (
    run_satellite_pipeline
)


def test_satellite_pipeline(tmp_path):

    output_path = (
        tmp_path / "spill.geojson"
    )

    result = run_satellite_pipeline(
        input_path="data/sample/CASE_001.tif",
        output_path=str(output_path),
        spill_id="CASE_001"
    )

    # Basic result checks
    assert result["spill_id"] == "CASE_001"
    assert result["area_km2"] > 0
    assert result["centroid"] is not None
    assert 0 <= result["confidence"] <= 1

    # Check actual GeoJSON
    gdf = gpd.read_file(
        output_path
    )

    assert len(gdf) == 1

    # Required contract fields
    required_fields = [
        "spill_id",
        "area_km2",
        "confidence",
        "detection_timestamp",
        "centroid",
    ]

    for field in required_fields:
        assert field in gdf.columns

    # Validate values
    assert gdf["spill_id"].iloc[0] == "CASE_001"
    assert gdf["area_km2"].iloc[0] > 0
    assert 0 <= gdf["confidence"].iloc[0] <= 1

    # Geometry must exist
    assert gdf.geometry.iloc[0] is not None
    assert not gdf.geometry.iloc[0].is_empty