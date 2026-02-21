import os

# ─── Base Paths ────────────────────────────────────────────────────────────────
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

DATA_DIR        = os.path.join(BASE_DIR, "data")
RAW_DIR         = os.path.join(DATA_DIR, "raw")
RAW_NORMAL_DIR  = os.path.join(RAW_DIR,  "normal")
RAW_ABNORMAL_DIR= os.path.join(RAW_DIR,  "abnormal")

PROCESSED_DIR         = os.path.join(DATA_DIR, "processed")
COLOUR_DIR            = os.path.join(PROCESSED_DIR, "colour")
ABNORMALITY_DIR       = os.path.join(PROCESSED_DIR, "abnormality")

MODELS_DIR = os.path.join(BASE_DIR, "models")
COLOUR_MODEL_PATH      = os.path.join(MODELS_DIR, "colour_model.pth")
ABNORMALITY_MODEL_PATH = os.path.join(MODELS_DIR, "abnormality_model.pth")

LOGS_DIR = os.path.join(BASE_DIR, "logs")

# ─── Kaggle Dataset Identifiers ───────────────────────────────────────────────
# Iris images dataset (colour classification)
COLOUR_DATASET      = "ouaraskhelilrafik/iris-images"
# Eye diseases classification (normal/cataract/DR/glaucoma → normal/abnormal)
ABNORMALITY_DATASET = "gunavenkatdoddi/eye-diseases-classification"

# ─── Colour Classes ───────────────────────────────────────────────────────────
COLOUR_CLASSES = ["dark_brown", "brown", "light_brown", "hazel"]
COLOUR_CLASS_TO_IDX = {c: i for i, c in enumerate(COLOUR_CLASSES)}

# Raw folder name → our standard class name mapping (adjust after inspecting download)
COLOUR_FOLDER_MAP = {
    # namratasri/eye-color-dataset folder names → our class names
    "dark brown":  "dark_brown",
    "dark_brown":  "dark_brown",
    "brown":       "brown",
    "light brown": "light_brown",
    "light_brown": "light_brown",
    "hazel":       "hazel",
}

# ─── Abnormality Classes ──────────────────────────────────────────────────────
ABNORMALITY_CLASSES    = ["normal", "abnormal"]
ABNORMALITY_CLASS_TO_IDX = {c: i for i, c in enumerate(ABNORMALITY_CLASSES)}

# Raw disease folder names that map to "abnormal"
ABNORMAL_FOLDER_NAMES = {
    "cataract", "diabetic_retinopathy", "diabetic retinopathy",
    "glaucoma", "DR", "dr"
}
NORMAL_FOLDER_NAMES = {"normal", "Normal"}

# ─── Image Settings ───────────────────────────────────────────────────────────
IMAGE_SIZE   = 224          # EfficientNet-B0 default input
CHANNELS     = 3

# ─── Training Hyperparameters ─────────────────────────────────────────────────
BATCH_SIZE   = 16
NUM_EPOCHS   = 20
LEARNING_RATE = 1e-4
WEIGHT_DECAY  = 1e-5
VAL_SPLIT     = 0.2
RANDOM_SEED   = 42

# ─── ImageNet normalisation stats ─────────────────────────────────────────────
IMAGENET_MEAN = [0.485, 0.456, 0.406]
IMAGENET_STD  = [0.229, 0.224, 0.225]
