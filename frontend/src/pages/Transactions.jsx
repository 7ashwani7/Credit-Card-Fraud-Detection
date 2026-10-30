import React, { useState, useEffect } from 'react';
import TransactionTable from '../components/TransactionTable';
import TransactionDetailDrawer from '../components/TransactionDetailDrawer';
import { api } from '../services/api';
import { Download } from 'lucide-react';

const MODEL_TITLES = {
  isolation_forest: 'Isolation Forest',
  lof: 'Local Outlier Factor (LOF)',
  one_class_svm: 'One-Class SVM',
  autoencoder: 'Neural Autoencoder'
};

export default function Transactions({ 
  refreshTrigger, 
  activeModel = 'isolation_forest', 
  onModelChange, 
  models = [] 
}) {
  const [transactions, setTransactions] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const [totalPages, setTotalPages] = useState(1);

  const [search, setSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState('ALL');
  const [predictionFilter, setPredictionFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('risk_score');
  const [sortOrder, setSortOrder] = useState('desc');

  const [loading, setLoading] = useState(false);
  const [selectedTxDetails, setSelectedTxDetails] = useState(null);

  const activeModelTitle = MODEL_TITLES[activeModel] || activeModel;

  // Fetch transactions on state change
  useEffect(() => {
    let isMounted = true;
    async function fetchTx() {
      setLoading(true);
      try {
        const res = await api.getTransactions({
          page,
          page_size: pageSize,
          search,
          risk_level: riskFilter,
          prediction: predictionFilter,
          sort_by: sortBy,
          sort_order: sortOrder
        });
        if (isMounted) {
          setTransactions(res.items || []);
          setTotal(res.total || 0);
          setTotalPages(res.total_pages || 1);
        }
      } catch (err) {
        console.error('Failed to fetch transactions:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    fetchTx();
    return () => { isMounted = false; };
  }, [page, pageSize, search, riskFilter, predictionFilter, sortBy, sortOrder, refreshTrigger]);

  const handleSelectTransaction = async (txId) => {
    try {
      const details = await api.getTransactionDetails(txId);
      setSelectedTxDetails(details);
    } catch (err) {
      console.error('Failed to load transaction details:', err);
    }
  };

  const handleClearFilters = () => {
    setSearch('');
    setRiskFilter('ALL');
    setPredictionFilter('ALL');
    setPage(1);
    setSortBy('risk_score');
    setSortOrder('desc');
  };

  const handleExportCSV = () => {
    if (transactions.length === 0) return;
    const headers = ['Transaction_ID', 'Amount', 'Time', 'Prediction', 'Anomaly_Score', 'Risk_Score', 'Risk_Level', 'Model'];
    const rows = transactions.map(t => [
      t.transaction_id,
      t.amount,
      t.time,
      t.prediction,
      t.anomaly_score,
      t.risk_score,
      t.risk_level,
      activeModelTitle
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `transactions_page_${page}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="transactions-container">
      {/* Page Header */}
      <div className="transactions-header">
        <div>
          <h2 className="transactions-title">
            Transactions
          </h2>
          <p className="transactions-subtitle">
            View and analyze detected transaction anomalies.
          </p>
        </div>

        <button 
          onClick={handleExportCSV}
          disabled={transactions.length === 0}
          className="btn btn-secondary btn-sm"
          title="Export current page to CSV"
        >
          <Download size={14} />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Main Transaction Table */}
      <TransactionTable 
        transactions={transactions}
        total={total}
        page={page}
        pageSize={pageSize}
        totalPages={totalPages}
        search={search}
        onSearchChange={(val) => { setSearch(val); setPage(1); }}
        riskFilter={riskFilter}
        onRiskFilterChange={(val) => { setRiskFilter(val); setPage(1); }}
        predictionFilter={predictionFilter}
        onPredictionFilterChange={(val) => { setPredictionFilter(val); setPage(1); }}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSortChange={(field, order) => { setSortBy(field); setSortOrder(order); }}
        onPageChange={(p) => setPage(p)}
        onSelectTransaction={handleSelectTransaction}
        loading={loading}
        onExportCSV={handleExportCSV}
        activeModelKey={activeModel}
        activeModelName={activeModelTitle}
        onModelChange={onModelChange}
        models={models}
        onClearFilters={handleClearFilters}
      />

      {/* Sliding Right-Side Transaction Detail Drawer */}
      {selectedTxDetails && (
        <TransactionDetailDrawer 
          transaction={selectedTxDetails} 
          onClose={() => setSelectedTxDetails(null)} 
        />
      )}
    </div>
  );
}

