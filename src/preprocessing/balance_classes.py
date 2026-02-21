"""
balance_classes.py – Augment under-represented iris colour classes to a target count.

Generates extra images by applying random transforms (flip, rotate, colour jitter)
to existing images for under-populated classes. Saves directly into processed/colour.

Usage:
    python src/preprocessing/balance_classes.py
    python src/preprocessing/balance_classes.py --target 500
"""

import os
import sys
import argparse
import random
from PIL import Image, ImageEnhance, ImageOps

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

from src.utils.config import COLOUR_DIR, COLOUR_CLASSES
from src.utils.logger import get_logger

log = get_logger("balance_classes")

IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".bmp"}


def list_images(folder):
    return [
        os.path.join(folder, f)
        for f in os.listdir(folder)
        if os.path.splitext(f)[1].lower() in IMAGE_EXTS
    ]


def augment_image(img: Image.Image) -> Image.Image:
    """Apply random augmentations to produce a new variant."""
    # Random horizontal flip
    if random.random() > 0.5:
        img = ImageOps.mirror(img)
    # Random vertical flip
    if random.random() > 0.7:
        img = ImageOps.flip(img)
    # Random rotation
    angle = random.uniform(-30, 30)
    img = img.rotate(angle)
    # Brightness
    img = ImageEnhance.Brightness(img).enhance(random.uniform(0.7, 1.3))
    # Contrast
    img = ImageEnhance.Contrast(img).enhance(random.uniform(0.8, 1.3))
    # Saturation
    img = ImageEnhance.Color(img).enhance(random.uniform(0.7, 1.3))
    return img


def balance_class(cls_dir: str, cls_name: str, target: int):
    images = list_images(cls_dir)
    current = len(images)
    if current == 0:
        log.warning(f"  {cls_name}: 0 images — skipping (add at least 1 real image first)")
        return
    if current >= target:
        log.info(f"  {cls_name}: {current} images — already at/above target ({target}), no augmentation needed")
        return

    needed = target - current
    log.info(f"  {cls_name}: {current} images → generating {needed} augmented copies …")

    generated = 0
    while generated < needed:
        src_path = random.choice(images)
        try:
            img = Image.open(src_path).convert("RGB")
            aug = augment_image(img)
            out_name = f"aug_{cls_name}_{current + generated:06d}.jpg"
            out_path = os.path.join(cls_dir, out_name)
            aug.save(out_path, quality=90)
            generated += 1
        except Exception as e:
            log.warning(f"    Failed to augment {src_path}: {e}")

    log.info(f"  {cls_name}: done  ({current + generated} total)")


def main(args):
    log.info(f"Balancing colour classes to target={args.target} images each …")

    for cls in COLOUR_CLASSES:
        cls_dir = os.path.join(COLOUR_DIR, cls)
        if not os.path.isdir(cls_dir):
            os.makedirs(cls_dir, exist_ok=True)
            log.warning(f"  {cls}: directory created but empty")
            continue
        balance_class(cls_dir, cls, args.target)

    log.info("\n=== Final Class Counts ===")
    for cls in COLOUR_CLASSES:
        d = os.path.join(COLOUR_DIR, cls)
        n = len(list_images(d)) if os.path.isdir(d) else 0
        log.info(f"  {cls}: {n} images")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Balance colour dataset classes")
    parser.add_argument(
        "--target", type=int, default=500,
        help="Target number of images per class (default: 500)"
    )
    args = parser.parse_args()
    main(args)
