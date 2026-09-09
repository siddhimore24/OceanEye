from satellite.preprocessing.preprocess import preprocess_sar
from satellite.detection.detect import detect_oil_like_regions
from satellite.geometry.geometry import extract_spill_geometry


def test_geometry():

    # Preprocess satellite image
    image, transform, crs, _ = preprocess_sar(
        "data/sample/CASE_001.tif"
    )

    # Detect oil-like region
    mask = detect_oil_like_regions(
        image
    )

    # Extract geographic geometry
    result = extract_spill_geometry(
        mask,
        transform,
        crs
    )

    # Geometry must exist
    assert result["geometry"] is not None

    # Area must be positive
    assert result["area_km2"] > 0

    # Centroid must exist
    assert result["centroid"] is not None

    # Centroid must contain coordinates
    assert "longitude" in result["centroid"]
    assert "latitude" in result["centroid"]