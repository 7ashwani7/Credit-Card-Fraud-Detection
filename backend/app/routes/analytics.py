import io
import os
import numpy as np
import pandas as pd
from fastapi import APIRouter, HTTPException, UploadFile, File
from typing import Dict, Any, List

from ..state import state
from ..services.dataset_service import DatasetService
from ..services.evaluation_service import EvaluationService
from ..utils.helpers import sanitize_value
from .dataset import _run_dataset_pipeline

router = APIRouter(tags=["Analytics & Statistics"])


@router.get("/statistics")
@router.get("/api/statistics")
def get_statistics() -> Dict[str, Any]:
    """Returns dynamic top-level statistics for the dashboard cards."""
    if state.clean_df is None:
        raise HTTPException(status_code=400, detail="No dataset loaded.")

    df = state.clean_df
    total = len(df)
    suspicious = int((df["Prediction"] == "Suspicious").sum()) if "Prediction" in df.columns else 0
    normal = total - suspicious
    fraud_pct = round((suspicious / total) * 100, 2) if total > 0 else 0.0

    amount_col = [c for c in df.columns if c.lower() == "amount"]
    if amount_col:
        avg_amount = round(float(df[amount_col[0]].mean()), 2)
        total_amount = round(float(df[amount_col[0]].sum()), 2)
        max_amount = round(float(df[amount_col[0]].max()), 2)
    else:
        avg_amount = 0.0
        total_amount = 0.0
        max_amount = 0.0

    # Risk counts
    risk_counts = df["Risk_Level"].value_counts().to_dict() if "Risk_Level" in df.columns else {}

    return sanitize_value({
        "total_transactions": total,
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
        "dataset_source": state.dataset_source,
        "is_demo": state.is_demo,
        "active_model": state.active_model_info.get("name", state.active_model_key),
        "dataset_metadata": state.dataset_metadata,
        "split_stats": state.split_stats,
        "cleaning_stats": state.cleaning_stats
    })


@router.get("/analytics")
@router.get("/api/analytics")
def get_analytics() -> Dict[str, Any]:
    """Generates comprehensive aggregated chart datasets for the analytics dashboard."""
    if state.clean_df is None:
        raise HTTPException(status_code=400, detail="No dataset loaded.")

    df = state.clean_df
    total = len(df)

    # 1. Normal vs Suspicious breakdown
    suspicious_count = int((df["Prediction"] == "Suspicious").sum()) if "Prediction" in df.columns else 0
    normal_count = total - suspicious_count
    tx_distribution = [
        {"name": "Normal", "value": normal_count, "color": "#10b981"},
        {"name": "Suspicious", "value": suspicious_count, "color": "#ef4444"}
    ]

    # 2. Amount Distribution Histogram (binned)
    amount_col = [c for c in df.columns if c.lower() == "amount"]
    amount_distribution = []
    if amount_col:
        col = amount_col[0]
        bins = [0, 50, 100, 250, 500, 1000, 50000]
        labels = ["< ₹50", "₹50-₹100", "₹100-₹250", "₹250-₹500", "₹500-₹1000", "₹1000+"]
        df_copy = df[[col, "Prediction"]].copy() if "Prediction" in df.columns else df[[col]].copy()
        if "Prediction" not in df_copy.columns:
            df_copy["Prediction"] = "Normal"
        df_copy["bracket"] = pd.cut(df_copy[col], bins=bins, labels=labels, right=False)

        for label in labels:
            sub = df_copy[df_copy["bracket"] == label]
            norm_sub = int((sub["Prediction"] == "Normal").sum())
            susp_sub = int((sub["Prediction"] == "Suspicious").sum())
            amount_distribution.append({
                "bracket": label,
                "Normal": norm_sub,
                "Suspicious": susp_sub,
                "Total": norm_sub + susp_sub
            })

    # 3. Ground Truth vs Prediction Comparison (if Class is available)
    has_target = state.is_labeled and state.target_column in df.columns
    ground_truth_distribution = []
    if has_target:
        target_col = state.target_column
        act_norm = int((df[target_col] == 0).sum())
        act_fraud = int((df[target_col] == 1).sum())
        ground_truth_distribution = [
            {"name": "Actual Normal", "count": act_norm, "color": "#06b6d4"},
            {"name": "Actual Fraud", "count": act_fraud, "color": "#f59e0b"}
        ]

    # 4. Anomaly Score Distribution (binned 0.0 - 1.0)
    score_bins = [0.0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0]
    score_labels = ["0.0-0.1", "0.1-0.2", "0.2-0.3", "0.3-0.4", "0.4-0.5", "0.5-0.6", "0.6-0.7", "0.7-0.8", "0.8-0.9", "0.9-1.0"]
    scores = df.get("Anomaly_Score", pd.Series(np.zeros(total)))
    score_cuts = pd.cut(scores, bins=score_bins, labels=score_labels, include_lowest=True)
    score_dist = []
    for label in score_labels:
        score_dist.append({
            "range": label,
            "count": int((score_cuts == label).sum())
        })

    # 5. Time-Series Trend Analysis (chunked into 12 chronological intervals)
    time_col = [c for c in df.columns if c.lower() == "time"]
    time_series = []
    if time_col:
        t_col = time_col[0]
        sorted_by_time = df.sort_values(by=t_col).reset_index(drop=True)
        chunks = 12
        chunk_size = max(1, total // chunks)
        for i in range(chunks):
            start_idx = i * chunk_size
            end_idx = min(total, (i + 1) * chunk_size) if i < chunks - 1 else total
            chunk = sorted_by_time.iloc[start_idx:end_idx]
            if not chunk.empty:
                t_label = f"T+{round(chunk[t_col].iloc[0] / 3600, 1)}h"
                time_series.append({
                    "interval": t_label,
                    "Total": len(chunk),
                    "Suspicious": int((chunk["Prediction"] == "Suspicious").sum()) if "Prediction" in chunk.columns else 0,
                    "Normal": int((chunk["Prediction"] == "Normal").sum()) if "Prediction" in chunk.columns else len(chunk),
                    "Avg_Risk": round(float(chunk["Risk_Score"].mean()), 1) if "Risk_Score" in chunk.columns else 0.0
                })

    # 6. Current active model evaluation metrics & confusion matrix
    active_cached = state.cached_model_results.get(state.active_model_key, {})
    evaluation = active_cached.get("evaluation", {})

    return sanitize_value({
        "transaction_distribution": tx_distribution,
        "amount_distribution": amount_distribution,
        "ground_truth_distribution": ground_truth_distribution,
        "anomaly_score_distribution": score_dist,
        "time_series": time_series,
        "evaluation": evaluation,
        "has_ground_truth": has_target,
        "active_model_name": state.active_model_info.get("name", state.active_model_key)
    })
