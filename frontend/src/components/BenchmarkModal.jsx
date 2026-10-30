import React, { useState, useEffect } from 'react';
import { 
  X, 
  Zap, 
  CheckCircle2, 
  Download
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend 
} from 'recharts';
import { useTheme } from '../context/ThemeContext';

export default function BenchmarkModal({ comparisonResults, onClose }) {
  const { isDark } = useTheme();
  const [activeChartTab, setActiveChartTab] = useState('f1');

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && onClose) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!comparisonResults) return null;

  const items = comparisonResults.comparison || [];
  const hasGroundTruth = comparisonResults.has_ground_truth;

  const gridColor = isDark ? '#374151' : '#E5E7EB';
  const axisColor = isDark ? '#9CA3AF' : '#6B7280';
  const tooltipStyle = {
    backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
    borderColor: isDark ? '#374151' : '#E5E7EB',
    color: isDark ? '#F9FAFB' : '#1F2937',
    borderRadius: '6px',
    fontSize: '13px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
  };

  // Prepare chart data
  const chartData = items.map((m) => ({
    name: m.name.replace(' (LOF)', '').replace('Neural ', ''),
    runtime: m.execution_time_ms || 0,
    anomalies: m.anomalies_detected || 0,
    precision: m.precision ? +(m.precision * 100).toFixed(1) : 0,
    recall: m.recall ? +(m.recall * 100).toFixed(1) : 0,
    f1: m.f1_score ? +(m.f1_score * 100).toFixed(1) : 0,
    pr_auc: m.pr_auc ? +m.pr_auc.toFixed(3) : 0
  }));

  const handleExportCSV = () => {
    if (!items.length) return;
    const headers = ['Model', 'Category', 'Runtime_ms', 'Anomalies_Detected', 'Anomaly_Rate_pct', 'Precision', 'Recall', 'F1_Score', 'PR_AUC'];
    const rows = items.map(m => [
      `"${m.name}"`,
      `"${m.category}"`,
      m.execution_time_ms,
      m.anomalies_detected,
      m.anomaly_rate,
      m.precision ?? 'N/A',
      m.recall ?? 'N/A',
      m.f1_score ?? 'N/A',
      m.pr_auc ?? 'N/A'
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `model_benchmark_comparison.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div
      className="modal-backdrop"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="simple-card modal-container"
        style={{
          width: '100%',
          maxWidth: '980px',
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: '24px',
          position: 'relative',
          backgroundColor: 'var(--bg-modal)',
          borderRadius: 'var(--radius-card)',
          boxShadow: 'var(--shadow-modal)'
        }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="benchmark-modal-title"
      >
        {/* Header */}
        <div 
          style={{ 
            display: 'flex', 
            alignItems: 'flex-start', 
            justifyContent: 'space-between', 
            paddingBottom: '16px', 
            borderBottom: '1px solid var(--border-color)',
            marginBottom: '18px',
            gap: '12px',
            flexWrap: 'wrap'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div 
              style={{
                width: '38px',
                height: '38px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--primary-light)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--primary-color)',
                flexShrink: 0
              }}
            >
              <Zap size={20} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <h2 id="benchmark-modal-title" style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                  Model Benchmark & Comparative Evaluation
                </h2>
                {hasGroundTruth && (
                  <span className="badge badge-normal">
                    <CheckCircle2 size={12} />
                    Ground Truth Verified
                  </span>
                )}
              </div>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px', margin: 0 }}>
                Side-by-side performance benchmarking across runtime efficiency, anomaly frequency, and statistical validation
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button 
              type="button"
              onClick={handleExportCSV}
              className="btn btn-secondary btn-sm"
              title="Export benchmark metrics as CSV"
            >
              <Download size={14} />
              <span>Export CSV</span>
            </button>
            <button 
              type="button"
              onClick={onClose}
              className="btn btn-secondary btn-icon-only"
              aria-label="Close benchmark modal"
              title="Close"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Section 1: Comparison Table */}
        <div style={{ marginBottom: '22px' }}>
          <div className="table-wrapper">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Algorithm</th>
                  <th>Technique</th>
                  <th>Runtime</th>
                  <th>Flagged</th>
                  <th>Rate</th>
                  {hasGroundTruth && (
                    <>
                      <th>Precision</th>
                      <th>Recall</th>
                      <th>F1-Score</th>
                      <th>PR-AUC</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {items.map((m) => (
                  <tr key={m.key}>
                    <td style={{ fontWeight: 600 }}>
                      {m.name}
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
                      {m.category}
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>
                      {m.execution_time_ms} ms
                    </td>
                    <td style={{ fontWeight: 600, color: 'var(--danger-color)', fontFamily: 'var(--font-mono)' }}>
                      {m.anomalies_detected}
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>
                      {m.anomaly_rate}%
                    </td>
                    {hasGroundTruth && (
                      <>
                        <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                          {m.precision !== null && m.precision !== undefined ? `${(m.precision * 100).toFixed(1)}%` : 'N/A'}
                        </td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                          {m.recall !== null && m.recall !== undefined ? `${(m.recall * 100).toFixed(1)}%` : 'N/A'}
                        </td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                          {m.f1_score !== null && m.f1_score !== undefined ? `${(m.f1_score * 100).toFixed(1)}%` : 'N/A'}
                        </td>
                        <td style={{ fontFamily: 'var(--font-mono)' }}>
                          {m.pr_auc !== null && m.pr_auc !== undefined ? m.pr_auc.toFixed(3) : 'N/A'}
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 2: Visual Comparison Charts */}
        <div style={{ backgroundColor: 'var(--bg-main)', padding: '16px', borderRadius: 'var(--radius-card)', border: '1px solid var(--border-color)' }}>
          {/* Chart Tabs */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', marginBottom: '14px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Comparative Visual Analytics
            </span>

            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {hasGroundTruth && (
                <button
                  type="button"
                  onClick={() => setActiveChartTab('f1')}
                  className={`btn btn-sm ${activeChartTab === 'f1' ? 'btn-primary' : 'btn-secondary'}`}
                >
                  F1-Score
                </button>
              )}
              {hasGroundTruth && (
                <button
                  type="button"
                  onClick={() => setActiveChartTab('precision_recall')}
                  className={`btn btn-sm ${activeChartTab === 'precision_recall' ? 'btn-primary' : 'btn-secondary'}`}
                >
                  Precision vs Recall
                </button>
              )}
              <button
                type="button"
                onClick={() => setActiveChartTab('runtime')}
                className={`btn btn-sm ${activeChartTab === 'runtime' ? 'btn-primary' : 'btn-secondary'}`}
              >
                Runtime (ms)
              </button>
              <button
                type="button"
                onClick={() => setActiveChartTab('anomalies')}
                className={`btn btn-sm ${activeChartTab === 'anomalies' ? 'btn-primary' : 'btn-secondary'}`}
              >
                Anomaly Count
              </button>
            </div>
          </div>

          {/* Chart Display Area */}
          <div style={{ width: '100%', height: '280px' }}>
            <ResponsiveContainer width="100%" height="100%">
              {activeChartTab === 'f1' && (
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                  <XAxis dataKey="name" stroke={axisColor} fontSize={12} tickLine={false} />
                  <YAxis stroke={axisColor} fontSize={12} tickLine={false} unit="%" domain={[0, 100]} />
                  <Tooltip 
                    contentStyle={tooltipStyle} 
                    formatter={(val) => [`${val}%`, 'F1-Score']}
                  />
                  <Bar dataKey="f1" fill="var(--primary-color)" radius={[4, 4, 0, 0]} />
                </BarChart>
              )}

              {activeChartTab === 'precision_recall' && (
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                  <XAxis dataKey="name" stroke={axisColor} fontSize={12} tickLine={false} />
                  <YAxis stroke={axisColor} fontSize={12} tickLine={false} unit="%" domain={[0, 100]} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ paddingTop: '8px', fontSize: '12px' }} />
                  <Bar dataKey="precision" name="Precision" fill="var(--primary-color)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="recall" name="Recall" fill="var(--success-color)" radius={[4, 4, 0, 0]} />
                </BarChart>
              )}

              {activeChartTab === 'runtime' && (
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                  <XAxis dataKey="name" stroke={axisColor} fontSize={12} tickLine={false} />
                  <YAxis stroke={axisColor} fontSize={12} tickLine={false} unit="ms" />
                  <Tooltip 
                    contentStyle={tooltipStyle} 
                    formatter={(val) => [`${val} ms`, 'Execution Runtime']}
                  />
                  <Bar dataKey="runtime" fill="var(--primary-color)" radius={[4, 4, 0, 0]} />
                </BarChart>
              )}

              {activeChartTab === 'anomalies' && (
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                  <XAxis dataKey="name" stroke={axisColor} fontSize={12} tickLine={false} />
                  <YAxis stroke={axisColor} fontSize={12} tickLine={false} />
                  <Tooltip 
                    contentStyle={tooltipStyle} 
                    formatter={(val) => [val, 'Flagged Anomalies']}
                  />
                  <Bar dataKey="anomalies" fill="var(--danger-color)" radius={[4, 4, 0, 0]} />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
