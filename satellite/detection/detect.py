import cv2
import numpy as np


def segment_oil_like_regions(
    image: np.ndarray,
    threshold: int = 80
) -> np.ndarray:
    """
    Detect relatively dark regions in a preprocessed SAR image.

    This is an MVP fallback detector.
    A dark SAR region is treated only as an
    'oil-like candidate', not confirmed oil.

    Parameters
    ----------
    image : np.ndarray
        Preprocessed SAR image with values from 0 to 255.

    threshold : int
        Intensity threshold.
        Pixels below this value are considered candidates.

    Returns
    -------
    np.ndarray
        Binary mask:
            255 = oil-like candidate
            0   = background
    """

    _, mask = cv2.threshold(
        image,
        threshold,
        255,
        cv2.THRESH_BINARY_INV
    )

    return mask


def clean_mask(
    mask: np.ndarray,
    kernel_size: int = 5
) -> np.ndarray:
    """
    Clean the candidate mask using morphological operations.

    Opening removes small isolated noise.
    Closing fills small gaps inside candidate regions.
    """

    kernel = np.ones(
        (kernel_size, kernel_size),
        dtype=np.uint8
    )

    # Remove small isolated regions
    mask = cv2.morphologyEx(
        mask,
        cv2.MORPH_OPEN,
        kernel
    )

    # Fill small gaps
    mask = cv2.morphologyEx(
        mask,
        cv2.MORPH_CLOSE,
        kernel
    )

    return mask


def remove_small_regions(
    mask: np.ndarray,
    min_area_pixels: int = 100
) -> np.ndarray:
    """
    Remove candidate regions smaller than the
    specified pixel area.
    """

    num_labels, labels, stats, _ = (
        cv2.connectedComponentsWithStats(
            mask,
            connectivity=8
        )
    )

    cleaned = np.zeros_like(mask)

    for label in range(1, num_labels):

        area = stats[
            label,
            cv2.CC_STAT_AREA
        ]

        if area >= min_area_pixels:
            cleaned[labels == label] = 255

    return cleaned


def detect_oil_like_regions(
    image: np.ndarray,
    threshold: int = 80,
    min_area_pixels: int = 100
) -> np.ndarray:
    """
    Complete oil-like candidate detection pipeline.

    Steps:
        1. Dark-region segmentation
        2. Morphological cleaning
        3. Removal of very small regions

    Returns
    -------
    np.ndarray
        Final binary spill candidate mask.
    """

    mask = segment_oil_like_regions(
        image,
        threshold=threshold
    )

    mask = clean_mask(
        mask
    )

    mask = remove_small_regions(
        mask,
        min_area_pixels=min_area_pixels
    )

    return mask