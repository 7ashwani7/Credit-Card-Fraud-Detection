# Credit Card Fraud Detection Using Anomaly Detection Techniques

An end-to-end, responsive full-stack machine learning web application that identifies potentially fraudulent credit card transactions using unsupervised and semi-supervised anomaly detection algorithms.

Designed as a **comprehensive College Major Project / Portfolio Project**, this system demonstrates real-time ML execution, dynamic dataset ingestion, comparative algorithmic benchmarking, and interactive financial risk analytics.

---

## 🚀 Key Features

* **Real Machine Learning Execution**: Does not simulate outputs—dynamically trains and runs Scikit-learn models on demand.
* **Multiple Anomaly Detection Algorithms**:
  * **Isolation Forest**: Tree ensemble partition-based anomaly isolation.
  * **Local Outlier Factor (LOF)**: Density-based local neighborhood outlier detection.
  * **One-Class Support Vector Machine (One-Class SVM)**: Boundary-based kernel maximum-margin hyperplane.
  * **Neural Autoencoder**: Deep learning compression & reconstruction loss (MSE) thresholding.
* **Interactive Dashboard**: Real-time dynamically calculated statistics (Total Transactions, Normal vs. Suspicious, Fraud Rate, Average Amount, Max Amount).
* **Drag-and-Drop Dataset Ingestion**: Upload any custom transaction `.csv` dataset with automatic schema inspection, missing-value imputation, duplicate handling, and `StandardScaler` feature scaling.
* **Transaction Risk Explorer**: Searchable, sortable, filterable (Risk Level, Prediction), and paginated transaction table with direct single-click inspection.
* **Granular Transaction Inspector**: Detailed modal revealing normalized Risk Scores (0–100), full PCA features (V1–V28), and the **top feature drivers (z-score deviations)** contributing to anomalous behavior.
* **Algorithmic Benchmark Matrix**: Side-by-side comparative table evaluating execution runtime (ms), detection rates, Precision, Recall, F1-Score, ROC-AUC, and PR-AUC.
* **Analytics & Evaluation Hub**: Donut distributions, spending bracket histograms, time-series anomaly velocity trends, and interactive Confusion Matrix with educational notes on imbalanced datasets.
* **Responsive Cybersecurity / Fintech UI**: Glassmorphic dark dashboard with responsive desktop, tablet, and mobile layouts.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, Vite, JavaScript (ES6+), Vanilla CSS3 Design Tokens, Recharts, Lucide React |
| **Backend API** | Python 3.14, FastAPI, Uvicorn, Pydantic, Python-Multipart |
| **Machine Learning** | Scikit-learn, NumPy, Pandas, SciPy |
| **Dataset Format** | Standard Kaggle benchmark schema (`Time, V1..V28, Amount, Class`) and custom numeric CSVs |

---

## 🧠 Anomaly Detection Algorithms Explained

```
Raw Transaction Data
        ↓
Data Preprocessing (Imputation & Duplicate Check)
        ↓
Feature Normalization (StandardScaler)
        ↓
Anomaly Detection Model (Isolation Forest / LOF / One-Class SVM / Autoencoder)
        ↓
Raw Anomaly Score Computation
        ↓
Normalized Risk Score (0 – 100) & Categorization (LOW / MEDIUM / HIGH)
        ↓
REST API (FastAPI) ➔ React Analytics Dashboard
```

### 1. Isolation Forest
* **Category**: Tree-based Ensemble
* **How It Works**: Isolates anomalies by randomly selecting a feature and randomly selecting a split value between the maximum and minimum values of that feature. Because fraudulent or anomalous transactions have values far from normal clusters, they require noticeably fewer splits to isolate near the root of the trees.
* **Hyperparameters**: `contamination` (default: 0.02), `n_estimators` (default: 100), `random_state`.

### 2. Local Outlier Factor (LOF)
* **Category**: Density-based Unsupervised
* **How It Works**: Compares the local density of an observation against the local densities of its $k$-nearest neighbors. An object that is significantly less dense than its neighbors is identified as an outlier.
* **Hyperparameters**: `n_neighbors` (default: 20), `contamination` (default: 0.02).

### 3. One-Class SVM
* **Category**: Support Vector Boundary Classifier
* **How It Works**: Projects features into a high-dimensional reproducing kernel Hilbert space (via Radial Basis Function `rbf` kernel) and fits a maximum-margin hyperplane separating the bulk of transactions from the origin.
* **Hyperparameters**: `kernel` ('rbf', 'linear', 'poly', 'sigmoid'), `nu` (default: 0.03), `gamma` ('scale').

### 4. Neural Autoencoder
* **Category**: Deep Learning / Reconstruction Error
* **How It Works**: An artificial neural network with bottleneck hidden layers `(32 -> 16 -> 8 -> 16 -> 32)`. The network trains on $X \to X$ reconstruction. Normal transactions reconstruct accurately, while unusual fraud combinations produce high Mean Squared Error (MSE), exceeding the anomaly threshold.
* **Hyperparameters**: `contamination` (default: 0.02), `max_iter` (default: 150).

---

## 📁 Project Structure

