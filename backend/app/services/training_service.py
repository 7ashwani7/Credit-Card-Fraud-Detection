import os
import json
import time
from datetime import datetime
from typing import Dict, Any, Optional, List
import numpy as np
import joblib

from ..state import state
from ..ml.isolation_forest import IsolationForestDetector
from ..ml.local_outlier_factor import LocalOutlierFactorDetector
from ..ml.one_class_svm import OneClassSVMDetector
from ..ml.autoencoder import AutoencoderDetector
from .evaluation_service import EvaluationService
from .prediction_service import PredictionService
from ..utils.helpers import sanitize_value


class TrainingService:
    """
    Orchestrates anomaly detection model training, evaluation on test split,
    model serialization to saved_models/, status tracking, and training history logs.
    """

    @staticmethod
    def _save_model_bundle(model_key: str, model_instance: Any, parameters: Dict[str, Any]):
        """Persists trained model and scaler to saved_models directory with metadata."""
        saved_dir = state.saved_models_dir
        os.makedirs(saved_dir, exist_ok=True)

        # 1. Save model with joblib
        model_filename = f"{model_key}.joblib"
        model_filepath = os.path.join(saved_dir, model_filename)
        joblib.dump(model_instance, model_filepath)

        # 2. Save scaler if fitted
        if state.preprocessor and state.preprocessor.is_fitted:
            scaler_path = os.path.join(saved_dir, "scaler.joblib")
            state.preprocessor.save_scaler(scaler_path)

        # 3. Save / Update metadata.json
        meta_filepath = os.path.join(saved_dir, "metadata.json")
        current_meta = {}
        if os.path.exists(meta_filepath):
            try:
                with open(meta_filepath, "r", encoding="utf-8") as f:
                    current_meta = json.load(f)
            except Exception:
                current_meta = {}

        current_meta["last_updated"] = datetime.now().isoformat()
        current_meta["dataset_source"] = state.dataset_source
        current_meta["features"] = state.feature_columns
        current_meta["target_column"] = state.target_column
        current_meta["train_samples"] = state.split_stats.get("training_samples", 0)
        current_meta["test_samples"] = state.split_stats.get("testing_samples", 0)

        if "models" not in current_meta:
            current_meta["models"] = {}

        current_meta["models"][model_key] = {
            "name": model_instance.get_info().get("name", model_key),
            "file": model_filename,
            "trained_at": datetime.now().isoformat(),
            "training_time_sec": model_instance.training_time_sec,
            "parameters": parameters
        }

        try:
            with open(meta_filepath, "w", encoding="utf-8") as f:
                json.dump(current_meta, f, indent=2)
        except Exception as e:
            print(f"[Warning] Failed to write metadata.json: {e}")

    @staticmethod
    def train_model(model_key: str, parameters: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Trains an individual anomaly detection model on X_train_scaled,
        evaluates on X_test_scaled, saves model, and records status.
        """
        key = model_key.lower().strip()
        if key not in state.models_state:
            raise ValueError(f"Unsupported model key: {model_key}")

        if state.X_train_scaled is None or state.X_test_scaled is None:
            raise ValueError("No train/test dataset available. Please upload or clean dataset first.")

        p = parameters or state.models_state[key]["parameters"]
        state.models_state[key]["status"] = "training"
        state.models_state[key]["error"] = None

        try:
            # 1. Instantiate detector
            if key == "isolation_forest":
                contamination = float(p.get("contamination", 0.02))
                n_estimators = int(p.get("n_estimators", 100))
                random_state = int(p.get("random_state", 42))
                detector = IsolationForestDetector(
                    contamination=contamination,
                    n_estimators=n_estimators,
                    random_state=random_state
                )
            elif key == "lof":
                n_neighbors = int(p.get("n_neighbors", 20))
                contamination = float(p.get("contamination", 0.02))
                detector = LocalOutlierFactorDetector(
                    n_neighbors=n_neighbors,
                    contamination=contamination,
                    novelty=True
                )
            elif key == "one_class_svm":
                kernel = str(p.get("kernel", "rbf"))
                nu = float(p.get("nu", 0.03))
                gamma = str(p.get("gamma", "scale"))
                detector = OneClassSVMDetector(
                    kernel=kernel,
                    nu=nu,
                    gamma=gamma
                )
            elif key == "autoencoder":
                contamination = float(p.get("contamination", 0.02))
                epochs = int(p.get("epochs", p.get("max_iter", 150)))
                batch_size = int(p.get("batch_size", 128))
                learning_rate = float(p.get("learning_rate", 0.001))
                latent_dim = int(p.get("latent_dim", 8))
                detector = AutoencoderDetector(
                    contamination=contamination,
                    epochs=epochs,
                    batch_size=batch_size,
                    learning_rate=learning_rate,
                    latent_dim=latent_dim
                )
            else:
                raise ValueError(f"Unknown model key: {key}")

            # 2. Fit detector ONLY on training features
            detector.fit(state.X_train_scaled)

            # 3. Evaluate model on test data
            raw_test_pred, test_preds, test_scores, _, _ = detector.predict(state.X_test_scaled)
            y_pred_binary_test = np.where(raw_test_pred == -1, 1, 0)
            evaluation = EvaluationService.evaluate(state.y_test, y_pred_binary_test, test_scores)

            # 4. Predict on full dataset for overview & table
            if state.clean_df is not None:
                X_full_scaled = state.preprocessor.transform(state.clean_df)
                raw_full, full_preds, full_scores, full_risk_scores, full_risk_levels = detector.predict(X_full_scaled)
                full_binary = np.where(raw_full == -1, 1, 0)
                anomalies_detected = int(np.sum(full_binary == 1))
                normal_detected = len(full_preds) - anomalies_detected
                anomaly_rate = round((anomalies_detected / len(full_preds)) * 100, 2) if len(full_preds) > 0 else 0.0
            else:
                anomalies_detected = evaluation["predicted_suspicious"]
                normal_detected = evaluation["predicted_normal"]
                anomaly_rate = evaluation["anomaly_percentage"]

            model_info = detector.get_info()

            # 5. Save model to state and disk
            state.trained_models[key] = detector
            TrainingService._save_model_bundle(key, detector, p)

            # 6. Update state models_state
            training_time = detector.training_time_sec
            state.models_state[key].update({
                "status": "trained",
                "training_time": training_time,
                "anomalies_detected": anomalies_detected,
                "anomaly_rate": anomaly_rate,
                "last_trained": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                "parameters": p,
                "error": None
            })

            model_result = {
                "model_info": model_info,
                "evaluation": evaluation,
                "summary": {
                    "total_transactions": len(state.clean_df) if state.clean_df is not None else len(state.X_test_scaled),
                    "anomalies_detected": anomalies_detected,
                    "normal_detected": normal_detected,
                    "anomaly_rate": anomaly_rate,
                    "execution_time_ms": detector.execution_time_ms,
                    "training_time_sec": training_time
                }
            }
            state.cached_model_results[key] = model_result

            # 7. Set as active model and update clean_df
            if state.clean_df is not None:
                state.clean_df["Prediction"] = full_preds
                state.clean_df["Anomaly_Score"] = full_scores
                state.clean_df["Risk_Score"] = full_risk_scores
                state.clean_df["Risk_Level"] = full_risk_levels
                state.active_model_key = key
                state.active_model_info = model_info

            # 8. Record in training history
            history_record = {
                "training_date": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                "dataset": state.dataset_source,
                "rows": len(state.clean_df) if state.clean_df is not None else 0,
                "features": len(state.feature_columns),
                "model": model_info.get("name", key),
                "model_key": key,
                "training_time": f"{training_time}s",
                "training_time_sec": training_time,
                "parameters": p,
                "status": "Completed",
                "anomalies_detected": anomalies_detected,
                "anomaly_rate": f"{anomaly_rate}%",
                "f1_score": evaluation.get("metrics", {}).get("f1_score")
            }
            state.training_history.insert(0, history_record)

            return sanitize_value(model_result)

        except Exception as e:
            state.models_state[key]["status"] = "failed"
            state.models_state[key]["error"] = str(e)
            # Record failed run in history
            state.training_history.insert(0, {
                "training_date": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                "dataset": state.dataset_source,
                "rows": len(state.clean_df) if state.clean_df is not None else 0,
                "features": len(state.feature_columns),
                "model": state.models_state[key]["name"],
                "model_key": key,
                "training_time": "0s",
                "training_time_sec": 0.0,
                "parameters": p,
                "status": "Failed",
                "error": str(e)
            })
            raise RuntimeError(f"Training failed for model '{key}': {str(e)}")

    @staticmethod
    def train_all(parameters_dict: Optional[Dict[str, Dict[str, Any]]] = None) -> Dict[str, Any]:
        """
        Trains all 4 anomaly detection algorithms sequentially:
        1. Isolation Forest
        2. Local Outlier Factor
        3. One-Class SVM
        4. Neural Autoencoder
        
        Returns exact response structure conforming to requirement 16:
        {
            "status": "success",
            "dataset": {
                "rows": ...,
                "features": ...,
                "training_samples": ...,
                "testing_samples": ...
            },
            "models": {
                "isolation_forest": { "status": "trained", "training_time": ... },
                "lof": { "status": "trained", "training_time": ... },
                "one_class_svm": { "status": "trained", "training_time": ... },
                "autoencoder": { "status": "trained", "training_time": ... }
            }
        }
        """
        p_dict = parameters_dict or {}
        keys = ["isolation_forest", "lof", "one_class_svm", "autoencoder"]
        models_response: Dict[str, Any] = {}

        for k in keys:
            params = p_dict.get(k)
            try:
                res = TrainingService.train_model(k, params)
                models_response[k] = {
                    "status": "trained",
                    "training_time": res["model_info"].get("training_time_sec", 0.0),
                    "anomalies_detected": res["summary"]["anomalies_detected"],
                    "anomaly_rate": res["summary"]["anomaly_rate"]
                }
            except Exception as e:
                models_response[k] = {
                    "status": "failed",
                    "error": str(e)
                }

        # Keep isolation_forest as default active model if trained successfully
        if "isolation_forest" in state.trained_models and state.clean_df is not None:
            PredictionService.apply_model_to_dataset("isolation_forest")

        rows_count = len(state.clean_df) if state.clean_df is not None else 0
        features_count = len(state.feature_columns)
        train_samples = state.split_stats.get("training_samples", 0)
        test_samples = state.split_stats.get("testing_samples", 0)

        response = {
            "status": "success",
            "dataset": {
                "rows": rows_count,
                "features": features_count,
                "training_samples": train_samples,
                "testing_samples": test_samples,
                "target_column": state.target_column,
                "is_labeled": state.is_labeled
            },
            "models": models_response
        }

        return sanitize_value(response)

    @staticmethod
    def get_training_status() -> Dict[str, Any]:
        """Returns current status and training times of all models."""
        return {
            "models": sanitize_value(state.models_state),
            "active_model": state.active_model_key,
            "dataset": {
                "rows": len(state.clean_df) if state.clean_df is not None else 0,
                "features": len(state.feature_columns),
                "is_labeled": state.is_labeled,
                "target_column": state.target_column,
                "split_stats": state.split_stats
            }
        }

    @staticmethod
    def get_comparison() -> Dict[str, Any]:
        """Generates dynamic model comparison across all 4 algorithms."""
        comparison_list = []
        for key in ["isolation_forest", "lof", "one_class_svm", "autoencoder"]:
            cached = state.cached_model_results.get(key)
            if cached:
                entry = EvaluationService.build_comparison_entry(
                    cached["model_info"],
                    cached["evaluation"],
                    cached["summary"]
                )
                comparison_list.append(entry)
            else:
                m_state = state.models_state.get(key, {})
                comparison_list.append({
                    "key": key,
                    "name": m_state.get("name", key),
                    "status": m_state.get("status", "not_trained"),
                    "training_time": m_state.get("training_time"),
                    "anomalies_detected": m_state.get("anomalies_detected", 0),
                    "anomaly_rate": m_state.get("anomaly_rate", 0.0),
                    "has_ground_truth": state.is_labeled
                })

        return {
            "has_ground_truth": state.is_labeled,
            "comparison": sanitize_value(comparison_list)
        }
