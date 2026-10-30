import React from 'react';

export default function StatCard({ 
  title, 
  label,
  value, 
  subtitle,
  supportingText,
  icon: Icon,
  color = 'default' // 'blue', 'green', 'red', 'orange', 'gray', 'default'
}) {
  const cardLabel = label || title;
  const cardSupportingText = supportingText || subtitle;

  return (
    <div className={`stat-card stat-card-${color}`}>
      <div className="stat-card-header">
        <span className="stat-card-label">{cardLabel}</span>
        {Icon && (
          <div className={`stat-card-icon stat-card-icon-${color}`}>
            <Icon size={16} />
          </div>
        )}
      </div>

      <div className={`stat-card-value stat-card-val-${color}`}>
        {value}
      </div>

      {cardSupportingText && (
        <div className="stat-card-supporting">
          {cardSupportingText}
        </div>
      )}
    </div>
  );
}
