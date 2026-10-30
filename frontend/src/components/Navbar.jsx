import React from 'react';
import { 
  UploadCloud, 
  RefreshCw, 
  Menu, 
  RotateCcw,
  Cpu
} from 'lucide-react';
import ThemeSelector from './ThemeSelector';

export default function Navbar({ 
  onUploadClick, 
  onRefreshClick, 
  onResetDemoClick,
  refreshing, 
  activeModel, 
  onModelChange, 
  _models = [], 
  _datasetSource,
  isDemo,
  onMenuToggle 
}) {
  const modelOptions = [
    { key: 'isolation_forest', label: 'Isolation Forest' },
    { key: 'lof', label: 'Local Outlier Factor (LOF)' },
    { key: 'one_class_svm', label: 'One-Class SVM' },
    { key: 'autoencoder', label: 'Neural Autoencoder' }
  ];

  return (
    <header className="app-navbar">
      {/* Left: Mobile Toggle & Project Branding */}
      <div className="navbar-left">
        <button 
          type="button"
          onClick={onMenuToggle}
          className="btn btn-secondary btn-icon-only navbar-menu-btn"
          aria-label="Toggle navigation drawer"
          title="Toggle navigation"
        >
          <Menu size={18} />
        </button>

        <div className="navbar-title-container">
          <div className="navbar-title-row">
            <h1 className="navbar-title">Credit Card Fraud Detection</h1>
            {isDemo ? (
              <span className="badge badge-neutral" title="Demo dataset active">
                Demo Data
              </span>
            ) : (
              <span className="badge badge-info" title="Custom dataset active">
                Custom CSV
              </span>
            )}
          </div>
          <p className="navbar-subtitle">
            Anomaly Detection & Transaction Risk Analysis
          </p>
        </div>
      </div>

      {/* Right: Model selector, Theme selector, Upload CSV, Refresh */}
      <div className="navbar-right">
        {/* Model selector (Secondary: Theme-aware border/background) */}
        <div className="navbar-model-selector" title="Select Anomaly Detection ML Model">
          <Cpu size={15} className="navbar-model-icon" />
          <span className="navbar-model-label">Model:</span>
          <select 
            value={activeModel} 
            onChange={(e) => onModelChange(e.target.value)}
            disabled={refreshing}
            className="navbar-model-select"
            aria-label="Select ML Model"
          >
            {modelOptions.map((opt) => (
              <option key={opt.key} value={opt.key}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Theme Selector: Sun -> Light, Moon -> Dark, Monitor -> System Default */}
        <ThemeSelector />

        {/* Upload CSV (Primary button: Blue) */}
        <button 
          type="button"
          onClick={onUploadClick}
          className="btn btn-primary navbar-upload-btn"
          title="Upload custom CSV dataset"
          disabled={refreshing}
        >
          <UploadCloud size={16} />
          <span>Upload CSV</span>
        </button>

        {/* Reset Demo button (Secondary: Theme-aware border/background) */}
        {!isDemo && (
          <button 
            type="button"
            onClick={onResetDemoClick}
            className="btn btn-secondary navbar-reset-btn"
            title="Reset to benchmark demo dataset"
            disabled={refreshing}
          >
            <RotateCcw size={15} />
            <span className="btn-label-text">Reset Demo</span>
          </button>
        )}

        {/* Refresh button (Secondary: Theme-aware border/background) */}
        <button 
          type="button"
          onClick={onRefreshClick}
          disabled={refreshing}
          className="btn btn-secondary btn-icon-only navbar-refresh-btn"
          title="Refresh data"
          aria-label="Refresh data"
        >
          <RefreshCw size={16} className={refreshing ? 'spin-icon' : ''} />
        </button>
      </div>
    </header>
  );
}
