# Backward compatibility: Re-export from services.evaluation_service
from ..services.evaluation_service import EvaluationService

def evaluate_model_performance(y_true, y_pred_binary, anomaly_scores):
    return EvaluationService.evaluate(y_true, y_pred_binary, anomaly_scores)

__all__ = ["evaluate_model_performance", "EvaluationService"]
