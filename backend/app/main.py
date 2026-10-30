import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd

from .state import state
from .routes import dataset, training, models, transactions, analytics
from .routes.dataset import _run_dataset_pipeline


def init_default_dataset():
    """Initializes default demo dataset on backend startup using full training pipeline."""
    try:
        # Search for dataset in project root or backend dir
        current_file = os.path.abspath(__file__)
        app_dir = os.path.dirname(current_file)
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

        if dataset_path and os.path.exists(dataset_path):
            print(f"[Startup] Loading default dataset from: {dataset_path}")
            df = pd.read_csv(dataset_path)
            pipeline_res = _run_dataset_pipeline(df, "Demo Dataset (Credit Card Transactions)", is_demo=True)
            print(f"[Startup] Ready! Loaded {len(state.clean_df)} transactions, {pipeline_res['initial_model']['summary']['anomalies_detected']} suspicious flagged via trained Isolation Forest.")
        else:
            print(f"[Startup] Warning: Dataset not found in candidate paths.")
    except Exception as e:
        print(f"[Startup] Error initializing default dataset: {e}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    init_default_dataset()
    yield
    # Shutdown


app = FastAPI(
    title="FraudShield – Credit Card Fraud Detection API",
    description="Production-grade REST API for dataset training, validation, cleaning, feature scaling, model benchmarking, and unsupervised anomaly detection.",
    version="2.0.0",
    lifespan=lifespan
)

# Enable CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register all route modules
app.include_router(dataset.router)
app.include_router(training.router)
app.include_router(models.router)
app.include_router(transactions.router)
app.include_router(analytics.router)


@app.get("/")
def root():
    from .utils.helpers import sanitize_value
    return sanitize_value({
        "title": "FraudShield – Credit Card Fraud Detection API",
        "status": "Online",
        "active_model": state.active_model_key,
        "dataset_loaded": state.clean_df is not None,
        "dataset_source": state.dataset_source,
        "dataset_status": "Labeled Dataset" if state.is_labeled else "Unlabeled Dataset",
        "is_demo": state.is_demo,
        "total_records": len(state.clean_df) if state.clean_df is not None else 0,
        "features": len(state.feature_columns),
        "split_stats": state.split_stats
    })
