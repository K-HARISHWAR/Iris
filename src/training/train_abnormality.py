"""
train_abnormality.py – Train EfficientNet-B0 for binary Normal/Abnormal classification.

Usage:
    python src/training/train_abnormality.py
    python src/training/train_abnormality.py --epochs 25 --batch_size 16
"""

import os
import sys
import argparse
import torch
import torch.nn as nn
from torch.utils.data import DataLoader, random_split
from torchvision import datasets, models

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

from src.utils.config import (
    ABNORMALITY_DIR, ABNORMALITY_MODEL_PATH, MODELS_DIR,
    ABNORMALITY_CLASSES, NUM_EPOCHS, BATCH_SIZE, LEARNING_RATE,
    WEIGHT_DECAY, VAL_SPLIT, RANDOM_SEED,
)
from src.utils.logger import get_logger
from src.utils.metrics import compute_accuracy, compute_classification_report
from src.training.augment import get_train_transforms, get_val_transforms

log = get_logger("train_abnormality")


# ─── Model ────────────────────────────────────────────────────────────────────

def build_model(num_classes: int = 2) -> nn.Module:
    model = models.efficientnet_b0(weights=models.EfficientNet_B0_Weights.IMAGENET1K_V1)
    in_features = model.classifier[1].in_features
    model.classifier = nn.Sequential(
        nn.Dropout(p=0.3, inplace=True),
        nn.Linear(in_features, num_classes),
    )
    return model


# ─── Dataset ──────────────────────────────────────────────────────────────────

def load_datasets(data_dir: str, val_split: float, seed: int):
    full_dataset = datasets.ImageFolder(root=data_dir, transform=get_train_transforms())
    n_val   = int(len(full_dataset) * val_split)
    n_train = len(full_dataset) - n_val
    generator = torch.Generator().manual_seed(seed)
    train_ds, val_ds = random_split(full_dataset, [n_train, n_val], generator=generator)
    val_ds.dataset = datasets.ImageFolder(root=data_dir, transform=get_val_transforms())
    return train_ds, val_ds, full_dataset.classes


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
        # Gradient clipping for stability
        scaler.unscale_(optimizer)
        torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)
        scaler.step(optimizer)
        scaler.update()
        
        total_loss += loss.item() * len(imgs)
        all_preds.extend(outputs.argmax(dim=1).cpu().tolist())
        all_labels.extend(labels.cpu().tolist())
    return total_loss / len(loader.dataset), compute_accuracy(all_labels, all_preds)


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
            all_preds.extend(outputs.argmax(dim=1).cpu().tolist())
            all_labels.extend(labels.cpu().tolist())
    return total_loss / len(loader.dataset), compute_accuracy(all_labels, all_preds), all_preds, all_labels


# ─── Main ─────────────────────────────────────────────────────────────────────

def main(args):
    torch.manual_seed(args.seed)
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    log.info(f"Device: {device}")

    if not os.path.isdir(args.data_dir):
        log.error(f"Data directory not found: {args.data_dir}")
        log.error("Run  python src/preprocessing/download_dataset.py  first.")
        sys.exit(1)

    train_ds, val_ds, classes = load_datasets(args.data_dir, args.val_split, args.seed)
    log.info(f"Classes: {classes}")
    log.info(f"Train: {len(train_ds)} | Val: {len(val_ds)}")

    # Compute class weights to handle imbalance
    all_targets = [full_t for full_t in train_ds.dataset.targets]
    counts = [all_targets.count(i) for i in range(len(classes))]
    total  = sum(counts)
    weights = torch.tensor([total / (len(classes) * c) for c in counts], dtype=torch.float).to(device)
    log.info(f"Class weights: {dict(zip(classes, weights.cpu().tolist()))}")

    num_workers = min(os.cpu_count() or 4, 8)
    train_loader = DataLoader(train_ds, batch_size=args.batch_size, shuffle=True,  num_workers=num_workers, pin_memory=True, persistent_workers=(num_workers > 0))
    val_loader   = DataLoader(val_ds,   batch_size=args.batch_size, shuffle=False, num_workers=num_workers, pin_memory=True, persistent_workers=(num_workers > 0))

    model     = build_model(num_classes=len(classes)).to(device)
    criterion = nn.CrossEntropyLoss(weight=weights, label_smoothing=0.05)
    optimizer = torch.optim.AdamW(model.parameters(), lr=args.lr, weight_decay=args.weight_decay)
    scheduler = torch.optim.lr_scheduler.ReduceLROnPlateau(optimizer, mode="max", patience=3, factor=0.5)
    scaler = torch.amp.GradScaler(device.type, enabled=device.type == 'cuda')

    os.makedirs(MODELS_DIR, exist_ok=True)
    best_val_acc = 0.0

    for epoch in range(1, args.epochs + 1):
        t_loss, t_acc = train_one_epoch(model, train_loader, criterion, optimizer, device, scaler)
        v_loss, v_acc, v_preds, v_labels = evaluate(model, val_loader, criterion, device)
        scheduler.step(v_acc)

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
            }, ABNORMALITY_MODEL_PATH)
            log.info(f"  * Best model saved  (val_acc={v_acc:.4f})")

    log.info(f"\nTraining complete. Best val accuracy: {best_val_acc:.4f}")
    _, _, v_preds, v_labels = evaluate(model, val_loader, criterion, device)
    log.info("\n" + compute_classification_report(v_labels, v_preds, target_names=classes))


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Train eye abnormality detector")
    parser.add_argument("--data_dir",    default=ABNORMALITY_DIR)
    parser.add_argument("--epochs",      type=int,   default=NUM_EPOCHS)
    parser.add_argument("--batch_size",  type=int,   default=BATCH_SIZE)
    parser.add_argument("--lr",          type=float, default=LEARNING_RATE)
    parser.add_argument("--weight_decay",type=float, default=WEIGHT_DECAY)
    parser.add_argument("--val_split",   type=float, default=VAL_SPLIT)
    parser.add_argument("--seed",        type=int,   default=RANDOM_SEED)
    args = parser.parse_args()
    main(args)
