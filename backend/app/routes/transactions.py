from fastapi import APIRouter, HTTPException, Query
from typing import Optional, List, Dict, Any
import numpy as np
import pandas as pd
from ..state import state
from ..utils.helpers import sanitize_value

router = APIRouter(prefix="/api/transactions", tags=["Transactions"])


@router.get("")
def get_transactions(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None),
    risk_level: Optional[str] = Query("ALL"),
    prediction: Optional[str] = Query("ALL"),
    sort_by: Optional[str] = Query("risk_score"),
    sort_order: Optional[str] = Query("desc")
) -> Dict[str, Any]:
    """
    Returns paginated, searchable, filterable, and sortable transactions.
    """
    if state.clean_df is None:
        raise HTTPException(status_code=400, detail="No dataset loaded. Please upload a dataset or load demo data.")

    df = state.clean_df.copy()

    # Search filter by Transaction ID or Amount
    if search:
        search_str = search.strip().lower()
        id_match = df["Transaction_ID"].astype(str).str.lower().str.contains(search_str)
        amount_col = [c for c in df.columns if c.lower() == "amount"]
        if amount_col:
            amount_match = df[amount_col[0]].astype(str).str.contains(search_str)
            df = df[id_match | amount_match]
        else:
            df = df[id_match]

    # Filter by Risk Level
    if risk_level and risk_level.upper() != "ALL":
        if "Risk_Level" in df.columns:
            df = df[df["Risk_Level"].str.upper() == risk_level.upper()]

    # Filter by Prediction (Normal / Suspicious)
    if prediction and prediction.upper() != "ALL":
        if "Prediction" in df.columns:
            df = df[df["Prediction"].str.lower() == prediction.lower()]

    # Sorting
    sort_column_map = {
        "transaction_id": "Transaction_ID",
        "amount": "Amount",
        "time": "Time",
        "anomaly_score": "Anomaly_Score",
        "risk_score": "Risk_Score",
        "prediction": "Prediction",
        "risk_level": "Risk_Level"
    }
    
    target_sort_col = sort_column_map.get(sort_by.lower(), "Risk_Score")
    if target_sort_col in df.columns:
        ascending = (sort_order.lower() == "asc")
        df = df.sort_values(by=target_sort_col, ascending=ascending)

    total_records = len(df)
    total_pages = max(1, (total_records + page_size - 1) // page_size)
    offset = (page - 1) * page_size
    page_df = df.iloc[offset : offset + page_size]

    items = []
    has_target = bool(state.is_labeled and state.target_column and state.target_column in df.columns)

    for _, row in page_df.iterrows():
        amount_col = [c for c in df.columns if c.lower() == "amount"]
        time_col = [c for c in df.columns if c.lower() == "time"]
        
        amount_val = float(row[amount_col[0]]) if amount_col else 0.0
        time_val = float(row[time_col[0]]) if time_col else 0.0

        item = {
            "transaction_id": str(row["Transaction_ID"]),
            "time": time_val,
            "amount": amount_val,
            "prediction": str(row.get("Prediction", "Normal")),
            "anomaly_score": float(row.get("Anomaly_Score", 0.0)),
            "risk_score": float(row.get("Risk_Score", 0.0)),
            "risk_level": str(row.get("Risk_Level", "LOW")),
            "model": state.active_model_info.get("name", state.active_model_key)
        }
        if has_target:
            item["actual_class"] = int(row[state.target_column])
        items.append(item)

    return {
        "items": sanitize_value(items),
        "total": total_records,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages,
        "active_model": state.active_model_key
    }


@router.get("/{transaction_id}")
def get_transaction_details(transaction_id: str) -> Dict[str, Any]:
    """
    Returns comprehensive details for a single transaction:
    - ID, Amount, Time, Prediction, Anomaly Score, Risk Score, Risk Level
    - All feature values (V1..V28 or custom features)
    - Top features contributing to anomaly score (z-score deviations)
    - Active model information
    """
    if state.clean_df is None or state.preprocessor is None:
        raise HTTPException(status_code=400, detail="No dataset loaded.")

    match_df = state.clean_df[state.clean_df["Transaction_ID"].astype(str) == str(transaction_id)]
    if match_df.empty:
        raise HTTPException(status_code=404, detail=f"Transaction {transaction_id} not found.")

    row = match_df.iloc[0]

    amount_col = [c for c in state.clean_df.columns if c.lower() == "amount"]
    time_col = [c for c in state.clean_df.columns if c.lower() == "time"]

    amount_val = float(row[amount_col[0]]) if amount_col else 0.0
    time_val = float(row[time_col[0]]) if time_col else 0.0

    # Calculate top contributing features via z-score deviations
    top_features = state.preprocessor.get_feature_deviations(row, top_k=7)

    # Collect all numeric features
    all_features = {}
    for feat in state.preprocessor.feature_columns:
        if feat in row:
            all_features[feat] = sanitize_value(row[feat])

    details = {
        "transaction_id": str(row["Transaction_ID"]),
        "time": time_val,
        "amount": amount_val,
        "prediction": str(row.get("Prediction", "Normal")),
        "anomaly_score": float(row.get("Anomaly_Score", 0.0)),
        "risk_score": float(row.get("Risk_Score", 0.0)),
        "risk_level": str(row.get("Risk_Level", "LOW")),
        "top_contributing_features": top_features,
        "all_features": all_features,
        "model_used": state.active_model_info or {"name": state.active_model_key}
    }

    target_col = state.target_column or (state.preprocessor.target_column if state.preprocessor else None)
    if target_col and target_col in row:
        details["actual_class"] = int(row[target_col])

    return sanitize_value(details)
