"""
pipeline.py – End-to-end inference pipeline for a single eye image.

Steps:
  1. Load image
  2. Crop iris region
  3. Run colour prediction
  4. Run abnormality prediction
  5. Return combined result

Usage:
    python src/inference/pipeline.py --image path/to/eye.jpg
"""

import os
import sys
import argparse
import json

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

from src.preprocessing.iris_crop import crop_iris_pil
from src.inference.predict_colour import load_colour_model, predict_colour
from src.inference.predict_abnormality import load_abnormality_model, predict_abnormality
from src.utils.logger import get_logger

log = get_logger("pipeline")


class EyePipeline:
    """
    Load both models once and run inference efficiently on multiple images.
    """
    def __init__(self):
        log.info("Loading colour model …")
        self.colour_model, self.colour_classes = load_colour_model()
        log.info("Loading abnormality model …")
        self.abn_model, self.abn_classes = load_abnormality_model()

    def run(self, image_path: str, crop: bool = True) -> dict:
        """
        Run full pipeline on one image.

        Args:
            image_path: Path to the eye image.
            crop:       If True, automatically crop the iris region first.

        Returns:
            Combined prediction dict.
        """
        from PIL import Image
        import tempfile

        original_path = image_path
        if crop:
            from PIL import Image as PILImage
            pil = PILImage.open(image_path).convert("RGB")
            cropped = crop_iris_pil(pil)
            # Save to temp for predict functions
            tmp = tempfile.NamedTemporaryFile(suffix=".jpg", delete=False)
            cropped.save(tmp.name)
            image_path = tmp.name

        colour_result = predict_colour(
            image_path, model=self.colour_model, classes=self.colour_classes
        )
        abn_result = predict_abnormality(
            image_path, model=self.abn_model, classes=self.abn_classes
        )

        if crop:
            try:
                os.unlink(image_path)   # clean up temp file
            except PermissionError:
                pass  # Windows file lock timing issue

        return {
            "image":          original_path,
            "iris_colour":    colour_result,
            "abnormality":    abn_result,
            "summary": (
                f"Colour: {colour_result['predicted_class']} "
                f"({colour_result['confidence']*100:.1f}%), "
                f"Status: {'⚠ Abnormal' if abn_result['is_abnormal'] else '✓ Normal'} "
                f"({abn_result['confidence']*100:.1f}%)"
            ),
        }


def main(args):
    pipeline = EyePipeline()
    result = pipeline.run(args.image, crop=not args.no_crop)
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Eye analysis pipeline")
    parser.add_argument("--image",    required=True, help="Path to eye image")
    parser.add_argument("--no_crop",  action="store_true",
                        help="Skip iris cropping (use if image is already cropped)")
    args = parser.parse_args()
    main(args)
