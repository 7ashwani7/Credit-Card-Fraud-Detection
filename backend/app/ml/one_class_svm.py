import time
from typing import Dict, Any, Tuple, Optional
import numpy as np
from sklearn.svm import OneClassSVM
from ..utils.helpers import compute_risk_level, normalize_scores


class OneClassSVMDetector:
    """
    One-Class Support Vector Machine Detector.
    Learns a decision boundary that encapsulates the region of normal transactions
    in high-dimensional kernel feature space, flagging outliers outside the boundary.
    """
    def __init__(
        self, 
        kernel: str = "rbf", 
        nu: float = 0.03, 
        gamma: str = "scale",
        max_train_samples: int = 25000,
        random_state: int = 42
    ):
        self.kernel = kernel
        self.nu = nu
        self.gamma = gamma
        self.max_train_samples = max_train_samples
        self.random_state = random_state
        self.model = OneClassSVM(
            kernel=self.kernel,
            nu=self.nu,
            gamma=self.gamma
        )
        self.execution_time_ms: float = 0.0
        self.training_time_sec: float = 0.0
        self.is_fitted: bool = False

    def fit(self, X_train: np.ndarray) -> "OneClassSVMDetector":
        """
        Trains One-Class SVM on training feature data.
        Subsamples to max_train_samples if needed to prevent O(N^2) memory issues on massive datasets.
        """
        start_time = time.time()
        
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
        Predicts normal vs suspicious using the fitted One-Class SVM boundary.
        Returns:
            raw_pred: 1 for Normal, -1 for Suspicious
            predictions: ['Normal', 'Suspicious', ...]
            anomaly_scores: normalized [0.0 to 1.0]
            risk_scores: [0 to 100]
            risk_levels: ['LOW', 'MEDIUM', 'HIGH']
        """
        if not self.is_fitted:
            raise ValueError("One-Class SVM must be fitted before predict.")

        raw_pred = self.model.predict(X)
        # decision_function: signed distance to hyperplane. Positive = inlier, negative = outlier.
        raw_scores = self.model.decision_function(X)
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
            "name": "One-Class SVM",
            "key": "one_class_svm",
            "category": "Boundary-based Support Vector",
            "description": "Fits a maximum-margin hyperplane in high-dimensional kernel feature space, capturing the density of legitimate transactions and flagging observations outside.",
            "parameters": {
                "kernel": self.kernel,
                "nu": self.nu,
                "gamma": self.gamma
            },
            "execution_time_ms": self.execution_time_ms,
            "training_time_sec": self.training_time_sec,
            "is_fitted": self.is_fitted
        }
