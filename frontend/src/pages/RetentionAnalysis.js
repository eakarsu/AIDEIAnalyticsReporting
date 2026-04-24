import React, { useState, useEffect, useCallback } from 'react';
import AIAnalysisPanel from '../components/AIAnalysisPanel';

const API = 'http://localhost:3001/api';

const RISK_LEVELS = ['Low', 'Medium', 'High', 'Critical'];

const emptyForm = {
  department: '',
  demographic_group: '',
  total_employees: '',
  departures: '',
  turnover_rate: '',
  voluntary_departures: '',
  involuntary_departures: '',
  avg_tenure: '',
  exit_reason: '',
  risk_level: 'Low',
  period: '',
  notes: ''
};

function RetentionAnalysis({ token }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [formData, setFormData] = useState({ ...emptyForm });
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [recordAiAnalysis, setRecordAiAnalysis] = useState(null);
  const [recordAiLoading, setRecordAiLoading] = useState(false);

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/retention-analysis`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      setData(Array.isArray(json) ? json : []);
    } catch (err) {
      console.error('Failed to fetch retention analysis:', err);
      setData([]);
    }
    setLoading(false);
  }, [token]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Stats
  const totalRecords = data.length;
  const avgTurnoverRate = totalRecords > 0
    ? (data.reduce((sum, d) => sum + (parseFloat(d.turnover_rate) || 0), 0) / totalRecords).toFixed(1)
    : '0.0';
  const criticalRiskCount = data.filter(d => d.risk_level === 'Critical').length;
  const totalDepartures = data.reduce((sum, d) => sum + (parseInt(d.departures) || 0), 0);

  // Create
  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API}/retention-analysis`, {
        method: 'POST',
        headers,
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setShowCreateModal(false);
        setFormData({ ...emptyForm });
        fetchData();
      }
    } catch (err) {
      console.error('Failed to create record:', err);
    }
  };

  // Edit
  const handleEdit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API}/retention-analysis/${selectedRecord.id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setShowEditModal(false);
        setShowDetailModal(false);
        setSelectedRecord(null);
        setFormData({ ...emptyForm });
        fetchData();
      }
    } catch (err) {
      console.error('Failed to update record:', err);
    }
  };

  // Delete
  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this record?')) return;
    try {
      const res = await fetch(`${API}/retention-analysis/${selectedRecord.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setShowDetailModal(false);
        setSelectedRecord(null);
        fetchData();
      }
    } catch (err) {
      console.error('Failed to delete record:', err);
    }
  };

  // AI Analysis (full dataset)
  const handleAiAnalysis = async () => {
    setAiLoading(true);
    setAiAnalysis(null);
    try {
      const res = await fetch(`${API}/ai/analyze-retention`, {
        method: 'POST',
        headers
      });
      const json = await res.json();
      setAiAnalysis(json.analysis || json.message || JSON.stringify(json));
    } catch (err) {
      setAiAnalysis('Failed to get AI analysis.');
    }
    setAiLoading(false);
  };

  // AI Analysis (single record)
  const handleRecordAiAnalysis = async (e, record) => {
    e.stopPropagation();
    setRecordAiLoading(true);
    setRecordAiAnalysis(null);
    try {
      const res = await fetch(`${API}/ai/analyze-record`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ record, type: 'retention_analysis' })
      });
      const json = await res.json();
      setRecordAiAnalysis(json.analysis || json.message || JSON.stringify(json));
    } catch (err) {
      setRecordAiAnalysis('Failed to get AI analysis for this record.');
    }
    setRecordAiLoading(false);
  };

  // Row click -> detail
  const openDetail = (record) => {
    setSelectedRecord(record);
    setShowDetailModal(true);
  };

  // Open edit from detail
  const openEdit = () => {
    setFormData({
      department: selectedRecord.department || '',
      demographic_group: selectedRecord.demographic_group || '',
      total_employees: selectedRecord.total_employees || '',
      departures: selectedRecord.departures || '',
      turnover_rate: selectedRecord.turnover_rate || '',
      voluntary_departures: selectedRecord.voluntary_departures || '',
      involuntary_departures: selectedRecord.involuntary_departures || '',
      avg_tenure: selectedRecord.avg_tenure || '',
      exit_reason: selectedRecord.exit_reason || '',
      risk_level: selectedRecord.risk_level || 'Low',
      period: selectedRecord.period || '',
      notes: selectedRecord.notes || ''
    });
    setShowDetailModal(false);
    setShowEditModal(true);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const getRiskBadge = (riskLevel) => {
    switch (riskLevel) {
      case 'Low':
        return <span className="badge-success">{riskLevel}</span>;
      case 'Medium':
        return <span className="badge-warning">{riskLevel}</span>;
      case 'High':
        return <span className="badge-danger">{riskLevel}</span>;
      case 'Critical':
        return <span className="badge-danger" style={{ fontWeight: 'bold' }}>{riskLevel}</span>;
      default:
        return <span className="badge-success">{riskLevel || '--'}</span>;
    }
  };

  // Form modal (shared between create and edit)
  const renderFormModal = (isEdit) => (
    <div className="modal-overlay" onClick={() => isEdit ? setShowEditModal(false) : setShowCreateModal(false)}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{isEdit ? 'Edit Record' : 'New Record'}</h3>
          <button className="modal-close" onClick={() => isEdit ? setShowEditModal(false) : setShowCreateModal(false)}>&times;</button>
        </div>
        <div className="modal-body">
          <form onSubmit={isEdit ? handleEdit : handleCreate}>
            <div className="form-grid">
              <div className="form-group">
                <label>Department</label>
                <input
                  type="text"
                  name="department"
                  value={formData.department}
                  onChange={handleFormChange}
                  required
                  placeholder="e.g. Engineering"
                />
              </div>
              <div className="form-group">
                <label>Demographic Group</label>
                <input
                  type="text"
                  name="demographic_group"
                  value={formData.demographic_group}
                  onChange={handleFormChange}
                  required
                  placeholder="e.g. Women, Hispanic"
                />
              </div>
              <div className="form-group">
                <label>Total Employees</label>
                <input
                  type="number"
                  name="total_employees"
                  value={formData.total_employees}
                  onChange={handleFormChange}
                  required
                  placeholder="e.g. 150"
                />
              </div>
              <div className="form-group">
                <label>Departures</label>
                <input
                  type="number"
                  name="departures"
                  value={formData.departures}
                  onChange={handleFormChange}
                  required
                  placeholder="e.g. 12"
                />
              </div>
              <div className="form-group">
                <label>Turnover Rate (%)</label>
                <input
                  type="number"
                  step="0.1"
                  name="turnover_rate"
                  value={formData.turnover_rate}
                  onChange={handleFormChange}
                  required
                  placeholder="e.g. 8.0"
                />
              </div>
              <div className="form-group">
                <label>Voluntary Departures</label>
                <input
                  type="number"
                  name="voluntary_departures"
                  value={formData.voluntary_departures}
                  onChange={handleFormChange}
                  placeholder="e.g. 8"
                />
              </div>
              <div className="form-group">
                <label>Involuntary Departures</label>
                <input
                  type="number"
                  name="involuntary_departures"
                  value={formData.involuntary_departures}
                  onChange={handleFormChange}
                  placeholder="e.g. 4"
                />
              </div>
              <div className="form-group">
                <label>Avg Tenure (years)</label>
                <input
                  type="number"
                  step="0.1"
                  name="avg_tenure"
                  value={formData.avg_tenure}
                  onChange={handleFormChange}
                  placeholder="e.g. 3.5"
                />
              </div>
              <div className="form-group">
                <label>Exit Reason</label>
                <input
                  type="text"
                  name="exit_reason"
                  value={formData.exit_reason}
                  onChange={handleFormChange}
                  placeholder="e.g. Career growth"
                />
              </div>
              <div className="form-group">
                <label>Risk Level</label>
                <select name="risk_level" value={formData.risk_level} onChange={handleFormChange} required>
                  {RISK_LEVELS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Period</label>
                <input
                  type="text"
                  name="period"
                  value={formData.period}
                  onChange={handleFormChange}
                  required
                  placeholder="e.g. Q1 2025"
                />
              </div>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label>Notes</label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleFormChange}
                  rows="3"
                  placeholder="Optional notes..."
                />
              </div>
            </div>
            <div className="form-actions">
              <button type="button" className="btn-secondary" onClick={() => isEdit ? setShowEditModal(false) : setShowCreateModal(false)}>
                Cancel
              </button>
              <button type="submit" className="btn-primary">
                {isEdit ? 'Update Record' : 'Create Record'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Retention Analysis</h2>
          <p>Monitor employee retention, turnover rates, and attrition risk across demographics</p>
        </div>
        <div className="header-actions">
          <button className="btn-ai" onClick={handleAiAnalysis}>
            AI Analysis
          </button>
          <button className="btn-primary" onClick={() => { setFormData({ ...emptyForm }); setShowCreateModal(true); }}>
            + New Record
          </button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="stats-bar">
        <div className="stat-card">
          <div className="stat-number">{totalRecords}</div>
          <div className="stat-text">Total Records</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{avgTurnoverRate}%</div>
          <div className="stat-text">Avg Turnover Rate</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{criticalRiskCount}</div>
          <div className="stat-text">Critical Risk</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{totalDepartures}</div>
          <div className="stat-text">Total Departures</div>
        </div>
      </div>

      {/* AI Analysis Panel (full dataset) */}
      <AIAnalysisPanel
        analysis={aiAnalysis}
        loading={aiLoading}
        onClose={() => setAiAnalysis(null)}
      />

      {/* Record-level AI Analysis Panel */}
      <AIAnalysisPanel
        analysis={recordAiAnalysis}
        loading={recordAiLoading}
        onClose={() => setRecordAiAnalysis(null)}
      />

      {/* Data Table */}
      <div className="data-table-container">
        {loading ? (
          <p style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>Loading retention analysis...</p>
        ) : data.length === 0 ? (
          <p style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>No retention records found. Click "New Record" to add one.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Department</th>
                <th>Demo Group</th>
                <th>Employees</th>
                <th>Departures</th>
                <th>Turnover%</th>
                <th>Vol</th>
                <th>Invol</th>
                <th>Tenure</th>
                <th>Risk Level</th>
                <th>AI</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row) => (
                <tr key={row.id} onClick={() => openDetail(row)} style={{ cursor: 'pointer' }}>
                  <td>{row.department}</td>
                  <td>{row.demographic_group}</td>
                  <td>{row.total_employees}</td>
                  <td>{row.departures}</td>
                  <td>{parseFloat(row.turnover_rate || 0).toFixed(1)}%</td>
                  <td>{row.voluntary_departures || '--'}</td>
                  <td>{row.involuntary_departures || '--'}</td>
                  <td>{row.avg_tenure ? `${parseFloat(row.avg_tenure).toFixed(1)}y` : '--'}</td>
                  <td>{getRiskBadge(row.risk_level)}</td>
                  <td>
                    <button
                      className="btn-ai"
                      style={{ padding: '4px 10px', fontSize: '12px' }}
                      onClick={(e) => handleRecordAiAnalysis(e, row)}
                    >
                      AI Analyze
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && renderFormModal(false)}

      {/* Edit Modal */}
      {showEditModal && renderFormModal(true)}

      {/* Detail Modal */}
      {showDetailModal && selectedRecord && (
        <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Record Details</h3>
              <button className="modal-close" onClick={() => setShowDetailModal(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="detail-grid">
                <div className="detail-item">
                  <div className="detail-label">Department</div>
                  <div className="detail-value">{selectedRecord.department}</div>
                </div>
                <div className="detail-item">
                  <div className="detail-label">Demographic Group</div>
                  <div className="detail-value">{selectedRecord.demographic_group}</div>
                </div>
                <div className="detail-item">
                  <div className="detail-label">Total Employees</div>
                  <div className="detail-value">{selectedRecord.total_employees}</div>
                </div>
                <div className="detail-item">
                  <div className="detail-label">Departures</div>
                  <div className="detail-value">{selectedRecord.departures}</div>
                </div>
                <div className="detail-item">
                  <div className="detail-label">Turnover Rate</div>
                  <div className="detail-value">{parseFloat(selectedRecord.turnover_rate || 0).toFixed(1)}%</div>
                </div>
                <div className="detail-item">
                  <div className="detail-label">Voluntary Departures</div>
                  <div className="detail-value">{selectedRecord.voluntary_departures || '--'}</div>
                </div>
                <div className="detail-item">
                  <div className="detail-label">Involuntary Departures</div>
                  <div className="detail-value">{selectedRecord.involuntary_departures || '--'}</div>
                </div>
                <div className="detail-item">
                  <div className="detail-label">Avg Tenure</div>
                  <div className="detail-value">{selectedRecord.avg_tenure ? `${parseFloat(selectedRecord.avg_tenure).toFixed(1)} years` : '--'}</div>
                </div>
                <div className="detail-item">
                  <div className="detail-label">Exit Reason</div>
                  <div className="detail-value">{selectedRecord.exit_reason || '--'}</div>
                </div>
                <div className="detail-item">
                  <div className="detail-label">Risk Level</div>
                  <div className="detail-value">{getRiskBadge(selectedRecord.risk_level)}</div>
                </div>
                <div className="detail-item">
                  <div className="detail-label">Period</div>
                  <div className="detail-value">{selectedRecord.period}</div>
                </div>
                <div className="detail-item" style={{ gridColumn: '1 / -1' }}>
                  <div className="detail-label">Notes</div>
                  <div className="detail-value">{selectedRecord.notes || 'No notes'}</div>
                </div>
              </div>
              <div className="form-actions" style={{ marginTop: '1.5rem' }}>
                <button className="btn-danger" onClick={handleDelete}>Delete</button>
                <button className="btn-primary" onClick={openEdit}>Edit</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default RetentionAnalysis;
