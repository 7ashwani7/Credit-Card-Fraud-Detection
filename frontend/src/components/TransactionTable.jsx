import React from 'react';
import { 
  Search, 
  ArrowUpDown, 
  ChevronLeft, 
  ChevronRight, 
  Eye, 
  FileSpreadsheet,
  X,
  RotateCcw,
  Cpu
} from 'lucide-react';
import { PredictionBadge, RiskBadge } from './FraudBadge';

export default function TransactionTable({
  transactions = [],
  total = 0,
  page = 1,
  pageSize = 20,
  totalPages = 1,
  search = '',
  onSearchChange,
  riskFilter = 'ALL',
  onRiskFilterChange,
  predictionFilter = 'ALL',
  onPredictionFilterChange,
  sortBy = 'risk_score',
  sortOrder = 'desc',
  onSortChange,
  onPageChange,
  onSelectTransaction,
  loading = false,
  onExportCSV,
  activeModelKey = 'isolation_forest',
  activeModelName = 'Isolation Forest',
  onModelChange,
  onClearFilters
}) {
  const handleSort = (field) => {
    if (sortBy === field) {
      onSortChange(field, sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      onSortChange(field, 'desc');
    }
  };

  const startRecord = total > 0 ? (page - 1) * pageSize + 1 : 0;
  const endRecord = Math.min(total, page * pageSize);
  const hasActiveFilters = Boolean(search || riskFilter !== 'ALL' || predictionFilter !== 'ALL');

  return (
    <div className="simple-card" style={{ padding: '20px' }}>
      {/* Toolbar: Search, Prediction filter, Risk filter, Model filter, Clear Filters */}
      <div className="transactions-toolbar">
        {/* Search Input with Clear Action */}
        <div className="toolbar-search-wrapper">
          <Search size={15} className="toolbar-search-icon" />
          <input
            type="search"
            placeholder="Search by ID or amount..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="toolbar-search-input"
            aria-label="Search transactions"
          />
          {search && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="toolbar-search-clear"
              title="Clear search"
              aria-label="Clear search"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Filters Group */}
        <div className="toolbar-filters">
          {/* Prediction Filter */}
          <div className="toolbar-filter-group">
            <span>Prediction:</span>
            <select 
              value={predictionFilter} 
              onChange={(e) => onPredictionFilterChange(e.target.value)}
              className="toolbar-select"
              aria-label="Filter by prediction"
            >
              <option value="ALL">All</option>
              <option value="Normal">Normal</option>
              <option value="Suspicious">Suspicious</option>
            </select>
          </div>

          {/* Risk Level Filter */}
          <div className="toolbar-filter-group">
            <span>Risk:</span>
            <select 
              value={riskFilter} 
              onChange={(e) => onRiskFilterChange(e.target.value)}
              className="toolbar-select"
              aria-label="Filter by risk level"
            >
              <option value="ALL">All</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
            </select>
          </div>

          {/* Model Filter if supported */}
          <div className="toolbar-filter-group">
            <span>Model:</span>
            {onModelChange ? (
              <select
                value={activeModelKey}
                onChange={(e) => onModelChange(e.target.value)}
                className="toolbar-select"
                aria-label="Filter by model"
                title="Filter / switch model"
              >
                <option value="isolation_forest">Isolation Forest</option>
                <option value="lof">Local Outlier Factor (LOF)</option>
                <option value="one_class_svm">One-Class SVM</option>
                <option value="autoencoder">Neural Autoencoder</option>
              </select>
            ) : (
              <div className="toolbar-model-pill" title="Model generating anomaly scores">
                <Cpu size={14} color="var(--primary-color)" />
                <span>{activeModelName}</span>
              </div>
            )}
          </div>

          {/* Clear Filters Button */}
          {onClearFilters && (
            <button
              type="button"
              onClick={onClearFilters}
              disabled={!hasActiveFilters}
              className="btn btn-secondary btn-sm toolbar-clear-btn"
              title="Reset all search queries and filters"
              style={{ opacity: hasActiveFilters ? 1 : 0.6 }}
            >
              <RotateCcw size={13} />
              <span>Clear Filters</span>
            </button>
          )}

          {/* Export CSV Button */}
          {onExportCSV && (
            <button 
              type="button"
              onClick={onExportCSV}
              className="btn btn-secondary btn-sm"
              title="Export visible page to CSV"
            >
              <FileSpreadsheet size={14} />
              <span>Export CSV</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Transactions Table (Horizontal scroll wrapper prevents layout breakage) */}
      <div className="table-wrapper">
        <table className="custom-table">
          <thead>
            <tr>
              <th onClick={() => handleSort('transaction_id')} style={{ cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span>Transaction ID</span>
                  <ArrowUpDown size={12} color={sortBy === 'transaction_id' ? 'var(--primary-color)' : 'currentColor'} />
                </div>
              </th>

              <th onClick={() => handleSort('amount')} style={{ cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span>Amount</span>
                  <ArrowUpDown size={12} color={sortBy === 'amount' ? 'var(--primary-color)' : 'currentColor'} />
                </div>
              </th>

              <th onClick={() => handleSort('time')} style={{ cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span>Time</span>
                  <ArrowUpDown size={12} color={sortBy === 'time' ? 'var(--primary-color)' : 'currentColor'} />
                </div>
              </th>

              <th onClick={() => handleSort('prediction')} style={{ cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span>Prediction</span>
                  <ArrowUpDown size={12} color={sortBy === 'prediction' ? 'var(--primary-color)' : 'currentColor'} />
                </div>
              </th>

              <th onClick={() => handleSort('anomaly_score')} style={{ cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span>Anomaly Score</span>
                  <ArrowUpDown size={12} color={sortBy === 'anomaly_score' ? 'var(--primary-color)' : 'currentColor'} />
                </div>
              </th>

              <th onClick={() => handleSort('risk_score')} style={{ cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span>Risk Score</span>
                  <ArrowUpDown size={12} color={sortBy === 'risk_score' ? 'var(--primary-color)' : 'currentColor'} />
                </div>
              </th>

              <th onClick={() => handleSort('risk_level')} style={{ cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span>Risk Level</span>
                  <ArrowUpDown size={12} color={sortBy === 'risk_level' ? 'var(--primary-color)' : 'currentColor'} />
                </div>
              </th>

              <th>Model</th>

              <th style={{ textAlign: 'right' }}>Details</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="9" style={{ textAlign: 'center', padding: '36px 16px', color: 'var(--text-secondary)' }}>
                  Loading transactions...
                </td>
              </tr>
            ) : transactions.length === 0 ? (
              <tr>
                <td colSpan="9" style={{ textAlign: 'center', padding: '36px 16px', color: 'var(--text-secondary)' }}>
                  No matching transactions found. Try adjusting your search query or filters.
                </td>
              </tr>
            ) : (
              transactions.map((tx) => (
                <tr 
                  key={tx.transaction_id}
                  className="clickable-row"
                  onClick={() => onSelectTransaction(tx.transaction_id)}
                  title="Click to view full transaction features"
                >
                  <td style={{ fontWeight: 600, fontFamily: 'var(--font-mono)', fontSize: '13px' }}>
                    {tx.transaction_id}
                  </td>

                  <td style={{ fontWeight: 600 }}>
                    ₹{tx.amount?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>

                  <td style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', fontSize: '13px' }}>
                    {typeof tx.time === 'number' ? `${tx.time.toFixed(1)}s` : `${tx.time}s`}
                  </td>

                  <td>
                    <PredictionBadge prediction={tx.prediction} />
                  </td>

                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: '13px' }}>
                    {typeof tx.anomaly_score === 'number' ? tx.anomaly_score.toFixed(4) : (tx.anomaly_score || '0.0000')}
                  </td>

                  <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                    {tx.risk_score}
                  </td>

                  <td>
                    <RiskBadge level={tx.risk_level} score={tx.risk_score} />
                  </td>

                  <td style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
                    {activeModelName}
                  </td>

                  <td style={{ textAlign: 'right' }}>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectTransaction(tx.transaction_id);
                      }}
                      className="btn btn-secondary btn-icon-only"
                      style={{ padding: '6px' }}
                      title="Inspect full transaction record"
                      aria-label={`Inspect transaction ${tx.transaction_id}`}
                    >
                      <Eye size={14} color="var(--primary-color)" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Bar */}
      <div className="table-pagination-bar">
        <div className="table-pagination-info">
          Showing <strong>{startRecord}</strong> to <strong>{endRecord}</strong> of <strong>{total.toLocaleString()}</strong> records
        </div>

        <div className="table-pagination-controls">
          <button
            type="button"
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1 || loading}
            className="btn btn-secondary btn-sm"
            aria-label="Go to previous page"
          >
            <ChevronLeft size={15} />
            <span>Previous</span>
          </button>

          <span className="table-pagination-page">
            Page {page} of {totalPages}
          </span>

          <button
            type="button"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages || loading}
            className="btn btn-secondary btn-sm"
            aria-label="Go to next page"
          >
            <span>Next</span>
            <ChevronRight size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
