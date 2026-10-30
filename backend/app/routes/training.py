from typing import Dict, Any, Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from ..state import state
from ..services.training_service import TrainingService
from ..utils.helpers import sanitize_value

router = APIRouter(tags=["Model Training"])


class TrainModelRequest(BaseModel):
    model_name: Optional[str] = Field(None, description="Name or key of model to train")
    model_key: Optional[str] = Field(None, description="Alternative model key")
    parameters: Optional[Dict[str, Any]] = None


class TrainAllRequest(BaseModel):
    parameters: Optional[Dict[str, Dict[str, Any]]] = None


@router.post("/train")
@router.post("/api/train")
def train_single_model(req: TrainModelRequest) -> Dict[str, Any]:
    """
    Trains a selected anomaly detection model on the training feature data (80% split),
    evaluates against the independent test set (20% holdout), saves model, and updates predictions.
    """
    target_key = req.model_name or req.model_key
    if not target_key:
        raise HTTPException(
            status_code=400, 
            detail="Missing model identifier. Please provide 'model_name' or 'model_key'."
        )

    # Normalize key (e.g. "Isolation Forest" -> "isolation_forest")
    norm_key = target_key.strip().lower().replace(" ", "_").replace("-", "_")
    if norm_key in ["local_outlier_factor", "localoutlierfactor"]:
        norm_key = "lof"
    elif norm_key in ["oneclasssvm", "ocsvm", "svm"]:
        norm_key = "one_class_svm"
    elif norm_key in ["neural_autoencoder", "auto_encoder"]:
        norm_key = "autoencoder"

    if norm_key not in state.models_state:
        valid_keys = list(state.models_state.keys())
        raise HTTPException(
            status_code=400, 
            detail=f"Unsupported model '{target_key}'. Supported models: {', '.join(valid_keys)}"
        )

    try:
        result = TrainingService.train_model(norm_key, req.parameters)
        return sanitize_value({
            "status": "success",
            "message": f"Successfully trained {state.models_state[norm_key]['name']}",
            "result": result
        })
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Training error: {str(e)}")


@router.post("/train/all")
@router.post("/api/train/all")
def train_all_models(req: Optional[TrainAllRequest] = None) -> Dict[str, Any]:
    """
    Trains all 4 anomaly detection models:
    1. Isolation Forest
    2. Local Outlier Factor (LOF)
    3. One-Class SVM
    4. Neural Autoencoder
    
    Returns dynamically computed training times and statuses.
    """
    if state.X_train_scaled is None:
        raise HTTPException(
            status_code=400, 
            detail="No training dataset available. Please upload a dataset or load demo data first."
        )

    params_dict = req.parameters if req else None
    try:
        response = TrainingService.train_all(params_dict)
        return sanitize_value(response)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Batch training failed: {str(e)}")


@router.get("/training/status")
@router.get("/api/training/status")
def get_training_status() -> Dict[str, Any]:
    """Returns real-time status, training duration, and anomaly rates of all 4 models."""
    return sanitize_value(TrainingService.get_training_status())


@router.get("/training/history")
@router.get("/api/training/history")
def get_training_history() -> Dict[str, Any]:
    """Returns training run history with dates, datasets, parameters, and evaluation summaries."""
    return sanitize_value({
        "status": "success",
        "history": state.training_history
    })
