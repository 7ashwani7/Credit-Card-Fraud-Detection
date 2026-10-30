import React from 'react';
import { CheckCircle2, AlertTriangle, ShieldAlert } from 'lucide-react';

/**
 * Prediction badge:
 * Normal: Green with Check icon
 * Suspicious: Red with Alert icon
 * Does not rely only on color for accessibility
 */
export function PredictionBadge({ prediction }) {
  const isSuspicious = prediction && prediction.toString().toLowerCase() === 'suspicious';
  
  if (isSuspicious) {
    return (
      <span className="badge badge-danger" title="Predicted Anomaly: Suspicious transaction">
        <AlertTriangle size={12} aria-hidden="true" />
        <span>Suspicious</span>
      </span>
    );
  }
  return (
    <span className="badge badge-normal" title="Predicted Normal: Legitimate transaction">
      <CheckCircle2 size={12} aria-hidden="true" />
      <span>Normal</span>
    </span>
  );
}

/**
 * Risk badge:
 * Low: Green with check icon
 * Medium: Orange with alert icon
 * High: Red with shield alert icon
 * Does not rely only on color for accessibility
 */
export function RiskBadge({ level, showScore = false, score }) {
  const lvl = (level || 'LOW').toString().toUpperCase();

  if (lvl === 'HIGH') {
    return (
      <span className="badge badge-danger" title={`High Risk Tier: ${score !== undefined ? `${score}/100` : 'Score > 70'}`}>
        <ShieldAlert size={12} aria-hidden="true" />
        <span>High{showScore && score !== undefined ? ` (${score})` : ''}</span>
      </span>
    );
  }
  if (lvl === 'MEDIUM') {
    return (
      <span className="badge badge-warning" title={`Medium Risk Tier: ${score !== undefined ? `${score}/100` : 'Score 31-70'}`}>
        <AlertTriangle size={12} aria-hidden="true" />
        <span>Medium{showScore && score !== undefined ? ` (${score})` : ''}</span>
      </span>
    );
  }
  return (
    <span className="badge badge-normal" title={`Low Risk Tier: ${score !== undefined ? `${score}/100` : 'Score 0-30'}`}>
      <CheckCircle2 size={12} aria-hidden="true" />
      <span>Low{showScore && score !== undefined ? ` (${score})` : ''}</span>
    </span>
  );
}
