import cv2
import numpy as np


def create_detection_overlay(
    image: np.ndarray,
    mask: np.ndarray
) -> np.ndarray:
    """
    Create a visual overlay showing detected
    oil-like candidate regions.

    Parameters
    ----------
    image : np.ndarray
        Preprocessed grayscale SAR image.

    mask : np.ndarray
        Binary detection mask:
            255 = candidate
            0   = background

    Returns
    -------
    np.ndarray
        BGR image with detected regions highlighted.
    """

    # Convert grayscale SAR image to 3-channel image
    overlay = cv2.cvtColor(
        image,
        cv2.COLOR_GRAY2BGR
    )

    # Highlight detected candidate pixels
    candidate_pixels = mask > 0

    overlay[candidate_pixels] = (
        0,
        0,
        255
    )

    return overlay


def save_detection_overlay(
    image: np.ndarray,
    mask: np.ndarray,
    output_path: str
) -> None:
    """
    Create and save the detection visualization.
    """

    overlay = create_detection_overlay(
        image,
        mask
    )

    cv2.imwrite(
        output_path,
        overlay
    )