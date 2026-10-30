import React, { useState, useEffect } from 'react';
import { 
  ResponsiveContainer, 
  Tooltip, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  PieChart, 
  Pie, 
  Cell, 
  Legend 
} from 'recharts';
import { 
  CreditCard, 
  CheckCircle2, 
  AlertTriangle, 
  TrendingUp, 
  Coins, 
  UploadCloud, 
  Play, 
  GitCompare, 
  ArrowRight, 
  Loader2,
  Zap
} from 'lucide-react';

import StatCard from '../components/StatCard';
import ChartCard from '../components/ChartCard';
import TransactionDetailDrawer from '../components/TransactionDetailDrawer';
import BenchmarkModal from '../components/BenchmarkModal';
import { PredictionBadge, RiskBadge } from '../components/FraudBadge';
import { useTheme } from '../context/ThemeContext';
import { api } from '../services/api';

export default function Dashboard({ 
  statistics, 
  analytics, 
  onNavigateToTransactions,
  _onNavigateToModels,
  onUploadClick,
  refreshTrigger,
  activeModel,
  onModelChange,
  showToast
}) {
  const { isDark } = useTheme();
  const [recentSuspicious, setRecentSuspicious] = useState([]);
  const [selectedTxDetails, setSelectedTxDetails] = useState(null);
  const [loadingTx, setLoadingTx] = useState(false);
  const [runningModel, setRunningModel] = useState(false);
  const [comparingModels, setComparingModels] = useState(false);
  const [comparisonResults, setComparisonResults] = useState(null);

  // Simple, vibrant palette for Light and Dark themes: Blue, Green, Orange, Red, Gray
  const blueColor = isDark ? '#3B82F6' : '#2563EB';
  const greenColor = isDark ? '#22C55E' : '#16A34A';
  const orangeColor = isDark ? '#F59E0B' : '#D97706';
  const redColor = isDark ? '#EF4444' : '#DC2626';
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

  // Fetch recent suspicious transactions preview
  useEffect(() => {
    let isMounted = true;
    async function loadPreview() {
      setLoadingTx(true);
      try {
        const res = await api.getTransactions({ 
          page: 1, 
          page_size: 5, 
          prediction: 'Suspicious',
          sort_by: 'risk_score', 
          sort_order: 'desc' 
        });
        if (isMounted) {
          setRecentSuspicious(res.items || []);
        }
      } catch (err) {
        console.error('Failed to load recent suspicious transactions:', err);
      } finally {
        if (isMounted) setLoadingTx(false);
      }
    }
    loadPreview();
    return () => { isMounted = false; };
  }, [refreshTrigger, statistics]);

  const handleSelectTransaction = async (txId) => {
    try {
      const details = await api.getTransactionDetails(txId);
      setSelectedTxDetails(details);
    } catch (err) {
      console.error('Failed to load transaction details:', err);
    }
  };

  // Quick Action: Run active model
  const handleRunActiveModel = async () => {
    setRunningModel(true);
    try {
      const modelKey = activeModel || 'isolation_forest';
      await api.runModel(modelKey);
      if (showToast) {
        showToast(`Model ${modelKey.replace(/_/g, ' ').toUpperCase()} executed successfully!`, 'success');
      }
      if (onModelChange) {
        onModelChange(modelKey);
      }
    } catch (err) {
      if (showToast) {
        showToast(`Model execution failed: ${err.message}`, 'error');
      }
    } finally {
      setRunningModel(false);
    }
  };

  // Quick Action: Compare all models
  const handleCompareModels = async () => {
    setComparingModels(true);
    try {
      const res = await api.compareModels();
      setComparisonResults(res);
      if (showToast) {
        showToast('All models compared successfully!', 'success');
      }
    } catch (err) {
      if (showToast) {
        showToast(`Model comparison failed: ${err.message}`, 'error');
      }
    } finally {
      setComparingModels(false);
    }
  };

  // Chart 1: Transaction Activity data (Time Series Volume)
  const overviewData = (analytics?.time_series || []).map((t) => ({
    interval: t.interval,
    Total: t.Total,
    Suspicious: t.Suspicious
  }));

  // Chart 2: Normal vs Suspicious data (Green vs Red)
  const normalCount = statistics?.normal_transactions || 0;
  const suspiciousCount = statistics?.suspicious_transactions || 0;
  const pieData = [
    { name: 'Normal', value: normalCount, color: greenColor },
    { name: 'Suspicious', value: suspiciousCount, color: redColor }
  ];

  // Chart 3: Anomaly Score Distribution data
  const scoreData = (analytics?.anomaly_score_distribution || []).map((d) => ({
    range: d.range,
    count: d.count
  }));

  // Chart 4: Risk Distribution data (Low = Green, Medium = Orange, High = Red)
  const riskCounts = statistics?.risk_breakdown || {
    low: normalCount,
    medium: 0,
    high: suspiciousCount
  };

  const riskData = [
    { name: 'Low Risk', count: riskCounts.low, fill: greenColor },
    { name: 'Medium Risk', count: riskCounts.medium, fill: orangeColor },
    { name: 'High Risk', count: riskCounts.high, fill: redColor }
  ];

  const activeModelDisplay = (activeModel || 'Isolation Forest')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <div className="dashboard-container">
      {/* 1. Header */}
      <div className="dashboard-header">
        <h2 className="dashboard-title">Dashboard</h2>
        <p className="dashboard-subtitle">
          Overview of transaction activity and anomaly detection results.
        </p>
      </div>

      {/* 2. Quick Actions Bar */}
      <div className="dashboard-quick-actions">
        <div className="quick-actions-left">
          <Zap size={16} color="var(--primary-color)" />
          <span>Quick Actions</span>
        </div>

        <div className="quick-actions-buttons">
          <button 
            type="button"
            onClick={onUploadClick} 
            className="btn btn-primary"
            title="Upload a new CSV transaction dataset"
          >
            <UploadCloud size={15} />
            <span>Upload Dataset</span>
          </button>

          <button 
            type="button"
            onClick={handleRunActiveModel} 
            disabled={runningModel} 
            className="btn btn-secondary"
            title={`Execute current active model: ${activeModelDisplay}`}
          >
            {runningModel ? (
              <Loader2 size={15} className="spin-icon" />
            ) : (
              <Play size={15} />
            )}
            <span>{runningModel ? 'Running Model...' : `Run Model (${activeModelDisplay})`}</span>
          </button>

          <button 
            type="button"
            onClick={onNavigateToTransactions} 
            className="btn btn-secondary"
            title="Inspect full transactions list"
          >
            <CreditCard size={15} />
            <span>View Transactions</span>
          </button>

          <button 
            type="button"
            onClick={handleCompareModels} 
            disabled={comparingModels} 
            className="btn btn-secondary"
            title="Benchmark all 4 anomaly detection models side-by-side"
          >
            {comparingModels ? (
              <Loader2 size={15} className="spin-icon" />
            ) : (
              <GitCompare size={15} />
            )}
            <span>{comparingModels ? 'Comparing Models...' : 'Compare Models'}</span>
          </button>
        </div>
      </div>

      {/* 3. Five Statistics Cards (Responsive: 5 in one row on desktop, 2-3 on tablet, 1 on mobile) */}
      <div className="stat-cards-grid">
        <StatCard 
          label="Total Transactions"
          value={statistics?.total_transactions?.toLocaleString() ?? '—'}
          supportingText="Overall processed count"
          icon={CreditCard}
          color="blue"
        />

        <StatCard 
          label="Normal Transactions"
          value={statistics?.normal_transactions?.toLocaleString() ?? '—'}
          supportingText="Verified legitimate records"
          icon={CheckCircle2}
          color="green"
        />

        <StatCard 
          label="Suspicious Transactions"
          value={statistics?.suspicious_transactions?.toLocaleString() ?? '—'}
          supportingText="Flagged as anomalous"
          icon={AlertTriangle}
          color="red"
        />

        <StatCard 
          label="Fraud Rate"
          value={`${statistics?.fraud_percentage ?? 0}%`}
          supportingText="Suspicious anomaly ratio"
          icon={TrendingUp}
          color="orange"
        />

        <StatCard 
          label="Average Transaction Amount"
          value={`₹${statistics?.average_amount?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) ?? '0.00'}`}
          supportingText="Mean volume per record"
          icon={Coins}
          color="gray"
        />
      </div>

      {/* 4. Charts: 2 Columns on Desktop, 1 Column on Mobile */}
      <div className="charts-grid">
        {/* Chart 1: Transaction Activity */}
        <ChartCard 
          title="Transaction Activity"
          subtitle="Volume of total and suspicious transactions over time"
        >
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={overviewData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
              <XAxis dataKey="interval" stroke={axisColor} fontSize={12} tickLine={false} />
              <YAxis stroke={axisColor} fontSize={12} tickLine={false} />
              <Tooltip 
                contentStyle={tooltipStyle} 
                itemStyle={{ color: tooltipStyle.color }}
                labelStyle={{ color: tooltipStyle.color, fontWeight: 600 }}
              />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px', color: axisColor }} />
              <Bar dataKey="Total" fill={blueColor} name="Total Volume" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Suspicious" fill={redColor} name="Suspicious Flagged" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Chart 2: Normal vs Suspicious */}
        <ChartCard 
          title="Normal vs Suspicious"
          subtitle="Proportion of legitimate versus flagged transactions"
        >
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={85}
                dataKey="value"
                paddingAngle={3}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(1)}%`}
                labelLine={false}
              >
                {pieData.map((entry, index) => (
                  <Cell key={`pie-cell-${index}`} fill={entry.color} stroke={pieStroke} strokeWidth={2} />
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

        {/* Chart 3: Anomaly Score Distribution */}
        <ChartCard 
          title="Anomaly Score Distribution"
          subtitle="Distribution of continuous anomaly decision scores (0.0 – 1.0)"
        >
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={scoreData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
              <XAxis dataKey="range" stroke={axisColor} fontSize={11} tickLine={false} angle={-30} textAnchor="end" />
              <YAxis stroke={axisColor} fontSize={12} tickLine={false} />
              <Tooltip 
                contentStyle={tooltipStyle} 
                itemStyle={{ color: tooltipStyle.color }}
                labelStyle={{ color: tooltipStyle.color, fontWeight: 600 }}
                formatter={(val) => [val, 'Count']}
              />
              <Bar dataKey="count" fill={blueColor} radius={[4, 4, 0, 0]} name="Transactions" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Chart 4: Risk Distribution */}
        <ChartCard 
          title="Risk Distribution"
          subtitle="Transactions categorized into Low, Medium, and High risk"
        >
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={riskData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
              <XAxis dataKey="name" stroke={axisColor} fontSize={12} tickLine={false} />
              <YAxis stroke={axisColor} fontSize={12} tickLine={false} />
              <Tooltip 
                contentStyle={tooltipStyle} 
                itemStyle={{ color: tooltipStyle.color }}
                labelStyle={{ color: tooltipStyle.color, fontWeight: 600 }}
                formatter={(val) => [val, 'Transactions']}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {riskData.map((entry, index) => (
                  <Cell key={`risk-cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* 5. Recent Suspicious Transactions Table */}
      <div className="recent-transactions-card simple-card">
        <div className="recent-transactions-header">
          <div>
            <h3 className="recent-transactions-title">
              Recent Suspicious Transactions
            </h3>
            <p className="recent-transactions-subtitle">
              Highest risk transactions detected by the active model
            </p>
          </div>

          <button 
            type="button"
            onClick={onNavigateToTransactions} 
            className="btn btn-secondary btn-sm"
            title="Navigate to full Transactions page"
          >
            <span>View All Transactions</span>
            <ArrowRight size={14} />
          </button>
        </div>

        <div className="table-wrapper">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Transaction ID</th>
                <th>Amount</th>
                <th>Risk</th>
                <th>Prediction</th>
              </tr>
            </thead>
            <tbody>
              {loadingTx ? (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-secondary)' }}>
                    Loading recent suspicious transactions...
                  </td>
                </tr>
              ) : recentSuspicious.length === 0 ? (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-secondary)' }}>
                    No suspicious transactions detected.
                  </td>
                </tr>
              ) : (
                recentSuspicious.map((tx) => (
                  <tr 
                    key={tx.transaction_id}
                    className="clickable-row"
                    onClick={() => handleSelectTransaction(tx.transaction_id)}
                    title="Click to view detailed transaction features"
                  >
                    <td style={{ fontWeight: 600, fontFamily: 'var(--font-mono)', fontSize: '13px' }}>
                      {tx.transaction_id}
                    </td>
                    <td style={{ fontWeight: 600 }}>
                      ₹{tx.amount?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td>
                      <RiskBadge level={tx.risk_level} score={tx.risk_score} />
                    </td>
                    <td>
                      <PredictionBadge prediction={tx.prediction} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Transaction Detail Drawer when a row is clicked */}
      {selectedTxDetails && (
        <TransactionDetailDrawer 
          transaction={selectedTxDetails} 
          onClose={() => setSelectedTxDetails(null)} 
        />
      )}

      {/* Model Benchmark Comparison Modal when "Compare Models" is clicked */}
      {comparisonResults && (
        <BenchmarkModal 
          comparisonResults={comparisonResults} 
          onClose={() => setComparisonResults(null)} 
        />
      )}
    </div>
  );
}
