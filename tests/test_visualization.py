import cv2

from satellite.preprocessing.preprocess import preprocess_sar
from satellite.detection.detect import detect_oil_like_regions
from satellite.detection.visualize import (
    create_detection_overlay
)


def test_detection_visualization():

    # Preprocess the test image
    image, _, _, _ = preprocess_sar(
        "data/sample/CASE_001.tif"
    )

    # Detect candidate regions
    mask = detect_oil_like_regions(
        image
    )

    # Create overlay
    overlay = create_detection_overlay(
        image,
        mask
    )

    # Overlay should exist
    assert overlay is not None

    # OpenCV uses BGR 3-channel images
    assert overlay.shape == (
        image.shape[0],
        image.shape[1],
        3
    )

    # Verify it can be written as an image
    success = cv2.imwrite(
        "data/sample/detection_overlay.png",
        overlay
    )

    assert success