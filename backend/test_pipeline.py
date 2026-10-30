"""
Comprehensive test script for FraudShield Dataset Training Pipeline.
Verifies all 16 checklist requirements from the user specification.
"""
import os
import io
import time
import numpy as np
import pandas as pd

from app.state import state
from app.services.dataset_service import DatasetService
from app.services.preprocessing import DataPreprocessor
from app.services.training_service import TrainingService
from app.services.evaluation_service import EvaluationService
from app.services.prediction_service import PredictionService


def test_validation():
    print("\n--- TEST 1: Dataset Validation ---")
    # 1. Invalid file format
    try:
        DatasetService.validate_csv(b"test", "test.xlsx")
        assert False, "Should have rejected non-csv"
    except ValueError as e:
        print("[PASS] Successfully rejected non-csv:", e)

    # 2. Empty csv
    try:
        DatasetService.validate_csv(b"", "empty.csv")
        assert False, "Should have rejected empty csv"
    except ValueError as e:
        print("[PASS] Successfully rejected empty csv:", e)

    # 3. Valid CSV detection
    df_sample = pd.DataFrame({
        "Time": [0.0, 1.0, 2.0],
        "V1": [1.2, -0.5, 0.3],
        "Amount": [10.0, 25.5, 99.0],
        "Class": [0, 1, 0]
    })
    buf = io.BytesIO()
    df_sample.to_csv(buf, index=False)
    raw_df, rep = DatasetService.validate_csv(buf.getvalue(), "sample.csv")
    assert rep["is_valid"] is True
    assert rep["has_target"] is True
    assert rep["target_column"] == "Class"
    assert rep["total_rows"] == 3
    print("[PASS] Successfully validated CSV and dynamically detected target column 'Class'.")


def test_cleaning():
    print("\n--- TEST 2: Data Cleaning & Legitimate Anomaly Preservation ---")
    df_dirty = pd.DataFrame({
        "Time": [0.0, 10.0, 20.0, 10.0, 50.0],
        "V1": [0.5, np.nan, -4.5, np.nan, 99.0], # rare outlier: 99.0, fraud characteristic: -4.5
        "V2": [0.1, 0.2, 3.8, 0.2, -1.0],
        "Amount": [15.0, 50.0, 1200.0, 50.0, np.nan],
        "Class": [0, 0, 1, 0, 0] # 1 is rare fraud
    })
    clean_df, b_stats, a_stats, summary = DatasetService.clean_dataset(df_dirty)
    assert b_stats["rows"] == 5
    assert b_stats["duplicate_rows"] == 1
    assert a_stats["rows"] == 4 # 1 duplicate removed
    assert a_stats["duplicate_rows"] == 0
    assert a_stats["missing_values"] == 0 # imputed
    # Ensure rare fraud transaction is NOT removed
    assert int((clean_df["Class"] == 1).sum()) == 1, "Rare fraud transaction must NOT be removed!"
    # Ensure outlier value 99.0 is NOT dropped
    assert 99.0 in clean_df["V1"].values, "Legitimate outlier features must NOT be dropped!"
    print("[PASS] Data cleaning verified: 1 duplicate removed, missing values imputed, rare fraud preserved.")


def test_train_test_split_and_scaling_leakage():
    print("\n--- TEST 3: Train/Test Split & Leakage Prevention ---")
    n = 200
    df = pd.DataFrame({
        "Time": np.arange(n) * 10.0,
        "Amount": np.random.exponential(50, n),
        "V1": np.random.randn(n),
        "V2": np.random.randn(n),
        "Class": np.random.choice([0, 1], size=n, p=[0.9, 0.1])
    })
    prep = DataPreprocessor(random_state=42)
    res = prep.split_and_scale(df, test_size=0.2)

    assert res["split_stats"]["training_samples"] == 160
    assert res["split_stats"]["testing_samples"] == 40
    assert res["is_labeled"] is True
    assert "Class" not in res["feature_columns"], "Class must NEVER be used as a feature!"

    # Verify scaler was fit ONLY on train
    train_mean = prep.scaler.mean_[0]
    raw_train_mean = res["X_train_raw"]["Time"].mean()
    assert abs(train_mean - raw_train_mean) < 1e-6, "Scaler mean must match raw train mean exactly!"
    print(f"[PASS] Scaler fitted strictly on train: train Time mean={train_mean:.2f}, test Time mean={res['X_test_raw']['Time'].mean():.2f}")


