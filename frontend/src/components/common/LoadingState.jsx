import React, { useState, useEffect } from 'react';
import { Loader2, CheckCircle2 } from 'lucide-react';

export default function LoadingState({
  title = 'Processing...',
  steps = [
    'Preparing dataset...',
    'Scaling features with StandardScaler...',
    'Fitting anomaly detection model...',
    'Calculating reconstruction / density scores...',
    'Generating performance metrics...'
  ],
  currentStepIndex
}) {
  const [internalStep, setInternalStep] = useState(0);

  useEffect(() => {
    if (currentStepIndex !== undefined) return;
    const interval = setInterval(() => {
      setInternalStep((prev) => (prev < steps.length - 1 ? prev + 1 : prev));
    }, 450);
    return () => clearInterval(interval);
  }, [steps.length, currentStepIndex]);

  const activeIndex = currentStepIndex !== undefined ? currentStepIndex : internalStep;

  return (
    <div
      className="simple-card"
      style={{
        padding: '36px 28px',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        maxWidth: '480px',
        margin: '0 auto'
      }}
    >
      <div
        style={{
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          backgroundColor: 'var(--primary-light)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--primary-color)',
          marginBottom: '16px'
        }}
      >
        <Loader2 size={24} className="spin-icon" />
      </div>

      <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
        {title}
      </h3>

      {/* Progress step indicator */}
      <div style={{ width: '100%', marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {steps.map((step, idx) => {
          const isDone = idx < activeIndex;
          const isCurrent = idx === activeIndex;

          return (
            <div
              key={idx}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '8px 12px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: isCurrent ? 'var(--primary-light)' : 'transparent',
                border: `1px solid ${isCurrent ? 'var(--primary-color)' : 'transparent'}`,
                fontSize: '13px',
                color: isDone ? 'var(--success-color)' : isCurrent ? 'var(--text-primary)' : 'var(--text-secondary)',
                transition: 'all 0.15s ease',
                textAlign: 'left'
              }}
            >
              {isDone ? (
                <CheckCircle2 size={16} color="var(--success-color)" />
              ) : isCurrent ? (
                <Loader2 size={16} className="spin-icon" color="var(--primary-color)" />
              ) : (
                <div style={{ width: '16px', height: '16px', borderRadius: '50%', border: '1px solid var(--border-color)' }} />
              )}
              <span style={{ fontWeight: isCurrent ? 600 : 400 }}>{step}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
