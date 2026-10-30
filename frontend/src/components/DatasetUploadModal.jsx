import React, { useState, useRef, useEffect } from 'react';
import { UploadCloud, FileText, X, Loader2, AlertCircle } from 'lucide-react';
import { api } from '../services/api';

export default function DatasetUploadModal({ onClose, onSuccess }) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !uploading) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [uploading, onClose]);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const validateAndSetFile = (file) => {
    setError(null);
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setError('Please select a valid CSV (.csv) file.');
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      setError('File size exceeds the 50MB limit.');
      return;
    }
    setSelectedFile(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setError(null);

    try {
      const response = await api.uploadDataset(selectedFile);
      onSuccess(response);
      onClose();
    } catch (err) {
      setUploading(false);
      setError(err.message || 'Failed to upload and process dataset.');
    }
  };

  return (
    <div 
      className="modal-backdrop"
      onClick={!uploading ? onClose : undefined}
      role="presentation"
    >
      <div 
        className="simple-card modal-container"
        style={{
          width: '100%',
          maxWidth: '520px',
          padding: '24px',
          backgroundColor: 'var(--bg-modal)',
          borderRadius: 'var(--radius-card)',
          boxShadow: 'var(--shadow-modal)',
          position: 'relative'
        }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="upload-modal-title"
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div>
            <h3 id="upload-modal-title" style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
              Upload CSV Dataset
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Upload credit card transaction data in CSV format
            </p>
          </div>
          {!uploading && (
            <button 
              type="button"
              onClick={onClose}
              className="btn btn-secondary btn-icon-only"
              style={{ padding: '6px' }}
              aria-label="Close upload modal"
              title="Close"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {uploading ? (
          <div style={{ padding: '36px 16px', textAlign: 'center' }}>
            <Loader2 size={26} className="spin-icon" style={{ color: 'var(--primary-color)', margin: '0 auto 12px' }} />
            <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)' }}>
              Processing dataset & running anomaly detection...
            </p>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
              Extracting features, computing PCA distributions, and calculating anomaly scores.
            </p>
          </div>
        ) : (
          <>
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  fileInputRef.current?.click();
                }
              }}
              tabIndex={0}
              role="button"
              aria-label="Upload CSV file dropzone"
              style={{
                border: `2px dashed ${dragActive ? 'var(--primary-color)' : 'var(--border-color)'}`,
                borderRadius: 'var(--radius-md)',
                padding: '28px 16px',
                textAlign: 'center',
                backgroundColor: dragActive ? 'var(--primary-light)' : 'var(--bg-main)',
                cursor: 'pointer',
                marginBottom: '16px',
                transition: 'border-color 0.15s ease, background-color 0.15s ease'
              }}
            >
              <input 
                ref={fileInputRef}
                type="file" 
                accept=".csv"
                style={{ display: 'none' }}
                onChange={handleFileChange}
                aria-label="Choose CSV file"
              />
              <UploadCloud size={28} color="var(--primary-color)" style={{ margin: '0 auto 8px' }} />
              <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                Click to browse or drag and drop CSV file
              </p>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>
                Supported format: CSV (V1–V28, Amount, Time) • Maximum size: 50MB
              </p>
            </div>

            {selectedFile && (
              <div 
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--bg-main)',
                  border: '1px solid var(--border-color)',
                  marginBottom: '16px',
                  fontSize: '13px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                  <FileText size={16} color="var(--primary-color)" style={{ flexShrink: 0 }} />
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {selectedFile.name}
                  </span>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '12px', flexShrink: 0 }}>
                    ({(selectedFile.size / 1024).toFixed(1)} KB)
                  </span>
                </div>
                <button 
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedFile(null);
                  }}
                  className="btn btn-secondary btn-sm"
                  style={{ padding: '2px 8px', fontSize: '12px' }}
                  title="Remove selected file"
                >
                  Remove
                </button>
              </div>
            )}

            {error && (
              <div 
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--danger-bg)',
                  color: 'var(--danger-color)',
                  fontSize: '13px',
                  marginBottom: '16px',
                  border: '1px solid var(--danger-border)'
                }}
                role="alert"
              >
                <AlertCircle size={16} style={{ flexShrink: 0 }} />
                <span>{error}</span>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button 
                type="button"
                onClick={onClose} 
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button 
                type="button"
                onClick={handleUpload} 
                disabled={!selectedFile}
                className="btn btn-primary"
              >
                Upload & Process
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
