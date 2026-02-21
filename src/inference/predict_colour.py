"""
predict_colour.py – Run iris colour prediction on a single image.
"""

import os
import sys
import torch
import torch.nn.functional as F
from PIL import Image

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

from src.utils.config import COLOUR_MODEL_PATH, IMAGE_SIZE
from src.training.augment import get_val_transforms
from torchvision import models
import torch.nn as nn


def load_colour_model(model_path: str = COLOUR_MODEL_PATH):
    """Load saved colour model. Returns (model, classes)."""
    if not os.path.isfile(model_path):
        raise FileNotFoundError(f"Model not found: {model_path}. Train first.")
    checkpoint = torch.load(model_path, map_location="cpu")
    classes    = checkpoint["classes"]
    num_classes = len(classes)

    model = models.efficientnet_b0(weights=None)
    in_features = model.classifier[1].in_features
    model.classifier = nn.Sequential(
        nn.Dropout(p=0.3, inplace=True),
        nn.Linear(in_features, num_classes),
    )
    model.load_state_dict(checkpoint["model_state_dict"])
    model.eval()
    return model, classes


def predict_colour(image_path: str, model=None, classes=None, model_path: str = COLOUR_MODEL_PATH) -> dict:
    """
    Predict the iris colour of a single eye image.

    Returns:
        {
          "predicted_class": "brown",
          "confidence": 0.92,
          "probabilities": {"dark_brown": 0.02, "brown": 0.92, ...}
        }
    """
    if model is None or classes is None:
        model, classes = load_colour_model(model_path)

    transform = get_val_transforms()
    image = Image.open(image_path).convert("RGB")
    tensor = transform(image).unsqueeze(0)          # (1, C, H, W)

    with torch.no_grad():
        logits = model(tensor)
        probs  = F.softmax(logits, dim=1).squeeze().tolist()

    idx = int(torch.tensor(probs).argmax())
    return {
        "predicted_class": classes[idx],
        "confidence":      round(probs[idx], 4),
        "probabilities":   {c: round(p, 4) for c, p in zip(classes, probs)},
    }


if __name__ == "__main__":
    path = sys.argv[1] if len(sys.argv) > 1 else None
    if not path:
        print("Usage: python src/inference/predict_colour.py <image_path>")
        sys.exit(1)
    result = predict_colour(path)
    print(result)
