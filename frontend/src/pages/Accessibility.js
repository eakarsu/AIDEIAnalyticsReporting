import React, { useState, useEffect, useCallback } from 'react';
import AIAnalysisPanel from '../components/AIAnalysisPanel';

const API = 'http://localhost:3001/api';

const COMPLIANCE_TYPES = ['Digital', 'Physical', 'Workplace', 'Process', 'Safety'];
const STANDARDS = ['WCAG 2.1 AA', 'ADA', 'Section 508'];
const STATUSES = ['Compliant', 'Partial', 'Non-Compliant', 'Under Review'];

const emptyForm = {
  area: '',
  compliance_type: 'Digital',
  standard: 'WCAG 2.1 AA',
  score: '',
  status: 'Compliant',
  accommodations_requested: '',
  accommodations_granted: '',
  avg_response_days: '',
  department: '',
  audit_date: '',
  next_review: '',
  notes: ''
};

function Accessibility({ token }) {
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
      const res = await fetch(`${API}/accessibility`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      setData(Array.isArray(json) ? json : []);
    } catch (err) {
      console.error('Failed to fetch accessibility data:', err);
      setData([]);
    }
    setLoading(false);
  }, [token]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Stats
  const totalRecords = data.length;
  const avgScore = totalRecords > 0
    ? (data.reduce((sum, d) => sum + (parseFloat(d.score) || 0), 0) / totalRecords).toFixed(1)
    : '0.0';
  const compliantCount = data.filter(d => d.status === 'Compliant').length;
  const totalAccommodationsGranted = data.reduce((sum, d) => sum + (parseInt(d.accommodations_granted) || 0), 0);

  // Create
  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API}/accessibility`, {
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
      console.error('Failed to create accessibility record:', err);
    }
  };

  // Edit
  const handleEdit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API}/accessibility/${selectedRecord.id}`, {
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
      console.error('Failed to update accessibility record:', err);
    }
  };

  // Delete
  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this record?')) return;
    try {
      const res = await fetch(`${API}/accessibility/${selectedRecord.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setShowDetailModal(false);
        setSelectedRecord(null);
        fetchData();
      }
    } catch (err) {
      console.error('Failed to delete accessibility record:', err);
    }
  };

  // AI Analysis (full dataset)
  const handleAiAnalysis = async () => {
    setAiLoading(true);
    setAiAnalysis(null);
    try {
      const res = await fetch(`${API}/ai/analyze-accessibility`, {
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
        body: JSON.stringify({ record, type: 'accessibility' })
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
      area: selectedRecord.area || '',
      compliance_type: selectedRecord.compliance_type || 'Digital',
      standard: selectedRecord.standard || 'WCAG 2.1 AA',
      score: selectedRecord.score || '',
      status: selectedRecord.status || 'Compliant',
      accommodations_requested: selectedRecord.accommodations_requested || '',
      accommodations_granted: selectedRecord.accommodations_granted || '',
      avg_response_days: selectedRecord.avg_response_days || '',
      department: selectedRecord.department || '',
      audit_date: selectedRecord.audit_date ? selectedRecord.audit_date.substring(0, 10) : '',
      next_review: selectedRecord.next_review ? selectedRecord.next_review.substring(0, 10) : '',
      notes: selectedRecord.notes || ''
    });
    setShowDetailModal(false);
    setShowEditModal(true);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const getStatusBadge = (status) => {
    const classMap = {
      'Compliant': 'badge-success',
      'Partial': 'badge-warning',
      'Non-Compliant': 'badge-danger',
      'Under Review': 'badge-info'
    };
    return <span className={classMap[status] || 'badge-info'}>{status}</span>;
  };

  // Form modal (shared between create and edit)
  const renderFormModal = (isEdit) => (
    <div className="modal-overlay" onClick={() => isEdit ? setShowEditModal(false) : setShowCreateModal(false)}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{isEdit ? 'Edit Record' : 'New Accessibility Record'}</h3>
          <button className="modal-close" onClick={() => isEdit ? setShowEditModal(false) : setShowCreateModal(false)}>&times;</button>
        </div>
        <div className="modal-body">
          <form onSubmit={isEdit ? handleEdit : handleCreate}>
            <div className="form-grid">
              <div className="form-group">
                <label>Area</label>
                <input
                  type="text"
                  name="area"
                  value={formData.area}
                  onChange={handleFormChange}
                  required
                  placeholder="e.g. Website, Building A"
                />
              </div>
              <div className="form-group">
                <label>Compliance Type</label>
                <select name="compliance_type" value={formData.compliance_type} onChange={handleFormChange} required>
                  {COMPLIANCE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Standard</label>
                <select name="standard" value={formData.standard} onChange={handleFormChange} required>
                  {STANDARDS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Score</label>
                <input
                  type="number"
                  step="0.1"
                  name="score"
                  value={formData.score}
                  onChange={handleFormChange}
                  required
                  placeholder="e.g. 85.5"
                />
              </div>
              <div className="form-group">
                <label>Status</label>
                <select name="status" value={formData.status} onChange={handleFormChange} required>
                  {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Accommodations Requested</label>
                <input
                  type="number"
                  name="accommodations_requested"
                  value={formData.accommodations_requested}
                  onChange={handleFormChange}
                  placeholder="e.g. 10"
                />
              </div>
              <div className="form-group">
                <label>Accommodations Granted</label>
                <input
                  type="number"
                  name="accommodations_granted"
                  value={formData.accommodations_granted}
                  onChange={handleFormChange}
                  placeholder="e.g. 8"
                />
              </div>
              <div className="form-group">
                <label>Avg Response Days</label>
                <input
                  type="number"
                  step="0.1"
                  name="avg_response_days"
                  value={formData.avg_response_days}
                  onChange={handleFormChange}
                  placeholder="e.g. 3.5"
                />
              </div>
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
                <label>Audit Date</label>
                <input
                  type="date"
                  name="audit_date"
                  value={formData.audit_date}
                  onChange={handleFormChange}
                />
              </div>
              <div className="form-group">
                <label>Next Review</label>
                <input
                  type="date"
                  name="next_review"
                  value={formData.next_review}
                  onChange={handleFormChange}
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
          <h2>Accessibility</h2>
          <p>Track accessibility compliance, accommodations, and audit results</p>
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
          <div className="stat-number">{avgScore}</div>
          <div className="stat-text">Avg Score</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{compliantCount}</div>
          <div className="stat-text">Compliant</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{totalAccommodationsGranted}</div>
          <div className="stat-text">Accommodations Granted</div>
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
          <p style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>Loading accessibility data...</p>
        ) : data.length === 0 ? (
          <p style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>No accessibility records found. Click "New Record" to add one.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Area</th>
                <th>Type</th>
                <th>Standard</th>
                <th>Score</th>
                <th>Status</th>
                <th>Requested</th>
                <th>Granted</th>
                <th>Resp Days</th>
                <th>Department</th>
                <th>AI</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row) => (
                <tr key={row.id} onClick={() => openDetail(row)} style={{ cursor: 'pointer' }}>
                  <td>{row.area}</td>
                  <td>{row.compliance_type}</td>
                  <td>{row.standard}</td>
                  <td>{parseFloat(row.score || 0).toFixed(1)}</td>
                  <td>{getStatusBadge(row.status)}</td>
                  <td>{row.accommodations_requested ?? '--'}</td>
                  <td>{row.accommodations_granted ?? '--'}</td>
                  <td>{row.avg_response_days != null ? parseFloat(row.avg_response_days).toFixed(1) : '--'}</td>
                  <td>{row.department}</td>
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
              <h3>Accessibility Record Details</h3>
              <button className="modal-close" onClick={() => setShowDetailModal(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="detail-grid">
                <div className="detail-item">
                  <div className="detail-label">Area</div>
                  <div className="detail-value">{selectedRecord.area}</div>
                </div>
                <div className="detail-item">
                  <div className="detail-label">Compliance Type</div>
                  <div className="detail-value">{selectedRecord.compliance_type}</div>
                </div>
                <div className="detail-item">
                  <div className="detail-label">Standard</div>
                  <div className="detail-value">{selectedRecord.standard}</div>
                </div>
                <div className="detail-item">
                  <div className="detail-label">Score</div>
                  <div className="detail-value">{parseFloat(selectedRecord.score || 0).toFixed(1)}</div>
                </div>
                <div className="detail-item">
                  <div className="detail-label">Status</div>
                  <div className="detail-value">{getStatusBadge(selectedRecord.status)}</div>
                </div>
                <div className="detail-item">
                  <div className="detail-label">Accommodations Requested</div>
                  <div className="detail-value">{selectedRecord.accommodations_requested ?? '--'}</div>
                </div>
                <div className="detail-item">
                  <div className="detail-label">Accommodations Granted</div>
                  <div className="detail-value">{selectedRecord.accommodations_granted ?? '--'}</div>
                </div>
                <div className="detail-item">
                  <div className="detail-label">Avg Response Days</div>
                  <div className="detail-value">{selectedRecord.avg_response_days != null ? parseFloat(selectedRecord.avg_response_days).toFixed(1) : '--'}</div>
                </div>
                <div className="detail-item">
                  <div className="detail-label">Department</div>
                  <div className="detail-value">{selectedRecord.department}</div>
                </div>
                <div className="detail-item">
                  <div className="detail-label">Audit Date</div>
                  <div className="detail-value">{selectedRecord.audit_date ? selectedRecord.audit_date.substring(0, 10) : '--'}</div>
                </div>
                <div className="detail-item">
                  <div className="detail-label">Next Review</div>
                  <div className="detail-value">{selectedRecord.next_review ? selectedRecord.next_review.substring(0, 10) : '--'}</div>
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

export default Accessibility;
