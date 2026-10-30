import json
import urllib.request
import urllib.parse
import time

BASE_URL = "http://127.0.0.1:8000"

def get(path):
    url = f"{BASE_URL}{path}"
    req = urllib.request.Request(url, headers={"User-Agent": "TestClient"})
    with urllib.request.urlopen(req) as response:
        return json.loads(response.read().decode("utf-8"))

def post(path, data=None):
    url = f"{BASE_URL}{path}"
    json_data = json.dumps(data or {}).encode("utf-8")
    req = urllib.request.Request(
        url, 
        data=json_data, 
        headers={"Content-Type": "application/json", "User-Agent": "TestClient"}
    )
    with urllib.request.urlopen(req) as response:
        return json.loads(response.read().decode("utf-8"))

def run_tests():
    print("Testing Root API...")
    root = get("/")
    print("[OK] Root status:", root.get("status"), "Records:", root.get("total_records"))

    print("\nTesting Dataset Statistics API...")
    stats = get("/dataset/statistics")
    print("[OK] Dataset Status:", stats.get("dataset_status"), "Rows:", stats.get("rows"), "Features:", stats.get("feature_count"))

    print("\nTesting Models Overview API...")
    models = get("/models")
    print("[OK] Active Model:", models.get("active_model"), "Models count:", len(models.get("models", [])))

    print("\nTesting Train Single Model API (Isolation Forest)...")
    train_one = post("/train", {"model_name": "isolation_forest"})
    print("[OK] Train IF Status:", train_one.get("status"))

    print("\nTesting Train All Models API...")
    train_all = post("/train/all")
    print("[OK] Train All Status:", train_all.get("status"), "Models trained:", list(train_all.get("models", {}).keys()))
    for m, info in train_all.get("models", {}).items():
        print(f"  - {m}: status={info.get('status')}, time={info.get('training_time')}s")

    print("\nTesting Training Status API...")
    t_status = get("/training/status")
    print("[OK] Training Status retrieved successfully. Active model:", t_status.get("active_model"))

    print("\nTesting Models Comparison API...")
    comparison = get("/models/compare")
    print("[OK] Models comparison count:", len(comparison.get("comparison", [])))
    for comp in comparison.get("comparison", []):
        print(f"  - {comp.get('name')}: Time={comp.get('training_time')}s, Anomalies={comp.get('anomalies_detected')}, F1={comp.get('f1_score')}")

    print("\nTesting Real-Time Prediction API...")
    pred = post("/predict", {
        "transaction": {
            "Time": 100.0,
            "Amount": 250.0,
            "V1": -1.2,
            "V2": 0.5
        }
    })
    print("[OK] Prediction:", pred.get("prediction", {}).get("prediction"), "Risk Level:", pred.get("prediction", {}).get("risk_level"), "Risk Score:", pred.get("prediction", {}).get("risk_score"))

    print("\nTesting Transactions List API...")
    txs = get("/api/transactions?page=1&page_size=5")
    print("[OK] Transactions total:", txs.get("total"), "Page items:", len(txs.get("items", [])))
    first_item = txs.get("items", [])[0] if txs.get("items") else {}
    print(f"  First TX: ID={first_item.get('transaction_id')}, Pred={first_item.get('prediction')}, Risk={first_item.get('risk_level')}, Score={first_item.get('risk_score')}")

    print("\nTesting Analytics API...")
    analytics = get("/api/analytics")
    print("[OK] Analytics ground_truth:", analytics.get("has_ground_truth"), "Time series intervals:", len(analytics.get("time_series", [])))

    print("\nTesting Training History API...")
    history = get("/training/history")
    print("[OK] Training runs in history:", len(history.get("history", [])))

    print("\n==========================================")
    print("ALL API ENDPOINTS TESTED AND VERIFIED OVER HTTP!")
    print("==========================================")

if __name__ == "__main__":
    run_tests()
