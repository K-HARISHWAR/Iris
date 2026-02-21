"""
Download datasets from Kaggle and organise them into the project structure.

Usage:
    python src/preprocessing/download_dataset.py

Requirements:
    - kaggle package installed  (pip install kaggle)
    - ~/.kaggle/kaggle.json present with your API credentials
"""

import os
import sys
import shutil
import zipfile

# Allow running from any directory
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

from src.utils.config import (
    BASE_DIR, RAW_NORMAL_DIR, RAW_ABNORMAL_DIR,
    COLOUR_DIR, ABNORMALITY_DIR,
    COLOUR_DATASET, ABNORMALITY_DATASET,
    COLOUR_FOLDER_MAP, ABNORMAL_FOLDER_NAMES, NORMAL_FOLDER_NAMES,
    COLOUR_CLASSES,
)
from src.utils.logger import get_logger

log = get_logger("download_dataset")

DOWNLOAD_DIR = os.path.join(BASE_DIR, "data", "downloads")


# ─── Helpers ──────────────────────────────────────────────────────────────────

def kaggle_download(dataset: str, dest: str):
    """Download & unzip a Kaggle dataset into `dest`."""
    os.makedirs(dest, exist_ok=True)
    log.info(f"Downloading Kaggle dataset: {dataset}")
    ret = os.system(
        f'kaggle datasets download -d "{dataset}" -p "{dest}" --unzip'
    )
    if ret != 0:
        log.error("kaggle download failed — check your API key and dataset name.")
        sys.exit(1)
    log.info(f"Downloaded to: {dest}")


def copy_images(src_dir: str, dst_dir: str, label: str):
    """Copy all image files from src_dir → dst_dir."""
    os.makedirs(dst_dir, exist_ok=True)
    exts = {".jpg", ".jpeg", ".png", ".bmp", ".tiff"}
    copied = 0
    for root, _, files in os.walk(src_dir):
        for f in files:
            if os.path.splitext(f)[1].lower() in exts:
                src = os.path.join(root, f)
                # Prefix filename with source folder to avoid collisions
                unique_name = f"{label}_{copied:05d}{os.path.splitext(f)[1]}"
                shutil.copy2(src, os.path.join(dst_dir, unique_name))
                copied += 1
    log.info(f"  Copied {copied} images  →  {dst_dir}")
    return copied


# ─── Abnormality Dataset ──────────────────────────────────────────────────────

def organise_abnormality(raw_dir: str):
    """
    Walk the downloaded eye-diseases folder and split into normal / abnormal.
    """
    log.info("Organising abnormality dataset …")
    normal_dst   = os.path.join(ABNORMALITY_DIR, "normal")
    abnormal_dst = os.path.join(ABNORMALITY_DIR, "abnormal")

    for folder in os.listdir(raw_dir):
        folder_lower = folder.lower().strip()
        src = os.path.join(raw_dir, folder)
        if not os.path.isdir(src):
            continue

        if folder_lower in {n.lower() for n in NORMAL_FOLDER_NAMES}:
            n = copy_images(src, normal_dst, "normal")
            copy_images(src, RAW_NORMAL_DIR, "normal")
        elif any(folder_lower.startswith(ab.lower()) for ab in ABNORMAL_FOLDER_NAMES) or \
             folder_lower not in {n.lower() for n in NORMAL_FOLDER_NAMES}:
            n = copy_images(src, abnormal_dst, folder_lower)
            copy_images(src, RAW_ABNORMAL_DIR, folder_lower)
        else:
            log.warning(f"  Unrecognised folder '{folder}' — skipping.")


# ─── Colour Dataset ───────────────────────────────────────────────────────────

def organise_colour(raw_dir: str):
    """
    Walk the downloaded eye-colour folder and place images into the 4 colour classes.
    """
    log.info("Organising colour dataset …")
    for folder in os.listdir(raw_dir):
        src = os.path.join(raw_dir, folder)
        if not os.path.isdir(src):
            continue

        # Try direct match first, then case-insensitive
        class_name = COLOUR_FOLDER_MAP.get(folder) or \
                     COLOUR_FOLDER_MAP.get(folder.lower())

        if class_name is None:
            # Try partial match
            fl = folder.lower()
            for key, val in COLOUR_FOLDER_MAP.items():
                if key in fl:
                    class_name = val
                    break

        if class_name is None:
            log.warning(f"  Unknown colour folder '{folder}' — skipping. "
                        f"Add it to COLOUR_FOLDER_MAP in config.py if needed.")
            continue

        dst = os.path.join(COLOUR_DIR, class_name)
        copy_images(src, dst, class_name)


# ─── Main ─────────────────────────────────────────────────────────────────────

def main():
    # 1. Download
    abn_raw = os.path.join(DOWNLOAD_DIR, "eye_diseases")
    col_raw = os.path.join(DOWNLOAD_DIR, "eye_colour")

    kaggle_download(ABNORMALITY_DATASET, abn_raw)
    kaggle_download(COLOUR_DATASET,      col_raw)

    # 2. Organise
    for folder in os.listdir(abn_raw):
        full = os.path.join(abn_raw, folder)
        if os.path.isdir(full):
            organise_abnormality(full)
            break
    else:
        organise_abnormality(abn_raw)

    for folder in os.listdir(col_raw):
        full = os.path.join(col_raw, folder)
        if os.path.isdir(full):
            organise_colour(full)
            break
    else:
        organise_colour(col_raw)

    # 3. Summary
    log.info("\n=== Dataset Summary ===")
    for split in ["normal", "abnormal"]:
        d = os.path.join(ABNORMALITY_DIR, split)
        n = len([f for f in os.listdir(d) if os.path.isfile(os.path.join(d, f))]) if os.path.isdir(d) else 0
        log.info(f"  Abnormality / {split}: {n} images")
    for cls in COLOUR_CLASSES:
        d = os.path.join(COLOUR_DIR, cls)
        n = len([f for f in os.listdir(d) if os.path.isfile(os.path.join(d, f))]) if os.path.isdir(d) else 0
        log.info(f"  Colour / {cls}: {n} images")


if __name__ == "__main__":
    main()
