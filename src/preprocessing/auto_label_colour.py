"""
auto_label_colour.py

Automatically assigns iris colour labels (dark_brown / brown / light_brown / hazel)
to unlabelled iris images using HSV colour analysis of the iris region.

Usage:
    python src/preprocessing/auto_label_colour.py
"""
import os, sys, shutil
import cv2
import numpy as np

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))
from src.utils.config import COLOUR_DIR
from src.utils.logger import get_logger

log = get_logger("auto_label_colour")

# Source: downloaded iris images (unlabelled)
SOURCE_DIR = os.path.join(
    os.path.dirname(__file__), "..", "..", "data", "downloads", "eye_colour", "iris_images"
)

def get_iris_hsv(img_bgr: np.ndarray):
    """
    Extract mean HSV values from the centre 40% of the image
    (where the iris pupil ring tends to be).
    """
    h, w = img_bgr.shape[:2]
    cy, cx = h // 2, w // 2
    r = int(min(h, w) * 0.20)
    mask = np.zeros((h, w), dtype=np.uint8)
    # Outer ring (iris) — exclude pupil (inner 10%)
    cv2.circle(mask, (cx, cy), r, 255, -1)
    inner_r = int(min(h, w) * 0.08)
    cv2.circle(mask, (cx, cy), inner_r, 0, -1)

    hsv = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2HSV)
    pixels = hsv[mask == 255]
    if len(pixels) == 0:
        # Fall back to centre crop if mask empty
        pixels = hsv[cy-r:cy+r, cx-r:cx+r].reshape(-1, 3)
    return pixels.mean(axis=0)   # [H, S, V]


def classify_colour(h, s, v) -> str:
    """
    Classify iris colour into 4 classes based on HSV.
    
    Real dataset observations:
      H ≈ 10-20 (warm orange-brown hue)
      S ≈ 100-200 (high saturation = colour image)
      V varies: dark=<90, medium-dark=90-115, medium=115-135, light=>135
    
    For near-IR (grayscale, S < 30): use V only.
    """
    if s < 30:
        # Near-IR or grayscale
        if v < 60:   return "dark_brown"
        if v < 90:   return "brown"
        if v < 120:  return "light_brown"
        return "hazel"

    # Colour images: warm brown hue range (H ~ 10-25 in OpenCV 0-179)
    # Split primarily on Value (brightness) for brown variants
    if v < 90:   return "dark_brown"
    if v < 115:  return "brown"
    if v < 135:  return "light_brown"
    # High V + warm hue (orange-green mix) = hazel
    if 10 <= h <= 25:
        return "hazel"
    return "light_brown"


def main():
    src = os.path.abspath(SOURCE_DIR)
    if not os.path.isdir(src):
        log.error(f"Source not found: {src}")
        sys.exit(1)

    # Prepare output dirs
    for cls in ["dark_brown", "brown", "light_brown", "hazel"]:
        os.makedirs(os.path.join(COLOUR_DIR, cls), exist_ok=True)

    counts = {c: 0 for c in ["dark_brown", "brown", "light_brown", "hazel"]}
    exts = {".jpg", ".jpeg", ".png", ".bmp"}

    for root, _, files in os.walk(src):
        for fname in files:
            if os.path.splitext(fname)[1].lower() not in exts:
                continue
            fpath = os.path.join(root, fname)
            img = cv2.imread(fpath)
            if img is None:
                continue
            h_mean, s_mean, v_mean = get_iris_hsv(img)
            label = classify_colour(h_mean, s_mean, v_mean)
            dst_name = f"{label}_{counts[label]:05d}{os.path.splitext(fname)[1]}"
            shutil.copy2(fpath, os.path.join(COLOUR_DIR, label, dst_name))
            counts[label] += 1

    log.info("=== Auto-labelling complete ===")
    for cls, cnt in counts.items():
        log.info(f"  {cls}: {cnt} images")


if __name__ == "__main__":
    main()
