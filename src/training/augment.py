"""
augment.py – Data augmentation pipelines for training and validation.
"""

from torchvision import transforms
from src.utils.config import IMAGE_SIZE, IMAGENET_MEAN, IMAGENET_STD
from src.preprocessing.iris_crop import crop_iris_pil
import random

class RandomIrisCropTransform:
    """Randomly crops only the iris from the eye image to act as extra training data without saving to disk."""
    def __init__(self, p=0.5):
        self.p = p

    def __call__(self, img):
        if random.random() < self.p:
            try:
                # crop_iris_pil expects and returns a PIL Image
                return crop_iris_pil(img)
            except Exception:
                pass
        return img


def get_train_transforms():
    """Aggressive augmentation for training."""
    return transforms.Compose([
        RandomIrisCropTransform(p=0.5),
        transforms.Resize((IMAGE_SIZE + 32, IMAGE_SIZE + 32)),
        transforms.RandomCrop(IMAGE_SIZE),
        transforms.RandomHorizontalFlip(p=0.5),
        transforms.RandomVerticalFlip(p=0.2),
        transforms.RandomRotation(degrees=20),
        transforms.ColorJitter(
            brightness=0.3,
            contrast=0.3,
            saturation=0.2,
            hue=0.05,
        ),
        transforms.RandomGrayscale(p=0.05),
        transforms.ToTensor(),
        transforms.Normalize(mean=IMAGENET_MEAN, std=IMAGENET_STD),
        transforms.RandomErasing(p=0.1, scale=(0.02, 0.1)),
    ])


def get_val_transforms():
    """Deterministic transforms for validation / inference."""
    return transforms.Compose([
        transforms.Resize((IMAGE_SIZE, IMAGE_SIZE)),
        transforms.ToTensor(),
        transforms.Normalize(mean=IMAGENET_MEAN, std=IMAGENET_STD),
    ])
