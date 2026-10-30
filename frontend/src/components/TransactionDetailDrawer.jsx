import React, { useState, useEffect } from 'react';
import { X, Copy, Check, TrendingUp, Layers } from 'lucide-react';
import { PredictionBadge, RiskBadge } from './FraudBadge';

export default function TransactionDetailDrawer({ transaction, onClose }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!transaction) return null;

  const allFeatures = transaction.all_features || {};
  const riskScore = typeof transaction.risk_score === 'number' ? Math.round(transaction.risk_score) : 0;
  const modelName = transaction.model_used?.name || (typeof transaction.model_used === 'string' ? transaction.model_used : 'Anomaly Suite');

  const handleCopyId = () => {
    if (!transaction.transaction_id) return;
    navigator.clipboard.writeText(String(transaction.transaction_id));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Determine risk bar color
  const riskBarColor = riskScore > 70 
    ? 'var(--danger-color)' 
    : riskScore > 30 
    ? 'var(--warning-color)' 
    : 'var(--success-color)';

  return (
    <div className="drawer-backdrop" onClick={onClose}>
      <div 
        className="drawer-content" 
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
      >
        {/* Drawer Header */}
        <div className="drawer-header">
          <div className="drawer-title-group">
            <div className="drawer-title-row">
              <h3 id="drawer-title" className="drawer-title">
                Transaction #{transaction.transaction_id}
              </h3>
              <button
                type="button"
                onClick={handleCopyId}
                className="btn btn-secondary btn-icon-only"
                style={{ padding: '4px 6px' }}
                title="Copy Transaction ID"
                aria-label="Copy Transaction ID"
              >
                {copied ? <Check size={13} color="var(--success-color)" /> : <Copy size={13} />}
              </button>
            </div>
            <p className="drawer-subtitle">
              Detailed Anomaly Detection & Feature Inspector
            </p>
          </div>

          <button 
            type="button"
            onClick={onClose}
            className="btn btn-secondary btn-icon-only"
            aria-label="Close drawer"
            title="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* Drawer Scrollable Body */}
        <div className="drawer-body">
          {/* Key Overview Metrics Grid */}
          <div className="drawer-overview-grid">
            <div className="drawer-metric-item">
              <span className="drawer-metric-label">Transaction ID</span>
              <span className="drawer-metric-value">{transaction.transaction_id}</span>
            </div>

            <div className="drawer-metric-item">
              <span className="drawer-metric-label">Amount</span>
              <span className="drawer-metric-value" style={{ color: 'var(--text-primary)' }}>
                ₹{transaction.amount?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>

            <div className="drawer-metric-item">
              <span className="drawer-metric-label">Time</span>
              <span className="drawer-metric-value">
                {typeof transaction.time === 'number' ? `${transaction.time.toFixed(1)}s` : `${transaction.time}s`}
              </span>
            </div>

            <div className="drawer-metric-item">
              <span className="drawer-metric-label">Prediction</span>
              <div style={{ marginTop: '3px' }}>
                <PredictionBadge prediction={transaction.prediction} />
              </div>
            </div>

            <div className="drawer-metric-item">
              <span className="drawer-metric-label">Risk Level</span>
              <div style={{ marginTop: '3px' }}>
                <RiskBadge level={transaction.risk_level} />
              </div>
            </div>

            <div className="drawer-metric-item">
              <span className="drawer-metric-label">Risk Score</span>
              <span className="drawer-metric-value" style={{ color: riskBarColor }}>
                {riskScore} / 100
              </span>
            </div>

            <div className="drawer-metric-item">
              <span className="drawer-metric-label">Anomaly Score</span>
              <span className="drawer-metric-value">
                {typeof transaction.anomaly_score === 'number' 
                  ? transaction.anomaly_score.toFixed(4) 
                  : (transaction.anomaly_score || '0.0000')}
              </span>
            </div>

            <div className="drawer-metric-item">
              <span className="drawer-metric-label">Model</span>
              <span className="drawer-metric-value" style={{ fontSize: '13px' }}>
                {modelName}
              </span>
            </div>

            {transaction.actual_class !== undefined && (
              <div className="drawer-metric-item" style={{ gridColumn: 'span 2' }}>
                <span className="drawer-metric-label">Ground Truth Label</span>
                <span className="drawer-metric-value" style={{ fontSize: '13px' }}>
                  {transaction.actual_class === 1 ? (
                    <span style={{ color: 'var(--danger-color)' }}>Fraud (Class 1)</span>
                  ) : (
                    <span style={{ color: 'var(--success-color)' }}>Normal (Class 0)</span>
                  )}
                </span>
              </div>
            )}
          </div>

          {/* Risk Score Progress Bar */}
          <div className="drawer-risk-meter">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                Normalized Risk Assessment
              </span>
              <span style={{ fontSize: '13px', fontWeight: 700, color: riskBarColor, fontFamily: 'var(--font-mono)' }}>
                {riskScore}%
              </span>
            </div>

            <div className="drawer-risk-bar">
              <div 
                className="drawer-risk-fill"
                style={{ 
                  width: `${Math.min(100, Math.max(0, riskScore))}%`,
                  backgroundColor: riskBarColor
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-secondary)' }}>
              <span>0-30 Low Risk</span>
              <span>31-70 Medium Risk</span>
              <span>71-100 High Risk</span>
            </div>
          </div>

          {/* Top Contributing Feature Deviations (If available) */}
          {Array.isArray(transaction.top_contributing_features) && transaction.top_contributing_features.length > 0 && (
            <div className="drawer-feature-section">
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <TrendingUp size={14} color="var(--primary-color)" />
                <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                  Top Anomaly Drivers (Feature Deviations)
                </h4>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>
                Features with the highest statistical deviation (z-score) from normal transactions:
              </p>

              <div className="drawer-contributing-list">
                {transaction.top_contributing_features.map((feat, idx) => (
                  <div key={idx} className="drawer-contributing-item">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--primary-color)' }}>
                        {feat.feature}
                      </span>
                      <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>
                        Val: <strong style={{ color: 'var(--text-primary)' }}>{feat.value}</strong> (Mean: {feat.mean})
                      </span>
                    </div>

                    <span className={`badge ${feat.z_score > 3.0 ? 'badge-danger' : 'badge-warning'}`}>
                      {feat.z_score}σ {feat.deviation_direction}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Feature values: V1 ... V28 */}
          <div className="drawer-feature-section">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Layers size={14} color="var(--primary-color)" />
                <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                  Feature Values (PCA V1 – V28)
                </h4>
              </div>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                {Object.keys(allFeatures).length} features recorded
              </span>
            </div>

            <div className="drawer-feature-grid">
              {Object.entries(allFeatures).map(([featName, featVal]) => (
                <div key={featName} className="drawer-feature-card">
                  <div className="drawer-feature-name">{featName}</div>
                  <div className="drawer-feature-value" title={String(featVal)}>
                    {typeof featVal === 'number' ? featVal.toFixed(3) : String(featVal)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

