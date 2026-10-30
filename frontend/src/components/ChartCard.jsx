import React from 'react';

export default function ChartCard({ 
  title, 
  subtitle, 
  action, 
  children,
  minHeight = '260px'
}) {
  return (
    <div className="chart-card simple-card">
      <div className="chart-card-header">
        <div>
          <h3 className="chart-card-title">
            {title}
          </h3>
          {subtitle && (
            <p className="chart-card-subtitle">
              {subtitle}
            </p>
          )}
        </div>

        {action && <div className="chart-card-action">{action}</div>}
      </div>

      <div className="chart-card-body" style={{ minHeight }}>
        {children}
      </div>
    </div>
  );
}
