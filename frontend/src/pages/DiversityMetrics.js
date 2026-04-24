import React, { useState, useEffect, useCallback } from 'react';
import AIAnalysisPanel from '../components/AIAnalysisPanel';

const API = 'http://localhost:3001/api';

const METRIC_TYPES = ['Gender', 'Ethnicity', 'Age', 'Disability'];

const emptyForm = {
  department: '',
  metric_type: 'Gender',
  category: '',
  value: '',
  period: '',
  year: new Date().getFullYear(),
  target_value: '',
  notes: ''
};

function DiversityMetrics({ token }) {
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
      const res = await fetch(`${API}/diversity-metrics`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      setData(Array.isArray(json) ? json : []);
    } catch (err) {
      console.error('Failed to fetch diversity metrics:', err);
      setData([]);
    }
    setLoading(false);
  }, [token]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Stats
  const totalRecords = data.length;
  const departments = [...new Set(data.map(d => d.department))].length;
  const avgValue = totalRecords > 0
    ? (data.reduce((sum, d) => sum + (parseFloat(d.value) || 0), 0) / totalRecords).toFixed(1)
    : '0.0';

  // Create
  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API}/diversity-metrics`, {
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
      console.error('Failed to create metric:', err);
    }
  };

  // Edit
  const handleEdit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API}/diversity-metrics/${selectedRecord.id}`, {
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
      console.error('Failed to update metric:', err);
    }
  };

  // Delete
  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this record?')) return;
    try {
      const res = await fetch(`${API}/diversity-metrics/${selectedRecord.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setShowDetailModal(false);
        setSelectedRecord(null);
        fetchData();
      }
    } catch (err) {
      console.error('Failed to delete metric:', err);
    }
  };

  // AI Analysis (full dataset)
  const handleAiAnalysis = async () => {
    setAiLoading(true);
    setAiAnalysis(null);
    try {
      const res = await fetch(`${API}/ai/analyze-diversity`, {
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
        body: JSON.stringify({ record, type: 'diversity_metrics' })
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
      metric_type: selectedRecord.metric_type || 'Gender',
      category: selectedRecord.category || '',
      value: selectedRecord.value || '',
      period: selectedRecord.period || '',
      year: selectedRecord.year || new Date().getFullYear(),
      target_value: selectedRecord.target_value || '',
      notes: selectedRecord.notes || ''
    });
    setShowDetailModal(false);
    setShowEditModal(true);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const getGapBadge = (value, target) => {
    const v = parseFloat(value) || 0;
    const t = parseFloat(target) || 0;
    const gap = v - t;
    if (t === 0) return <span className="badge-success">--</span>;
    if (gap >= 0) return <span className="badge-success">+{gap.toFixed(1)}%</span>;
    if (gap > -5) return <span className="badge-warning">{gap.toFixed(1)}%</span>;
    return <span className="badge-danger">{gap.toFixed(1)}%</span>;
  };

  // Form modal (shared between create and edit)
  const renderFormModal = (isEdit) => (
    <div className="modal-overlay" onClick={() => isEdit ? setShowEditModal(false) : setShowCreateModal(false)}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{isEdit ? 'Edit Metric' : 'New Diversity Metric'}</h3>
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
                <label>Metric Type</label>
                <select name="metric_type" value={formData.metric_type} onChange={handleFormChange} required>
                  {METRIC_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Category</label>
                <input
                  type="text"
                  name="category"
                  value={formData.category}
                  onChange={handleFormChange}
                  required
                  placeholder="e.g. Female, Hispanic"
                />
              </div>
              <div className="form-group">
                <label>Value (%)</label>
                <input
                  type="number"
                  step="0.1"
                  name="value"
                  value={formData.value}
                  onChange={handleFormChange}
                  required
                  placeholder="e.g. 32.5"
                />
              </div>
              <div className="form-group">
                <label>Period</label>
                <input
                  type="text"
                  name="period"
                  value={formData.period}
                  onChange={handleFormChange}
                  required
                  placeholder="e.g. Q1, H1, Annual"
                />
              </div>
              <div className="form-group">
                <label>Year</label>
                <input
                  type="number"
                  name="year"
                  value={formData.year}
                  onChange={handleFormChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Target Value (%)</label>
                <input
                  type="number"
                  step="0.1"
                  name="target_value"
                  value={formData.target_value}
                  onChange={handleFormChange}
                  placeholder="e.g. 40.0"
                />
              </div>
              <div className="form-group">
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
                {isEdit ? 'Update Metric' : 'Create Metric'}
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
          <h2>Diversity Metrics</h2>
          <p>Track demographic representation across departments and roles</p>
        </div>
        <div className="header-actions">
          <button className="btn-ai" onClick={handleAiAnalysis}>
            AI Analysis
          </button>
          <button className="btn-primary" onClick={() => { setFormData({ ...emptyForm }); setShowCreateModal(true); }}>
            + New Metric
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
          <div className="stat-number">{departments}</div>
          <div className="stat-text">Departments</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{avgValue}%</div>
          <div className="stat-text">Avg Value</div>
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
          <p style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>Loading diversity metrics...</p>
        ) : data.length === 0 ? (
          <p style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>No diversity metrics found. Click "New Metric" to add one.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Department</th>
                <th>Type</th>
                <th>Category</th>
                <th>Value%</th>
                <th>Target%</th>
                <th>Gap</th>
                <th>Period</th>
                <th>Year</th>
                <th>AI</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row) => (
                <tr key={row.id} onClick={() => openDetail(row)} style={{ cursor: 'pointer' }}>
                  <td>{row.department}</td>
                  <td>{row.metric_type}</td>
                  <td>{row.category}</td>
                  <td>{parseFloat(row.value || 0).toFixed(1)}%</td>
                  <td>{row.target_value ? `${parseFloat(row.target_value).toFixed(1)}%` : '--'}</td>
                  <td>{getGapBadge(row.value, row.target_value)}</td>
                  <td>{row.period}</td>
                  <td>{row.year}</td>
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
              <h3>Metric Details</h3>
              <button className="modal-close" onClick={() => setShowDetailModal(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="detail-grid">
                <div className="detail-item">
                  <div className="detail-label">Department</div>
                  <div className="detail-value">{selectedRecord.department}</div>
                </div>
                <div className="detail-item">
                  <div className="detail-label">Metric Type</div>
                  <div className="detail-value">{selectedRecord.metric_type}</div>
                </div>
                <div className="detail-item">
                  <div className="detail-label">Category</div>
                  <div className="detail-value">{selectedRecord.category}</div>
                </div>
                <div className="detail-item">
                  <div className="detail-label">Value</div>
                  <div className="detail-value">{parseFloat(selectedRecord.value || 0).toFixed(1)}%</div>
                </div>
                <div className="detail-item">
                  <div className="detail-label">Target Value</div>
                  <div className="detail-value">{selectedRecord.target_value ? `${parseFloat(selectedRecord.target_value).toFixed(1)}%` : '--'}</div>
                </div>
                <div className="detail-item">
                  <div className="detail-label">Gap</div>
                  <div className="detail-value">{getGapBadge(selectedRecord.value, selectedRecord.target_value)}</div>
                </div>
                <div className="detail-item">
                  <div className="detail-label">Period</div>
                  <div className="detail-value">{selectedRecord.period}</div>
                </div>
                <div className="detail-item">
                  <div className="detail-label">Year</div>
                  <div className="detail-value">{selectedRecord.year}</div>
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

export default DiversityMetrics;
