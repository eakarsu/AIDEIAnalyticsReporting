import React, { useState, useEffect, useCallback } from 'react';

const API = 'http://localhost:3001/api';

function AuditLog({ token }) {
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ action: '', module: '' });

  const headers = { Authorization: `Bearer ${token}` };

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.action) params.set('action', filters.action);
      if (filters.module) params.set('module', filters.module);

      const [logsRes, statsRes] = await Promise.all([
        fetch(`${API}/audit-log?${params}`, { headers }),
        fetch(`${API}/audit-log/stats`, { headers })
      ]);
      const logsData = await logsRes.json();
      const statsData = await statsRes.json();
      setLogs(Array.isArray(logsData) ? logsData : []);
      setStats(statsData);
    } catch (err) {
      console.error('Failed to fetch audit logs:', err);
      setLogs([]);
    }
    setLoading(false);
  }, [token, filters.action, filters.module]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const getActionBadge = (action) => {
    const colors = {
      'CREATE': 'badge-success',
      'UPDATE': 'badge-warning',
      'DELETE': 'badge-danger',
      'VIEW': 'badge-info',
      'EXPORT': 'badge-neutral',
      'LOGIN': 'badge-info'
    };
    return <span className={colors[action] || 'badge-neutral'}>{action}</span>;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '--';
    return new Date(dateStr).toLocaleString();
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Audit Log</h2>
          <p>Track all user actions and system events</p>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-bar">
        <div className="stat-card">
          <div className="stat-number">{stats?.total || 0}</div>
          <div className="stat-text">Total Events</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{stats?.today || 0}</div>
          <div className="stat-text">Today's Events</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{stats?.byAction?.length || 0}</div>
          <div className="stat-text">Action Types</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{stats?.byUser?.length || 0}</div>
          <div className="stat-text">Active Users</div>
        </div>
      </div>

      {/* Filters */}
      <div style={{
        display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap'
      }}>
        <select
          value={filters.action}
          onChange={(e) => setFilters(prev => ({ ...prev, action: e.target.value }))}
          style={{
            padding: '10px 14px', background: 'rgba(15, 23, 42, 0.6)',
            border: '1px solid rgba(99, 102, 241, 0.2)', borderRadius: '10px',
            color: '#e2e8f0', fontSize: '14px'
          }}
        >
          <option value="">All Actions</option>
          <option value="CREATE">Create</option>
          <option value="UPDATE">Update</option>
          <option value="DELETE">Delete</option>
          <option value="VIEW">View</option>
          <option value="EXPORT">Export</option>
          <option value="LOGIN">Login</option>
        </select>

        <select
          value={filters.module}
          onChange={(e) => setFilters(prev => ({ ...prev, module: e.target.value }))}
          style={{
            padding: '10px 14px', background: 'rgba(15, 23, 42, 0.6)',
            border: '1px solid rgba(99, 102, 241, 0.2)', borderRadius: '10px',
            color: '#e2e8f0', fontSize: '14px'
          }}
        >
          <option value="">All Modules</option>
          <option value="diversity-metrics">Diversity Metrics</option>
          <option value="pay-equity">Pay Equity</option>
          <option value="hiring-bias">Hiring Bias</option>
          <option value="incident-reports">Incident Reports</option>
          <option value="compliance-reports">Compliance Reports</option>
          <option value="auth">Authentication</option>
        </select>

        <button className="btn-secondary" onClick={() => setFilters({ action: '', module: '' })}>
          Clear Filters
        </button>
      </div>

      {/* Activity by Action Type */}
      {stats?.byAction && stats.byAction.length > 0 && (
        <div style={{
          background: 'rgba(30, 41, 59, 0.6)',
          border: '1px solid rgba(99, 102, 241, 0.1)',
          borderRadius: '16px',
          padding: '24px',
          marginBottom: '24px'
        }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#f1f5f9', marginBottom: '16px' }}>Activity by Action Type</h3>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {stats.byAction.map(item => (
              <div key={item.action} style={{
                background: 'rgba(15, 23, 42, 0.4)',
                padding: '12px 20px',
                borderRadius: '10px',
                border: '1px solid rgba(99, 102, 241, 0.08)',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '20px', fontWeight: 700, color: '#a5b4fc' }}>{item.count}</div>
                <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase' }}>{item.action}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Log Table */}
      <div className="data-table-container">
        {loading ? (
          <p style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>Loading audit logs...</p>
        ) : logs.length === 0 ? (
          <p style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>No audit log entries found. Actions will appear here as users interact with the system.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>User</th>
                <th>Action</th>
                <th>Module</th>
                <th>Record ID</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {logs.map(log => (
                <tr key={log.id} style={{ cursor: 'default' }}>
                  <td style={{ fontSize: '13px', color: '#94a3b8' }}>{formatDate(log.created_at)}</td>
                  <td>{log.user_name || 'System'}</td>
                  <td>{getActionBadge(log.action)}</td>
                  <td>{log.module}</td>
                  <td>{log.record_id || '--'}</td>
                  <td style={{ maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {log.details || '--'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default AuditLog;
