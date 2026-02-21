"""
train_colour.py – Train EfficientNet-B0 for 4-class iris colour classification.

Classes: dark_brown | brown | light_brown | hazel

Usage:
    python src/training/train_colour.py
    python src/training/train_colour.py --epochs 30 --batch_size 32 --lr 0.0001
"""

import os
import sys
import argparse
import torch  # type: ignore
import torch.nn as nn  # type: ignore
from torch.utils.data import DataLoader, Subset, random_split  # type: ignore
from torchvision import datasets, models  # type: ignore

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

from src.utils.config import (  # type: ignore
    COLOUR_DIR, COLOUR_MODEL_PATH, MODELS_DIR,
    COLOUR_CLASSES, NUM_EPOCHS, BATCH_SIZE, LEARNING_RATE,
    WEIGHT_DECAY, VAL_SPLIT, RANDOM_SEED,
)
from src.utils.logger import get_logger  # type: ignore
from src.utils.metrics import compute_accuracy, compute_classification_report  # type: ignore
from src.training.augment import get_train_transforms, get_val_transforms  # type: ignore

log = get_logger("train_colour")


# ─── Model ────────────────────────────────────────────────────────────────────

def build_model(num_classes: int) -> nn.Module:
    model = models.efficientnet_b0(weights=models.EfficientNet_B0_Weights.IMAGENET1K_V1)
    in_features = model.classifier[1].in_features
    model.classifier = nn.Sequential(
        nn.Dropout(p=0.3, inplace=True),
        nn.Linear(in_features, num_classes),
    )
    return model


# ─── Dataset ──────────────────────────────────────────────────────────────────

class _TransformSubset:
    """Wraps a Subset and applies a different transform, without subclassing Subset.

    Subclassing torch.utils.data.Subset causes an MRO conflict in newer PyTorch
    versions where `object.__init__` is called with positional args it doesn't accept.
    Using composition avoids this entirely.
    """
    def __init__(self, subset: Subset, transform):
        self._subset = subset
        self._transform = transform

    def __len__(self):
        return len(self._subset)

    def __getitem__(self, idx):
        img, label = self._subset.dataset[self._subset.indices[idx]]
        if self._transform is not None:
            img = self._transform(img)
        return img, label


def load_datasets(data_dir: str, val_split: float, seed: int):
    # Load once with train transforms to get class list and perform the split
    full_dataset = datasets.ImageFolder(root=data_dir, transform=get_train_transforms())
    n_val  = int(len(full_dataset) * val_split)
    n_train = len(full_dataset) - n_val
    generator = torch.Generator().manual_seed(seed)
    train_subset, val_subset = random_split(full_dataset, [n_train, n_val], generator=generator)
    # Apply deterministic val transforms without touching the shared underlying dataset
    val_ds = _TransformSubset(val_subset, transform=get_val_transforms())
    return train_subset, val_ds, full_dataset.classes


# ─── Training Loop ────────────────────────────────────────────────────────────

def train_one_epoch(model, loader, criterion, optimizer, device, scaler):
    model.train()
    total_loss, all_preds, all_labels = 0.0, [], []
    for imgs, labels in loader:
        imgs, labels = imgs.to(device, non_blocking=True), labels.to(device, non_blocking=True)
        optimizer.zero_grad()
        
        with torch.autocast(device_type=device.type, dtype=torch.float16, enabled=device.type == 'cuda'):
            outputs = model(imgs)
            loss = criterion(outputs, labels)
            
        scaler.scale(loss).backward()
        scaler.step(optimizer)
        scaler.update()

        total_loss += loss.item() * len(imgs)
        preds = outputs.argmax(dim=1).cpu().tolist()
        all_preds.extend(preds)
        all_labels.extend(labels.cpu().tolist())
    avg_loss = total_loss / len(loader.dataset)
    acc = compute_accuracy(all_labels, all_preds)
    return avg_loss, acc


