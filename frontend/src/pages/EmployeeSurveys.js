import React, { useState, useEffect, useCallback } from 'react';
import AIAnalysisPanel from '../components/AIAnalysisPanel';

const API = 'http://localhost:3001/api';

const SENTIMENTS = ['Positive', 'Neutral', 'Negative', 'Mixed'];

const emptyForm = {
  survey_name: '',
  department: '',
  demographic_group: '',
  category: '',
  score: '',
  response_rate: '',
  total_respondents: '',
  sentiment: 'Positive',
  key_themes: '',
  period: '',
  notes: ''
};

function EmployeeSurveys({ token }) {
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
      const res = await fetch(`${API}/employee-surveys`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      setData(Array.isArray(json) ? json : []);
    } catch (err) {
      console.error('Failed to fetch employee surveys:', err);
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
  const avgResponseRate = totalRecords > 0
    ? (data.reduce((sum, d) => sum + (parseFloat(d.response_rate) || 0), 0) / totalRecords).toFixed(1)
    : '0.0';
  const negativeSentimentCount = data.filter(d => d.sentiment === 'Negative').length;

  // Create
  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API}/employee-surveys`, {
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
      console.error('Failed to create survey:', err);
    }
  };

  // Edit
  const handleEdit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API}/employee-surveys/${selectedRecord.id}`, {
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
      console.error('Failed to update survey:', err);
    }
  };

  // Delete
  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this record?')) return;
    try {
      const res = await fetch(`${API}/employee-surveys/${selectedRecord.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setShowDetailModal(false);
        setSelectedRecord(null);
        fetchData();
      }
    } catch (err) {
      console.error('Failed to delete survey:', err);
    }
  };

  // AI Analysis (full dataset)
  const handleAiAnalysis = async () => {
    setAiLoading(true);
    setAiAnalysis(null);
    try {
      const res = await fetch(`${API}/ai/analyze-surveys`, {
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
        body: JSON.stringify({ record, type: 'employee_surveys' })
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
      survey_name: selectedRecord.survey_name || '',
      department: selectedRecord.department || '',
      demographic_group: selectedRecord.demographic_group || '',
      category: selectedRecord.category || '',
      score: selectedRecord.score || '',
      response_rate: selectedRecord.response_rate || '',
      total_respondents: selectedRecord.total_respondents || '',
      sentiment: selectedRecord.sentiment || 'Positive',
      key_themes: selectedRecord.key_themes || '',
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

  const getSentimentBadge = (sentiment) => {
    const badgeMap = {
      Positive: 'badge-success',
      Neutral: 'badge-info',
      Negative: 'badge-danger',
      Mixed: 'badge-warning'
    };
    return <span className={badgeMap[sentiment] || 'badge-info'}>{sentiment}</span>;
  };

  // Form modal (shared between create and edit)
  const renderFormModal = (isEdit) => (
    <div className="modal-overlay" onClick={() => isEdit ? setShowEditModal(false) : setShowCreateModal(false)}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{isEdit ? 'Edit Survey' : 'New Survey'}</h3>
          <button className="modal-close" onClick={() => isEdit ? setShowEditModal(false) : setShowCreateModal(false)}>&times;</button>
        </div>
        <div className="modal-body">
          <form onSubmit={isEdit ? handleEdit : handleCreate}>
            <div className="form-grid">
              <div className="form-group">
                <label>Survey Name</label>
                <input
                  type="text"
                  name="survey_name"
                  value={formData.survey_name}
                  onChange={handleFormChange}
                  required
                  placeholder="e.g. Employee Engagement Q1"
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
                <label>Category</label>
                <input
                  type="text"
                  name="category"
                  value={formData.category}
                  onChange={handleFormChange}
                  required
                  placeholder="e.g. Inclusion, Belonging"
                />
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
                  placeholder="e.g. 4.2"
                />
              </div>
              <div className="form-group">
                <label>Response Rate (%)</label>
                <input
                  type="number"
                  step="0.1"
                  name="response_rate"
                  value={formData.response_rate}
                  onChange={handleFormChange}
                  required
                  placeholder="e.g. 85.0"
                />
              </div>
              <div className="form-group">
                <label>Total Respondents</label>
                <input
                  type="number"
                  name="total_respondents"
                  value={formData.total_respondents}
                  onChange={handleFormChange}
                  required
                  placeholder="e.g. 150"
                />
              </div>
              <div className="form-group">
                <label>Sentiment</label>
                <select name="sentiment" value={formData.sentiment} onChange={handleFormChange} required>
                  {SENTIMENTS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label>Key Themes</label>
                <textarea
                  name="key_themes"
                  value={formData.key_themes}
                  onChange={handleFormChange}
                  rows="3"
                  placeholder="Key themes from the survey..."
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
                {isEdit ? 'Update Survey' : 'Create Survey'}
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
          <h2>Employee Surveys</h2>
          <p>Track employee survey results across demographics and departments</p>
        </div>
        <div className="header-actions">
          <button className="btn-ai" onClick={handleAiAnalysis}>
            AI Analysis
          </button>
          <button className="btn-primary" onClick={() => { setFormData({ ...emptyForm }); setShowCreateModal(true); }}>
            + New Survey
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
          <div className="stat-number">{avgResponseRate}%</div>
          <div className="stat-text">Avg Response Rate</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{negativeSentimentCount}</div>
          <div className="stat-text">Negative Sentiment</div>
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
          <p style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>Loading employee surveys...</p>
        ) : data.length === 0 ? (
          <p style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>No employee surveys found. Click "New Survey" to add one.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Survey Name</th>
                <th>Department</th>
                <th>Demo Group</th>
                <th>Category</th>
                <th>Score</th>
                <th>Response Rate%</th>
                <th>Respondents</th>
                <th>Sentiment</th>
                <th>AI</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row) => (
                <tr key={row.id} onClick={() => openDetail(row)} style={{ cursor: 'pointer' }}>
                  <td>{row.survey_name}</td>
                  <td>{row.department}</td>
                  <td>{row.demographic_group}</td>
                  <td>{row.category}</td>
                  <td>{parseFloat(row.score || 0).toFixed(1)}</td>
                  <td>{parseFloat(row.response_rate || 0).toFixed(1)}%</td>
                  <td>{row.total_respondents}</td>
                  <td>{getSentimentBadge(row.sentiment)}</td>
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
              <h3>Survey Details</h3>
              <button className="modal-close" onClick={() => setShowDetailModal(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="detail-grid">
                <div className="detail-item">
                  <div className="detail-label">Survey Name</div>
                  <div className="detail-value">{selectedRecord.survey_name}</div>
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
                  <div className="detail-label">Category</div>
                  <div className="detail-value">{selectedRecord.category}</div>
                </div>
                <div className="detail-item">
                  <div className="detail-label">Score</div>
                  <div className="detail-value">{parseFloat(selectedRecord.score || 0).toFixed(1)}</div>
                </div>
                <div className="detail-item">
                  <div className="detail-label">Response Rate</div>
                  <div className="detail-value">{parseFloat(selectedRecord.response_rate || 0).toFixed(1)}%</div>
                </div>
                <div className="detail-item">
                  <div className="detail-label">Total Respondents</div>
                  <div className="detail-value">{selectedRecord.total_respondents}</div>
                </div>
                <div className="detail-item">
                  <div className="detail-label">Sentiment</div>
                  <div className="detail-value">{getSentimentBadge(selectedRecord.sentiment)}</div>
                </div>
                <div className="detail-item" style={{ gridColumn: '1 / -1' }}>
                  <div className="detail-label">Key Themes</div>
                  <div className="detail-value">{selectedRecord.key_themes || 'No key themes'}</div>
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

export default EmployeeSurveys;
