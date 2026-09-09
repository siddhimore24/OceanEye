import numpy as np
import rasterio
import cv2


def load_sar_image(path: str):
    """
    Load a single-band Sentinel-1 SAR GeoTIFF.

    Returns
    -------
    image : np.ndarray
        SAR intensity values.
    transform : rasterio.Affine
        Geographic transformation of the raster.
    crs : rasterio.crs.CRS
        Coordinate reference system.
    metadata : dict
        Raster metadata.
    """

    with rasterio.open(path) as src:

        image = src.read(1).astype(np.float32)

        transform = src.transform
        crs = src.crs
        metadata = src.meta.copy()

    return image, transform, crs, metadata


def handle_invalid_values(image: np.ndarray) -> np.ndarray:
    """
    Replace NaN and infinite values with valid values.
    """

    image = np.nan_to_num(
        image,
        nan=0.0,
        posinf=0.0,
        neginf=0.0
    )

    return image


def normalize_image(image: np.ndarray) -> np.ndarray:
    """
    Normalize SAR intensity values to the range 0-255.

    Percentiles are used instead of the absolute minimum
    and maximum so that extreme pixels have less influence.
    """

    lower = np.percentile(image, 2)
    upper = np.percentile(image, 98)

    if upper <= lower:
        return np.zeros_like(
            image,
            dtype=np.uint8
        )

    normalized = (
        (image - lower)
        / (upper - lower)
    )

    normalized = np.clip(
        normalized,
        0,
        1
    )

    normalized = (
        normalized * 255
    ).astype(np.uint8)

    return normalized


def reduce_noise(image: np.ndarray) -> np.ndarray:
    """
    Apply light Gaussian smoothing to reduce
    high-frequency noise.
    """

    denoised = cv2.GaussianBlur(
        image,
        (5, 5),
        0
    )

    return denoised


def preprocess_sar(path: str):
    """
    Complete SAR preprocessing pipeline.

    Steps:
        1. Load raster
        2. Handle invalid values
        3. Normalize
        4. Reduce noise

    Returns
    -------
    processed_image
    transform
    crs
    metadata
    """

    image, transform, crs, metadata = load_sar_image(
        path
    )

    image = handle_invalid_values(
        image
    )

    image = normalize_image(
        image
    )

    image = reduce_noise(
        image
    )

    return (
        image,
        transform,
        crs,
        metadata
    )