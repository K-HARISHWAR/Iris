# 👁️ Indian Eye ML Model

A two-model pipeline for Indian eye image analysis:

| Model | Task | Architecture | Classes |
|---|---|---|---|
| **Colour** | Iris colour classification | EfficientNet-B0 | dark_brown, brown, light_brown, hazel |
| **Abnormality** | Eye health detection | EfficientNet-B0 | normal, abnormal |

---

## ⚡ Quick Start

### 1. Install dependencies
```bash
pip install -r requirements.txt
```

### 2. Set up Kaggle API key
Place your `kaggle.json` at:
- **Windows**: `C:\Users\<you>\.kaggle\kaggle.json`
- **Linux/Mac**: `~/.kaggle/kaggle.json`

Get it from: [kaggle.com](https://kaggle.com) → Account → API → Create New Token

### 3. Download & organise datasets
```bash
python src/preprocessing/download_dataset.py
```

### 4. Train models
```bash
# Iris colour (4-class)
python src/training/train_colour.py

# Abnormality detection (binary)
python src/training/train_abnormality.py
```

### 5. Run inference
```bash
python src/inference/pipeline.py --image path/to/eye.jpg
```

---

## 📁 Project Structure

```
ml_model/
├── data/
│   ├── raw/              ← Raw downloaded images
│   └── processed/
│       ├── colour/       ← dark_brown | brown | light_brown | hazel
│       └── abnormality/  ← normal | abnormal
├── models/
│   ├── colour_model.pth
│   └── abnormality_model.pth
├── src/
│   ├── preprocessing/    ← iris_crop, normalize, resize, download
│   ├── training/         ← augment, train_colour, train_abnormality
│   ├── inference/        ← predict_colour, predict_abnormality, pipeline
│   └── utils/            ← config, logger, metrics
└── requirements.txt
```

---

## 📊 Datasets

| Dataset | Source | Purpose |
|---|---|---|
| Eye Color Dataset | `kaggle: namratasri/eye-color-dataset` | Iris colour classification |
| Eye Diseases | `kaggle: gunavenkatdoddi/eye-diseases` | Normal vs Abnormal |

---

## 🧠 Model Details

- **Architecture**: EfficientNet-B0 (pretrained on ImageNet, fine-tuned)
- **Input size**: 224 × 224
- **Optimizer**: AdamW + Cosine LR / ReduceLROnPlateau
- **Augmentation**: Flip, Rotate, ColorJitter, RandomErasing

---

## ⚙️ Training Args
```
--epochs        Number of epochs (default: 20)
--batch_size    Batch size (default: 16)
--lr            Learning rate (default: 1e-4)
--val_split     Validation split fraction (default: 0.2)
```
