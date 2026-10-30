from typing import Dict, Any, Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from ..state import state
from ..services.training_service import TrainingService
from ..services.prediction_service import PredictionService
from ..utils.helpers import sanitize_value

router = APIRouter(tags=["Models & Inference"])


class ModelRunRequest(BaseModel):
    model_key: str
    parameters: Optional[Dict[str, Any]] = None


class PredictRequest(BaseModel):
    transaction: Dict[str, Any] = Field(..., description="Transaction features e.g. Time, Amount, V1..V28")
    model_key: Optional[str] = Field(None, description="Model to use for inference")


AVAILABLE_MODELS = {
    "isolation_forest": {
        "name": "Isolation Forest",
        "key": "isolation_forest",
        "category": "Tree Ensemble",
        "description": "Isolates observations by randomly selecting a feature and split value. Anomalies isolate near tree roots with fewer splits.",
        "default_parameters": {
            "contamination": 0.02,
            "n_estimators": 100,
            "random_state": 42
        }
    },
    "lof": {
        "name": "Local Outlier Factor (LOF)",
        "key": "lof",
        "category": "Density-based Unsupervised",
        "description": "LOF flags transactions whose local neighborhood density differs significantly from neighboring clusters (novelty=True).",
        "default_parameters": {
            "n_neighbors": 20,
            "contamination": 0.02,
            "novelty": True
        }
    },
    "one_class_svm": {
        "name": "One-Class SVM",
        "key": "one_class_svm",
        "category": "Kernel Boundary Support Vector",
        "description": "Learns a decision boundary that encapsulates the region of normal transactions in high-dimensional kernel space.",
        "default_parameters": {
            "kernel": "rbf",
            "nu": 0.03,
            "gamma": "scale"
        }
    },
    "autoencoder": {
        "name": "Neural Autoencoder",
        "key": "autoencoder",
        "category": "Deep Learning / Reconstruction",
        "description": "Compresses transactions through encoder bottleneck hidden layers and reconstructs via decoder. Anomalous fraud patterns produce high MSE reconstruction error.",
        "default_parameters": {
            "contamination": 0.02,
            "epochs": 150,
            "batch_size": 128,
            "learning_rate": 0.001,
            "latent_dim": 8
        }
    }
}


@router.get("/models")
@router.get("/api/models")
def get_models() -> Dict[str, Any]:
    """Returns overview of all 4 models, their training status, metrics, and parameters."""
    models_list = []
    for k, v in AVAILABLE_MODELS.items():
        m_copy = dict(v)
        m_state = state.models_state.get(k, {})
        m_copy["is_active"] = (k == state.active_model_key)
        m_copy["status"] = m_state.get("status", "not_trained")
        m_copy["training_time"] = m_state.get("training_time")
        m_copy["anomalies_detected"] = m_state.get("anomalies_detected", 0)
        m_copy["anomaly_rate"] = m_state.get("anomaly_rate", 0.0)
        m_copy["last_trained"] = m_state.get("last_trained")
        m_copy["cached_results"] = state.cached_model_results.get(k)
        models_list.append(m_copy)

    return sanitize_value({
        "active_model": state.active_model_key,
        "models": models_list
    })


@router.get("/models/compare")
@router.get("/api/models/compare")
@router.post("/models/compare")
@router.post("/api/models/compare")
def compare_all_models() -> Dict[str, Any]:
    """
    Returns comparative evaluation metrics across all 4 anomaly detection models:
    Model, Training Time, Anomalies Detected, Anomaly Rate, Precision, Recall, F1, ROC-AUC, PR-AUC.
    """
    return sanitize_value(TrainingService.get_comparison())


@router.get("/models/{model_name}")
@router.get("/api/models/{model_name}")
def get_model_details(model_name: str) -> Dict[str, Any]:
    """Returns detailed status and performance metrics for a specific model."""
    norm_key = model_name.strip().lower().replace(" ", "_").replace("-", "_")
    if norm_key in ["local_outlier_factor", "localoutlierfactor"]:
        norm_key = "lof"
    elif norm_key in ["oneclasssvm", "ocsvm"]:
        norm_key = "one_class_svm"
    elif norm_key in ["neural_autoencoder", "auto_encoder"]:
        norm_key = "autoencoder"

    if norm_key not in AVAILABLE_MODELS:
        raise HTTPException(status_code=404, detail=f"Model '{model_name}' not found.")

    model_def = dict(AVAILABLE_MODELS[norm_key])
    model_def["status"] = state.models_state.get(norm_key, {}).get("status", "not_trained")
    model_def["cached_results"] = state.cached_model_results.get(norm_key)
    model_def["is_active"] = (norm_key == state.active_model_key)

    return sanitize_value(model_def)


@router.post("/predict")
@router.post("/api/predict")
def predict_transaction(req: PredictRequest) -> Dict[str, Any]:
    """
    Generates real-time anomaly detection inference for a given transaction:
    Prediction (Normal/Suspicious), Anomaly Score (0-1), Risk Score (0-100), Risk Level (LOW/MEDIUM/HIGH),
    and top contributing features.
    """
    try:
        result = PredictionService.predict_transaction(req.transaction, req.model_key)
        return sanitize_value({
            "status": "success",
            "prediction": result
        })
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")


@router.post("/models/run")
@router.post("/api/models/run")
def run_model(req: ModelRunRequest):
    """
    Executes or switches active model, re-predicts across clean_df,
    and returns evaluation results.
    """
    norm_key = req.model_key.strip().lower().replace(" ", "_")
    if norm_key in ["local_outlier_factor", "localoutlierfactor"]:
        norm_key = "lof"
    elif norm_key in ["oneclasssvm"]:
        norm_key = "one_class_svm"

    if norm_key not in state.models_state:
        raise HTTPException(status_code=400, detail=f"Unsupported model key: {req.model_key}")

    # If model is not yet trained, train it
    if norm_key not in state.trained_models:
        try:
            res = TrainingService.train_model(norm_key, req.parameters)
            return sanitize_value(res)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to train and run model: {str(e)}")

    # If already trained, apply to dataset and set active
    try:
        PredictionService.apply_model_to_dataset(norm_key)
        cached = state.cached_model_results.get(norm_key)
        if cached:
            return sanitize_value(cached)
        else:
            return sanitize_value({
                "status": "success",
                "active_model": norm_key,
                "model_info": state.models_state.get(norm_key)
            })
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to apply model: {str(e)}")
