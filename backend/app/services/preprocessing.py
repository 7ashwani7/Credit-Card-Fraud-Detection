import os
from typing import Dict, List, Optional, Tuple, Any
import numpy as np
import pandas as pd
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
import joblib


class DataPreprocessor:
    """
    Handles feature selection, target separation, train/test split,
    and data leakage-free scaling (fit scaler ONLY on training data).
    """
    def __init__(self, random_state: int = 42):
        self.scaler = StandardScaler()
        self.random_state = random_state
        self.feature_columns: List[str] = []
        self.scaled_columns: List[str] = []
        self.unscaled_columns: List[str] = []
        self.target_column: Optional[str] = None
        self.is_labeled: bool = False
        self.is_fitted: bool = False
        self.feature_means: Dict[str, float] = {}
        self.feature_stds: Dict[str, float] = {}

    def select_features(
        self, 
        df: pd.DataFrame, 
        custom_features: Optional[List[str]] = None
    ) -> Tuple[List[str], Optional[str]]:
        """
        Determines target and usable input features.
        Never includes target in feature set.
        Excludes ID columns.
        """
        # Detect target
        self.target_column = None
        for col in df.columns:
            if col.strip().lower() in ["class", "fraud", "is_fraud", "target", "label"]:
                self.target_column = col
                break
        
        self.is_labeled = self.target_column is not None

        if custom_features:
            # Validate custom features
            self.feature_columns = [
                c for c in custom_features 
                if c in df.columns and c != self.target_column
            ]
        else:
            # Auto-detect numeric columns excluding target and ID fields
            numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
            self.feature_columns = [
                c for c in numeric_cols 
                if c != self.target_column 
                and not c.lower().startswith("unnamed") 
                and c.lower() not in ["id", "transaction_id", "row_id", "index"]
            ]

        if not self.feature_columns:
            raise ValueError("No valid numeric feature columns found in dataset for anomaly detection.")

        return self.feature_columns, self.target_column

    def split_and_scale(
        self, 
        df: pd.DataFrame, 
        test_size: float = 0.2,
        custom_features: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Executes complete production preprocessing pipeline:
        1. Feature selection (excludes target)
        2. Separates X and y
        3. 80/20 Train/Test Split (stratified if labeled)
        4. Fits StandardScaler ONLY on training data (prevents data leakage)
        5. Transforms training and testing splits
        6. Computes baseline population statistics
        """
        self.select_features(df, custom_features=custom_features)

        X = df[self.feature_columns].copy()
        
        # Target extraction
        y = None
        if self.is_labeled:
            y = df[self.target_column].fillna(0).astype(int).values

        # Train / Test Split
        if self.is_labeled and y is not None:
            classes, counts = np.unique(y, return_counts=True)
            # Stratify only if multiple classes and min class has >= 2 samples
            can_stratify = len(classes) > 1 and np.min(counts) >= 2
            stratify_arg = y if can_stratify else None
            
            X_train, X_test, y_train, y_test = train_test_split(
                X, y, 
                test_size=test_size, 
                random_state=self.random_state, 
                stratify=stratify_arg
            )
            is_stratified = can_stratify
        else:
            X_train, X_test = train_test_split(
                X, 
                test_size=test_size, 
                random_state=self.random_state
            )
            y_train, y_test = None, None
            is_stratified = False

        # Determine which columns to scale
        # For credit card dataset: Scale Time & Amount; V1..V28 are PCA transformed
        # For generic datasets: scale continuous non-PCA numeric features
        self.scaled_columns = []
        self.unscaled_columns = []

        is_credit_card_pca = any(c.startswith("V") and c[1:].isdigit() for c in self.feature_columns)
        
        for col in self.feature_columns:
            if is_credit_card_pca:
                if col.lower() in ["time", "amount"]:
                    self.scaled_columns.append(col)
                else:
                    self.unscaled_columns.append(col)
            else:
                # General dataset: scale all numeric features
                self.scaled_columns.append(col)

        # FIT SCALER ONLY ON TRAINING DATA
        if self.scaled_columns:
            self.scaler.fit(X_train[self.scaled_columns])
            self.is_fitted = True
            
            # Transform Train
            X_train_scaled = X_train.copy()
            X_train_scaled[self.scaled_columns] = self.scaler.transform(X_train[self.scaled_columns])
            
            # Transform Test
            X_test_scaled = X_test.copy()
            X_test_scaled[self.scaled_columns] = self.scaler.transform(X_test[self.scaled_columns])
        else:
            X_train_scaled = X_train.copy()
            X_test_scaled = X_test.copy()
            self.is_fitted = True

        # Store baseline feature means and standard deviations from training data
        for col in self.feature_columns:
            vals = X_train[col].values.astype(float)
            mean_val = float(np.mean(vals))
            std_val = float(np.std(vals))
            self.feature_means[col] = mean_val
            self.feature_stds[col] = std_val if std_val > 1e-6 else 1.0

        # Calculate split stats
        normal_train = int(np.sum(y_train == 0)) if y_train is not None else len(X_train)
        fraud_train = int(np.sum(y_train == 1)) if y_train is not None else 0
        normal_test = int(np.sum(y_test == 0)) if y_test is not None else len(X_test)
        fraud_test = int(np.sum(y_test == 1)) if y_test is not None else 0

        split_stats = {
            "training_samples": len(X_train),
            "testing_samples": len(X_test),
            "normal_samples_train": normal_train,
            "fraud_samples_train": fraud_train,
            "normal_samples_test": normal_test,
            "fraud_samples_test": fraud_test,
            "total_normal": normal_train + normal_test,
            "total_fraud": fraud_train + fraud_test,
            "training_split": f"{int((1 - test_size) * 100)}%",
            "testing_split": f"{int(test_size * 100)}%",
            "is_stratified": bool(is_stratified),
            "random_state": self.random_state
        }

        return {
            "X_train_raw": X_train,
            "X_test_raw": X_test,
            "X_train_scaled": X_train_scaled.values.astype(float),
            "X_test_scaled": X_test_scaled.values.astype(float),
            "y_train": y_train,
            "y_test": y_test,
            "split_stats": split_stats,
            "feature_columns": self.feature_columns,
            "scaled_columns": self.scaled_columns,
            "unscaled_columns": self.unscaled_columns,
            "target_column": self.target_column,
            "is_labeled": self.is_labeled
        }

    def transform(self, df_or_array: Any) -> np.ndarray:
        """
        Transforms new / test / future transactions using the fitted training scaler.
        """
        if not self.is_fitted:
            raise ValueError("Preprocessor scaler has not been fitted yet.")

        if isinstance(df_or_array, pd.DataFrame):
            df_copy = df_or_array[self.feature_columns].copy()
            if self.scaled_columns:
                df_copy[self.scaled_columns] = self.scaler.transform(df_copy[self.scaled_columns])
            return df_copy.values.astype(float)
        else:
            # Array case: assuming it matches feature_columns ordering
            arr = np.array(df_or_array, dtype=float)
            if arr.ndim == 1:
                arr = arr.reshape(1, -1)
            if self.scaled_columns:
                # Find indices of scaled columns
                col_indices = [self.feature_columns.index(c) for c in self.scaled_columns]
                arr_scaled = arr.copy()
                arr_scaled[:, col_indices] = self.scaler.transform(arr[:, col_indices])
                return arr_scaled
            return arr

    def save_scaler(self, filepath: str):
        """Saves fitted scaler and column mappings to disk."""
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        bundle = {
            "scaler": self.scaler,
            "feature_columns": self.feature_columns,
            "scaled_columns": self.scaled_columns,
            "unscaled_columns": self.unscaled_columns,
            "target_column": self.target_column,
            "feature_means": self.feature_means,
            "feature_stds": self.feature_stds
        }
        joblib.dump(bundle, filepath)

    def load_scaler(self, filepath: str):
        """Loads fitted scaler from disk."""
        if not os.path.exists(filepath):
            raise FileNotFoundError(f"Scaler bundle not found at {filepath}")
        bundle = joblib.load(filepath)
        self.scaler = bundle["scaler"]
        self.feature_columns = bundle["feature_columns"]
        self.scaled_columns = bundle["scaled_columns"]
        self.unscaled_columns = bundle["unscaled_columns"]
        self.target_column = bundle["target_column"]
        self.feature_means = bundle["feature_means"]
        self.feature_stds = bundle["feature_stds"]
        self.is_fitted = True

    def get_feature_deviations(self, transaction_series: pd.Series, top_k: int = 5) -> List[Dict[str, Any]]:
        """
        Calculates top features contributing to anomaly score via z-score deviations against training set baseline.
        """
        deviations = []
        for col in self.feature_columns:
            if col in transaction_series:
                val = float(transaction_series[col])
                mean = self.feature_means.get(col, 0.0)
                std = self.feature_stds.get(col, 1.0)
                z_score = abs(val - mean) / std
                deviations.append({
                    "feature": col,
                    "value": round(val, 4),
                    "mean": round(mean, 4),
                    "z_score": round(z_score, 3),
                    "deviation_direction": "High" if val > mean else "Low"
                })

        deviations.sort(key=lambda x: x["z_score"], reverse=True)
        return deviations[:top_k]
