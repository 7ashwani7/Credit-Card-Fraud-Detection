from typing import Dict, Any, Optional, List
import numpy as np
from sklearn.metrics import (
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
    average_precision_score,
    confusion_matrix,
    accuracy_score
)
from ..utils.helpers import sanitize_value


class EvaluationService:
    """
    Evaluates anomaly detection models on test datasets:
    - If ground-truth labels exist, computes precision, recall, f1, ROC-AUC, PR-AUC, and confusion matrix.
    - If unlabeled, computes anomaly counts, anomaly percentage, and score distributions without generating fake metrics.
    """

    @staticmethod
    def evaluate(
        y_true: Optional[np.ndarray],
        y_pred_binary: np.ndarray,
        anomaly_scores: np.ndarray
    ) -> Dict[str, Any]:
        """
        Calculates authoritative evaluation metrics.
        y_pred_binary: 1 for Suspicious / Fraud, 0 for Normal.
        """
        total_samples = len(y_pred_binary)
        suspicious_count = int(np.sum(y_pred_binary == 1))
        normal_count = total_samples - suspicious_count
        anomaly_rate = round((suspicious_count / total_samples) * 100, 2) if total_samples > 0 else 0.0

        result: Dict[str, Any] = {
            "has_ground_truth": False,
            "total_samples": total_samples,
            "predicted_normal": normal_count,
            "predicted_suspicious": suspicious_count,
            "anomaly_percentage": anomaly_rate,
            "mean_anomaly_score": round(float(np.mean(anomaly_scores)), 4) if total_samples > 0 else 0.0,
            "score_distribution": {
                "min": round(float(np.min(anomaly_scores)), 4) if total_samples > 0 else 0.0,
                "max": round(float(np.max(anomaly_scores)), 4) if total_samples > 0 else 0.0,
                "median": round(float(np.median(anomaly_scores)), 4) if total_samples > 0 else 0.0,
                "std": round(float(np.std(anomaly_scores)), 4) if total_samples > 0 else 0.0,
            }
        }

        if y_true is None:
            return result

        unique_classes = np.unique(y_true)
        result["has_ground_truth"] = True
        actual_fraud = int(np.sum(y_true == 1))
        actual_normal = int(np.sum(y_true == 0))
        result["actual_fraud"] = actual_fraud
        result["actual_normal"] = actual_normal
        result["actual_fraud_percentage"] = round((actual_fraud / total_samples) * 100, 3) if total_samples > 0 else 0.0

        # Confusion Matrix [[TN, FP], [FN, TP]]
        cm = confusion_matrix(y_true, y_pred_binary, labels=[0, 1])
        tn, fp, fn, tp = int(cm[0, 0]), int(cm[0, 1]), int(cm[1, 0]), int(cm[1, 1])

        prec = float(precision_score(y_true, y_pred_binary, zero_division=0))
        rec = float(recall_score(y_true, y_pred_binary, zero_division=0))
        f1 = float(f1_score(y_true, y_pred_binary, zero_division=0))
        acc = float(accuracy_score(y_true, y_pred_binary))

        roc_auc = None
        pr_auc = None
        if len(unique_classes) > 1:
            try:
                roc_auc = round(float(roc_auc_score(y_true, anomaly_scores)), 4)
            except Exception:
                roc_auc = None

            try:
                pr_auc = round(float(average_precision_score(y_true, anomaly_scores)), 4)
            except Exception:
                pr_auc = None

        result.update({
            "confusion_matrix": {
                "true_positive": tp,
                "false_positive": fp,
                "true_negative": tn,
                "false_negative": fn,
                "matrix": [
                    {"actual": "Normal", "predicted_normal": tn, "predicted_fraud": fp},
                    {"actual": "Fraud", "predicted_normal": fn, "predicted_fraud": tp}
                ]
            },
            "metrics": {
                "precision": round(prec, 4),
                "recall": round(rec, 4),
                "f1_score": round(f1, 4),
                "accuracy": round(acc, 4),
                "roc_auc": roc_auc,
                "pr_auc": pr_auc
            },
            "notes": "Calculated on independent test split (20% holdout). PR-AUC and F1-Score reflect genuine fraud detection capability on imbalanced datasets."
        })

        return result

    @staticmethod
    def build_comparison_entry(model_info: Dict[str, Any], evaluation: Dict[str, Any], summary: Dict[str, Any]) -> Dict[str, Any]:
        """Constructs standardized model comparison entry."""
        has_labels = evaluation.get("has_ground_truth", False)
        metrics = evaluation.get("metrics", {})

        entry = {
            "key": model_info.get("key"),
            "name": model_info.get("name"),
            "category": model_info.get("category"),
            "training_time": model_info.get("training_time_sec", round(model_info.get("execution_time_ms", 0) / 1000.0, 2)),
            "execution_time_ms": model_info.get("execution_time_ms", 0.0),
            "anomalies_detected": summary.get("anomalies_detected", evaluation.get("predicted_suspicious", 0)),
            "anomaly_rate": summary.get("anomaly_rate", evaluation.get("anomaly_percentage", 0.0)),
            "has_ground_truth": has_labels
        }

        if has_labels:
            entry.update({
                "precision": metrics.get("precision"),
                "recall": metrics.get("recall"),
                "f1_score": metrics.get("f1_score"),
                "roc_auc": metrics.get("roc_auc"),
                "pr_auc": metrics.get("pr_auc"),
                "accuracy": metrics.get("accuracy")
            })
        else:
            entry.update({
                "precision": None,
                "recall": None,
                "f1_score": None,
                "roc_auc": None,
                "pr_auc": None,
                "accuracy": None
            })

        return sanitize_value(entry)
