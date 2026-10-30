import os
from typing import Dict, Any, Optional
from fastapi import APIRouter, HTTPException, UploadFile, File
import pandas as pd

from ..state import state
from ..services.dataset_service import DatasetService
from ..services.preprocessing import DataPreprocessor
from ..services.training_service import TrainingService
from ..utils.helpers import sanitize_value

router = APIRouter(tags=["Dataset Pipeline"])


def _run_dataset_pipeline(df: pd.DataFrame, source_name: str, is_demo: bool = False) -> Dict[str, Any]:
    """
    Executes complete end-to-end dataset pipeline:
    1. Validation
    2. Data Cleaning (deduplication, median/mode imputation, preserving legitimate anomalies)
    3. Feature Selection & Target Separation
    4. Train/Test Split (80/20 stratified if labeled)
    5. StandardScaler fitted ONLY on training data (preventing data leakage)
    6. Initial Model Training (Isolation Forest)
    """
    # 1. Clean dataset
    clean_df, before_stats, after_stats, cleaning_summary = DatasetService.clean_dataset(df)

    # 2. Preprocess & Split & Scale
    preprocessor = DataPreprocessor(random_state=42)
    prep_res = preprocessor.split_and_scale(clean_df, test_size=0.2)

    # 3. Update state
    state.raw_df = df
    state.clean_df = clean_df
    state.cleaning_stats = {
        "before": before_stats,
        "after": after_stats,
        "summary": cleaning_summary
    }
    state.preprocessor = preprocessor
    state.scaler = preprocessor.scaler
    state.feature_columns = prep_res["feature_columns"]
    state.target_column = prep_res["target_column"]
    state.is_labeled = prep_res["is_labeled"]
    state.split_stats = prep_res["split_stats"]

    state.X_train_raw = prep_res["X_train_raw"]
    state.X_test_raw = prep_res["X_test_raw"]
    state.X_train_scaled = prep_res["X_train_scaled"]
    state.X_test_scaled = prep_res["X_test_scaled"]
    state.y_train = prep_res["y_train"]
    state.y_test = prep_res["y_test"]

    state.dataset_source = source_name
    state.is_demo = is_demo
    state.cached_model_results = {}
    
    # Reset model states
    for k in state.models_state:
        state.models_state[k]["status"] = "not_trained"
        state.models_state[k]["training_time"] = None
        state.models_state[k]["anomalies_detected"] = 0
        state.models_state[k]["error"] = None

    # 4. Train default Isolation Forest
    train_res = TrainingService.train_model("isolation_forest")

    return {
        "status": "success",
        "dataset_source": source_name,
        "is_demo": is_demo,
        "dataset_status": "Labeled Dataset" if state.is_labeled else "Unlabeled Dataset",
        "target_column": state.target_column,
        "features": state.feature_columns,
        "feature_count": len(state.feature_columns),
        "before_cleaning": before_stats,
        "after_cleaning": after_stats,
        "split_stats": state.split_stats,
        "initial_model": train_res
    }


@router.post("/dataset/upload")
@router.post("/api/dataset/upload")
@router.post("/api/upload")
async def upload_dataset(file: UploadFile = File(...)) -> Dict[str, Any]:
    """
    Accepts CSV upload, validates, cleans, separates features/target,
    performs train/test split, fits scaler ONLY on training data, and trains initial model.
    """
    if not file.filename.lower().endswith(".csv"):
        raise HTTPException(
            status_code=400, 
            detail="Invalid file format. Please upload a valid CSV (.csv) file."
        )

    try:
        contents = await file.read()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to read file: {str(e)}")

    try:
        raw_df, validation_report = DatasetService.validate_csv(contents, file.filename)
        state.dataset_metadata = validation_report
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    try:
        pipeline_res = _run_dataset_pipeline(raw_df, f"Uploaded: {file.filename}", is_demo=False)
        return sanitize_value({
            "message": f"Successfully processed '{file.filename}'",
            "validation": validation_report,
            "pipeline": pipeline_res,
            "rows": len(state.clean_df),
            "features": state.feature_columns,
            "has_target": state.is_labeled,
            "target_column": state.target_column,
            "anomalies_detected": pipeline_res["initial_model"]["summary"]["anomalies_detected"],
            "anomaly_rate": pipeline_res["initial_model"]["summary"]["anomaly_rate"]
        })
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Dataset processing failed: {str(e)}")