def evaluate(model, loader, criterion, device):
    model.eval()
    total_loss, all_preds, all_labels = 0.0, [], []
    with torch.no_grad():
        for imgs, labels in loader:
            imgs, labels = imgs.to(device, non_blocking=True), labels.to(device, non_blocking=True)
            with torch.autocast(device_type=device.type, dtype=torch.float16, enabled=device.type == 'cuda'):
                outputs = model(imgs)
                loss = criterion(outputs, labels)
            total_loss += loss.item() * len(imgs)
            preds = outputs.argmax(dim=1).cpu().tolist()
            all_preds.extend(preds)
            all_labels.extend(labels.cpu().tolist())
    avg_loss = total_loss / len(loader.dataset)
    acc = compute_accuracy(all_labels, all_preds)
    return avg_loss, acc, all_preds, all_labels


# ─── Main ─────────────────────────────────────────────────────────────────────

def main(args):
    torch.manual_seed(args.seed)
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    log.info(f"Device: {device}")

    if not os.path.isdir(args.data_dir):
        log.error(f"Data directory not found: {args.data_dir}")
        log.error("Run  python src/preprocessing/download_dataset.py  first.")
        sys.exit(1)

    # Check at least some images exist
    total_images = sum(
        len(files) for _, _, files in os.walk(args.data_dir)
        if any(f.lower().endswith(('.jpg', '.jpeg', '.png', '.bmp')) for f in _)
    )

    train_ds, val_ds, classes = load_datasets(args.data_dir, args.val_split, args.seed)
    log.info(f"Classes: {classes}")
    log.info(f"Train: {len(train_ds)} | Val: {len(val_ds)}")

    num_workers = min(os.cpu_count() or 4, 8)
    train_loader = DataLoader(train_ds, batch_size=args.batch_size, shuffle=True,  num_workers=num_workers, pin_memory=True, persistent_workers=(num_workers > 0))
    val_loader   = DataLoader(val_ds,   batch_size=args.batch_size, shuffle=False, num_workers=num_workers, pin_memory=True, persistent_workers=(num_workers > 0))

    model = build_model(num_classes=len(classes)).to(device)
    criterion = nn.CrossEntropyLoss(label_smoothing=0.1)
    optimizer = torch.optim.AdamW(model.parameters(), lr=args.lr, weight_decay=args.weight_decay)
    scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=args.epochs)
    scaler = torch.amp.GradScaler(device.type, enabled=device.type == 'cuda')

    os.makedirs(MODELS_DIR, exist_ok=True)
    best_val_acc = 0.0

    for epoch in range(1, args.epochs + 1):
        t_loss, t_acc = train_one_epoch(model, train_loader, criterion, optimizer, device, scaler)
        v_loss, v_acc, v_preds, v_labels = evaluate(model, val_loader, criterion, device)
        scheduler.step()

        log.info(
            f"Epoch {epoch:3d}/{args.epochs} | "
            f"Train loss={t_loss:.4f} acc={t_acc:.4f} | "
            f"Val   loss={v_loss:.4f} acc={v_acc:.4f}"
        )

        if v_acc > best_val_acc:
            best_val_acc = v_acc
            torch.save({
                "epoch": epoch,
                "model_state_dict": model.state_dict(),
                "classes": classes,
                "val_acc": v_acc,
            }, COLOUR_MODEL_PATH)
            log.info(f"  * Best model saved  (val_acc={v_acc:.4f})")

    log.info(f"\nTraining complete. Best val accuracy: {best_val_acc:.4f}")
    # Final report
    _, _, v_preds, v_labels = evaluate(model, val_loader, criterion, device)
    log.info("\n" + compute_classification_report(v_labels, v_preds, target_names=classes))


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Train iris colour classifier")
    parser.add_argument("--data_dir",    default=COLOUR_DIR)
    parser.add_argument("--epochs",      type=int,   default=NUM_EPOCHS)
    parser.add_argument("--batch_size",  type=int,   default=BATCH_SIZE)
    parser.add_argument("--lr",          type=float, default=LEARNING_RATE)
    parser.add_argument("--weight_decay",type=float, default=WEIGHT_DECAY)
    parser.add_argument("--val_split",   type=float, default=VAL_SPLIT)
    parser.add_argument("--seed",        type=int,   default=RANDOM_SEED)
    args = parser.parse_args()
    main(args)
