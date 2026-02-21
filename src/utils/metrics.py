from sklearn.metrics import (
    accuracy_score,
    confusion_matrix,
    classification_report,
    roc_auc_score,
)
import numpy as np


def compute_accuracy(y_true, y_pred) -> float:
    """Return top-1 accuracy (0-1 scale)."""
    return accuracy_score(y_true, y_pred)


def compute_confusion_matrix(y_true, y_pred, labels=None):
    """Return confusion matrix as numpy array."""
    return confusion_matrix(y_true, y_pred, labels=labels)


def compute_classification_report(y_true, y_pred, target_names=None) -> str:
    """Return a formatted classification report string."""
    return classification_report(y_true, y_pred, target_names=target_names, zero_division=0)


def compute_auc(y_true, y_score, multi_class: str = "ovr") -> float:
    """
    AUC-ROC score.
    For binary classification pass y_score as 1-D probability of positive class.
    For multi-class pass y_score as (N, C) probability matrix.
    """
    try:
        if np.array(y_score).ndim == 1:
            return roc_auc_score(y_true, y_score)
        return roc_auc_score(y_true, y_score, multi_class=multi_class, average="macro")
    except ValueError:
        return float("nan")
