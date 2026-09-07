from satellite.preprocessing.preprocess import preprocess_sar


def test_preprocessing():

    image, transform, crs, metadata = preprocess_sar(
        "data/sample/CASE_001.tif"
    )

    # Image should exist
    assert image is not None

    # Image should have the expected dimensions
    assert image.shape == (500, 500)

    # Normalized image should be 8-bit
    assert image.dtype.name == "uint8"

    # Values should be between 0 and 255
    assert image.min() >= 0
    assert image.max() <= 255

    # Geographic information should exist
    assert transform is not None
    assert crs is not None