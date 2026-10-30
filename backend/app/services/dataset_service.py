import io
from typing import Dict, Any, Tuple, Optional, List
import pandas as pd
import numpy as np


class DatasetService:
    """
    Handles CSV dataset validation, cleaning, statistics, and column detection.
    Adheres strictly to anomaly detection rules:
    - Never deletes legitimate rare/fraud records
    - Imputes missing numeric values via column medians
    - Imputes missing categorical values via mode or 'Unknown'
    - Tracks before and after cleaning metrics
    """

    @staticmethod
    def validate_csv(contents: bytes, filename: str) -> Tuple[pd.DataFrame, Dict[str, Any]]:
        """
        Validates uploaded CSV file:
        - Must have .csv extension
        - Must parse as non-empty DataFrame
        - Detects shape, columns, numeric/categorical types, missing values, duplicates, and target column
        """
        if not filename.lower().endswith(".csv"):
            raise ValueError(f"Invalid file format for '{filename}'. Only .csv files are supported.")

        try:
            # Attempt parsing with pandas
            df = pd.read_csv(io.BytesIO(contents))
        except Exception as e:
            raise ValueError(f"Failed to parse CSV file: {str(e)}")

        if df.empty or len(df) == 0:
            raise ValueError("The uploaded CSV dataset contains no data rows.")

        total_rows, total_cols = df.shape
        columns = list(df.columns)

        # Detect column types
        numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
        categorical_cols = [c for c in columns if c not in numeric_cols]

        missing_per_col = df.isnull().sum().to_dict()
        total_missing = int(df.isnull().sum().sum())
        duplicate_rows = int(df.duplicated().sum())

        # Dynamic target column detection
        target_col = None
        for col in columns:
            clean_name = col.strip().lower()
            if clean_name in ["class", "fraud", "is_fraud", "target", "label"]:
                target_col = col
                break

        has_target = target_col is not None
        class_distribution = None
        if has_target:
            val_counts = df[target_col].value_counts().to_dict()
            class_distribution = {str(k): int(v) for k, v in val_counts.items()}

        validation_report = {
            "filename": filename,
            "validation_status": "Valid",
            "is_valid": True,
            "total_rows": total_rows,
            "total_columns": total_cols,
            "columns": columns,
            "numeric_columns": numeric_cols,
            "categorical_columns": categorical_cols,
            "missing_values_count": total_missing,
            "missing_per_column": {k: int(v) for k, v in missing_per_col.items() if v > 0},
            "duplicate_rows_count": duplicate_rows,
            "has_target": has_target,
            "target_column": target_col,
            "dataset_status": "Labeled Dataset" if has_target else "Unlabeled Dataset",
            "class_distribution": class_distribution
        }

        return df, validation_report

    @staticmethod
    def clean_dataset(df: pd.DataFrame) -> Tuple[pd.DataFrame, Dict[str, Any], Dict[str, Any], Dict[str, Any]]:
        """
        Executes robust data cleaning:
        1. Remove exact duplicate rows
        2. Convert numeric columns to numeric types
        3. Replace inf/-inf with NaN
        4. Handle missing numeric values using column median
        5. Handle missing categorical values using mode or 'Unknown'
        6. Preserves all rare/fraud transactions
        
        Returns:
            clean_df: Cleaned pandas DataFrame
            before_stats: Rows, Columns, Missing, Duplicates before cleaning
            after_stats: Rows, Columns, Missing, Duplicates after cleaning
            summary: Detailed changes performed
        """
        before_rows = len(df)
        before_cols = len(df.columns)
        before_missing = int(df.isnull().sum().sum())
        before_duplicates = int(df.duplicated().sum())

        before_stats = {
            "rows": before_rows,
            "columns": before_cols,
            "missing_values": before_missing,
            "duplicate_rows": before_duplicates
        }

        # Step 1: Remove exact duplicate rows
        clean_df = df.drop_duplicates().reset_index(drop=True)
        duplicates_removed = before_rows - len(clean_df)

        # Step 2: Convert numeric-like columns and detect inf
        numeric_cols = clean_df.select_dtypes(include=[np.number]).columns.tolist()
        object_cols = clean_df.select_dtypes(include=["object"]).columns.tolist()

        converted_cols = []
        for col in object_cols:
            # Check if object column can be safely converted to numeric
            try:
                coerced = pd.to_numeric(clean_df[col], errors="coerce")
                # If at least 80% converted without error, treat as numeric
                if coerced.notnull().sum() / len(clean_df) > 0.8:
                    clean_df[col] = coerced
                    converted_cols.append(col)
                    if col not in numeric_cols:
                        numeric_cols.append(col)
            except Exception:
                pass

        # Step 3: Replace inf / -inf with NaN in numeric columns
        clean_df[numeric_cols] = clean_df[numeric_cols].replace([np.inf, -np.inf], np.nan)

        # Step 4: Handle missing numeric values with median imputation
        imputed_numeric = {}
        for col in numeric_cols:
            n_missing = int(clean_df[col].isnull().sum())
            if n_missing > 0:
                median_val = float(clean_df[col].median())
                if np.isnan(median_val):
                    median_val = 0.0
                clean_df[col] = clean_df[col].fillna(median_val)
                imputed_numeric[col] = n_missing

        # Step 5: Handle missing categorical values with mode or 'Unknown'
        cat_cols = [c for c in clean_df.columns if c not in numeric_cols]
        imputed_categorical = {}
        for col in cat_cols:
            n_missing = int(clean_df[col].isnull().sum())
            if n_missing > 0:
                mode_series = clean_df[col].mode()
                fill_val = mode_series.iloc[0] if not mode_series.empty else "Unknown"
                clean_df[col] = clean_df[col].fillna(fill_val)
                imputed_categorical[col] = n_missing

        # Ensure Transaction_ID column exists for UI table navigation
        id_cols = [c for c in clean_df.columns if c.lower() in ["transaction_id", "tx_id", "row_id"]]
        if not id_cols:
            clean_df.insert(0, "Transaction_ID", [f"TX-{10001 + i}" for i in range(len(clean_df))])

        after_rows = len(clean_df)
        after_cols = len(clean_df.columns)
        after_missing = int(clean_df.isnull().sum().sum())
        after_duplicates = int(clean_df.duplicated().sum())

        after_stats = {
            "rows": after_rows,
            "columns": after_cols,
            "missing_values": after_missing,
            "duplicate_rows": after_duplicates
        }

        summary = {
            "duplicates_removed": duplicates_removed,
            "numeric_imputed": imputed_numeric,
            "categorical_imputed": imputed_categorical,
            "converted_columns": converted_cols,
            "note": "Cleaned without dropping legitimate transaction records or anomalies."
        }

        return clean_df, before_stats, after_stats, summary
