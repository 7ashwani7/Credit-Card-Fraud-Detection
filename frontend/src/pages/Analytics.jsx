import React from 'react';
import { 
  BarChart, 
  Bar, 
  LineChart,
  Line,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Legend 
} from 'recharts';
import { 
  ShieldAlert, 
  AlertTriangle, 
  TrendingUp, 
  Info, 
  CheckCircle2, 
  Activity 
} from 'lucide-react';

import ChartCard from '../components/ChartCard';
import { useTheme } from '../context/ThemeContext';

export default function Analytics({ analytics, statistics }) {
  const { isDark } = useTheme();

  // Simple curated theme-adaptive palette
  const primaryColor = isDark ? '#3B82F6' : '#2563EB';
  const successColor = isDark ? '#22C55E' : '#16A34A';
  const warningColor = isDark ? '#F59E0B' : '#D97706';
  const dangerColor = isDark ? '#EF4444' : '#DC2626';
  const gridColor = isDark ? '#374151' : '#E5E7EB';
  const axisColor = isDark ? '#9CA3AF' : '#6B7280';
  const pieStroke = isDark ? '#1F2937' : '#FFFFFF';

  const tooltipStyle = {
    backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
    borderColor: isDark ? '#374151' : '#E5E7EB',
    color: isDark ? '#F9FAFB' : '#1F2937',
    borderRadius: '6px',
    fontSize: '13px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
  };

  const evalData = analytics?.evaluation || {};
  const metrics = evalData.metrics || {};
  const cm = evalData.confusion_matrix || {};
  const hasGroundTruth = Boolean(analytics?.has_ground_truth || evalData.has_ground_truth);

  const amountDistribution = analytics?.amount_distribution || [];
  const scoreDistribution = analytics?.anomaly_score_distribution || [];
  const timeSeries = analytics?.time_series || [];

  // Chart: Normal vs Suspicious pie data
  const normalCount = statistics?.normal_transactions ?? 0;
  const suspiciousCount = statistics?.suspicious_transactions ?? 0;
  const pieData = [
    { name: 'Normal', value: normalCount, color: successColor },
    { name: 'Suspicious', value: suspiciousCount, color: dangerColor }
  ];

  // Chart: Risk Distribution data
  const riskData = [
    { level: 'Low Risk', count: statistics?.risk_breakdown?.low ?? 0, fill: successColor },
    { level: 'Medium Risk', count: statistics?.risk_breakdown?.medium ?? 0, fill: warningColor },
    { level: 'High Risk', count: statistics?.risk_breakdown?.high ?? 0, fill: dangerColor }
  ];

  // Chart: Model Performance metric comparisons
  const performanceData = [
    { metric: 'Precision', score: Math.round((metrics.precision ?? 0) * 100) },
    { metric: 'Recall', score: Math.round((metrics.recall ?? 0) * 100) },
    { metric: 'F1 Score', score: Math.round((metrics.f1_score ?? 0) * 100) },
    { metric: 'ROC-AUC', score: Math.round((metrics.roc_auc ?? 0) * 100) },
    { metric: 'PR-AUC', score: Math.round((metrics.pr_auc ?? 0) * 100) }
  ];

  // Confusion matrix counts with safe fallbacks
  const tn = cm.true_negative ?? cm.true_negatives ?? 0;
  const fp = cm.false_positive ?? cm.false_positives ?? 0;
  const fn = cm.false_negative ?? cm.false_negatives ?? 0;
  const tp = cm.true_positive ?? cm.true_positives ?? 0;

  return (
    <div className="analytics-container">
      {/* Page Header */}
      <div className="analytics-header">
        <div>
          <h2 className="analytics-title">
            Analytics & Model Evaluation
          </h2>
          <p className="analytics-subtitle">
            Comprehensive statistical analysis, risk distribution, and algorithm performance evaluation.
          </p>
        </div>
      </div>

      {/* ==========================================================================
          1. TRANSACTION OVERVIEW
          ========================================================================== */}
      <section className="analytics-section">
        <div className="analytics-section-header">
          <h3 className="analytics-section-title">
            <Activity size={18} color="var(--primary-color)" />
            <span>1. Transaction Overview</span>
          </h3>
          <p className="analytics-section-subtitle">
            Aggregated transaction volume trends and monetary value bracket distribution.
          </p>
        </div>

        <div className="analytics-chart-grid">
          {/* Chart 1: Transaction Volume */}
          <div className="analytics-chart-cell">
            <ChartCard 
              title="Transaction Volume" 
              subtitle="Volume of transactions across chronological time intervals"
            >
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={timeSeries} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                  <XAxis dataKey="interval" stroke={axisColor} fontSize={11} tickLine={false} />
                  <YAxis stroke={axisColor} fontSize={12} tickLine={false} />
                  <Tooltip 
                    contentStyle={tooltipStyle} 
                    itemStyle={{ color: tooltipStyle.color }}
                    labelStyle={{ color: tooltipStyle.color, fontWeight: 600 }}
                  />
                  <Bar dataKey="Total" fill={primaryColor} name="Total Volume" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          {/* Chart 2: Transaction Amount Distribution */}
          <div className="analytics-chart-cell">
            <ChartCard 
              title="Transaction Amount Distribution" 
              subtitle="Transactions grouped into monetary brackets by fraud prediction"
            >
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={amountDistribution} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                  <XAxis dataKey="bracket" stroke={axisColor} fontSize={11} tickLine={false} />
                  <YAxis stroke={axisColor} fontSize={12} tickLine={false} />
                  <Tooltip 
                    contentStyle={tooltipStyle} 
                    itemStyle={{ color: tooltipStyle.color }}
                    labelStyle={{ color: tooltipStyle.color, fontWeight: 600 }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', color: axisColor }} />
                  <Bar dataKey="Normal" fill={successColor} name="Normal" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Suspicious" fill={dangerColor} name="Suspicious" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>
        </div>
      </section>

      {/* ==========================================================================
          2. ANOMALY ANALYSIS
          ========================================================================== */}
      <section className="analytics-section">
        <div className="analytics-section-header">
          <h3 className="analytics-section-title">
            <ShieldAlert size={18} color="var(--danger-color)" />
            <span>2. Anomaly Analysis</span>
          </h3>
          <p className="analytics-section-subtitle">
            Proportions of normal vs suspicious transactions and normalized anomaly score spectrum.
          </p>
        </div>

        <div className="analytics-chart-grid">
          {/* Chart 3: Normal vs Suspicious */}
          <div className="analytics-chart-cell">
            <ChartCard 
              title="Normal vs Suspicious" 
              subtitle="Proportion of verified normal transactions vs flagged anomalies"
            >
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    outerRadius={85}
                    innerRadius={45}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(1)}%`}
                    labelLine={false}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke={pieStroke} strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={tooltipStyle} 
                    itemStyle={{ color: tooltipStyle.color }}
                    labelStyle={{ color: tooltipStyle.color, fontWeight: 600 }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', color: axisColor }} />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          {/* Chart 4: Anomaly Score Distribution */}
          <div className="analytics-chart-cell">
            <ChartCard 
              title="Anomaly Score Distribution" 
              subtitle="Frequency distribution across normalized continuous anomaly scores"
            >
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={scoreDistribution} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                  <XAxis dataKey="range" stroke={axisColor} fontSize={10} tickLine={false} angle={-30} textAnchor="end" />
                  <YAxis stroke={axisColor} fontSize={12} tickLine={false} />
                  <Tooltip 
                    contentStyle={tooltipStyle} 
                    itemStyle={{ color: tooltipStyle.color }}
                    labelStyle={{ color: tooltipStyle.color, fontWeight: 600 }}
                  />
                  <Bar dataKey="count" fill={primaryColor} radius={[4, 4, 0, 0]} name="Transactions" />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>
        </div>
      </section>

      {/* ==========================================================================
          3. RISK ANALYSIS
          ========================================================================== */}
      <section className="analytics-section">
        <div className="analytics-section-header">
          <h3 className="analytics-section-title">
            <AlertTriangle size={18} color="var(--warning-color)" />
            <span>3. Risk Analysis</span>
          </h3>
          <p className="analytics-section-subtitle">
            Calculated risk level distribution and chronological risk progression.
          </p>
        </div>

        <div className="analytics-chart-grid">
          {/* Chart 5: Risk Distribution */}
          <div className="analytics-chart-cell">
            <ChartCard 
              title="Risk Distribution" 
              subtitle="Transactions categorized into Low, Medium, and High risk tiers"
            >
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={riskData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                  <XAxis dataKey="level" stroke={axisColor} fontSize={12} tickLine={false} />
                  <YAxis stroke={axisColor} fontSize={12} tickLine={false} />
                  <Tooltip 
                    contentStyle={tooltipStyle} 
                    itemStyle={{ color: tooltipStyle.color }}
                    labelStyle={{ color: tooltipStyle.color, fontWeight: 600 }}
                  />
                  <Bar dataKey="count" name="Transactions" radius={[4, 4, 0, 0]}>
                    {riskData.map((entry, index) => (
                      <Cell key={`risk-cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          {/* Average Risk Over Time */}
          <div className="analytics-chart-cell">
            <ChartCard 
              title="Average Risk Over Time" 
              subtitle="Mean risk score trend (0 – 100) across chronological transaction batches"
            >
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={timeSeries} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                  <XAxis dataKey="interval" stroke={axisColor} fontSize={11} tickLine={false} />
                  <YAxis stroke={axisColor} fontSize={12} tickLine={false} domain={[0, 100]} />
                  <Tooltip 
                    contentStyle={tooltipStyle} 
                    itemStyle={{ color: tooltipStyle.color }}
                    labelStyle={{ color: tooltipStyle.color, fontWeight: 600 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="Avg_Risk" 
                    stroke={warningColor} 
                    strokeWidth={2} 
                    dot={{ fill: warningColor, r: 3 }} 
                    name="Mean Risk Score"
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>
        </div>
      </section>

      {/* ==========================================================================
          4. MODEL PERFORMANCE
          ========================================================================== */}
      <section className="analytics-section">
        <div className="analytics-section-header">
          <h3 className="analytics-section-title">
            <TrendingUp size={18} color="var(--primary-color)" />
            <span>4. Model Performance</span>
          </h3>
          <p className="analytics-section-subtitle">
            Supervised validation benchmarks, evaluation metrics, and confusion matrix.
          </p>
        </div>

        {hasGroundTruth ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* 2-Column Grid: Chart 6 (Model Performance) + KPI Cards */}
            <div className="analytics-chart-grid">
              {/* Chart 6: Model Performance */}
              <div className="analytics-chart-cell">
                <ChartCard 
                  title="Model Performance" 
                  subtitle={`Supervised metrics for active model: ${analytics?.active_model_name || 'Active Algorithm'}`}
                >
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={performanceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                      <XAxis dataKey="metric" stroke={axisColor} fontSize={11} tickLine={false} />
                      <YAxis stroke={axisColor} fontSize={12} tickLine={false} domain={[0, 100]} unit="%" />
                      <Tooltip 
                        contentStyle={tooltipStyle} 
                        itemStyle={{ color: tooltipStyle.color }}
                        labelStyle={{ color: tooltipStyle.color, fontWeight: 600 }}
                        formatter={(val) => [`${val}%`, 'Score']}
                      />
                      <Bar dataKey="score" fill={primaryColor} radius={[4, 4, 0, 0]} name="Score (%)" />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartCard>
              </div>

              {/* KPI Cards: Precision, Recall, F1 Score, ROC-AUC, PR-AUC */}
              <div className="analytics-chart-cell">
                <div className="simple-card" style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '20px' }}>
                  <h4 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 14px' }}>
                    Key Performance Indicators
                  </h4>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px' }}>
                    <div style={{ backgroundColor: 'var(--bg-subtle)', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 500 }}>Precision</span>
                      <div style={{ fontSize: '20px', fontWeight: 700, color: primaryColor, marginTop: '2px', fontFamily: 'var(--font-mono)' }}>
                        {metrics.precision !== null && metrics.precision !== undefined ? `${(metrics.precision * 100).toFixed(1)}%` : 'N/A'}
                      </div>
                    </div>

                    <div style={{ backgroundColor: 'var(--bg-subtle)', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 500 }}>Recall</span>
                      <div style={{ fontSize: '20px', fontWeight: 700, color: successColor, marginTop: '2px', fontFamily: 'var(--font-mono)' }}>
                        {metrics.recall !== null && metrics.recall !== undefined ? `${(metrics.recall * 100).toFixed(1)}%` : 'N/A'}
                      </div>
                    </div>

                    <div style={{ backgroundColor: 'var(--bg-subtle)', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 500 }}>F1 Score</span>
                      <div style={{ fontSize: '20px', fontWeight: 700, color: warningColor, marginTop: '2px', fontFamily: 'var(--font-mono)' }}>
                        {metrics.f1_score !== null && metrics.f1_score !== undefined ? `${(metrics.f1_score * 100).toFixed(1)}%` : 'N/A'}
                      </div>
                    </div>

                    <div style={{ backgroundColor: 'var(--bg-subtle)', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 500 }}>ROC-AUC</span>
                      <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px', fontFamily: 'var(--font-mono)' }}>
                        {metrics.roc_auc !== null && metrics.roc_auc !== undefined ? metrics.roc_auc.toFixed(3) : 'N/A'}
                      </div>
                    </div>

                    <div style={{ backgroundColor: 'var(--bg-subtle)', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 500 }}>PR-AUC</span>
                      <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px', fontFamily: 'var(--font-mono)' }}>
                        {metrics.pr_auc !== null && metrics.pr_auc !== undefined ? metrics.pr_auc.toFixed(3) : 'N/A'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Confusion Matrix Table */}
            <div className="simple-card" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                <div>
                  <h4 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                    Confusion Matrix
                  </h4>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '2px 0 0' }}>
                    Comparison between actual fraud classes and model-predicted anomalies.
                  </p>
                </div>
                <span className="badge badge-normal" style={{ fontSize: '11px' }}>
                  <CheckCircle2 size={12} />
                  Ground Truth Active
                </span>
              </div>

              <div className="table-wrapper" style={{ maxWidth: '640px' }}>
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Actual Class \ Model Prediction</th>
                      <th>Predicted Normal</th>
                      <th>Predicted Suspicious</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                        Actual Normal (Class 0)
                      </td>
                      <td style={{ color: successColor, fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
                        {tn.toLocaleString()} <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 400 }}>(True Negative)</span>
                      </td>
                      <td style={{ color: warningColor, fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
                        {fp.toLocaleString()} <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 400 }}>(False Positive)</span>
                      </td>
                    </tr>
                    <tr>
                      <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                        Actual Fraud (Class 1)
                      </td>
                      <td style={{ color: dangerColor, fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
                        {fn.toLocaleString()} <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 400 }}>(False Negative)</span>
                      </td>
                      <td style={{ color: primaryColor, fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
                        {tp.toLocaleString()} <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 400 }}>(True Positive)</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          /* When ground-truth labels are unavailable */
          <div className="ground-truth-notice">
            <Info size={28} color="var(--text-secondary)" />
            <p style={{ fontWeight: 600, fontSize: '15px', color: 'var(--text-primary)', margin: 0 }}>
              Ground-truth labels are unavailable for this dataset.
            </p>
            <p style={{ margin: 0, maxWidth: '520px', fontSize: '13px' }}>
              The currently active dataset does not contain verified fraud class labels ('Class' or 'Target'). Supervised benchmark metrics such as Confusion Matrix, Precision, Recall, F1 Score, ROC-AUC, and PR-AUC require labeled ground-truth data. Unsupervised anomaly detection metrics remain fully available above.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}

