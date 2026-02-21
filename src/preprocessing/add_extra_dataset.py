import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

from src.preprocessing.download_dataset import kaggle_download, copy_images
from src.utils.config import COLOUR_DIR, COLOUR_FOLDER_MAP, BASE_DIR

DOWNLOAD_DIR = os.path.join(BASE_DIR, "data", "downloads", "extra_eye_color")

def add_extra_colour_dataset(dataset_name="namratasri/eye-color-dataset"):
    print(f"Downloading extra dataset: {dataset_name}")
    kaggle_download(dataset_name, DOWNLOAD_DIR)
    
    print("Organising extra colour dataset …")
    # Walk the downloaded folder and place images into the 4 colour classes.
    for root, dirs, files in os.walk(DOWNLOAD_DIR):
        for folder in dirs:
            src = os.path.join(root, folder)
            
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
                continue
            
            dst = os.path.join(COLOUR_DIR, class_name)
            copy_images(src, dst, f"extra_{class_name}")

if __name__ == "__main__":
    add_extra_colour_dataset()
