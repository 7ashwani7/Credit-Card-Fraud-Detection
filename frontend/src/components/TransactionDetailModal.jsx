import React from 'react';
import { X, ShieldAlert, ShieldCheck, TrendingUp, Cpu } from 'lucide-react';
import { PredictionBadge, RiskBadge } from './FraudBadge';

export default function TransactionDetailModal({ transaction, onClose }) {
  if (!transaction) return null;

  const isSuspicious = transaction.prediction?.toLowerCase() === 'suspicious';
  const riskScore = transaction.risk_score || 0;

  return (
    <div 
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(5, 8, 16, 0.75)',
        backdropFilter: 'blur(8px)',
        zIndex: 60,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
      onClick={onClose}
    >
      <div 
        className="glass-card"
        style={{
          width: '100%',
          maxWidth: '820px',
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: '28px',
          position: 'relative',
          background: '#0e1526',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid var(--border-card)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div 
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: isSuspicious ? 'var(--status-danger-bg)' : 'var(--status-normal-bg)',
                border: `1px solid ${isSuspicious ? 'var(--status-danger-border)' : 'var(--status-normal-border)'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: isSuspicious ? '#ef4444' : '#10b981'
              }}
            >
              {isSuspicious ? <ShieldAlert size={24} /> : <ShieldCheck size={24} />}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: '#ffffff' }}>
                  {transaction.transaction_id}
                </h2>
                <PredictionBadge prediction={transaction.prediction} />
                <RiskBadge level={transaction.risk_level} />
              </div>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                Evaluated by <span style={{ color: '#818cf8', fontWeight: 600 }}>{transaction.model_used?.name || 'Anomaly Model'}</span>
              </p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="btn btn-secondary btn-sm"
            style={{ padding: '8px', borderRadius: '50%' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Top Metric Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px', marginBottom: '24px' }}>
          <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '14px 18px', borderRadius: '12px', border: '1px solid var(--border-card)' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Amount</span>
            <div style={{ fontSize: '1.35rem', fontWeight: 700, color: '#ffffff', marginTop: '4px' }}>
              ₹{transaction.amount?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>

          <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '14px 18px', borderRadius: '12px', border: '1px solid var(--border-card)' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Timestamp</span>
            <div style={{ fontSize: '1.15rem', fontWeight: 600, color: '#ffffff', marginTop: '4px' }}>
              {transaction.time}s <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>({(transaction.time / 3600).toFixed(1)} hrs)</span>
            </div>
          </div>

          <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '14px 18px', borderRadius: '12px', border: '1px solid var(--border-card)' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Anomaly Score</span>
            <div style={{ fontSize: '1.35rem', fontWeight: 700, color: isSuspicious ? '#ef4444' : '#38bdf8', marginTop: '4px' }}>
              {transaction.anomaly_score?.toFixed(4)}
            </div>
          </div>

          <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '14px 18px', borderRadius: '12px', border: '1px solid var(--border-card)' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Ground Truth (Class)</span>
            <div style={{ fontSize: '1.15rem', fontWeight: 600, color: '#ffffff', marginTop: '4px' }}>
              {transaction.actual_class !== undefined ? (
                transaction.actual_class === 1 ? (
                  <span style={{ color: '#ef4444' }}>Fraud (1)</span>
                ) : (
                  <span style={{ color: '#10b981' }}>Normal (0)</span>
                )
              ) : (
                <span style={{ color: 'var(--text-dim)' }}>Unlabeled</span>
              )}
            </div>
          </div>
        </div>

        {/* Risk Score Progress Bar */}
        <div style={{ marginBottom: '28px', background: 'rgba(255, 255, 255, 0.02)', padding: '18px 20px', borderRadius: '12px', border: '1px solid var(--border-card)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>
              Normalized Risk Score (0 – 100)
            </span>
            <span style={{ fontSize: '1.1rem', fontWeight: 700, color: riskScore > 70 ? '#ef4444' : riskScore > 30 ? '#f59e0b' : '#10b981' }}>
              {riskScore} / 100
            </span>
          </div>

          <div style={{ width: '100%', height: '10px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '5px', overflow: 'hidden' }}>
            <div 
              style={{
                width: `${Math.min(100, Math.max(0, riskScore))}%`,
                height: '100%',
                background: riskScore > 70 
                  ? 'linear-gradient(90deg, #f59e0b 0%, #ef4444 100%)' 
                  : riskScore > 30 
                  ? 'linear-gradient(90deg, #10b981 0%, #f59e0b 100%)' 
                  : 'linear-gradient(90deg, #06b6d4 0%, #10b981 100%)',
                borderRadius: '5px',
                transition: 'width 0.4s ease'
              }}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '6px' }}>
            <span>0 - 30: Low Risk (Safe)</span>
            <span>31 - 70: Medium Risk (Caution)</span>
            <span>71 - 100: High Risk (Anomalous)</span>
          </div>
        </div>

        {/* Feature Contribution Section */}
        {transaction.top_contributing_features && transaction.top_contributing_features.length > 0 && (
          <div style={{ marginBottom: '28px' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <TrendingUp size={16} color="#818cf8" />
              Top Anomaly Drivers (Feature Deviations from Mean)
            </h4>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '14px' }}>
              Features with the largest statistical deviation (z-score) from normal transactions in this dataset:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {transaction.top_contributing_features.map((feat, idx) => (
                <div 
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid var(--border-card)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: '#818cf8', width: '60px' }}>
                      {feat.feature}
                    </span>
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                      Value: <strong style={{ color: '#ffffff' }}>{feat.value}</strong> (Mean: {feat.mean})
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span 
                      className={`badge ${feat.z_score > 3.0 ? 'badge-danger' : 'badge-warning'}`}
                      style={{ fontSize: '0.72rem' }}
                    >
                      {feat.z_score}σ {feat.deviation_direction}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* All Feature Values Grid */}
        {transaction.all_features && (
          <div>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Cpu size={16} color="#06b6d4" />
              Full PCA Feature Matrix ({Object.keys(transaction.all_features).length} Features)
            </h4>
            <div 
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))',
                gap: '8px',
                maxHeight: '220px',
                overflowY: 'auto',
                padding: '12px',
                background: 'rgba(0, 0, 0, 0.25)',
                borderRadius: '10px',
                border: '1px solid var(--border-card)'
              }}
            >
              {Object.entries(transaction.all_features).map(([key, val]) => (
                <div 
                  key={key}
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    padding: '6px 8px',
                    borderRadius: '6px',
                    border: '1px solid rgba(255, 255, 255, 0.04)',
                    fontSize: '0.75rem'
                  }}
                >
                  <div style={{ color: 'var(--text-dim)', fontSize: '0.68rem', fontFamily: 'var(--font-mono)' }}>{key}</div>
                  <div style={{ color: 'var(--text-main)', fontWeight: 500, fontFamily: 'var(--font-mono)', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {typeof val === 'number' ? val.toFixed(3) : val}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