def test_model_training_and_serialization():
    print("\n--- TEST 4: Model Training (IF, LOF, One-Class SVM, Autoencoder) & Saving ---")
    n = 600
    cols = ["Time"] + [f"V{i}" for i in range(1, 29)] + ["Amount", "Class"]
    data = np.random.randn(n, 31)
    df = pd.DataFrame(data, columns=cols)
    df["Class"] = np.random.choice([0, 1], size=n, p=[0.95, 0.05])
    df["Time"] = np.arange(n) * 5.0
    df["Amount"] = np.random.exponential(60, n)

    clean_df, b_stats, a_stats, summary = DatasetService.clean_dataset(df)
    prep = DataPreprocessor(random_state=42)
    prep_res = prep.split_and_scale(clean_df, test_size=0.2)

    state.raw_df = df
    state.clean_df = clean_df
    state.preprocessor = prep
    state.scaler = prep.scaler
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

    # Train all 4 models
    res = TrainingService.train_all()
    assert res["status"] == "success"
    models_res = res["models"]
    
    for k in ["isolation_forest", "lof", "one_class_svm", "autoencoder"]:
        assert k in models_res
        assert models_res[k]["status"] == "trained"
        assert models_res[k]["training_time"] > 0
        print(f"[PASS] {k}: status={models_res[k]['status']}, training_time={models_res[k]['training_time']}s, anomalies={models_res[k]['anomalies_detected']}")

    # Verify serialization
    saved_models = os.listdir(state.saved_models_dir)
    expected_files = ["isolation_forest.joblib", "lof.joblib", "one_class_svm.joblib", "autoencoder.joblib", "scaler.joblib", "metadata.json"]
    for f in expected_files:
        assert f in saved_models, f"Missing serialized file: {f}"
    print("[PASS] All 4 models, scaler, and metadata.json confirmed saved to disk in saved_models/.")


def test_evaluation_and_inference():
    print("\n--- TEST 5: Model Evaluation on Holdout Split & Inference ---")
    comp = TrainingService.get_comparison()
    assert comp["has_ground_truth"] is True
    assert len(comp["comparison"]) == 4
    for entry in comp["comparison"]:
        assert "precision" in entry
        assert "recall" in entry
        assert "f1_score" in entry
        assert "anomalies_detected" in entry
        print(f"[PASS] {entry['name']}: Prec={entry['precision']}, Rec={entry['recall']}, F1={entry['f1_score']}, ROC-AUC={entry['roc_auc']}")

    # Single transaction inference
    tx = {"Time": 500.0, "Amount": 1500.0}
    for i in range(1, 29):
        tx[f"V{i}"] = -3.5 if i in [14, 12, 10] else 0.0
    pred_res = PredictionService.predict_transaction(tx, "isolation_forest")
    assert "prediction" in pred_res
    assert "anomaly_score" in pred_res
    assert "risk_score" in pred_res
    assert "risk_level" in pred_res
    assert "top_contributing_features" in pred_res
    print("[PASS] Real-time inference output:", pred_res["prediction"], "Risk:", pred_res["risk_level"], "Score:", pred_res["risk_score"])


if __name__ == "__main__":
    t0 = time.time()
    test_validation()
    test_cleaning()
    test_train_test_split_and_scaling_leakage()
    test_model_training_and_serialization()
    test_evaluation_and_inference()
    print(f"\n==========================================")
    print(f"ALL 5 TEST SUITES PASSED in {round(time.time() - t0, 2)}s!")
    print(f"==========================================")
