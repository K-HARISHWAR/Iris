"""
iris_crop.py – Detect and crop the iris region from an eye image.

Uses OpenCV's HoughCircles to find the iris circle.
Falls back to a centre crop if no circle is detected.
"""

import cv2
import numpy as np
from PIL import Image


def crop_iris(image: np.ndarray, margin: float = 0.05) -> np.ndarray:
    """
    Detect and crop the iris from a BGR OpenCV image.

    Args:
        image:   BGR image (H x W x 3).
        margin:  Extra margin (fraction of radius) to include around the iris.

    Returns:
        Cropped BGR image of the iris region.
    """
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    gray = cv2.medianBlur(gray, 5)

    h, w = gray.shape
    min_r = int(min(h, w) * 0.20)
    max_r = int(min(h, w) * 0.55)

    circles = cv2.HoughCircles(
        gray,
        cv2.HOUGH_GRADIENT,
        dp=1.2,
        minDist=min(h, w) // 2,
        param1=50,
        param2=30,
        minRadius=min_r,
        maxRadius=max_r,
    )

    if circles is not None:
        circles = np.round(circles[0, :]).astype(int)
        cx, cy, r = circles[0]
        r_margin = int(r * (1 + margin))
        x1 = max(cx - r_margin, 0)
        y1 = max(cy - r_margin, 0)
        x2 = min(cx + r_margin, w)
        y2 = min(cy + r_margin, h)
        return image[y1:y2, x1:x2]

    # Fallback: centre square crop
    side = int(min(h, w) * 0.7)
    cx, cy = w // 2, h // 2
    x1 = max(cx - side // 2, 0)
    y1 = max(cy - side // 2, 0)
    x2 = min(cx + side // 2, w)
    y2 = min(cy + side // 2, h)
    return image[y1:y2, x1:x2]


def crop_iris_pil(pil_image: Image.Image) -> Image.Image:
    """Convenience wrapper that accepts and returns PIL Images."""
    bgr = cv2.cvtColor(np.array(pil_image.convert("RGB")), cv2.COLOR_RGB2BGR)
    cropped = crop_iris(bgr)
    return Image.fromarray(cv2.cvtColor(cropped, cv2.COLOR_BGR2RGB))


if __name__ == "__main__":
    import sys
    path = sys.argv[1] if len(sys.argv) > 1 else None
    if path:
        img = cv2.imread(path)
        out = crop_iris(img)
        cv2.imwrite("iris_crop_output.jpg", out)
        print(f"Saved iris_crop_output.jpg  (shape={out.shape})")
