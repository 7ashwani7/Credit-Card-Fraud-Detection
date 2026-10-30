import time
from typing import Dict, Any, Tuple, Optional
import numpy as np
from sklearn.neighbors import LocalOutlierFactor
from ..utils.helpers import compute_risk_level, normalize_scores


class LocalOutlierFactorDetector:
    """
    Local Outlier Factor (LOF) Detector.
    Measures the local deviation of density of a given sample with respect to its neighbors.
    Configured with novelty=True so that it can be fitted on training data and predict on unseen/test transactions.
    """
    def __init__(
        self, 
        n_neighbors: int = 20, 
        contamination: float = 0.02,
        novelty: bool = True,
        max_train_samples: int = 25000,
        random_state: int = 42
    ):
        self.n_neighbors = n_neighbors
        self.contamination = contamination
        self.novelty = novelty
        self.max_train_samples = max_train_samples
        self.random_state = random_state
        self.model = LocalOutlierFactor(
            n_neighbors=self.n_neighbors,
            contamination=self.contamination,
            novelty=self.novelty,
            n_jobs=-1
        )
        self.execution_time_ms: float = 0.0
        self.training_time_sec: float = 0.0
        self.is_fitted: bool = False

    def fit(self, X_train: np.ndarray) -> "LocalOutlierFactorDetector":
        """Fits LOF on training feature data."""
        start_time = time.time()
        
        # Subsample for tree indexing if training set is extremely large to preserve low latency
        if len(X_train) > self.max_train_samples:
            rng = np.random.default_rng(self.random_state)
            indices = rng.choice(len(X_train), size=self.max_train_samples, replace=False)
            X_fit = X_train[indices]
        else:
            X_fit = X_train

        self.model.fit(X_fit)
        duration = time.time() - start_time
        self.execution_time_ms = round(duration * 1000, 2)
        self.training_time_sec = round(duration, 3)
        self.is_fitted = True
        return self

    def predict(self, X: np.ndarray) -> Tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray, list]:
        """
        Predicts whether samples are normal or suspicious using the fitted LOF model.
        Returns:
            raw_pred: 1 for Normal, -1 for Suspicious
            predictions: ['Normal', 'Suspicious', ...]
            anomaly_scores: normalized [0.0 to 1.0]
            risk_scores: [0 to 100]
            risk_levels: ['LOW', 'MEDIUM', 'HIGH']
        """
        if not self.is_fitted:
            raise ValueError("LOF detector must be fitted before predict.")

        raw_pred = self.model.predict(X)
        # score_samples returns opposite of outlier factor (more negative is more anomalous)
        raw_scores = self.model.score_samples(X)
        anomaly_scores = normalize_scores(-raw_scores)
        risk_scores = np.round(anomaly_scores * 100, 1)

        predictions = np.where(raw_pred == -1, "Suspicious", "Normal")
        risk_levels = [compute_risk_level(r) for r in risk_scores]

        return raw_pred, predictions, anomaly_scores, risk_scores, risk_levels

    def fit_predict(self, X_train: np.ndarray, X_test: Optional[np.ndarray] = None) -> Tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray, list]:
        self.fit(X_train)
        target = X_test if X_test is not None else X_train
        return self.predict(target)

    def get_info(self) -> Dict[str, Any]:
        return {
            "name": "Local Outlier Factor (LOF)",
            "key": "lof",
            "category": "Density-based Unsupervised",
            "description": "LOF flags transactions whose local neighborhood density differs significantly from surrounding reference clusters (novelty=True enabled for test and future inference).",
            "parameters": {
                "n_neighbors": self.n_neighbors,
                "contamination": self.contamination,
                "novelty": self.novelty
            },
            "execution_time_ms": self.execution_time_ms,
            "training_time_sec": self.training_time_sec,
            "is_fitted": self.is_fitted
        }
