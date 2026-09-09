import numpy as np

from satellite.preprocessing.preprocess import preprocess_sar
from satellite.detection.detect import detect_oil_like_regions


def test_detection():

    # Load and preprocess CASE_001
    image, _, _, _ = preprocess_sar(
        "data/sample/CASE_001.tif"
    )

    # Run oil-like detection
    mask = detect_oil_like_regions(
        image
    )

    # Mask should have the same dimensions
    assert mask.shape == image.shape

    # Mask should be binary
    unique_values = np.unique(mask)

    assert set(unique_values).issubset(
        {0, 255}
    )

    # At least some candidate pixels should exist
    assert np.sum(mask > 0) > 0