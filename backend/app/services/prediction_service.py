from typing import Dict, Any, List, Optional
import numpy as np
import pandas as pd
from ..state import state
from ..utils.helpers import compute_risk_level, sanitize_value


class PredictionService:
    """
    Handles anomaly detection inference for individual transactions,
    batches of transactions, and updates to the active dataset state.
    """

    @staticmethod
    def predict_transaction(
        transaction_data: Dict[str, Any], 
        model_key: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Runs anomaly detection inference on an individual transaction.
        Calculates:
        - prediction (Normal / Suspicious)
        - anomaly_score (0.0 to 1.0)
        - risk_score (0 to 100)
        - risk_level (LOW, MEDIUM, HIGH)
        - top contributing features (z-score deviations against training set baseline)
        """
        key = model_key or state.active_model_key
        model = state.trained_models.get(key)
        if model is None:
            raise ValueError(f"Model '{key}' is not trained yet. Please train the model first.")

        if state.preprocessor is None or not state.preprocessor.is_fitted:
            raise ValueError("Preprocessor is not fitted. Please run the training pipeline first.")

        # Extract features according to trained feature_columns
        feature_cols = state.preprocessor.feature_columns
        row_dict = {}
        for col in feature_cols:
            if col in transaction_data:
                try:
                    row_dict[col] = float(transaction_data[col])
                except (ValueError, TypeError):
                    row_dict[col] = float(state.preprocessor.feature_means.get(col, 0.0))
            else:
                row_dict[col] = float(state.preprocessor.feature_means.get(col, 0.0))

        df_row = pd.DataFrame([row_dict])
        X_scaled = state.preprocessor.transform(df_row)

        raw_pred, predictions, anomaly_scores, risk_scores, risk_levels = model.predict(X_scaled)

        # Feature deviations
        top_deviations = state.preprocessor.get_feature_deviations(df_row.iloc[0], top_k=7)

        result = {
            "model_used": key,
            "prediction": str(predictions[0]),
            "is_anomaly": bool(raw_pred[0] == -1),
            "anomaly_score": float(anomaly_scores[0]),
            "risk_score": float(risk_scores[0]),
            "risk_level": str(risk_levels[0]),
            "top_contributing_features": top_deviations
        }

        return sanitize_value(result)

    @staticmethod
    def apply_model_to_dataset(model_key: str) -> Dict[str, Any]:
        """
        Runs predictions for the entire clean_df using the specified model
        and updates state.clean_df columns:
        - Prediction
        - Anomaly_Score
        - Risk_Score
        - Risk_Level
        """
        model = state.trained_models.get(model_key)
        if model is None:
            raise ValueError(f"Model '{model_key}' has not been trained yet.")

        if state.clean_df is None or state.preprocessor is None:
            raise ValueError("No active dataset loaded in memory.")

        # Scale full clean dataset features using fitted scaler
        X_scaled = state.preprocessor.transform(state.clean_df)

        raw_pred, predictions, anomaly_scores, risk_scores, risk_levels = model.predict(X_scaled)

        state.clean_df["Prediction"] = predictions
        state.clean_df["Anomaly_Score"] = anomaly_scores
        state.clean_df["Risk_Score"] = risk_scores
        state.clean_df["Risk_Level"] = risk_levels

        state.active_model_key = model_key
        state.active_model_info = model.get_info()

        y_pred_binary = np.where(raw_pred == -1, 1, 0)
        suspicious_count = int(np.sum(y_pred_binary == 1))
        normal_count = len(predictions) - suspicious_count
        anomaly_rate = round((suspicious_count / len(predictions)) * 100, 2) if len(predictions) > 0 else 0.0

        summary = {
            "active_model": model_key,
            "total_transactions": len(predictions),
            "anomalies_detected": suspicious_count,
            "normal_detected": normal_count,
            "anomaly_rate": anomaly_rate
        }

        return summary
