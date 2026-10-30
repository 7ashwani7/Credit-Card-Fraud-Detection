import React, { useEffect } from 'react';
import { 
  LayoutDashboard, 
  CreditCard, 
  Cpu, 
  BarChart2, 
  HelpCircle, 
  Shield, 
  X 
} from 'lucide-react';

export default function Sidebar({ 
  activeTab, 
  setActiveTab, 
  mobileOpen, 
  setMobileOpen, 
  serverStatus 
}) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'transactions', label: 'Transactions', icon: CreditCard },
    { id: 'models', label: 'Models', icon: Cpu },
    { id: 'analytics', label: 'Analytics', icon: BarChart2 },
    { id: 'about', label: 'About Project', icon: HelpCircle }
  ];

  const isOnline = serverStatus === 'Online';

  // Close mobile drawer on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && mobileOpen && setMobileOpen) {
        setMobileOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileOpen, setMobileOpen]);

  const handleNavClick = (tabId) => {
    setActiveTab(tabId);
    if (setMobileOpen) {
      setMobileOpen(false);
    }
  };

  const renderSidebarContent = (isDrawer = false) => (
    <div className="sidebar-inner">
      <div className="sidebar-content-top">
        {/* Brand / Logo */}
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <div className="sidebar-brand-icon" title="FraudShield">
              <Shield size={20} />
            </div>
            <div className="sidebar-brand-text">
              <span className="sidebar-brand-title">FraudShield</span>
              <span className="sidebar-brand-subtitle">ANOMALY AI</span>
            </div>
          </div>

          {isDrawer && (
            <button 
              type="button"
              onClick={() => setMobileOpen(false)}
              className="btn btn-secondary btn-icon-only sidebar-close-btn"
              aria-label="Close navigation menu"
              title="Close menu"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Navigation List */}
        <nav className="sidebar-nav" aria-label="Main Navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavClick(item.id)}
                className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
                title={item.label}
                aria-current={isActive ? 'page' : undefined}
              >
                <span className="sidebar-nav-icon">
                  <Icon size={18} />
                </span>
                <span className="sidebar-nav-label">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Footer: ML Backend Status */}
      <div className="sidebar-footer">
        <div className="sidebar-footer-card">
          <div className="sidebar-footer-label">ML BACKEND</div>
          <div 
            className="sidebar-status-row"
            title={`ML Backend: ${isOnline ? 'Online' : serverStatus || 'Offline'}`}
          >
            <span className={`sidebar-status-dot ${isOnline ? 'online' : 'offline'}`} />
            <span className={`sidebar-status-text ${isOnline ? 'online' : ''}`}>
              {isOnline ? 'Online' : (serverStatus || 'Offline')}
            </span>
          </div>
          <p className="sidebar-footer-desc">
            Scikit-learn Anomaly Suite
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Permanent Sidebar (Desktop full 240-250px width, Tablet compact layout) */}
      <aside className="app-sidebar sidebar-permanent">
        {renderSidebarContent(false)}
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <>
          <div 
            className="sidebar-backdrop"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          <aside 
            className="sidebar-drawer"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation Drawer"
          >
            {renderSidebarContent(true)}
          </aside>
        </>
      )}
    </>
  );
}
