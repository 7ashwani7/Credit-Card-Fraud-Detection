import numpy as np
import pandas as pd
from typing import Any, Dict, List, Tuple


def sanitize_value(val: Any) -> Any:
    """Recursively converts NumPy, NaN, and Infinity values into JSON-friendly Python types."""
    if val is None:
        return None
    if isinstance(val, (np.bool_, bool)):
        return bool(val)
    if isinstance(val, (np.integer, np.int64, np.int32)):
        return int(val)
    if isinstance(val, (np.floating, np.float64, np.float32, float)):
        if np.isnan(val) or np.isneginf(val) or np.isposinf(val):
            return 0.0
        return round(float(val), 4)
    if isinstance(val, np.ndarray):
        return [sanitize_value(v) for v in val.tolist()]
    if isinstance(val, dict):
        return {k: sanitize_value(v) for k, v in val.items()}
    if isinstance(val, (list, tuple)):
        return [sanitize_value(v) for v in val]
    return val


def compute_risk_level(risk_score: float, low_threshold: float = 30.0, high_threshold: float = 70.0) -> str:
    """
    Categorizes risk score into LOW, MEDIUM, or HIGH.
    Risk Score 0 - 30   -> LOW
    Risk Score 31 - 70  -> MEDIUM
    Risk Score 71 - 100 -> HIGH
    """
    if risk_score <= low_threshold:
        return "LOW"
    elif risk_score <= high_threshold:
        return "MEDIUM"
    else:
        return "HIGH"


def normalize_scores(raw_scores: np.ndarray, invert: bool = False) -> np.ndarray:
    """
    Normalizes an array of raw anomaly or decision scores to the [0.0, 1.0] range.
    If invert is True, lower original scores become higher anomaly scores.
    """
    scores = np.asarray(raw_scores, dtype=float)
    if invert:
        scores = -scores

    min_val = np.min(scores)
    max_val = np.max(scores)

    if max_val == min_val:
        return np.zeros_like(scores)

    normalized = (scores - min_val) / (max_val - min_val)
    return np.clip(normalized, 0.0, 1.0)
