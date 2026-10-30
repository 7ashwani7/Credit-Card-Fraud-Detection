import React from 'react';
import { Loader2 } from 'lucide-react';

export default function StatusBadge({ status = 'IDLE' }) {
  const normStatus = (status || 'IDLE').toUpperCase();

  switch (normStatus) {
    case 'ACTIVE':
      return (
        <span className="status-pill status-pill-active">
          <span className="status-dot status-dot-blue" />
          Active
        </span>
      );

    case 'RUNNING':
      return (
        <span className="status-pill status-pill-running">
          <Loader2 size={11} className="spin-icon" />
          Running
        </span>
      );

    case 'COMPLETED':
      return (
        <span className="status-pill status-pill-completed">
          <span className="status-dot status-dot-green" />
          Completed
        </span>
      );

    case 'ERROR':
      return (
        <span className="status-pill status-pill-error">
          Error
        </span>
      );

    case 'IDLE':
    default:
      return (
        <span className="status-pill status-pill-idle">
          <span className="status-dot status-dot-gray" />
          Idle
        </span>
      );
  }
}
