import React, { useState, useEffect, useCallback } from 'react';
import AIAnalysisPanel from '../components/AIAnalysisPanel';

const API = 'http://localhost:3001/api';

const TRAINING_TYPES = ['DEI Core', 'Leadership', 'Mentorship', 'Compliance', 'Hiring', 'Professional Development', 'Leadership Development'];
const DELIVERY_METHODS = ['Virtual', 'In-Person', 'Hybrid'];

const emptyForm = {
  program_name: '',
  training_type: 'DEI Core',
  department: '',
  total_enrolled: '',
  completed: '',
  completion_rate: '',
  avg_score: '',
  demographic_group: '',
  delivery_method: 'Virtual',
  duration_hours: '',
  period: '',
  notes: ''
};

function TrainingPrograms({ token }) {
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
      const res = await fetch(`${API}/training-programs`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      setData(Array.isArray(json) ? json : []);
    } catch (err) {
      console.error('Failed to fetch training programs:', err);
      setData([]);
    }
    setLoading(false);
  }, [token]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Stats
  const totalPrograms = data.length;
  const avgCompletionRate = totalPrograms > 0
    ? (data.reduce((sum, d) => sum + (parseFloat(d.completion_rate) || 0), 0) / totalPrograms).toFixed(1)
    : '0.0';
  const avgScore = totalPrograms > 0
    ? (data.reduce((sum, d) => sum + (parseFloat(d.avg_score) || 0), 0) / totalPrograms).toFixed(1)
    : '0.0';
  const totalEnrolled = data.reduce((sum, d) => sum + (parseInt(d.total_enrolled) || 0), 0);

  // Create
  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API}/training-programs`, {
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
      console.error('Failed to create training program:', err);
    }
  };

  // Edit
  const handleEdit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API}/training-programs/${selectedRecord.id}`, {
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
      console.error('Failed to update training program:', err);
    }
  };

  // Delete
  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this record?')) return;
    try {
      const res = await fetch(`${API}/training-programs/${selectedRecord.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setShowDetailModal(false);
        setSelectedRecord(null);
        fetchData();
      }
    } catch (err) {
      console.error('Failed to delete training program:', err);
    }
  };

  // AI Analysis (full dataset)
  const handleAiAnalysis = async () => {
    setAiLoading(true);
    setAiAnalysis(null);
    try {
      const res = await fetch(`${API}/ai/analyze-training`, {
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
        body: JSON.stringify({ record, type: 'training_programs' })
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
      program_name: selectedRecord.program_name || '',
      training_type: selectedRecord.training_type || 'DEI Core',
      department: selectedRecord.department || '',
      total_enrolled: selectedRecord.total_enrolled || '',
      completed: selectedRecord.completed || '',
      completion_rate: selectedRecord.completion_rate || '',
      avg_score: selectedRecord.avg_score || '',
      demographic_group: selectedRecord.demographic_group || '',
      delivery_method: selectedRecord.delivery_method || 'Virtual',
      duration_hours: selectedRecord.duration_hours || '',
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

  const getCompletionRateBadge = (rate) => {
    const r = parseFloat(rate) || 0;
    if (r >= 90) return <span className="badge-success">{r.toFixed(1)}%</span>;
    if (r >= 75) return <span className="badge-warning">{r.toFixed(1)}%</span>;
    return <span className="badge-danger">{r.toFixed(1)}%</span>;
  };

  // Form modal (shared between create and edit)
  const renderFormModal = (isEdit) => (
    <div className="modal-overlay" onClick={() => isEdit ? setShowEditModal(false) : setShowCreateModal(false)}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{isEdit ? 'Edit Program' : 'New Program'}</h3>
          <button className="modal-close" onClick={() => isEdit ? setShowEditModal(false) : setShowCreateModal(false)}>&times;</button>
        </div>
        <div className="modal-body">
          <form onSubmit={isEdit ? handleEdit : handleCreate}>
            <div className="form-grid">
              <div className="form-group">
                <label>Program Name</label>
                <input
                  type="text"
                  name="program_name"
                  value={formData.program_name}
                  onChange={handleFormChange}
                  required
                  placeholder="e.g. DEI Fundamentals"
                />
              </div>
              <div className="form-group">
                <label>Training Type</label>
                <select name="training_type" value={formData.training_type} onChange={handleFormChange} required>
                  {TRAINING_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
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
                <label>Total Enrolled</label>
                <input
                  type="number"
                  name="total_enrolled"
                  value={formData.total_enrolled}
                  onChange={handleFormChange}
                  required
                  placeholder="e.g. 150"
                />
              </div>
              <div className="form-group">
                <label>Completed</label>
                <input
                  type="number"
                  name="completed"
                  value={formData.completed}
                  onChange={handleFormChange}
                  placeholder="e.g. 120"
                />
              </div>
              <div className="form-group">
                <label>Completion Rate (%)</label>
                <input
                  type="number"
                  step="0.1"
                  name="completion_rate"
                  value={formData.completion_rate}
                  onChange={handleFormChange}
                  placeholder="e.g. 80.0"
                />
              </div>
              <div className="form-group">
                <label>Avg Score</label>
                <input
                  type="number"
                  step="0.1"
                  name="avg_score"
                  value={formData.avg_score}
                  onChange={handleFormChange}
                  placeholder="e.g. 85.5"
                />
              </div>
              <div className="form-group">
                <label>Demographic Group</label>
                <input
                  type="text"
                  name="demographic_group"
                  value={formData.demographic_group}
                  onChange={handleFormChange}
                  placeholder="e.g. All Employees"
                />
              </div>
              <div className="form-group">
                <label>Delivery Method</label>
                <select name="delivery_method" value={formData.delivery_method} onChange={handleFormChange}>
                  {DELIVERY_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Duration (hours)</label>
                <input
                  type="number"
                  step="0.5"
                  name="duration_hours"
                  value={formData.duration_hours}
                  onChange={handleFormChange}
                  placeholder="e.g. 4"
                />
              </div>
              <div className="form-group">
                <label>Period</label>
                <input
                  type="text"
                  name="period"
                  value={formData.period}
                  onChange={handleFormChange}
                  placeholder="e.g. Q1 2024"
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
                {isEdit ? 'Update Program' : 'Create Program'}
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
          <h2>Training Programs</h2>
          <p>Track DEI training programs, completion rates, and effectiveness</p>
        </div>
        <div className="header-actions">
          <button className="btn-ai" onClick={handleAiAnalysis}>
            AI Analysis
          </button>
          <button className="btn-primary" onClick={() => { setFormData({ ...emptyForm }); setShowCreateModal(true); }}>
            + New Program
          </button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="stats-bar">
        <div className="stat-card">
          <div className="stat-number">{totalPrograms}</div>
          <div className="stat-text">Total Programs</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{avgCompletionRate}%</div>
          <div className="stat-text">Avg Completion Rate</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{avgScore}</div>
          <div className="stat-text">Avg Score</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{totalEnrolled}</div>
          <div className="stat-text">Total Enrolled</div>
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
          <p style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>Loading training programs...</p>
        ) : data.length === 0 ? (
          <p style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>No training programs found. Click "New Program" to add one.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Program Name</th>
                <th>Type</th>
                <th>Department</th>
                <th>Enrolled</th>
                <th>Completed</th>
                <th>Rate%</th>
                <th>Avg Score</th>
                <th>Demo Group</th>
                <th>Method</th>
                <th>AI</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row) => (
                <tr key={row.id} onClick={() => openDetail(row)} style={{ cursor: 'pointer' }}>
                  <td>{row.program_name}</td>
                  <td>{row.training_type}</td>
                  <td>{row.department}</td>
                  <td>{row.total_enrolled}</td>
                  <td>{row.completed}</td>
                  <td>{getCompletionRateBadge(row.completion_rate)}</td>
                  <td>{parseFloat(row.avg_score || 0).toFixed(1)}</td>
                  <td>{row.demographic_group}</td>
                  <td>{row.delivery_method}</td>
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
              <h3>Program Details</h3>
              <button className="modal-close" onClick={() => setShowDetailModal(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="detail-grid">
                <div className="detail-item">
                  <div className="detail-label">Program Name</div>
                  <div className="detail-value">{selectedRecord.program_name}</div>
                </div>
                <div className="detail-item">
                  <div className="detail-label">Training Type</div>
                  <div className="detail-value">{selectedRecord.training_type}</div>
                </div>
                <div className="detail-item">
                  <div className="detail-label">Department</div>
                  <div className="detail-value">{selectedRecord.department}</div>
                </div>
                <div className="detail-item">
                  <div className="detail-label">Total Enrolled</div>
                  <div className="detail-value">{selectedRecord.total_enrolled}</div>
                </div>
                <div className="detail-item">
                  <div className="detail-label">Completed</div>
                  <div className="detail-value">{selectedRecord.completed}</div>
                </div>
                <div className="detail-item">
                  <div className="detail-label">Completion Rate</div>
                  <div className="detail-value">{getCompletionRateBadge(selectedRecord.completion_rate)}</div>
                </div>
                <div className="detail-item">
                  <div className="detail-label">Avg Score</div>
                  <div className="detail-value">{parseFloat(selectedRecord.avg_score || 0).toFixed(1)}</div>
                </div>
                <div className="detail-item">
                  <div className="detail-label">Demographic Group</div>
                  <div className="detail-value">{selectedRecord.demographic_group || '--'}</div>
                </div>
                <div className="detail-item">
                  <div className="detail-label">Delivery Method</div>
                  <div className="detail-value">{selectedRecord.delivery_method}</div>
                </div>
                <div className="detail-item">
                  <div className="detail-label">Duration (hours)</div>
                  <div className="detail-value">{selectedRecord.duration_hours || '--'}</div>
                </div>
                <div className="detail-item">
                  <div className="detail-label">Period</div>
                  <div className="detail-value">{selectedRecord.period || '--'}</div>
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

export default TrainingPrograms;
