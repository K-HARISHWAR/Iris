"""
resize.py – Resize eye images to a standard square size.
"""

import cv2
import numpy as np
from PIL import Image

from src.utils.config import IMAGE_SIZE


def resize_cv2(image: np.ndarray, size: int = IMAGE_SIZE) -> np.ndarray:
    """Resize a BGR/RGB numpy image to (size x size) using LANCZOS interpolation."""
    return cv2.resize(image, (size, size), interpolation=cv2.INTER_LANCZOS4)


def resize_pil(pil_image: Image.Image, size: int = IMAGE_SIZE) -> Image.Image:
    """Resize a PIL image to (size x size)."""
    return pil_image.convert("RGB").resize((size, size), Image.LANCZOS)