@router.post("/dataset/clean")
@router.post("/api/dataset/clean")
def clean_current_dataset() -> Dict[str, Any]:
    """
    Executes cleaning on currently loaded dataset:
    - Removes exact duplicate rows
    - Converts numeric types
    - Imputes missing numeric values with median
    - Imputes missing categorical values
    - Preserves rare/fraud transactions
    Returns before and after cleaning statistics.
    """
    if state.raw_df is None:
        raise HTTPException(status_code=400, detail="No dataset loaded to clean.")

    try:
        pipeline_res = _run_dataset_pipeline(state.raw_df, state.dataset_source, is_demo=state.is_demo)
        return sanitize_value({
            "status": "success",
            "message": "Dataset cleaned successfully.",
            "before_cleaning": pipeline_res["before_cleaning"],
            "after_cleaning": pipeline_res["after_cleaning"],
            "duplicates_removed": pipeline_res["before_cleaning"]["rows"] - pipeline_res["after_cleaning"]["rows"]
        })
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Data cleaning failed: {str(e)}")


@router.get("/dataset/statistics")
@router.get("/api/dataset/statistics")
def get_dataset_statistics() -> Dict[str, Any]:
    """Returns comprehensive dataset statistics, split metrics, and cleaning stats."""
    if state.clean_df is None:
        raise HTTPException(status_code=400, detail="No dataset loaded.")

    df = state.clean_df
    total = len(df)
    suspicious = int((df["Prediction"] == "Suspicious").sum()) if "Prediction" in df.columns else 0
    normal = total - suspicious
    fraud_pct = round((suspicious / total) * 100, 2) if total > 0 else 0.0

    amount_col = [c for c in df.columns if c.lower() == "amount"]
    avg_amount = round(float(df[amount_col[0]].mean()), 2) if amount_col else 0.0
    total_amount = round(float(df[amount_col[0]].sum()), 2) if amount_col else 0.0
    max_amount = round(float(df[amount_col[0]].max()), 2) if amount_col else 0.0

    risk_counts = df["Risk_Level"].value_counts().to_dict() if "Risk_Level" in df.columns else {}

    return sanitize_value({
        "status": "success",
        "dataset_source": state.dataset_source,
        "is_demo": state.is_demo,
        "dataset_status": "Labeled Dataset" if state.is_labeled else "Unlabeled Dataset",
        "has_target": state.is_labeled,
        "target_column": state.target_column,
        "total_transactions": total,
        "rows": total,
        "columns": len(df.columns),
        "features": state.feature_columns,
        "feature_count": len(state.feature_columns),
        "training_samples": state.split_stats.get("training_samples", 0),
        "testing_samples": state.split_stats.get("testing_samples", 0),
        "normal_transactions": normal,
        "suspicious_transactions": suspicious,
        "fraud_percentage": fraud_pct,
        "average_amount": avg_amount,
        "total_amount": total_amount,
        "max_amount": max_amount,
        "risk_breakdown": {
            "low": int(risk_counts.get("LOW", 0)),
            "medium": int(risk_counts.get("MEDIUM", 0)),
            "high": int(risk_counts.get("HIGH", 0)),
        },
        "cleaning_statistics": state.cleaning_stats,
        "split_statistics": state.split_stats,
        "active_model": state.active_model_info.get("name", state.active_model_key),
        "dataset_metadata": state.dataset_metadata
    })


@router.post("/dataset/reset-demo")
@router.post("/api/reset-demo")
def reset_demo_dataset():
    """Resets dataset to default creditcard.csv and runs complete training pipeline."""
    current_file = os.path.abspath(__file__)
    routes_dir = os.path.dirname(current_file)
    app_dir = os.path.dirname(routes_dir)
    backend_dir = os.path.dirname(app_dir)
    project_root = os.path.dirname(backend_dir)

    candidates = [
        os.path.join(project_root, "dataset", "creditcard.csv"),
        os.path.join(backend_dir, "dataset", "creditcard.csv"),
        os.path.join(project_root, "creditcard.csv"),
        os.path.join(backend_dir, "creditcard.csv")
    ]

    dataset_path = None
    for cand in candidates:
        if os.path.exists(cand):
            dataset_path = cand
            break

    if not dataset_path or not os.path.exists(dataset_path):
        raise HTTPException(status_code=404, detail="Demo dataset file not found on server.")

    try:
        df = pd.read_csv(dataset_path)
        pipeline_res = _run_dataset_pipeline(df, "Demo Dataset (Credit Card Transactions)", is_demo=True)
        return sanitize_value({
            "message": "Reset to Demo Dataset successfully",
            "rows": len(state.clean_df),
            "anomalies_detected": pipeline_res["initial_model"]["summary"]["anomalies_detected"],
            "pipeline": pipeline_res
        })
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to reset demo dataset: {str(e)}")
