"""
fetch_extra_iris_data.py – Download extra iris eye images from multiple Kaggle sources
and organise them into your existing data/processed colour & abnormality directories.

Sources used (all publicly accessible):
  1. ouaraskhelilrafik/iris-images        – iris-cropped RGB images
  2. sondosaabed/casia-iris-thousand      – CASIA-Iris-Thousand, large biometric set
  3. arwabasal/itec-iris-and-pupil-segmentation – coloured iris images

Usage:
    python src/preprocessing/fetch_extra_iris_data.py
"""

import os
import sys
import shutil
import zipfile
import glob

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

from src.utils.config import (
    BASE_DIR, COLOUR_DIR, ABNORMALITY_DIR, COLOUR_FOLDER_MAP
)
from src.utils.logger import get_logger

log = get_logger("fetch_extra_iris_data")

DOWNLOAD_DIR = os.path.join(BASE_DIR, "data", "downloads", "extra_iris")
IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".bmp", ".tiff"}

# ─── Datasets to download ────────────────────────────────────────────────────
EXTRA_DATASETS = [
    {
        "ref":   "ouaraskhelilrafik/iris-images",
        "label": "iris_images",
        # Left/right sub-folders but all images are iris crops – add as generic brown class
        "mode":  "colour",   # put into colour/brown after iris-cropping at train time
        "class": "brown",
    },
    {
        "ref":   "sondosaabed/casia-iris-thousand",
        "label": "casia_iris",
        "mode":  "colour",
        "class": "dark_brown",   # CASIA images are predominantly dark brown iris
    },
    {
        "ref":   "arwabasal/itec-iris-and-pupil-segmentation",
        "label": "itec_iris",
        "mode":  "colour",
        "class": "brown",
    },
]


# ─── Helpers ─────────────────────────────────────────────────────────────────

def kaggle_download(dataset_ref: str, dest: str):
    """Download & unzip a Kaggle dataset into dest."""
    os.makedirs(dest, exist_ok=True)
    log.info(f"Downloading {dataset_ref} …")
    ret = os.system(f'kaggle datasets download -d "{dataset_ref}" -p "{dest}" --unzip')
    if ret != 0:
        log.error(f"Download failed for {dataset_ref}")
        return False
    log.info(f"  → {dest}")
    return True


def copy_images_to(src_dir: str, dst_dir: str, prefix: str, limit: int = None):
    """Recursively copy images from src_dir into dst_dir, optionally capped at limit."""
    os.makedirs(dst_dir, exist_ok=True)
    copied = 0
    for root, _, files in os.walk(src_dir):
        for f in sorted(files):
            if limit and copied >= limit:
                return copied
            if os.path.splitext(f)[1].lower() in IMAGE_EXTS:
                src = os.path.join(root, f)
                unique_name = f"{prefix}_{copied:06d}{os.path.splitext(f)[1].lower()}"
                shutil.copy2(src, os.path.join(dst_dir, unique_name))
                copied += 1
    log.info(f"  Copied {copied} images → {dst_dir}")
    return copied


# ─── Main ────────────────────────────────────────────────────────────────────

def main():
    log.info("=== Fetching Extra Iris Data from Kaggle ===")
    total_copied = 0

    for ds in EXTRA_DATASETS:
        ref   = ds["ref"]
        label = ds["label"]
        mode  = ds["mode"]
        cls   = ds["class"]

        raw_dest = os.path.join(DOWNLOAD_DIR, label)

        # Skip download if already have the folder
        if os.path.isdir(raw_dest) and any(
            os.path.splitext(f)[1].lower() in IMAGE_EXTS
            for _, _, files in os.walk(raw_dest)
            for f in files
        ):
            log.info(f"Already downloaded: {ref}  (using cached copy)")
        else:
            ok = kaggle_download(ref, raw_dest)
            if not ok:
                log.warning(f"Skipping {ref}")
                continue

        # Destination inside processed/colour/<class>
        dst_dir = os.path.join(COLOUR_DIR, cls)
        n = copy_images_to(raw_dest, dst_dir, prefix=label, limit=2000)  # max 2000 per source
        total_copied += n

    # ─── Summary ─────────────────────────────────────────────────────────────
    log.info("\n=== Extra Iris Data Download Summary ===")
    for cls in os.listdir(COLOUR_DIR):
        d = os.path.join(COLOUR_DIR, cls)
        if os.path.isdir(d):
            n = sum(1 for f in os.listdir(d) if os.path.splitext(f)[1].lower() in IMAGE_EXTS)
            log.info(f"  colour/{cls}: {n} images")
    log.info(f"\n  Total newly copied: {total_copied} images")
    log.info("Done! You can now re-run training to use the extra data.")


if __name__ == "__main__":
    main()
