"""
normalize_colour.py – Colour and contrast normalisation for eye images.
"""

import cv2
import numpy as np
from PIL import Image


def apply_clahe(image: np.ndarray, clip_limit: float = 2.0, tile_grid: int = 8) -> np.ndarray:
    """
    Apply CLAHE (Contrast Limited Adaptive Histogram Equalization) to a BGR image.
    Enhances local contrast, especially useful for retinal/fundus images.

    Returns BGR image.
    """
    lab = cv2.cvtColor(image, cv2.COLOR_BGR2LAB)
    l, a, b = cv2.split(lab)
    clahe = cv2.createCLAHE(clipLimit=clip_limit, tileGridSize=(tile_grid, tile_grid))
    l_clahe = clahe.apply(l)
    lab_clahe = cv2.merge([l_clahe, a, b])
    return cv2.cvtColor(lab_clahe, cv2.COLOR_LAB2BGR)


def normalise_image(image: np.ndarray) -> np.ndarray:
    """
    Scale pixel values to [0, 1] float32 and apply per-channel normalisation.
    Returns float32 numpy array (H x W x 3).
    """
    img = image.astype(np.float32) / 255.0
    mean = img.mean(axis=(0, 1), keepdims=True)
    std  = img.std(axis=(0, 1), keepdims=True) + 1e-6
    return (img - mean) / std


def preprocess_bgr(image: np.ndarray, use_clahe: bool = True) -> np.ndarray:
    """
    Full preprocessing pipeline on a BGR image:
    1. Optional CLAHE
    2. Convert to RGB float32 normalised array.
    """
    if use_clahe:
        image = apply_clahe(image)
    rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    return normalise_image(rgb)


def preprocess_pil(pil_image: Image.Image, use_clahe: bool = True) -> np.ndarray:
    """PIL wrapper – returns float32 normalised RGB array."""
    bgr = cv2.cvtColor(np.array(pil_image.convert("RGB")), cv2.COLOR_RGB2BGR)
    return preprocess_bgr(bgr, use_clahe=use_clahe)
