import time
from typing import Dict, Any, Tuple, Optional, Sequence
import numpy as np
from sklearn.neural_network import MLPRegressor
from ..utils.helpers import compute_risk_level, normalize_scores


class AutoencoderDetector:
    """
    Neural Autoencoder for Anomaly Detection.
    Pipeline:
      Input Features (D)
            ↓
         Encoder (D -> 32 -> 16)
            ↓
      Latent Bottleneck (latent_dim=8)
            ↓
         Decoder (8 -> 16 -> 32)
            ↓
      Reconstructed Features (D)

    Anomalies produce high Mean Squared Error (MSE) reconstruction loss.
    The anomaly threshold is dynamically learned from the training reconstruction errors.
    """
    def __init__(
        self, 
        contamination: float = 0.02, 
        epochs: int = 150,
        batch_size: int = 128,
        learning_rate: float = 0.001,
        hidden_layers: Optional[Sequence[int]] = None,
        latent_dim: int = 8,
        max_train_samples: int = 35000,
        random_state: int = 42
    ):
        self.contamination = contamination
        self.epochs = epochs
        self.batch_size = batch_size
        self.learning_rate = learning_rate
        self.latent_dim = latent_dim
        self.max_train_samples = max_train_samples
        self.random_state = random_state
        
        # Configure hidden layers for bottleneck architecture
        if hidden_layers is not None:
            self.hidden_layer_sizes = tuple(hidden_layers)
        else:
            # Symmetrical encoder-decoder bottleneck
            self.hidden_layer_sizes = (32, 16, self.latent_dim, 16, 32)
            
        self.model = MLPRegressor(
            hidden_layer_sizes=self.hidden_layer_sizes,
            activation="relu",
            solver="adam",
            learning_rate_init=self.learning_rate,
            batch_size=self.batch_size if self.batch_size > 0 else "auto",
            max_iter=self.epochs,
            random_state=self.random_state,
            early_stopping=True,
            validation_fraction=0.1,
            n_iter_no_change=10
        )
        self.threshold_: float = 0.0
        self.mean_train_mse_: float = 0.0
        self.std_train_mse_: float = 0.0
        self.execution_time_ms: float = 0.0
        self.training_time_sec: float = 0.0
        self.is_fitted: bool = False

    def fit(self, X_train: np.ndarray) -> "AutoencoderDetector":
        """
        Trains Autoencoder to reconstruct input X (X -> X).
        Learns anomaly threshold dynamically from training MSE distribution.
        """
        start_time = time.time()
        
        # If dataset is massive, train on representative subsample to ensure fast convergence
        if len(X_train) > self.max_train_samples:
            rng = np.random.default_rng(self.random_state)
            indices = rng.choice(len(X_train), size=self.max_train_samples, replace=False)
            X_fit = X_train[indices]
        else:
            X_fit = X_train

        self.model.fit(X_fit, X_fit)
        duration = time.time() - start_time
        self.execution_time_ms = round(duration * 1000, 2)
        self.training_time_sec = round(duration, 3)
        
        # Compute training reconstruction error to set dynamic threshold
        X_train_pred = self.model.predict(X_fit)
        mse_train = np.mean(np.square(X_fit - X_train_pred), axis=1)
        
        # Dynamic anomaly threshold from training data: (1 - contamination) * 100 percentile
        self.threshold_ = float(np.percentile(mse_train, (1.0 - self.contamination) * 100))
        self.mean_train_mse_ = float(np.mean(mse_train))
        self.std_train_mse_ = float(np.std(mse_train))
        self.is_fitted = True
        return self

    def predict(self, X: np.ndarray) -> Tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray, list]:
        """
        Calculates reconstruction MSE and predicts Normal vs Suspicious.
        Returns:
            raw_pred: 1 for Normal, -1 for Suspicious
            predictions: ['Normal', 'Suspicious', ...]
            anomaly_scores: normalized [0.0 to 1.0]
            risk_scores: [0 to 100]
            risk_levels: ['LOW', 'MEDIUM', 'HIGH']
        """
        if not self.is_fitted:
            raise ValueError("AutoencoderDetector must be fitted before predict.")

        X_pred = self.model.predict(X)
        mse_errors = np.mean(np.square(X - X_pred), axis=1)

        # raw_pred: 1 for Normal, -1 for Outlier
        raw_pred = np.where(mse_errors > self.threshold_, -1, 1)

        anomaly_scores = normalize_scores(mse_errors)
        risk_scores = np.round(anomaly_scores * 100, 1)

        predictions = np.where(raw_pred == -1, "Suspicious", "Normal")
        risk_levels = [compute_risk_level(r) for r in risk_scores]

        return raw_pred, predictions, anomaly_scores, risk_scores, risk_levels

    def fit_predict(self, X_train: np.ndarray, X_test: Optional[np.ndarray] = None) -> Tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray, list]:
        self.fit(X_train)
        target = X_test if X_test is not None else X_train
        return self.predict(target)

    def get_info(self) -> Dict[str, Any]:
        arch_str = " -> ".join(str(h) for h in self.hidden_layer_sizes)
        return {
            "name": "Neural Autoencoder",
            "key": "autoencoder",
            "category": "Deep Learning / Neural Compression",
            "description": "Compresses transactions through bottleneck hidden layers and reconstructs them. Anomalous patterns produce high Mean Squared Error (MSE) reconstruction loss.",
            "parameters": {
                "architecture": arch_str,
                "epochs": self.epochs,
                "batch_size": self.batch_size,
                "learning_rate": self.learning_rate,
                "latent_dim": self.latent_dim,
                "contamination": self.contamination,
                "threshold": round(self.threshold_, 6) if self.is_fitted else None
            },
            "execution_time_ms": self.execution_time_ms,
            "training_time_sec": self.training_time_sec,
            "is_fitted": self.is_fitted
        }
