import React, { useState, useEffect, useCallback } from 'react';
import AIAnalysisPanel from '../components/AIAnalysisPanel';

const API = 'http://localhost:3001/api';

const emptyForm = {
  job_title: '',
  department: '',
  total_applicants: '',
  demographic_group: '',
  applicants_in_group: '',
  interviewed: '',
  offered: '',
  hired: '',
  pass_through_rate: '',
  bias_score: '',
  period: '',
  notes: ''
};

function getBiasScoreBadgeClass(score) {
  const s = parseFloat(score);
  if (isNaN(s)) return 'badge-success';
  if (s >= -1) return 'badge-success';
  if (s >= -3) return 'badge-warning';
  return 'badge-danger';
}

function HiringBias({ token }) {
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
      const res = await fetch(`${API}/hiring-bias`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      setData(Array.isArray(json) ? json : []);
    } catch (err) {
      console.error('Failed to fetch hiring bias data:', err);
      setData([]);
    }
    setLoading(false);
  }, [token]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Stats
  const totalRecords = data.length;
  const avgBiasScore = totalRecords > 0
    ? (data.reduce((sum, d) => sum + (parseFloat(d.bias_score) || 0), 0) / totalRecords).toFixed(2)
    : '0.00';
  const totalApplicants = data.reduce((sum, d) => sum + (parseInt(d.total_applicants, 10) || 0), 0);
  const avgPassThroughRate = totalRecords > 0
    ? (data.reduce((sum, d) => sum + (parseFloat(d.pass_through_rate) || 0), 0) / totalRecords).toFixed(1)
    : '0.0';

  // Create
  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API}/hiring-bias`, {
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
      console.error('Failed to create hiring bias record:', err);
    }
  };

  // Edit
  const handleEdit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API}/hiring-bias/${selectedRecord.id}`, {
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
      console.error('Failed to update hiring bias record:', err);
    }
  };

  // Delete
  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this record?')) return;
    try {
      const res = await fetch(`${API}/hiring-bias/${selectedRecord.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setShowDetailModal(false);
        setSelectedRecord(null);
        fetchData();
      }
    } catch (err) {
      console.error('Failed to delete hiring bias record:', err);
    }
  };

  // AI Analysis (full dataset)
  const handleAiAnalysis = async () => {
    setAiLoading(true);
    setAiAnalysis(null);
    try {
      const res = await fetch(`${API}/ai/analyze-hiring-bias`, {
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
        body: JSON.stringify({ record, type: 'hiring_bias' })
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
      job_title: selectedRecord.job_title || '',
      department: selectedRecord.department || '',
      total_applicants: selectedRecord.total_applicants || '',
      demographic_group: selectedRecord.demographic_group || '',
      applicants_in_group: selectedRecord.applicants_in_group || '',
      interviewed: selectedRecord.interviewed || '',
      offered: selectedRecord.offered || '',
      hired: selectedRecord.hired || '',
      pass_through_rate: selectedRecord.pass_through_rate || '',
      bias_score: selectedRecord.bias_score || '',
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

  // Form modal (shared between create and edit)
  const renderFormModal = (isEdit) => (
    <div className="modal-overlay" onClick={() => isEdit ? setShowEditModal(false) : setShowCreateModal(false)}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{isEdit ? 'Edit Hiring Bias Record' : 'New Hiring Bias Record'}</h3>
          <button className="modal-close" onClick={() => isEdit ? setShowEditModal(false) : setShowCreateModal(false)}>&times;</button>
        </div>
        <div className="modal-body">
          <form onSubmit={isEdit ? handleEdit : handleCreate}>
            <div className="form-grid">
              <div className="form-group">
                <label>Job Title</label>
                <input
                  type="text"
                  name="job_title"
                  value={formData.job_title}
                  onChange={handleFormChange}
                  required
                  placeholder="e.g. Software Engineer"
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
                <label>Total Applicants</label>
                <input
                  type="number"
                  name="total_applicants"
                  value={formData.total_applicants}
                  onChange={handleFormChange}
                  required
                  placeholder="e.g. 200"
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
                  placeholder="e.g. Female, Hispanic"
                />
              </div>
              <div className="form-group">
                <label>Applicants in Group</label>
                <input
                  type="number"
                  name="applicants_in_group"
                  value={formData.applicants_in_group}
                  onChange={handleFormChange}
                  required
                  placeholder="e.g. 50"
                />
              </div>
              <div className="form-group">
                <label>Interviewed</label>
                <input
                  type="number"
                  name="interviewed"
                  value={formData.interviewed}
                  onChange={handleFormChange}
                  required
                  placeholder="e.g. 20"
                />
              </div>
              <div className="form-group">
                <label>Offered</label>
                <input
                  type="number"
                  name="offered"
                  value={formData.offered}
                  onChange={handleFormChange}
                  required
                  placeholder="e.g. 8"
                />
              </div>
              <div className="form-group">
                <label>Hired</label>
                <input
                  type="number"
                  name="hired"
                  value={formData.hired}
                  onChange={handleFormChange}
                  required
                  placeholder="e.g. 5"
                />
              </div>
              <div className="form-group">
                <label>Pass-Through Rate (%)</label>
                <input
                  type="number"
                  step="0.1"
                  name="pass_through_rate"
                  value={formData.pass_through_rate}
                  onChange={handleFormChange}
                  required
                  placeholder="e.g. 10.0"
                />
              </div>
              <div className="form-group">
                <label>Bias Score</label>
                <input
                  type="number"
                  step="0.01"
                  name="bias_score"
                  value={formData.bias_score}
                  onChange={handleFormChange}
                  required
                  placeholder="e.g. -1.5"
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
                  placeholder="e.g. Q1 2026"
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
          <h2>Hiring Bias</h2>
          <p>Analyze hiring funnel bias across demographics and roles</p>
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
          <div className="stat-number">{avgBiasScore}</div>
          <div className="stat-text">Avg Bias Score</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{totalApplicants.toLocaleString()}</div>
          <div className="stat-text">Total Applicants</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{avgPassThroughRate}%</div>
          <div className="stat-text">Avg Pass-Through Rate</div>
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
          <p style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>Loading hiring bias data...</p>
        ) : data.length === 0 ? (
          <p style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>No hiring bias records found. Click "+ New Record" to add one.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Job Title</th>
                <th>Department</th>
                <th>Demo Group</th>
                <th>Applicants</th>
                <th>Interviewed</th>
                <th>Offered</th>
                <th>Hired</th>
                <th>Pass Rate%</th>
                <th>Bias Score</th>
                <th>Period</th>
                <th>AI</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row) => (
                <tr key={row.id} onClick={() => openDetail(row)} style={{ cursor: 'pointer' }}>
                  <td>{row.job_title}</td>
                  <td>{row.department}</td>
                  <td>{row.demographic_group}</td>
                  <td>{row.total_applicants}</td>
                  <td>{row.interviewed}</td>
                  <td>{row.offered}</td>
                  <td>{row.hired}</td>
                  <td>{parseFloat(row.pass_through_rate || 0).toFixed(1)}%</td>
                  <td>
                    <span className={getBiasScoreBadgeClass(row.bias_score)}>
                      {parseFloat(row.bias_score || 0).toFixed(2)}
                    </span>
                  </td>
                  <td>{row.period}</td>
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
              <h3>Hiring Bias Details</h3>
              <button className="modal-close" onClick={() => setShowDetailModal(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="detail-grid">
                <div className="detail-item">
                  <div className="detail-label">Job Title</div>
                  <div className="detail-value">{selectedRecord.job_title}</div>
                </div>
                <div className="detail-item">
                  <div className="detail-label">Department</div>
                  <div className="detail-value">{selectedRecord.department}</div>
                </div>
                <div className="detail-item">
                  <div className="detail-label">Demographic Group</div>
                  <div className="detail-value">{selectedRecord.demographic_group}</div>
                </div>
                <div className="detail-item">
                  <div className="detail-label">Total Applicants</div>
                  <div className="detail-value">{selectedRecord.total_applicants}</div>
                </div>
                <div className="detail-item">
                  <div className="detail-label">Applicants in Group</div>
                  <div className="detail-value">{selectedRecord.applicants_in_group}</div>
                </div>
                <div className="detail-item">
                  <div className="detail-label">Interviewed</div>
                  <div className="detail-value">{selectedRecord.interviewed}</div>
                </div>
                <div className="detail-item">
                  <div className="detail-label">Offered</div>
                  <div className="detail-value">{selectedRecord.offered}</div>
                </div>
                <div className="detail-item">
                  <div className="detail-label">Hired</div>
                  <div className="detail-value">{selectedRecord.hired}</div>
                </div>
                <div className="detail-item">
                  <div className="detail-label">Pass-Through Rate</div>
                  <div className="detail-value">{parseFloat(selectedRecord.pass_through_rate || 0).toFixed(1)}%</div>
                </div>
                <div className="detail-item">
                  <div className="detail-label">Bias Score</div>
                  <div className="detail-value">
                    <span className={getBiasScoreBadgeClass(selectedRecord.bias_score)}>
                      {parseFloat(selectedRecord.bias_score || 0).toFixed(2)}
                    </span>
                  </div>
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

export default HiringBias;
