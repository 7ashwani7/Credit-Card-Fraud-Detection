import React from 'react';
import { 
  ArrowDown, 
  Cpu, 
  Database, 
  Server, 
  Layout, 
  AlertTriangle, 
  GitBranch, 
  ShieldAlert,
  Info,
  Terminal,
  Activity
} from 'lucide-react';

export default function About() {
  const pipelineSteps = [
    {
      step: '01',
      title: 'Transaction Data',
      desc: 'Raw financial transaction records containing PCA-transformed features (V1–V28), transaction amount, and relative time offset.',
      badge: 'Input Stream'
    },
    {
      step: '02',
      title: 'Preprocessing',
      desc: 'Data validation, median imputation for missing values, schema verification, and deduplication of transaction records.',
      badge: 'Data Cleansing'
    },
    {
      step: '03',
      title: 'Feature Scaling',
      desc: 'StandardScaler and RobustScaler normalization to standardize variance and prevent heavy-tailed amounts from dominating calculations.',
      badge: 'Normalization'
    },
    {
      step: '04',
      title: 'Anomaly Detection',
      desc: 'Execution of unsupervised machine learning algorithms to evaluate structural, density, or geometric deviation from normal patterns.',
      badge: 'Model Inference'
    },
    {
      step: '05',
      title: 'Anomaly Score',
      desc: 'Raw continuous decision function output measuring mathematical deviation from the cluster of normal transactions.',
      badge: 'Raw Metric'
    },
    {
      step: '06',
      title: 'Risk Score',
      desc: 'Normalized calibration transforming raw decision values into an intuitive 0–100 scale with quantile risk thresholds.',
      badge: 'Calibrated Index'
    },
    {
      step: '07',
      title: 'Suspicious Transaction',
      desc: 'Categorization into risk tiers (Low, Medium, High Risk) and flagging of high-risk transactions for investigation and automated alerts.',
      badge: 'Triage & Alert'
    }
  ];

  const algorithms = [
    {
      name: 'Isolation Forest',
      category: 'Tree Ensemble',
      math: 'Path Length in Random Partition Trees',
      desc: 'Isolates anomalies instead of profiling normal data. It builds ensembles of random decision trees. Because anomalous transactions have rare or extreme values, they require noticeably fewer splits to isolate and end up close to the root of the tree.'
    },
    {
      name: 'LOF',
      category: 'Density Estimation',
      math: 'Local Density vs. k-Nearest Neighbors',
      desc: 'Compares the local density of a transaction to that of its k-nearest neighbors. If a transaction is located in an area with significantly lower density than its neighbors, it indicates that the transaction is isolated and likely an outlier.'
    },
    {
      name: 'One-Class SVM',
      category: 'Kernel Boundary',
      math: 'Max-Margin Hyperplane with RBF Kernel',
      desc: 'Learns a boundary that wraps around normal transactions in a high-dimensional feature space using an RBF kernel. Any transaction that lands outside this boundary hyperplane is treated as an anomaly.'
    },
    {
      name: 'Autoencoder',
      category: 'Deep Learning',
      math: 'MSE Reconstruction Loss: ||x - x̂||²',
      desc: 'A neural network that compresses transactions into a narrow bottleneck and then attempts to reconstruct them. Because it learns the manifold of normal transactions, it fails to accurately reconstruct strange fraud patterns, resulting in a high reconstruction error.'
    }
  ];

  const techStack = {
    frontend: [
      { name: 'React', desc: 'Component-based UI library powering modular views & reactive state' },
      { name: 'Vite', desc: 'High-speed build tool and modern frontend development server' },
      { name: 'Recharts', desc: 'Declarative, composable SVG charting library for interactive analytics' },
      { name: 'Lucide React', desc: 'Accessible, consistent icon system across navigation and controls' }
    ],
    backend: [
      { name: 'Python', desc: 'Core programming language for data manipulation & ML runtime' },
      { name: 'FastAPI', desc: 'Modern, high-performance web framework for asynchronous REST APIs' }
    ],
    ml: [
      { name: 'Pandas', desc: 'High-performance tabular data structures and preprocessing pipelines' },
      { name: 'NumPy', desc: 'Vectorized numerical operations and multi-dimensional array calculations' },
      { name: 'Scikit-learn', desc: 'Industry-standard algorithms, scalers, and model evaluation metrics' }
    ]
  };

  const architectureNodes = [
    {
      title: 'Presentation Layer',
      icon: <Layout size={16} style={{ color: 'var(--primary-color)' }} />,
      desc: 'React + Vite SPA providing Dashboard, Transactions Explorer, Benchmarking Console, and Analytics visualizer.'
    },
    {
      title: 'REST API Layer',
      icon: <Server size={16} style={{ color: 'var(--primary-color)' }} />,
      desc: 'FastAPI endpoints handling asynchronous requests, Pydantic validation, and dataset session state.'
    },
    {
      title: 'ML Pipeline Engine',
      icon: <Cpu size={16} style={{ color: 'var(--primary-color)' }} />,
      desc: 'Scikit-learn pipelines executing feature scaling, model fitting, and continuous decision scoring.'
    },
    {
      title: 'Evaluation & Triage',
      icon: <Activity size={16} style={{ color: 'var(--primary-color)' }} />,
      desc: '0–100 risk score calibration, quantile thresholding (Low/Med/High), and ground-truth validation if available.'
    }
  ];

  return (
    <div className="about-container">
      {/* Page Header */}
      <div className="about-header">
        <h1 className="about-title">
          Credit Card Fraud Detection Using Anomaly Detection Techniques
        </h1>
        <p className="about-subtitle">
          An unsupervised machine learning research framework for transaction risk scoring, outlier identification, and algorithmic benchmarking.
        </p>
        <div className="about-academic-meta">
          <span className="about-meta-tag">
            <ShieldAlert size={13} style={{ color: 'var(--primary-color)' }} />
            Domain: Financial Cyber-Security
          </span>
          <span className="about-meta-tag">
            <GitBranch size={13} style={{ color: 'var(--primary-color)' }} />
            Paradigm: Unsupervised Anomaly Detection
          </span>
          <span className="about-meta-tag">
            <Terminal size={13} style={{ color: 'var(--primary-color)' }} />
            Architecture: React + FastAPI + Scikit-learn
          </span>
        </div>
      </div>

      {/* 1. Project Overview */}
      <section className="about-section-card">
        <div className="about-section-header">
          <span className="about-section-number">Section 1</span>
          <h2 className="about-section-title">Project Overview</h2>
        </div>
        <p className="about-body-text">
          This project investigates the application of unsupervised machine learning and anomaly detection algorithms to identify suspicious credit card transactions in real time without requiring historical ground-truth fraud labels for model training.
        </p>
        <p className="about-body-text">
          Modern electronic payment systems process billions of operations every day. Because legitimate card usage overwhelmingly dominates transactional volume and real-world fraud patterns evolve rapidly, identifying unauthorized activity requires algorithms capable of isolating transactions that statistically deviate from established behavioral norms.
        </p>
        <p className="about-body-text">
          The system provides an end-to-end framework: from tabular transaction ingestion and robust feature scaling, to continuous anomaly scoring, calibrated risk stratification (0–100 score), and comparative algorithmic benchmarking across multiple unsupervised models.
        </p>
      </section>

      {/* 2. Problem Statement */}
      <section className="about-section-card">
        <div className="about-section-header">
          <span className="about-section-number">Section 2</span>
          <h2 className="about-section-title">Problem Statement</h2>
        </div>
        <p className="about-body-text">
          Credit card fraud causes tens of billions of dollars in annual global losses. Developing automated, high-precision detection mechanisms poses three fundamental mathematical and operational challenges:
        </p>
        <div className="about-point-list">
          <div className="about-point-item">
            <div className="about-point-bullet" />
            <div>
              <strong>Extreme Class Imbalance:</strong> In real-world financial datasets (such as the standard European Cardholder benchmark), fraudulent transactions account for less than 0.2% of all activity. Standard supervised classifiers become heavily biased toward the legitimate majority class, yielding deceptive high accuracy while failing to intercept fraud.
            </div>
          </div>

          <div className="about-point-item">
            <div className="about-point-bullet" />
            <div>
              <strong>Concept Drift & Zero-Day Patterns:</strong> Fraud syndicates continually alter spending behaviors, merchant categories, geolocation hops, and transaction velocity. Static rule-based systems struggle to anticipate or adapt to previously unseen attack patterns.
            </div>
          </div>

          <div className="about-point-item">
            <div className="about-point-bullet" />
            <div>
              <strong>Asymmetric Error Costs:</strong> Missing a fraudulent transaction (false negative) causes immediate financial liability and regulatory penalties. Conversely, falsely flagging legitimate transactions (false positive) introduces friction, card declines, and customer dissatisfaction.
            </div>
          </div>
        </div>
      </section>

      {/* 3. Objective */}
      <section className="about-section-card">
        <div className="about-section-header">
          <span className="about-section-number">Section 3</span>
          <h2 className="about-section-title">Objective</h2>
        </div>
        <p className="about-body-text">
          The primary objective of this application is to construct an accessible, transparent, and reproducible anomaly detection pipeline for financial transaction risk assessment:
        </p>
        <div className="about-point-list">
          <div className="about-point-item">
            <div className="about-point-bullet" />
            <div>
              <strong>Unsupervised Outlier Identification:</strong> Detect potential fraud vectors by modeling normal transaction manifolds and identifying statistical deviations without relying on supervised labels during training.
            </div>
          </div>

          <div className="about-point-item">
            <div className="about-point-bullet" />
            <div>
              <strong>Continuous Score Normalization:</strong> Convert disparate raw algorithmic decision functions into normalized continuous Anomaly Scores and an intuitive 0–100 Risk Score.
            </div>
          </div>

          <div className="about-point-item">
            <div className="about-point-bullet" />
            <div>
              <strong>Algorithmic Benchmarking:</strong> Empirically evaluate and compare distinct anomaly detection paradigms (Isolation Forest, LOF, One-Class SVM, and Autoencoder) across execution runtime, memory footprint, and scoring distributions.
            </div>
          </div>

          <div className="about-point-item">
            <div className="about-point-bullet" />
            <div>
              <strong>Analyst Triage & Risk Stratification:</strong> Partition transactions into actionable risk bands (Low, Medium, High Risk) to assist risk analysts in prioritizing suspicious transaction audits.
            </div>
          </div>
        </div>
      </section>

      {/* 4. How It Works */}
      <section className="about-section-card">
        <div className="about-section-header">
          <span className="about-section-number">Section 4</span>
          <h2 className="about-section-title">How It Works</h2>
        </div>
        <p className="about-body-text">
          The diagram below illustrates the sequential end-to-end transaction processing and scoring pipeline:
        </p>

        <div className="about-flow-container">
          {pipelineSteps.map((step, idx) => (
            <React.Fragment key={step.step}>
              <div className="about-flow-step">
                <span className="about-flow-step-num">{step.step}</span>
                <div className="about-flow-step-content">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                    <h3 className="about-flow-step-title">{step.title}</h3>
                    <span className="about-flow-step-badge">{step.badge}</span>
                  </div>
                  <p className="about-flow-step-desc">{step.desc}</p>
                </div>
              </div>

              {idx < pipelineSteps.length - 1 && (
                <div className="about-flow-arrow">
                  <ArrowDown size={16} />
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </section>

      {/* 5. Algorithms */}
      <section className="about-section-card">
        <div className="about-section-header">
          <span className="about-section-number">Section 5</span>
          <h2 className="about-section-title">Algorithms</h2>
        </div>
        <p className="about-body-text">
          The framework implements four distinct unsupervised anomaly detection algorithms, each representing a unique mathematical formulation:
        </p>

        <div className="about-algo-grid">
          {algorithms.map((algo) => (
            <div key={algo.name} className="about-algo-card">
              <div className="about-algo-card-top">
                <h3 className="about-algo-name">{algo.name}</h3>
                <span className="about-algo-type">{algo.category}</span>
              </div>
              <p className="about-algo-desc">{algo.desc}</p>
              <div className="about-algo-math">{algo.math}</div>
            </div>
          ))}
        </div>
      </section>

      {/* 6. Technology Stack */}
      <section className="about-section-card">
        <div className="about-section-header">
          <span className="about-section-number">Section 6</span>
          <h2 className="about-section-title">Technology Stack</h2>
        </div>
        <p className="about-body-text">
          Built using modern, lightweight open-source technologies organized into three primary layers:
        </p>

        <div className="about-tech-grid">
          {/* Frontend */}
          <div className="about-tech-group">
            <div className="about-tech-header">
              <Layout size={16} style={{ color: 'var(--primary-color)' }} />
              <span>Frontend</span>
            </div>
            <div className="about-tech-items">
              {techStack.frontend.map((item) => (
                <div key={item.name} className="about-tech-item">
                  <span className="about-tech-item-name">{item.name}</span>
                  <span className="about-tech-item-desc">{item.desc}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Backend */}
          <div className="about-tech-group">
            <div className="about-tech-header">
              <Server size={16} style={{ color: 'var(--primary-color)' }} />
              <span>Backend</span>
            </div>
            <div className="about-tech-items">
              {techStack.backend.map((item) => (
                <div key={item.name} className="about-tech-item">
                  <span className="about-tech-item-name">{item.name}</span>
                  <span className="about-tech-item-desc">{item.desc}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ML */}
          <div className="about-tech-group">
            <div className="about-tech-header">
              <Database size={16} style={{ color: 'var(--primary-color)' }} />
              <span>ML & Analytics</span>
            </div>
            <div className="about-tech-items">
              {techStack.ml.map((item) => (
                <div key={item.name} className="about-tech-item">
                  <span className="about-tech-item-name">{item.name}</span>
                  <span className="about-tech-item-desc">{item.desc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 7. System Architecture */}
      <section className="about-section-card">
        <div className="about-section-header">
          <span className="about-section-number">Section 7</span>
          <h2 className="about-section-title">System Architecture</h2>
        </div>
        <p className="about-body-text">
          The system follows a modular client-server architecture with separation between user presentation, REST API orchestration, and machine learning inference:
        </p>

        <div className="about-arch-box">
          <div className="about-arch-flow">
            {architectureNodes.map((node, i) => (
              <div key={i} className="about-arch-node">
                <div className="about-arch-node-title">
                  {node.icon}
                  <span>{node.title}</span>
                </div>
                <div className="about-arch-node-desc">
                  {node.desc}
                </div>
              </div>
            ))}
          </div>

          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '4px 0 0 0', lineHeight: 1.5 }}>
            <strong>Communication Flow:</strong> The React client communicates with FastAPI over asynchronous HTTP REST endpoints. The backend coordinates Pandas/NumPy preprocessing, runs Scikit-learn model inference in memory, normalizes anomaly scores into risk scores, and streams structured JSON payloads back to the client interface.
          </p>
        </div>
      </section>

      {/* 8. Limitations */}
      <section className="about-section-card">
        <div className="about-section-header">
          <span className="about-section-number">Section 8</span>
          <h2 className="about-section-title">Limitations</h2>
        </div>
        <p className="about-body-text">
          While unsupervised anomaly detection provides significant operational value, the following theoretical and practical constraints must be understood:
        </p>

        <div className="about-limitation-box">
          <div className="about-limitation-item">
            <AlertTriangle size={18} className="about-limitation-icon" />
            <div className="about-limitation-text">
              <strong>Anomaly detection identifies unusual transactions:</strong> Algorithms detect statistical deviations from the predominant data distribution. Legitimate but atypical transactions—such as rare high-value purchases, foreign travel, or holiday spending surges—may trigger high anomaly scores despite being completely lawful.
            </div>
          </div>

          <div className="about-limitation-item">
            <AlertTriangle size={18} className="about-limitation-icon" />
            <div className="about-limitation-text">
              <strong>It does not automatically prove that a transaction is fraudulent:</strong> A high anomaly score is an indicator of novelty and statistical rarity, not definitive legal or operational proof of fraud. Anomaly detection serves as a high-precision triage filter to prioritize human analyst review or multi-factor verification rather than an autonomous verdict.
            </div>
          </div>

          <div className="about-limitation-item">
            <Info size={18} className="about-limitation-icon" />
            <div className="about-limitation-text">
              <strong>Supervised evaluation metrics require ground-truth labels:</strong> Quantitative performance metrics such as Precision, Recall, F1 Score, and ROC-AUC cannot be rigorously calculated without verified historical fraud labels (the <code>Class</code> feature). In purely unsupervised production deployments without verified labels, system efficacy must be monitored using proxy heuristics, analyst feedback loops, and operational audit sampling.
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
