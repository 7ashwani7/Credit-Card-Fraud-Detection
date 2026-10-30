import time
from typing import Dict, Any, Tuple, Optional
import numpy as np
from sklearn.ensemble import IsolationForest
from ..utils.helpers import compute_risk_level, normalize_scores


class IsolationForestDetector:
    """
    Isolation Forest Anomaly Detector.
    Isolates observations by randomly selecting a feature and split value.
    Anomalies are isolated close to the root of the trees.
    """
    def __init__(
        self, 
        contamination: float = 0.02, 
        n_estimators: int = 100, 
        random_state: int = 42
    ):
        self.contamination = contamination
        self.n_estimators = n_estimators
        self.random_state = random_state
        self.model = IsolationForest(
            contamination=self.contamination,
            n_estimators=self.n_estimators,
            random_state=self.random_state,
            n_jobs=-1
        )
        self.execution_time_ms: float = 0.0
        self.training_time_sec: float = 0.0
        self.is_fitted: bool = False

    def fit(self, X_train: np.ndarray) -> "IsolationForestDetector":
        """Fits Isolation Forest on training feature data."""
        start_time = time.time()
        self.model.fit(X_train)
        duration = time.time() - start_time
        self.execution_time_ms = round(duration * 1000, 2)
        self.training_time_sec = round(duration, 3)
        self.is_fitted = True
        return self

    def predict(self, X: np.ndarray) -> Tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray, list]:
        """
        Generates predictions and anomaly scores for input data.
        Returns:
            raw_pred: 1 for Normal, -1 for Suspicious
            predictions: ['Normal', 'Suspicious', ...]
            anomaly_scores: normalized [0.0 to 1.0]
            risk_scores: [0 to 100]
            risk_levels: ['LOW', 'MEDIUM', 'HIGH']
        """
        if not self.is_fitted:
            raise ValueError("IsolationForest model must be fitted before predict.")

        raw_pred = self.model.predict(X)
        # score_samples returns opposite of anomaly score (lower is more anomalous)
        raw_scores = self.model.score_samples(X)
        # Higher score = more anomalous
        anomaly_scores = normalize_scores(-raw_scores)
        risk_scores = np.round(anomaly_scores * 100, 1)

        predictions = np.where(raw_pred == -1, "Suspicious", "Normal")
        risk_levels = [compute_risk_level(r) for r in risk_scores]

        return raw_pred, predictions, anomaly_scores, risk_scores, risk_levels

    def fit_predict(self, X_train: np.ndarray, X_test: Optional[np.ndarray] = None) -> Tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray, list]:
        """Fits on training data and predicts on X_test if provided, otherwise on X_train."""
        self.fit(X_train)
        target = X_test if X_test is not None else X_train
        return self.predict(target)

    def get_info(self) -> Dict[str, Any]:
        return {
            "name": "Isolation Forest",
            "key": "isolation_forest",
            "category": "Tree-based Ensemble",
            "description": "Isolates anomalies by recursively selecting features and split values. Anomalies require fewer splits to isolate in random trees.",
            "parameters": {
                "contamination": self.contamination,
                "n_estimators": self.n_estimators,
                "random_state": self.random_state
            },
            "execution_time_ms": self.execution_time_ms,
            "training_time_sec": self.training_time_sec,
            "is_fitted": self.is_fitted
        }
