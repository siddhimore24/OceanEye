from datetime import datetime, timezone

import geopandas as gpd

from satellite.preprocessing.preprocess import preprocess_sar
from satellite.detection.detect import detect_oil_like_regions
from satellite.geometry.geometry import extract_spill_geometry


def calculate_detection_confidence(
    image,
    mask
) -> float:
    """
    Calculate an algorithmic confidence score for the
    detected oil-like candidate.

    IMPORTANT:
    This is NOT the probability that the region is oil.

    It is only a score representing how strongly the
    detected region matches the simple MVP detector.
    """

    candidate_pixels = image[mask > 0]

    if len(candidate_pixels) == 0:
        return 0.0

    # Average intensity of detected candidate
    candidate_mean = candidate_pixels.mean()

    # Lower intensity = darker candidate
    darkness_score = 1.0 - (
        candidate_mean / 255.0
    )

    darkness_score = max(
        0.0,
        min(1.0, darkness_score)
    )

    return float(darkness_score)


def create_spill_geojson(
    geometry_result,
    confidence,
    spill_id,
    detection_timestamp,
    output_path,
    source_crs
):
    """
    Create spill.geojson according to the team's
    satellite data contract.
    """

    geometry = geometry_result["geometry"]
    centroid = geometry_result["centroid"]
    area_km2 = geometry_result["area_km2"]

    if geometry is None:
        raise ValueError(
            "No spill geometry was detected."
        )

    if centroid is None:
        raise ValueError(
            "Spill centroid could not be calculated."
        )

    # Convert geometry to WGS84 for GeoJSON output.
    gdf = gpd.GeoDataFrame(
        [
            {
                "spill_id": spill_id,
                "area_km2": area_km2,
                "confidence": confidence,
                "detection_timestamp": detection_timestamp,
                "centroid_lon": centroid["longitude"],
                "centroid_lat": centroid["latitude"],
            }
        ],
        geometry=[geometry],
        crs=source_crs
    )

    gdf = gdf.to_crs("EPSG:4326")

    gdf.to_file(
        output_path,
        driver="GeoJSON"
    )


def run_satellite_pipeline(
    input_path: str,
    output_path: str,
    spill_id: str = "CASE_001"
):
    """
    Run the complete Member-2 satellite pipeline.

    Pipeline:

        Sentinel-1 image
              ↓
        Preprocessing
              ↓
        Oil-like detection
              ↓
        Spill geometry
              ↓
        Confidence
              ↓
        spill.geojson
    """

    print("Starting satellite pipeline...")

    # --------------------------------------------------
    # 1. PREPROCESSING
    # --------------------------------------------------

    image, transform, crs, metadata = preprocess_sar(
        input_path
    )

    print("✓ Preprocessing completed")

    # --------------------------------------------------
    # 2. DETECTION
    # --------------------------------------------------

    mask = detect_oil_like_regions(image)

    print("✓ Oil-like candidate detection completed")

    # --------------------------------------------------
    # 3. GEOMETRY
    # --------------------------------------------------

    geometry_result = extract_spill_geometry(
        mask,
        transform,
        crs
    )

    if geometry_result["geometry"] is None:
        raise RuntimeError(
            "No oil-like candidate geometry detected."
        )

    print("✓ Spill geometry generated")

    # --------------------------------------------------
    # 4. CONFIDENCE
    # --------------------------------------------------

    confidence = calculate_detection_confidence(
        image,
        mask
    )

    print(
        f"✓ Detection confidence: {confidence:.3f}"
    )

    # --------------------------------------------------
    # 5. TIMESTAMP
    # --------------------------------------------------

    detection_timestamp = metadata.get(
        "TIFFTAG_DATETIME"
    )

    if detection_timestamp is None:
        detection_timestamp = (
            datetime.now(timezone.utc).isoformat()
        )

    # --------------------------------------------------
    # 6. CREATE GeoJSON
    # --------------------------------------------------

    create_spill_geojson(
        geometry_result=geometry_result,
        confidence=confidence,
        spill_id=spill_id,
        detection_timestamp=detection_timestamp,
        output_path=output_path,
        source_crs=crs
    )

    print("✓ spill.geojson created")

    # --------------------------------------------------
    # 7. RETURN SUMMARY
    # --------------------------------------------------

    return {
        "spill_id": spill_id,
        "area_km2": geometry_result["area_km2"],
        "centroid": geometry_result["centroid"],
        "confidence": confidence,
        "output_path": output_path
    }