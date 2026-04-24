import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import DiversityMetrics from './pages/DiversityMetrics';
import PayEquity from './pages/PayEquity';
import HiringBias from './pages/HiringBias';
import PromotionBias from './pages/PromotionBias';
import ComplianceReports from './pages/ComplianceReports';
import Benchmarking from './pages/Benchmarking';
import EmployeeSurveys from './pages/EmployeeSurveys';
import TrainingPrograms from './pages/TrainingPrograms';
import RetentionAnalysis from './pages/RetentionAnalysis';
import LeadershipPipeline from './pages/LeadershipPipeline';
import SupplierDiversity from './pages/SupplierDiversity';
import ERGManagement from './pages/ERGManagement';
import IncidentReports from './pages/IncidentReports';
import Accessibility from './pages/Accessibility';
import WorkforceDemographics from './pages/WorkforceDemographics';
import GlobalSearch from './pages/GlobalSearch';
import Analytics from './pages/Analytics';
import DataExport from './pages/DataExport';
import DataImport from './pages/DataImport';
import Reports from './pages/Reports';
import Alerts from './pages/Alerts';
import AuditLog from './pages/AuditLog';
import UserManagement from './pages/UserManagement';
import './App.css';

const API = 'http://localhost:3001/api';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user') || 'null'));

  const login = (t, u) => {
    localStorage.setItem('token', t);
    localStorage.setItem('user', JSON.stringify(u));
    setToken(t);
    setUser(u);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  useEffect(() => {
    if (token) {
      fetch(`${API}/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
        .then(r => { if (!r.ok) logout(); })
        .catch(() => logout());
    }
  }, [token]);

  if (!token) return <Login onLogin={login} />;

  return (
    <Router>
      <div className="app">
        <nav className="sidebar">
          <div className="sidebar-header">
            <div className="logo-icon">DEI</div>
            <h1>AI DEI Analytics</h1>
          </div>
          <ul className="nav-links">
            <li><a href="/">Dashboard</a></li>
            <li><a href="/diversity-metrics">Diversity Metrics</a></li>
            <li><a href="/pay-equity">Pay Equity</a></li>
            <li><a href="/hiring-bias">Hiring Bias</a></li>
            <li><a href="/promotion-bias">Promotion Bias</a></li>
            <li><a href="/compliance-reports">Compliance Reports</a></li>
            <li><a href="/benchmarking">Benchmarking</a></li>
            <li><a href="/employee-surveys">Employee Surveys</a></li>
            <li><a href="/training-programs">Training Programs</a></li>
            <li><a href="/retention-analysis">Retention Analysis</a></li>
            <li><a href="/leadership-pipeline">Leadership Pipeline</a></li>
            <li><a href="/supplier-diversity">Supplier Diversity</a></li>
            <li><a href="/erg-management">ERG Management</a></li>
            <li><a href="/incident-reports">Incident Reports</a></li>
            <li><a href="/accessibility">Accessibility</a></li>
            <li><a href="/workforce-demographics">Workforce Demographics</a></li>
          </ul>
          <div style={{ padding: '0 12px', marginBottom: '8px' }}>
            <div style={{ fontSize: '10px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '1px', padding: '8px 16px' }}>Tools</div>
          </div>
          <ul className="nav-links" style={{ paddingTop: 0 }}>
            <li><a href="/search">Global Search</a></li>
            <li><a href="/analytics">Visual Analytics</a></li>
            <li><a href="/reports">Report Builder</a></li>
            <li><a href="/export">Data Export</a></li>
            <li><a href="/import">Data Import</a></li>
            <li><a href="/alerts">Alerts</a></li>
            <li><a href="/audit-log">Audit Log</a></li>
            <li><a href="/user-management">User Management</a></li>
          </ul>
          <div className="sidebar-footer">
            <div className="user-info">
              <div className="user-avatar">{user?.name?.charAt(0)}</div>
              <div>
                <div className="user-name">{user?.name}</div>
                <div className="user-role">{user?.role}</div>
              </div>
            </div>
            <button className="logout-btn" onClick={logout}>Logout</button>
          </div>
        </nav>
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard token={token} user={user} />} />
            <Route path="/diversity-metrics" element={<DiversityMetrics token={token} />} />
            <Route path="/pay-equity" element={<PayEquity token={token} />} />
            <Route path="/hiring-bias" element={<HiringBias token={token} />} />
            <Route path="/promotion-bias" element={<PromotionBias token={token} />} />
            <Route path="/compliance-reports" element={<ComplianceReports token={token} />} />
            <Route path="/benchmarking" element={<Benchmarking token={token} />} />
            <Route path="/employee-surveys" element={<EmployeeSurveys token={token} />} />
            <Route path="/training-programs" element={<TrainingPrograms token={token} />} />
            <Route path="/retention-analysis" element={<RetentionAnalysis token={token} />} />
            <Route path="/leadership-pipeline" element={<LeadershipPipeline token={token} />} />
            <Route path="/supplier-diversity" element={<SupplierDiversity token={token} />} />
            <Route path="/erg-management" element={<ERGManagement token={token} />} />
            <Route path="/incident-reports" element={<IncidentReports token={token} />} />
            <Route path="/accessibility" element={<Accessibility token={token} />} />
            <Route path="/workforce-demographics" element={<WorkforceDemographics token={token} />} />
            <Route path="/search" element={<GlobalSearch token={token} />} />
            <Route path="/analytics" element={<Analytics token={token} />} />
            <Route path="/reports" element={<Reports token={token} />} />
            <Route path="/export" element={<DataExport token={token} />} />
            <Route path="/import" element={<DataImport token={token} />} />
            <Route path="/alerts" element={<Alerts token={token} />} />
            <Route path="/audit-log" element={<AuditLog token={token} />} />
            <Route path="/user-management" element={<UserManagement token={token} user={user} />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
