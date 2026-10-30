import React from 'react';
import { 
  X, 
  Cpu, 
  Clock, 
  Activity, 
  AlertTriangle,
  Info,
  Sliders,
  CheckCircle2
} from 'lucide-react';
import StatusBadge from './common/StatusBadge';

export default function ModelDetailModal({ model, onClose }) {
  if (!model) return null;

  const cached = model.cached_results;
  const metrics = cached?.evaluation?.metrics;
  const cm = cached?.evaluation?.confusion_matrix;
  const hasGroundTruth = cached?.evaluation?.has_ground_truth;
  const summary = cached?.summary;

  const limitationsMap = {
    isolation_forest: [
      'Axis-parallel splits can struggle with complex non-linear diagonal correlations.',
      'Contamination parameter heavily dictates the decision threshold.',
      'Slight variability across runs due to random feature/split selection.'
    ],
    lof: [
      'Computationally heavier: O(N^2) complexity with large datasets.',
      'Sensitive to the choice of the k-nearest neighbors parameter.',
      'Does not provide an out-of-sample prediction function without retraining or re-indexing.'
    ],
    one_class_svm: [
      'Quadratic training time scaling with high sample counts.',
      'Requires delicate tuning of the Nu and Gamma parameters.',
      'Sensitive to outliers in the training baseline without proper regularization.'
    ],
    autoencoder: [
      'Neural network training requires multiple iterative epochs and more compute.',
      'Loss threshold selection for outlier classification requires empirical tuning.',
      'Less interpretable internal representations compared to decision tree paths.'
    ]
  };

  const limitations = limitationsMap[model.key] || [
    'Unsupervised thresholds require empirical calibration against business risk tolerance.',
    'Assumes legitimate transactions dominate the data manifold.'
  ];

  return (
    <div
      className="modal-backdrop"
      onClick={onClose}
    >
      <div
        className="simple-card"
        style={{
          width: '100%',
          maxWidth: '880px',
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: '28px',
          position: 'relative',
          backgroundColor: 'var(--bg-modal)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div 
          style={{ 
            display: 'flex', 
            alignItems: 'flex-start', 
            justifyContent: 'space-between', 
            paddingBottom: '18px', 
            borderBottom: '1px solid var(--border-color)',
            marginBottom: '20px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div 
              style={{
                width: '42px',
                height: '42px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--primary-light)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--primary-color)'
              }}
            >
              <Cpu size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {model.name}
                </h2>
                <span className="badge badge-info">
                  {model.category}
                </span>
                <StatusBadge status={model.is_active ? 'ACTIVE' : cached ? 'COMPLETED' : 'IDLE'} />
              </div>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                Technical Specification, Hyperparameters & Evaluation Diagnostics
              </p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="btn btn-secondary btn-icon-only"
            aria-label="Close modal"
          >
            <X size={16} />
          </button>
        </div>

        {/* 2-Column Responsive Layout */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
          {/* Left Column: Theory, Parameters, Limitations */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Description */}
            <div style={{ backgroundColor: 'var(--bg-main)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
              <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--primary-color)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '6px' }}>
                Algorithmic Principle
              </h4>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                {model.description}
              </p>
            </div>

            {/* Hyperparameters Used */}
            <div style={{ backgroundColor: 'var(--bg-main)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
              <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Sliders size={14} color="var(--primary-color)" />
                Hyperparameter Configuration
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {Object.entries(model.default_parameters || {}).map(([key, val]) => (
                  <div key={key} style={{ padding: '8px 10px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>
                      {key.replace(/_/g, ' ')}
                    </span>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
                      {String(val)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Model Strengths & Limitations */}
            <div style={{ backgroundColor: 'var(--bg-main)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
              <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--warning-color)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <AlertTriangle size={14} />
                Considerations & Limitations
              </h4>
              <ul style={{ paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {limitations.map((lim, i) => (
                  <li key={i} style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                    {lim}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Right Column: Execution Summary & Metrics */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {cached ? (
              <>
                {/* Prediction Summary KPI */}
                <div style={{ backgroundColor: 'var(--bg-main)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                  <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Activity size={14} color="var(--primary-color)" />
                    Inference Execution Summary
                  </h4>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                    <div style={{ padding: '10px 12px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Total Records</span>
                      <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>
                        {summary?.total_transactions?.toLocaleString()}
                      </div>
                    </div>

                    <div style={{ padding: '10px 12px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Runtime Latency</span>
                      <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--primary-color)', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
                        {summary?.execution_time_ms} ms
                      </div>
                    </div>

                    <div style={{ padding: '10px 12px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--danger-bg)', border: '1px solid var(--danger-border)' }}>
                      <span style={{ fontSize: '11px', color: 'var(--danger-color)' }}>Suspicious Flagged</span>
                      <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--danger-color)', marginTop: '2px' }}>
                        {summary?.anomalies_detected}{' '}
                        <span style={{ fontSize: '12px', fontWeight: 500 }}>({summary?.anomaly_rate}%)</span>
                      </div>
                    </div>

                    <div style={{ padding: '10px 12px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--success-bg)', border: '1px solid var(--success-border)' }}>
                      <span style={{ fontSize: '11px', color: 'var(--success-color)' }}>Normal Approved</span>
                      <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--success-color)', marginTop: '2px' }}>
                        {summary?.normal_detected?.toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Ground Truth Validation Metrics */}
                {hasGroundTruth && metrics ? (
                  <div style={{ backgroundColor: 'var(--bg-main)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                    <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--success-color)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <CheckCircle2 size={14} />
                      Validation Metrics (Ground Truth)
                    </h4>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '14px' }}>
                      <div style={{ padding: '8px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                        <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Precision</span>
                        <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--primary-color)', fontFamily: 'var(--font-mono)' }}>
                          {(metrics.precision * 100).toFixed(1)}%
                        </div>
                      </div>

                      <div style={{ padding: '8px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                        <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Recall</span>
                        <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--success-color)', fontFamily: 'var(--font-mono)' }}>
                          {(metrics.recall * 100).toFixed(1)}%
                        </div>
                      </div>

                      <div style={{ padding: '8px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                        <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>F1-Score</span>
                        <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--warning-color)', fontFamily: 'var(--font-mono)' }}>
                          {(metrics.f1_score * 100).toFixed(1)}%
                        </div>
                      </div>
                    </div>

                    {/* Confusion Matrix Mini Grid */}
                    {cm && (
                      <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
                        <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>
                          Confusion Matrix (Actual vs Predicted)
                        </span>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '12px' }}>
                          <div style={{ padding: '8px 10px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--success-bg)', border: '1px solid var(--success-border)' }}>
                            <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>True Negatives</span>
                            <div style={{ fontWeight: 700, color: 'var(--success-color)', fontSize: '14px' }}>{cm.true_negatives}</div>
                          </div>
                          <div style={{ padding: '8px 10px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--warning-bg)', border: '1px solid var(--warning-border)' }}>
                            <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>False Positives</span>
                            <div style={{ fontWeight: 700, color: 'var(--warning-color)', fontSize: '14px' }}>{cm.false_positives}</div>
                          </div>
                          <div style={{ padding: '8px 10px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--danger-bg)', border: '1px solid var(--danger-border)' }}>
                            <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>False Negatives</span>
                            <div style={{ fontWeight: 700, color: 'var(--danger-color)', fontSize: '14px' }}>{cm.false_negatives}</div>
                          </div>
                          <div style={{ padding: '8px 10px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--primary-light)', border: '1px solid var(--border-color)' }}>
                            <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>True Positives</span>
                            <div style={{ fontWeight: 700, color: 'var(--primary-color)', fontSize: '14px' }}>{cm.true_positives}</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ backgroundColor: 'var(--bg-main)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px dashed var(--border-color)', textAlign: 'center' }}>
                    <Info size={18} color="var(--text-secondary)" style={{ margin: '0 auto 6px' }} />
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                      Ground-truth validation metrics are displayed when labeled fraud targets (e.g. Class column) are present in the dataset.
                    </p>
                  </div>
                )}
              </>
            ) : (
              <div style={{ backgroundColor: 'var(--bg-main)', padding: '32px 20px', borderRadius: 'var(--radius-md)', border: '1px dashed var(--border-color)', textAlign: 'center', color: 'var(--text-secondary)' }}>
                <Clock size={24} color="var(--text-muted)" style={{ margin: '0 auto 10px' }} />
                <h4 style={{ fontSize: '15px', color: 'var(--text-primary)', marginBottom: '4px' }}>
                  No Run History for this Model
                </h4>
                <p style={{ fontSize: '13px', maxWidth: '300px', margin: '0 auto' }}>
                  Execute this algorithm on the current dataset to generate detailed inference metrics.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
