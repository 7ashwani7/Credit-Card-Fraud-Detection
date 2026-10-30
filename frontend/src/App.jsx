import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import DatasetUploadModal from './components/DatasetUploadModal';
import Toast from './components/common/Toast';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Models from './pages/Models';
import Analytics from './pages/Analytics';
import About from './pages/About';
import { api } from './services/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [statistics, setStatistics] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [models, setModels] = useState([]);
  const [activeModel, setActiveModel] = useState('isolation_forest');
  const [serverStatus, setServerStatus] = useState('Connecting...');
  const [refreshing, setRefreshing] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  };

  const loadData = useCallback(async () => {
    setRefreshing(true);
    try {
      const [statsRes, analyticsRes, modelsRes] = await Promise.all([
        api.getStatistics(),
        api.getAnalytics(),
        api.getModels()
      ]);
      setStatistics(statsRes);
      setAnalytics(analyticsRes);
      setModels(modelsRes.models || []);
      if (modelsRes.active_model) {
        setActiveModel(modelsRes.active_model);
      }
      setServerStatus('Online');
    } catch (err) {
      console.error('Failed to load initial data:', err);
      setServerStatus('Offline');
      showToast('Could not reach backend API. Ensure FastAPI server is running on port 8000.', 'error');
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData, refreshTrigger]);

  const handleModelChange = async (newModelKey) => {
    setActiveModel(newModelKey);
    setRefreshing(true);
    try {
      await api.runModel(newModelKey);
      showToast(`Activated ${newModelKey.replace(/_/g, ' ').toUpperCase()} model successfully!`, 'success');
      setRefreshTrigger(prev => prev + 1);
    } catch (err) {
      showToast(`Failed to switch model: ${err.message}`, 'error');
    } finally {
      setRefreshing(false);
    }
  };

  const handleResetDemo = async () => {
    setRefreshing(true);
    try {
      await api.resetDemoDataset();
      showToast('Reset to standard Credit Card Demo Dataset!', 'success');
      setRefreshTrigger(prev => prev + 1);
    } catch (err) {
      showToast(`Failed to reset demo dataset: ${err.message}`, 'error');
    } finally {
      setRefreshing(false);
    }
  };

  const handleUploadSuccess = (res) => {
    const msg = res.message || 'Dataset uploaded and processed successfully.';
    showToast(`${msg} (Flagged ${res.anomalies_detected ?? 0} anomalies)`, 'success');
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="app-container">
      {/* Toast System */}
      <Toast toast={toast} onClose={() => setToast(null)} />

      {/* Left Sidebar Navigation */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
        serverStatus={serverStatus}
      />

      {/* Main Layout Area */}
      <div className="main-layout">
        {/* Top Header Navbar */}
        <Navbar 
          onUploadClick={() => setUploadModalOpen(true)}
          onRefreshClick={() => setRefreshTrigger(prev => prev + 1)}
          onResetDemoClick={handleResetDemo}
          refreshing={refreshing}
          activeModel={activeModel}
          onModelChange={handleModelChange}
          models={models}
          datasetSource={statistics?.dataset_source}
          isDemo={statistics?.is_demo ?? true}
          onMenuToggle={() => setMobileOpen(prev => !prev)}
        />

        {/* View Switcher Container */}
        <main className="content-wrapper">
          {activeTab === 'dashboard' && (
            <Dashboard 
              statistics={statistics} 
              analytics={analytics} 
              onNavigateToTransactions={() => setActiveTab('transactions')}
              onNavigateToModels={() => setActiveTab('models')}
              onUploadClick={() => setUploadModalOpen(true)}
              refreshTrigger={refreshTrigger}
              activeModel={activeModel}
              onModelChange={handleModelChange}
              showToast={showToast}
            />
          )}

          {activeTab === 'transactions' && (
            <Transactions 
              refreshTrigger={refreshTrigger} 
              activeModel={activeModel}
              onModelChange={handleModelChange}
              models={models}
            />
          )}

          {activeTab === 'models' && (
            <Models 
              activeModel={activeModel} 
              onModelChanged={(key) => {
                setActiveModel(key);
                setRefreshTrigger(prev => prev + 1);
              }}
              refreshTrigger={refreshTrigger}
            />
          )}

          {activeTab === 'analytics' && (
            <Analytics 
              analytics={analytics} 
              statistics={statistics} 
            />
          )}

          {activeTab === 'about' && (
            <About />
          )}
        </main>
      </div>

      {/* Dataset Upload Modal */}
      {uploadModalOpen && (
        <DatasetUploadModal 
          onClose={() => setUploadModalOpen(false)}
          onSuccess={handleUploadSuccess}
        />
      )}
    </div>
  );
}
