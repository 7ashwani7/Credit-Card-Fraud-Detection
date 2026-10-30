import React, { useState } from 'react';
import { Sliders, Loader2, ChevronDown, ChevronUp, Check, Play, CheckCircle2, AlertCircle, Circle } from 'lucide-react';

export default function ModelCard({ 
  model, 
  isActive, 
  onRunModel, 
  onTrainModel,
  isRunning,
  isTraining 
}) {
  const [params, setParams] = useState(model.default_parameters || model.parameters || {});
  const [showConfig, setShowConfig] = useState(false);

  const cached = model.cached_results;
  const metrics = cached?.evaluation?.metrics;
  const hasGroundTruth = cached?.evaluation?.has_ground_truth;

  // Determine training status: "trained", "training", "failed", "not_trained"
  let modelStatus = model.status || (cached ? 'trained' : 'not_trained');
  if (isTraining) {
    modelStatus = 'training';
  } else if (isRunning) {
    modelStatus = 'running';
  }

  const handleParamChange = (key, value) => {
    setParams(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleTrain = () => {
    if (onTrainModel) {
      onTrainModel(model.key, params);
    }
  };

  const handleRun = () => {
    if (onRunModel) {
      onRunModel(model.key, params);
    }
  };

  const renderStatusBadge = () => {
    switch (modelStatus) {
      case 'training':
        return (
          <span style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '4px', 
            fontSize: '11px', 
            fontWeight: 600, 
            color: 'var(--primary-color)', 
            backgroundColor: 'var(--primary-light)', 
            padding: '2px 8px', 
            borderRadius: 'var(--radius-sm)' 
          }}>
            <Loader2 size={11} className="spin-icon" />
            <span>● Training</span>
          </span>
        );
      case 'trained':
        return (
          <span style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '4px', 
            fontSize: '11px', 
            fontWeight: 600, 
            color: 'var(--success-color)', 
            backgroundColor: 'var(--success-bg)', 
            padding: '2px 8px', 
            borderRadius: 'var(--radius-sm)' 
          }}>
            <Check size={11} />
            <span>✓ Trained</span>
          </span>
        );
      case 'failed':
        return (
          <span style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '4px', 
            fontSize: '11px', 
            fontWeight: 600, 
            color: 'var(--danger-color)', 
            backgroundColor: 'var(--danger-bg)', 
            padding: '2px 8px', 
            borderRadius: 'var(--radius-sm)' 
          }}>
            <AlertCircle size={11} />
            <span>✕ Failed</span>
          </span>
        );
      default:
        return (
          <span style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '4px', 
            fontSize: '11px', 
            fontWeight: 500, 
            color: 'var(--text-secondary)', 
            backgroundColor: 'var(--bg-subtle)', 
            border: '1px solid var(--border-color)',
            padding: '2px 8px', 
            borderRadius: 'var(--radius-sm)' 
          }}>
            <Circle size={9} />
            <span>○ Not Trained</span>
          </span>
        );
    }
  };

  const MODEL_META = {
    isolation_forest: {
      name: 'Isolation Forest',
      category: 'Tree Ensemble',
      description: 'Isolates anomalies by recursive partitioning. Fewer splits identify outliers.'
    },
    lof: {
      name: 'Local Outlier Factor (LOF)',
      category: 'Density-based',
      description: 'Compares local density against neighboring clusters (novelty=True).'
    },
    one_class_svm: {
      name: 'One-Class SVM',
      category: 'Kernel Boundary',
      description: 'Learns a maximum-margin support vector boundary enclosing normal records.'
    },
    autoencoder: {
      name: 'Neural Autoencoder',
      category: 'Deep Learning',
      description: 'Reconstructs data through latent bottleneck. High MSE indicates anomaly.'
    }
  };

  const meta = MODEL_META[model.key] || {
    name: model.name,
    category: model.category || 'ML Model',
    description: model.description
  };

  const trainingTimeDisplay = model.training_time != null 
    ? `${model.training_time}s` 
    : (cached?.summary?.training_time_sec != null ? `${cached.summary.training_time_sec}s` : '—');

  const anomaliesCountDisplay = model.anomalies_detected != null 
    ? model.anomalies_detected 
    : (cached?.summary?.anomalies_detected != null ? cached.summary.anomalies_detected : '—');

  const anomalyRateDisplay = model.anomaly_rate != null 
    ? `${model.anomaly_rate}%` 
    : (cached?.summary?.anomaly_rate != null ? `${cached.summary.anomaly_rate}%` : '—');

  return (
    <div className={`model-card ${isActive ? 'model-card-active' : ''}`} style={{
      borderColor: isActive ? 'var(--primary-color)' : undefined
    }}>
      <div>
        {/* Top: Category & Status Badge */}
        <div className="model-card-top">
          <span className="model-category-badge">
            {meta.category}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {isActive && (
              <span style={{ 
                fontSize: '11px', 
                fontWeight: 600, 
                color: 'var(--primary-color)',
                backgroundColor: 'var(--primary-light)',
                padding: '2px 6px',
                borderRadius: 'var(--radius-sm)'
              }}>
                Active
              </span>
            )}
            {renderStatusBadge()}
          </div>
        </div>

        {/* Model Name & Description */}
        <h3 className="model-title">
          {meta.name}
        </h3>
        <p className="model-desc">
          {meta.description}
        </p>

        {/* Expandable: Tune Hyperparameters */}
        <div>
          <button 
            type="button"
            onClick={() => setShowConfig(!showConfig)}
            className="model-tune-toggle"
            aria-expanded={showConfig}
          >
            <Sliders size={13} />
            <span>Tune Parameters</span>
            {showConfig ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>

          {showConfig && (
            <div className="model-params-box">
              {model.key === 'isolation_forest' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div className="model-param-group">
                    <label className="model-param-label">Contamination</label>
                    <input 
                      type="number" 
                      step="0.01" 
                      min="0.005" 
                      max="0.5"
                      value={params.contamination ?? 0.02} 
                      onChange={(e) => handleParamChange('contamination', parseFloat(e.target.value))}
                      className="model-param-input"
                    />
                  </div>
                  <div className="model-param-group">
                    <label className="model-param-label">Estimators</label>
                    <input 
                      type="number" 
                      step="10" 
                      min="20" 
                      max="300"
                      value={params.n_estimators ?? 100} 
                      onChange={(e) => handleParamChange('n_estimators', parseInt(e.target.value, 10))}
                      className="model-param-input"
                    />
                  </div>
                </div>
              )}

              {model.key === 'lof' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div className="model-param-group">
                    <label className="model-param-label">Neighbors</label>
                    <input 
                      type="number" 
                      step="1" 
                      min="5" 
                      max="100"
                      value={params.n_neighbors ?? 20} 
                      onChange={(e) => handleParamChange('n_neighbors', parseInt(e.target.value, 10))}
                      className="model-param-input"
                    />
                  </div>
                  <div className="model-param-group">
                    <label className="model-param-label">Contamination</label>
                    <input 
                      type="number" 
                      step="0.01" 
                      min="0.005" 
                      max="0.5"
                      value={params.contamination ?? 0.02} 
                      onChange={(e) => handleParamChange('contamination', parseFloat(e.target.value))}
                      className="model-param-input"
                    />
                  </div>
                </div>
              )}

              {model.key === 'one_class_svm' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                  <div className="model-param-group">
                    <label className="model-param-label">Kernel</label>
                    <select 
                      value={params.kernel ?? 'rbf'} 
                      onChange={(e) => handleParamChange('kernel', e.target.value)}
                      className="model-param-input"
                    >
                      <option value="rbf">RBF</option>
                      <option value="linear">Linear</option>
                      <option value="poly">Poly</option>
                      <option value="sigmoid">Sigmoid</option>
                    </select>
                  </div>
                  <div className="model-param-group">
                    <label className="model-param-label">Nu</label>
                    <input 
                      type="number" 
                      step="0.01" 
                      min="0.01" 
                      max="0.2"
                      value={params.nu ?? 0.03} 
                      onChange={(e) => handleParamChange('nu', parseFloat(e.target.value))}
                      className="model-param-input"
                    />
                  </div>
                  <div className="model-param-group">
                    <label className="model-param-label">Gamma</label>
                    <select
                      value={params.gamma ?? 'scale'} 
                      onChange={(e) => handleParamChange('gamma', e.target.value)}
                      className="model-param-input"
                    >
                      <option value="scale">Scale</option>
                      <option value="auto">Auto</option>
                    </select>
                  </div>
                </div>
              )}

              {model.key === 'autoencoder' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div className="model-param-group">
                    <label className="model-param-label">Contamination</label>
                    <input 
                      type="number" 
                      step="0.01" 
                      min="0.005" 
                      max="0.5"
                      value={params.contamination ?? 0.02} 
                      onChange={(e) => handleParamChange('contamination', parseFloat(e.target.value))}
                      className="model-param-input"
                    />
                  </div>
                  <div className="model-param-group">
                    <label className="model-param-label">Epochs</label>
                    <input 
                      type="number" 
                      step="25" 
                      min="25" 
                      max="400"
                      value={params.epochs ?? params.max_iter ?? 150} 
                      onChange={(e) => handleParamChange('epochs', parseInt(e.target.value, 10))}
                      className="model-param-input"
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Training Results Section */}
        <div className="model-metrics-box">
          <div className="model-metric-grid" style={{ marginBottom: hasGroundTruth ? '10px' : '0' }}>
            <div className="model-metric-item">
              <span className="model-metric-label">Status</span>
              <span className="model-metric-val" style={{ 
                color: modelStatus === 'trained' ? 'var(--success-color)' : (modelStatus === 'failed' ? 'var(--danger-color)' : 'var(--text-primary)') 
              }}>
                {modelStatus === 'trained' ? 'Trained' : (modelStatus === 'failed' ? 'Failed' : 'Not Trained')}
              </span>
            </div>

            <div className="model-metric-item">
              <span className="model-metric-label">Training Time</span>
              <span className="model-metric-val" style={{ fontFamily: 'var(--font-mono)' }}>
                {trainingTimeDisplay}
              </span>
            </div>

            <div className="model-metric-item">
              <span className="model-metric-label">Anomalies Detected</span>
              <span className="model-metric-val" style={{ color: 'var(--danger-color)', fontFamily: 'var(--font-mono)' }}>
                {anomaliesCountDisplay}
              </span>
            </div>

            <div className="model-metric-item">
              <span className="model-metric-label">Anomaly Rate</span>
              <span className="model-metric-val" style={{ fontFamily: 'var(--font-mono)' }}>
                {anomalyRateDisplay}
              </span>
            </div>
          </div>

          {hasGroundTruth && metrics && (
            <div 
              style={{ 
                paddingTop: '8px', 
                borderTop: '1px solid var(--border-color)', 
                display: 'grid', 
                gridTemplateColumns: 'repeat(3, 1fr)', 
                gap: '6px' 
              }}
            >
              <div className="model-metric-item">
                <span className="model-metric-label">Precision</span>
                <span className="model-metric-val">
                  {metrics.precision != null ? `${(metrics.precision * 100).toFixed(1)}%` : 'N/A'}
                </span>
              </div>

              <div className="model-metric-item">
                <span className="model-metric-label">Recall</span>
                <span className="model-metric-val">
                  {metrics.recall != null ? `${(metrics.recall * 100).toFixed(1)}%` : 'N/A'}
                </span>
              </div>

              <div className="model-metric-item">
                <span className="model-metric-label">F1 Score</span>
                <span className="model-metric-val">
                  {metrics.f1_score != null ? `${(metrics.f1_score * 100).toFixed(1)}%` : 'N/A'}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons: Train Model + Run / Set Active */}
      <div style={{ display: 'flex', gap: '8px', marginTop: 'auto', paddingTop: '12px' }}>
        <button 
          type="button"
          onClick={handleTrain}
          disabled={isTraining || isRunning}
          className="btn btn-secondary"
          style={{ flex: 1 }}
          title={`Train ${meta.name} on training feature set`}
        >
          {isTraining ? (
            <>
              <Loader2 size={13} className="spin-icon" />
              <span>Training...</span>
            </>
          ) : (
            <span>Train {meta.name.split(' ')[0]}</span>
          )}
        </button>

        <button 
          type="button"
          onClick={handleRun}
          disabled={isRunning || isTraining}
          className={`btn ${isActive ? 'btn-secondary' : 'btn-primary'}`}
          style={{ flex: 1 }}
          title={`Set ${meta.name} as active model and run predictions`}
        >
          {isRunning ? (
            <>
              <Loader2 size={13} className="spin-icon" />
              <span>Applying...</span>
            </>
          ) : (
            <span>{isActive ? 'Active Model' : 'Set Active'}</span>
          )}
        </button>
      </div>
    </div>
  );
}
