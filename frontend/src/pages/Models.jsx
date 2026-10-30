import React, { useState, useEffect, useCallback } from 'react';
import { 
  Loader2, 
  BarChart2, 
  X, 
  AlertCircle, 
  Database, 
  Play, 
  CheckCircle2, 
  Layers, 
  History, 
  Sparkles, 
  Info,
  Check,
  Circle,
  HelpCircle
} from 'lucide-react';
import ModelCard from '../components/ModelCard';
import { api } from '../services/api';

export default function Models({ activeModel, onModelChanged, refreshTrigger }) {
  const [models, setModels] = useState([]);
  const [datasetStats, setDatasetStats] = useState(null);
  const [runningModelKey, setRunningModelKey] = useState(null);
  const [trainingModelKey, setTrainingModelKey] = useState(null);
  const [trainingAll, setTrainingAll] = useState(false);
  const [comparing, setComparing] = useState(false);
  const [comparisonResults, setComparisonResults] = useState(null);
  const [trainingHistory, setTrainingHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showCleaningStats, setShowCleaningStats] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const [modelsRes, statsRes, historyRes] = await Promise.all([
        api.getModels(),
        api.getDatasetStatistics(),
        api.getTrainingHistory().catch(() => ({ history: [] }))
      ]);
      setModels(modelsRes.models || []);
      setDatasetStats(statsRes);
      setTrainingHistory(historyRes.history || []);
    } catch (err) {
      console.error('Failed to load models or dataset statistics:', err);
      setErrorMessage('Could not load models or dataset details from server.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData, refreshTrigger, activeModel]);

  // Train an individual model
  const handleTrainModel = async (modelKey, params) => {
    setTrainingModelKey(modelKey);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      await api.trainModel(modelKey, params);
      setSuccessMessage(`Successfully trained ${modelKey.replace(/_/g, ' ').toUpperCase()}!`);
      await loadData();
      if (onModelChanged) onModelChanged(modelKey);
    } catch (err) {
      setErrorMessage(`Training failed: ${err.message}`);
    } finally {
      setTrainingModelKey(null);
    }
  };

  // Train all 4 models sequentially
  const handleTrainAllModels = async () => {
    setTrainingAll(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const res = await api.trainAllModels();
      setSuccessMessage('Successfully trained all 4 anomaly detection models!');
      await loadData();
      if (onModelChanged) onModelChanged('isolation_forest');
    } catch (err) {
      setErrorMessage(`Train all models failed: ${err.message}`);
    } finally {
      setTrainingAll(false);
    }
  };

  // Run / Set active model
  const handleRunModel = async (modelKey, params) => {
    setRunningModelKey(modelKey);
    setErrorMessage(null);
    try {
      await api.runModel(modelKey, params);
      await loadData();
      if (onModelChanged) onModelChanged(modelKey);
    } catch (err) {
      setErrorMessage(`Model activation failed: ${err.message}`);
    } finally {
      setRunningModelKey(null);
    }
  };

  // Benchmark / Comparison table
  const handleBenchmarkModels = async () => {
    setComparing(true);
    setErrorMessage(null);
    try {
      const res = await api.compareModels();
      setComparisonResults(res);
      await loadData();
    } catch (err) {
      setErrorMessage(`Model benchmark failed: ${err.message}`);
    } finally {
      setComparing(false);
    }
  };

  const isLabeled = datasetStats?.has_target ?? datasetStats?.is_labeled ?? false;
  const splitStats = datasetStats?.split_statistics || {};
  const cleaningStats = datasetStats?.cleaning_statistics || {};
  const beforeClean = cleaningStats?.before || {};
  const afterClean = cleaningStats?.after || {};

  return (
    <div className="models-container">
      {/* 1. Page Header */}
      <div className="models-header">
        <div>
          <h2 className="models-title">
            Anomaly Detection Models
          </h2>
          <p className="models-subtitle">
            Train, evaluate, and benchmark machine learning algorithms on transaction features.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <button 
            type="button"
            onClick={() => setShowHistory(!showHistory)}
            className="btn btn-secondary"
            title="View training history runs"
          >
            <History size={14} />
            <span>{showHistory ? 'Hide History' : 'Training History'}</span>
          </button>

          <button 
            type="button"
            onClick={handleBenchmarkModels}
            disabled={comparing || trainingAll || runningModelKey !== null}
            className="btn btn-secondary"
            title="Compare all models on test set"
          >
            {comparing ? (
              <>
                <Loader2 size={14} className="spin-icon" />
                <span>Benchmarking...</span>
              </>
            ) : (
              <>
                <BarChart2 size={14} />
                <span>Benchmark Models</span>
              </>
            )}
          </button>

          <button 
            type="button"
            onClick={handleTrainAllModels}
            disabled={trainingAll || runningModelKey !== null || trainingModelKey !== null}
            className="btn btn-primary"
            title="Train all 4 anomaly detection models sequentially"
          >
            {trainingAll ? (
              <>
                <Loader2 size={14} className="spin-icon" />
                <span>Training Models...</span>
              </>
            ) : (
              <>
                <Sparkles size={14} />
                <span>Train All Models</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Global Error Notice */}
      {errorMessage && (
        <div 
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px', 
            padding: '10px 14px', 
            backgroundColor: 'var(--danger-bg)', 
            color: 'var(--danger-color)', 
            border: '1px solid var(--danger-border)', 
            borderRadius: 'var(--radius-sm)',
            fontSize: '13px'
          }}
        >
          <AlertCircle size={16} />
          <span>{errorMessage}</span>
          <button 
            type="button" 
            onClick={() => setErrorMessage(null)} 
            style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Global Success Notice */}
      {successMessage && (
        <div 
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px', 
            padding: '10px 14px', 
            backgroundColor: 'var(--success-bg)', 
            color: 'var(--success-color)', 
            border: '1px solid var(--success-border)', 
            borderRadius: 'var(--radius-sm)',
            fontSize: '13px'
          }}
        >
          <CheckCircle2 size={16} />
          <span>{successMessage}</span>
          <button 
            type="button" 
            onClick={() => setSuccessMessage(null)} 
            style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* ==========================================================================
          2. DATASET TRAINING SECTION
          ========================================================================== */}
      <div className="simple-card" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Database size={18} color="var(--primary-color)" />
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
              Dataset Training Pipeline
            </h3>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* Labeled vs Unlabeled Status Badge */}
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              fontSize: '12px',
              fontWeight: 600,
              padding: '3px 10px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: isLabeled ? 'var(--success-bg)' : 'var(--bg-subtle)',
              color: isLabeled ? 'var(--success-color)' : 'var(--text-secondary)',
              border: `1px solid ${isLabeled ? 'var(--success-border)' : 'var(--border-color)'}`
            }}>
              {isLabeled ? <CheckCircle2 size={13} /> : <HelpCircle size={13} />}
              <span>{isLabeled ? 'Labeled Dataset' : 'Unlabeled Dataset'}</span>
            </span>

            <button
              type="button"
              onClick={() => setShowCleaningStats(!showCleaningStats)}
              className="btn btn-secondary btn-sm"
              title="Inspect before and after data cleaning statistics"
            >
              <span>{showCleaningStats ? 'Hide Cleaning Stats' : 'Cleaning Stats'}</span>
            </button>
          </div>
        </div>

        {/* Dataset Metadata Grid */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', 
          gap: '12px',
          marginBottom: '16px'
        }}>
          <div style={{ backgroundColor: 'var(--bg-subtle)', padding: '10px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 500 }}>Dataset</span>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={datasetStats?.dataset_source}>
              {datasetStats?.dataset_source || 'Standard Dataset'}
            </div>
          </div>

          <div style={{ backgroundColor: 'var(--bg-subtle)', padding: '10px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 500 }}>Total Rows</span>
            <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px', fontFamily: 'var(--font-mono)' }}>
              {datasetStats?.rows?.toLocaleString() ?? '—'}
            </div>
          </div>

          <div style={{ backgroundColor: 'var(--bg-subtle)', padding: '10px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 500 }}>Features</span>
            <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--primary-color)', marginTop: '2px', fontFamily: 'var(--font-mono)' }}>
              {datasetStats?.feature_count ?? datasetStats?.features?.length ?? '—'}
            </div>
          </div>

          <div style={{ backgroundColor: 'var(--bg-subtle)', padding: '10px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 500 }}>Training Samples</span>
            <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px', fontFamily: 'var(--font-mono)' }}>
              {splitStats?.training_samples?.toLocaleString() ?? '—'}
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 400, marginLeft: '4px' }}>
                ({splitStats?.training_split || '80%'})
              </span>
            </div>
          </div>

          <div style={{ backgroundColor: 'var(--bg-subtle)', padding: '10px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 500 }}>Testing Samples</span>
            <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px', fontFamily: 'var(--font-mono)' }}>
              {splitStats?.testing_samples?.toLocaleString() ?? '—'}
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 400, marginLeft: '4px' }}>
                ({splitStats?.testing_split || '20%'})
              </span>
            </div>
          </div>

          <div style={{ backgroundColor: 'var(--bg-subtle)', padding: '10px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 500 }}>Target Column</span>
            <div style={{ fontSize: '14px', fontWeight: 600, color: isLabeled ? 'var(--success-color)' : 'var(--text-secondary)', marginTop: '2px' }}>
              {datasetStats?.target_column || 'None (Unlabeled)'}
            </div>
          </div>

          <div style={{ backgroundColor: 'var(--bg-subtle)', padding: '10px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 500 }}>Missing Values</span>
            <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px', fontFamily: 'var(--font-mono)' }}>
              0 <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>(Imputed)</span>
            </div>
          </div>

          <div style={{ backgroundColor: 'var(--bg-subtle)', padding: '10px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 500 }}>Duplicates</span>
            <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px', fontFamily: 'var(--font-mono)' }}>
              0 <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>(Cleaned)</span>
            </div>
          </div>
        </div>

        {/* Optional Before/After Cleaning Stats Details */}
        {showCleaningStats && (
          <div style={{
            backgroundColor: 'var(--bg-subtle)',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-color)',
            padding: '14px',
            marginBottom: '16px'
          }}>
            <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 10px' }}>
              Data Cleaning Statistics (Before vs After)
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Before Cleaning:</span>
                <ul style={{ margin: '4px 0 0', paddingLeft: '18px', fontSize: '12px', color: 'var(--text-primary)' }}>
                  <li>Rows: <strong>{beforeClean.rows?.toLocaleString() ?? '—'}</strong></li>
                  <li>Columns: <strong>{beforeClean.columns ?? '—'}</strong></li>
                  <li>Missing Values: <strong>{beforeClean.missing_values ?? 0}</strong></li>
                  <li>Duplicate Rows: <strong>{beforeClean.duplicate_rows?.toLocaleString() ?? 0}</strong></li>
                </ul>
              </div>
              <div>
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--success-color)' }}>After Cleaning:</span>
                <ul style={{ margin: '4px 0 0', paddingLeft: '18px', fontSize: '12px', color: 'var(--text-primary)' }}>
                  <li>Rows: <strong>{afterClean.rows?.toLocaleString() ?? '—'}</strong></li>
                  <li>Columns: <strong>{afterClean.columns ?? '—'}</strong></li>
                  <li>Missing Values: <strong>{afterClean.missing_values ?? 0} (Median Imputed)</strong></li>
                  <li>Duplicate Rows: <strong>{afterClean.duplicate_rows ?? 0} (Exact Removed)</strong></li>
                </ul>
              </div>
            </div>
            <p style={{ margin: '8px 0 0', fontSize: '11px', color: 'var(--text-secondary)' }}>
              * Legitimate rare transactions and fraud anomalies were strictly preserved. StandardScaler fitted ONLY on training split.
            </p>
          </div>
        )}

        {/* Individual Model Training Buttons Bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '8px',
          paddingTop: '12px',
          borderTop: '1px solid var(--border-color)'
        }}>
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
            Model Training Actions:
          </span>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => handleTrainModel('isolation_forest')}
              disabled={trainingModelKey !== null || trainingAll}
              className="btn btn-secondary btn-sm"
              title="Train Isolation Forest"
            >
              {trainingModelKey === 'isolation_forest' ? <Loader2 size={13} className="spin-icon" /> : null}
              <span>Train Isolation Forest</span>
            </button>

            <button
              type="button"
              onClick={() => handleTrainModel('lof')}
              disabled={trainingModelKey !== null || trainingAll}
              className="btn btn-secondary btn-sm"
              title="Train Local Outlier Factor (novelty=True)"
            >
              {trainingModelKey === 'lof' ? <Loader2 size={13} className="spin-icon" /> : null}
              <span>Train LOF</span>
            </button>

            <button
              type="button"
              onClick={() => handleTrainModel('one_class_svm')}
              disabled={trainingModelKey !== null || trainingAll}
              className="btn btn-secondary btn-sm"
              title="Train One-Class SVM"
            >
              {trainingModelKey === 'one_class_svm' ? <Loader2 size={13} className="spin-icon" /> : null}
              <span>Train One-Class SVM</span>
            </button>

            <button
              type="button"
              onClick={() => handleTrainModel('autoencoder')}
              disabled={trainingModelKey !== null || trainingAll}
              className="btn btn-secondary btn-sm"
              title="Train Neural Autoencoder"
            >
              {trainingModelKey === 'autoencoder' ? <Loader2 size={13} className="spin-icon" /> : null}
              <span>Train Autoencoder</span>
            </button>

            <button
              type="button"
              onClick={handleTrainAllModels}
              disabled={trainingAll || trainingModelKey !== null}
              className="btn btn-primary btn-sm"
              title="Train all 4 models sequentially"
            >
              {trainingAll ? <Loader2 size={13} className="spin-icon" /> : <Sparkles size={13} />}
              <span>Train All Models</span>
            </button>
          </div>
        </div>
      </div>

      {/* ==========================================================================
          3. REAL-TIME TRAINING PROGRESS INDICATOR
          ========================================================================== */}
      {(trainingAll || trainingModelKey !== null) && (
        <div className="simple-card" style={{ padding: '16px 20px', borderLeft: '4px solid var(--primary-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
            <Loader2 size={18} className="spin-icon" color="var(--primary-color)" />
            <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
              Training Models...
            </h4>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
            {[
              { key: 'isolation_forest', label: 'Isolation Forest' },
              { key: 'lof', label: 'LOF' },
              { key: 'one_class_svm', label: 'One-Class SVM' },
              { key: 'autoencoder', label: 'Autoencoder' }
            ].map(m => {
              const mState = models.find(mod => mod.key === m.key);
              const isCurrentlyTraining = trainingAll || trainingModelKey === m.key;
              const isDone = mState?.status === 'trained';

              return (
                <div key={m.key} style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  backgroundColor: 'var(--bg-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '12px'
                }}>
                  <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{m.label}</span>
                  {isCurrentlyTraining && !isDone ? (
                    <span style={{ color: 'var(--primary-color)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Loader2 size={12} className="spin-icon" />
                      <span>● Training</span>
                    </span>
                  ) : isDone ? (
                    <span style={{ color: 'var(--success-color)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Check size={13} />
                      <span>✓ Completed</span>
                    </span>
                  ) : (
                    <span style={{ color: 'var(--text-secondary)' }}>○ Queued</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ==========================================================================
          4. MODELS GRID (4 CARDS)
          ========================================================================== */}
      <div className="models-grid">
        {loading && models.length === 0 ? (
          <div style={{ padding: '36px', textAlign: 'center', color: 'var(--text-secondary)', gridColumn: '1 / -1' }}>
            <Loader2 size={24} className="spin-icon" style={{ margin: '0 auto 8px' }} />
            <p style={{ margin: 0 }}>Loading anomaly models...</p>
          </div>
        ) : (
          models.map((m) => (
            <ModelCard 
              key={m.key}
              model={m}
              isActive={m.key === activeModel}
              onRunModel={handleRunModel}
              onTrainModel={handleTrainModel}
              isRunning={runningModelKey === m.key}
              isTraining={trainingModelKey === m.key || (trainingAll && m.status !== 'trained')}
            />
          ))
        )}
      </div>

      {/* ==========================================================================
          5. MODEL COMPARISON TABLE
          ========================================================================== */}
      {comparisonResults && comparisonResults.comparison && (
        <div className="model-comparison-card">
          <div className="model-comparison-header">
            <div>
              <h3 className="model-comparison-title">
                Model Comparison Benchmark
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '2px 0 0' }}>
                Actual comparative evaluation across runtime, detected anomalies, and validation metrics on the test split.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setComparisonResults(null)}
              className="btn btn-secondary btn-icon-only"
              title="Close comparison table"
              aria-label="Close comparison table"
            >
              <X size={15} />
            </button>
          </div>

          <div className="table-wrapper">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Model</th>
                  <th>Training Time</th>
                  <th>Anomalies</th>
                  <th>Anomaly Rate</th>
                  <th>Precision</th>
                  <th>Recall</th>
                  <th>F1 Score</th>
                  <th>ROC-AUC</th>
                  <th>PR-AUC</th>
                </tr>
              </thead>
              <tbody>
                {comparisonResults.comparison.map((m) => {
                  if (m.error) {
                    return (
                      <tr key={m.key}>
                        <td style={{ fontWeight: 600 }}>{m.name}</td>
                        <td colSpan="8" style={{ color: 'var(--danger-color)', fontSize: '12px' }}>
                          Error: {m.error}
                        </td>
                      </tr>
                    );
                  }

                  const hasPrecision = m.precision !== null && m.precision !== undefined;
                  const hasRecall = m.recall !== null && m.recall !== undefined;
                  const hasF1 = m.f1_score !== null && m.f1_score !== undefined;
                  const hasRocAuc = m.roc_auc !== null && m.roc_auc !== undefined;
                  const hasPrAuc = m.pr_auc !== null && m.pr_auc !== undefined;

                  return (
                    <tr key={m.key}>
                      <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                        {m.name}
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)' }}>
                        {m.training_time != null ? `${m.training_time}s` : `${m.execution_time_ms}ms`}
                      </td>
                      <td style={{ color: 'var(--danger-color)', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
                        {m.anomalies_detected}
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)' }}>
                        {m.anomaly_rate}%
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)' }}>
                        {hasPrecision ? `${(m.precision * 100).toFixed(1)}%` : 'N/A'}
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)' }}>
                        {hasRecall ? `${(m.recall * 100).toFixed(1)}%` : 'N/A'}
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                        {hasF1 ? `${(m.f1_score * 100).toFixed(1)}%` : 'N/A'}
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)' }}>
                        {hasRocAuc ? `${(m.roc_auc * 100).toFixed(1)}%` : 'N/A'}
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)' }}>
                        {hasPrAuc ? `${(m.pr_auc * 100).toFixed(1)}%` : 'N/A'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==========================================================================
          6. TRAINING HISTORY SECTION
          ========================================================================== */}
      {showHistory && (
        <div className="simple-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                Training History
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '2px 0 0' }}>
                Chronological log of training runs, hyperparameters, durations, and anomaly results.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowHistory(false)}
              className="btn btn-secondary btn-icon-only"
              title="Close history"
              aria-label="Close history"
            >
              <X size={15} />
            </button>
          </div>

          <div className="table-wrapper">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Training Date</th>
                  <th>Dataset</th>
                  <th>Rows</th>
                  <th>Features</th>
                  <th>Model</th>
                  <th>Training Time</th>
                  <th>Anomalies</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {trainingHistory.length === 0 ? (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-secondary)' }}>
                      No previous training runs recorded.
                    </td>
                  </tr>
                ) : (
                  trainingHistory.map((h, idx) => (
                    <tr key={idx}>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
                        {h.training_date}
                      </td>
                      <td style={{ maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={h.dataset}>
                        {h.dataset}
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)' }}>
                        {h.rows?.toLocaleString() ?? '—'}
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)' }}>
                        {h.features}
                      </td>
                      <td style={{ fontWeight: 600 }}>
                        {h.model}
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)' }}>
                        {h.training_time}
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--danger-color)' }}>
                        {h.anomalies_detected ?? '—'} ({h.anomaly_rate ?? '—'})
                      </td>
                      <td>
                        <span style={{
                          fontSize: '11px',
                          fontWeight: 600,
                          padding: '2px 6px',
                          borderRadius: 'var(--radius-sm)',
                          backgroundColor: h.status === 'Completed' ? 'var(--success-bg)' : 'var(--danger-bg)',
                          color: h.status === 'Completed' ? 'var(--success-color)' : 'var(--danger-color)'
                        }}>
                          {h.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