```text
Credit-Card-Fraud-Detection/
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx                # Header with upload, model picker, and refresh
│   │   │   ├── Sidebar.jsx               # Navigation bar & server status indicator
│   │   │   ├── StatCard.jsx              # Reusable KPI statistic card
│   │   │   ├── TransactionTable.jsx      # Searchable, filterable, sortable table
│   │   │   ├── TransactionDetailModal.jsx# Inspection modal with z-score anomaly drivers
│   │   │   ├── DatasetUploadModal.jsx    # Drag-and-drop CSV uploader with step progress
│   │   │   ├── FraudBadge.jsx            # Status badges (Normal, Suspicious, Risk)
│   │   │   ├── ModelCard.jsx             # Algorithm card with hyperparameter tuning
│   │   │   └── ChartCard.jsx             # Container for analytical charts
│   │   │
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx             # High-level overview & key charts
│   │   │   ├── Transactions.jsx          # Comprehensive transaction risk explorer
│   │   │   ├── Models.jsx                # Model cards & benchmark matrix
│   │   │   ├── Analytics.jsx             # Confusion matrix & distribution plots
│   │   │   └── About.jsx                 # Academic guide & viva defense preparation
│   │   │
│   │   ├── services/
│   │   │   └── api.js                    # REST API client
│   │   │
│   │   ├── App.jsx                       # Main application shell
│   │   ├── main.jsx                      # React mounting
│   │   └── index.css                     # Dark fintech design system tokens
│   │
│   ├── package.json
│   ├── vite.config.js
│   └── README.md
│
├── backend/
│   ├── app/
│   │   ├── main.py                       # FastAPI application & startup loader
│   │   ├── state.py                      # In-memory dataset & cache state
│   │   ├── routes/
│   │   │   ├── transactions.py           # /api/transactions endpoints
│   │   │   ├── models.py                 # /api/models execution & comparison
│   │   │   └── analytics.py              # /api/statistics, /api/analytics, /api/upload
│   │   │
│   │   ├── ml/
│   │   │   ├── preprocessing.py          # Scaling, imputation & z-score deviations
│   │   │   ├── isolation_forest.py       # Isolation Forest implementation
│   │   │   ├── lof.py                    # Local Outlier Factor implementation
│   │   │   ├── one_class_svm.py          # One-Class SVM implementation
│   │   │   ├── autoencoder.py            # Neural Autoencoder implementation
│   │   │   └── evaluation.py             # Confusion matrix, PR-AUC, ROC-AUC
│   │   │
│   │   └── utils/
│   │       └── helpers.py                # JSON serialization & risk tier mapping
│   │
│   ├── requirements.txt
│   └── README.md
│
├── dataset/
│   ├── creditcard.csv                    # 2,500 sample credit card transactions
│   └── generate_dataset.py               # Configurable synthetic benchmark generator
│
├── models/                               # Directory for exported/saved model artifacts
├── README.md
└── .gitignore
```

---

## ⚡ Installation & Execution Guide

### 1. Prerequisites
* **Python 3.10+** (Tested on Python 3.14)
* **Node.js 18+** and **npm**

### 2. Backend Setup
Open a terminal in the project directory:

```bash
# Navigate to backend
cd backend

# Install Python dependencies
pip install -r requirements.txt

# Start the FastAPI server on port 8000
uvicorn app.main:app --reload --port 8000
```

The backend starts at `http://localhost:8000`. You can inspect the interactive Swagger API documentation at:
👉 `http://localhost:8000/docs`

### 3. Frontend Setup
Open a second terminal:

```bash
# Navigate to frontend
cd frontend

# Install Node dependencies
npm install

# Start the Vite development server
npm run dev
```

The web dashboard opens at:
👉 `http://localhost:5173`

---

## 📊 Normalized Risk Score Formula

The application maps raw continuous model decisions into a normalized **Risk Score between 0 and 100**:

$$\text{Risk Score} = \text{round}(\text{Anomaly Score} \times 100, 1)$$

Transactions are grouped into risk categories:
* **0 – 30 (LOW RISK)**: Legitimate transaction. No action required.
* **31 – 70 (MEDIUM RISK)**: Moderate deviation. Flagged for secondary verification.
* **71 – 100 (HIGH RISK)**: Severe anomaly. Block or trigger step-up multi-factor authentication.

---

## 🎓 Viva Defense & College Project FAQ

### Q1: Why is Accuracy a misleading metric in fraud detection?
**Answer**: Fraud is inherently rare (often $< 1\%$ of transactions). If a dataset contains 99.8% normal transactions and 0.2% fraud, a dummy model that simply predicts "Normal" for every single transaction will achieve a deceptive **99.8% accuracy**, yet miss 100% of actual fraud. Therefore, **Precision, Recall, F1-Score, and PR-AUC** (Area Under the Precision-Recall Curve) are the primary metrics.

### Q2: Why use Unsupervised Anomaly Detection rather than Supervised Classification?
**Answer**:
1. **Zero-Day Attacks**: Supervised models only learn patterns present in historical fraud data. Fraud syndicates constantly invent new laundering vectors.
2. **Delayed Ground Truth**: Legitimate chargebacks and fraud reporting take 30 to 90 days to confirm. Unsupervised anomaly detection flags outliers immediately at inference time.

### Q3: How are the feature deviations (z-scores) calculated in the inspector?
**Answer**: For each numerical feature $j$, we compute:
$$z_j = \frac{|x_j - \mu_j|}{\sigma_j}$$
Where $\mu_j$ is the population mean and $\sigma_j$ is standard deviation. The features with the largest $z_j$ values represent the primary drivers that caused the transaction to be categorized as anomalous.

---

## ⚠️ Limitations & Ethical Considerations

1. **Indicator, Not Legal Verdict**: Anomaly detection identifies statistical deviations from historical norms. An anomalous transaction may simply be an atypical legitimate purchase (e.g., an international flight ticket or an emergency medical expense).
2. **False Positives (Customer Friction)**: Setting the contamination rate too high increases false alarms, leading to unnecessary card declines.
3. **Concept Drift**: Spending patterns shift during holiday seasons and macroeconomic cycles; models should be periodically retrained on fresh transaction windows.
