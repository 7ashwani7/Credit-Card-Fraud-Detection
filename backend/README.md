# Credit Card Fraud Detection - Backend API

FastAPI REST backend with Scikit-learn anomaly detection models.

## Setup & Running

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Start the FastAPI server:
```bash
uvicorn app.main:app --reload --port 8000
```

3. Interactive Swagger documentation:
Visit `http://localhost:8000/docs` in your browser.

## API Endpoints Overview

- `GET /`: Health check and loaded dataset status
- `GET /api/statistics`: High-level metrics for dashboard cards
- `GET /api/analytics`: Aggregated chart data (distributions, time series, confusion matrix)
- `POST /api/upload`: Upload and process custom `.csv` dataset
- `POST /api/reset-demo`: Reset dataset to standard demo transactions
- `GET /api/transactions`: Searchable, filterable, sortable, paginated transactions
- `GET /api/transactions/{id}`: Detailed transaction inspection with feature contribution z-scores
- `GET /api/models`: Supported anomaly detection models and current active status
- `POST /api/models/run`: Run algorithm (Isolation Forest, LOF, One-Class SVM, Autoencoder) with custom hyper-parameters
- `POST /api/models/compare`: Benchmark and compare all algorithms side-by-side
