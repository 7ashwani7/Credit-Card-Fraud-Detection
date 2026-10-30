import React from 'react';
import { Database } from 'lucide-react';

export default function EmptyState({
  icon: Icon = Database,
  title = 'No Data Available',
  description = 'There is currently no data to display.',
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction
}) {
  return (
    <div
      className="simple-card"
      style={{
        padding: '48px 24px',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        border: '1px dashed var(--border-color)',
        maxWidth: '480px',
        margin: '0 auto'
      }}
    >
      <div
        style={{
          width: '48px',
          height: '48px',
          borderRadius: 'var(--radius-md)',
          backgroundColor: 'var(--primary-light)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--primary-color)',
          marginBottom: '16px'
        }}
      >
        <Icon size={24} />
      </div>

      <h3 style={{ fontSize: '17px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
        {title}
      </h3>

      <p style={{ fontSize: '14px', color: 'var(--text-secondary)', maxWidth: '400px', lineHeight: 1.5, marginBottom: actionLabel ? '20px' : '0' }}>
        {description}
      </p>

      {(actionLabel || secondaryActionLabel) && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
          {actionLabel && (
            <button onClick={onAction} className="btn btn-primary">
              {actionLabel}
            </button>
          )}
          {secondaryActionLabel && (
            <button onClick={onSecondaryAction} className="btn btn-secondary">
              {secondaryActionLabel}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
