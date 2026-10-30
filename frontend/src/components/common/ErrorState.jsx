import React from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';

export default function ErrorState({
  title = 'Operation Failed',
  message = 'An unexpected error occurred while processing your request.',
  onRetry,
  retryLabel = 'Try Again'
}) {
  return (
    <div
      className="simple-card"
      style={{
        padding: '36px 24px',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        maxWidth: '480px',
        margin: '0 auto',
        borderColor: 'var(--danger-border)'
      }}
    >
      <div
        style={{
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          backgroundColor: 'var(--danger-bg)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--danger-color)',
          marginBottom: '16px'
        }}
      >
        <AlertCircle size={24} />
      </div>

      <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
        {title}
      </h3>

      <p style={{ fontSize: '14px', color: 'var(--text-secondary)', maxWidth: '420px', lineHeight: 1.5, marginBottom: onRetry ? '20px' : '0' }}>
        {message}
      </p>

      {onRetry && (
        <button onClick={onRetry} className="btn btn-secondary">
          <RotateCcw size={15} />
          <span>{retryLabel}</span>
        </button>
      )}
    </div>
  );
}
