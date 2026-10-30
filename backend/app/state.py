import os
from typing import Dict, Any, Optional, List
import pandas as pd
import numpy as np

class AppState:
    def __init__(self):
        # Raw and Clean DataFrames
        self.raw_df: Optional[pd.DataFrame] = None
        self.clean_df: Optional[pd.DataFrame] = None
        
        # Cleaning Diagnostics
        self.cleaning_stats: Dict[str, Any] = {
            "before": {},
            "after": {},
            "duplicates_removed": 0,
            "missing_imputed": {}
        }
        
        # Split and Scaled Datasets (fit scaler ONLY on training data to prevent data leakage)
        self.X_train_raw: Optional[pd.DataFrame] = None
        self.X_test_raw: Optional[pd.DataFrame] = None
        self.X_train_scaled: Optional[np.ndarray] = None
        self.X_test_scaled: Optional[np.ndarray] = None
        self.y_train: Optional[np.ndarray] = None
        self.y_test: Optional[np.ndarray] = None
        self.y_target: Optional[np.ndarray] = None
        
        # Preprocessing artifacts
        self.preprocessor: Any = None
        self.scaler: Any = None
        self.feature_columns: List[str] = []
        self.target_column: Optional[str] = None
        self.is_labeled: bool = False
        
        # Split configuration and statistics
        self.train_split_ratio: float = 0.8
        self.test_split_ratio: float = 0.2
        self.random_state: int = 42
        self.split_stats: Dict[str, Any] = {
            "training_samples": 0,
            "testing_samples": 0,
            "normal_samples_train": 0,
            "fraud_samples_train": 0,
            "normal_samples_test": 0,
            "fraud_samples_test": 0,
            "total_normal": 0,
            "total_fraud": 0,
            "is_stratified": False
        }
        
        # Anomaly Detection Models state
        self.active_model_key: str = "isolation_forest"
        self.active_model_info: Dict[str, Any] = {}
        self.cached_model_results: Dict[str, Any] = {}
        
        # Individual model instances and statuses
        # Status options: "not_trained", "training", "trained", "failed"
        self.models_state: Dict[str, Dict[str, Any]] = {
            "isolation_forest": {
                "name": "Isolation Forest",
                "key": "isolation_forest",
                "status": "not_trained",
                "training_time": None,
                "anomalies_detected": 0,
                "anomaly_rate": 0.0,
                "last_trained": None,
                "error": None,
                "parameters": {
                    "n_estimators": 100,
                    "contamination": 0.02,
                    "random_state": 42
                }
            },
            "lof": {
                "name": "Local Outlier Factor (LOF)",
                "key": "lof",
                "status": "not_trained",
                "training_time": None,
                "anomalies_detected": 0,
                "anomaly_rate": 0.0,
                "last_trained": None,
                "error": None,
                "parameters": {
                    "n_neighbors": 20,
                    "contamination": 0.02,
                    "novelty": True
                }
            },
            "one_class_svm": {
                "name": "One-Class SVM",
                "key": "one_class_svm",
                "status": "not_trained",
                "training_time": None,
                "anomalies_detected": 0,
                "anomaly_rate": 0.0,
                "last_trained": None,
                "error": None,
                "parameters": {
                    "kernel": "rbf",
                    "nu": 0.03,
                    "gamma": "scale"
                }
            },
            "autoencoder": {
                "name": "Neural Autoencoder",
                "key": "autoencoder",
                "status": "not_trained",
                "training_time": None,
                "anomalies_detected": 0,
                "anomaly_rate": 0.0,
                "last_trained": None,
                "error": None,
                "parameters": {
                    "epochs": 150,
                    "batch_size": 128,
                    "learning_rate": 0.001,
                    "latent_dim": 8,
                    "contamination": 0.02
                }
            }
        }
        
        # Instantiated model objects in memory
        self.trained_models: Dict[str, Any] = {}
        
        # Training History
        self.training_history: List[Dict[str, Any]] = []
        
        # Dataset metadata and source
        self.dataset_metadata: Dict[str, Any] = {}
        self.dataset_source: str = "Demo Dataset (Credit Card Transactions)"
        self.is_demo: bool = True
        
        # Saved models directory
        backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        self.saved_models_dir: str = os.path.join(backend_dir, "saved_models")
        os.makedirs(self.saved_models_dir, exist_ok=True)
        
        # Risk score thresholds (0-30: LOW, 31-70: MEDIUM, 71-100: HIGH)
        self.risk_threshold_low: float = 30.0
        self.risk_threshold_high: float = 70.0

state = AppState()
