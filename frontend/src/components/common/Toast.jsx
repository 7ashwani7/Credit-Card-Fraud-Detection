import React from 'react';
import { X, CheckCircle2, AlertCircle } from 'lucide-react';

export default function Toast({ toast, onClose }) {
  if (!toast) return null;

  const isError = toast.type === 'error';

  return (
    <div
      role="alert"
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '10px 16px',
        borderRadius: 'var(--radius-md)',
        backgroundColor: 'var(--bg-surface)',
        border: `1px solid ${isError ? 'var(--danger-border)' : 'var(--border-color)'}`,
        boxShadow: 'var(--shadow-dropdown)',
        color: 'var(--text-primary)',
        maxWidth: '420px',
        fontSize: '13px',
        transition: 'background-color 0.2s ease, color 0.2s ease, border-color 0.2s ease'
      }}
    >
      {isError ? (
        <AlertCircle size={16} color="var(--danger-color)" style={{ flexShrink: 0 }} />
      ) : (
        <CheckCircle2 size={16} color="var(--success-color)" style={{ flexShrink: 0 }} />
      )}
      <span style={{ flex: 1 }}>{toast.message}</span>
      <button
        onClick={onClose}
        style={{
          background: 'none',
          border: 'none',
          color: 'var(--text-secondary)',
          cursor: 'pointer',
          padding: '2px',
          display: 'flex'
        }}
        aria-label="Dismiss"
      >
        <X size={14} />
      </button>
    </div>
  );
}
