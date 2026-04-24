import React, { useState, useEffect, useCallback } from 'react';
import AIAnalysisPanel from '../components/AIAnalysisPanel';

const API = 'http://localhost:3001/api';

const STATUS_OPTIONS = ['Active', 'Growing', 'Established', 'New'];

const emptyForm = {
  erg_name: '',
  focus_area: '',
  membership_count: '',
  active_members: '',
  executive_sponsor: '',
  budget: '',
  events_held: '',
  engagement_score: '',
  year_founded: new Date().getFullYear(),
  status: 'Active',
  impact_summary: '',
  notes: ''
};

function ERGManagement({ token }) {
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
      const res = await fetch(`${API}/erg-management`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      setData(Array.isArray(json) ? json : []);
    } catch (err) {
      console.error('Failed to fetch ERG management data:', err);
      setData([]);
    }
    setLoading(false);
  }, [token]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Stats
  const totalERGs = data.length;
  const totalMembers = data.reduce((sum, d) => sum + (parseInt(d.membership_count) || 0), 0);
  const avgEngagement = totalERGs > 0
    ? (data.reduce((sum, d) => sum + (parseFloat(d.engagement_score) || 0), 0) / totalERGs).toFixed(1)
    : '0.0';
  const totalBudget = data.reduce((sum, d) => sum + (parseFloat(d.budget) || 0), 0);
  const formatBudget = (val) => {
    const num = parseFloat(val) || 0;
    return '$' + num.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  };

  // Create
  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API}/erg-management`, {
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
      console.error('Failed to create ERG:', err);
    }
  };

  // Edit
  const handleEdit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API}/erg-management/${selectedRecord.id}`, {
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
      console.error('Failed to update ERG:', err);
    }
  };

  // Delete
  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this record?')) return;
    try {
      const res = await fetch(`${API}/erg-management/${selectedRecord.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setShowDetailModal(false);
        setSelectedRecord(null);
        fetchData();
      }
    } catch (err) {
      console.error('Failed to delete ERG:', err);
    }
  };

  // AI Analysis (full dataset)
  const handleAiAnalysis = async () => {
    setAiLoading(true);
    setAiAnalysis(null);
    try {
      const res = await fetch(`${API}/ai/analyze-ergs`, {
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
        body: JSON.stringify({ record, type: 'erg_management' })
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
      erg_name: selectedRecord.erg_name || '',
      focus_area: selectedRecord.focus_area || '',
      membership_count: selectedRecord.membership_count || '',
      active_members: selectedRecord.active_members || '',
      executive_sponsor: selectedRecord.executive_sponsor || '',
      budget: selectedRecord.budget || '',
      events_held: selectedRecord.events_held || '',
      engagement_score: selectedRecord.engagement_score || '',
      year_founded: selectedRecord.year_founded || new Date().getFullYear(),
      status: selectedRecord.status || 'Active',
      impact_summary: selectedRecord.impact_summary || '',
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
    const map = {
      Established: 'badge-success',
      Active: 'badge-info',
      Growing: 'badge-warning',
      New: 'badge-neutral'
    };
    const cls = map[status] || 'badge-neutral';
    return <span className={cls}>{status}</span>;
  };

  // Form modal (shared between create and edit)
  const renderFormModal = (isEdit) => (
    <div className="modal-overlay" onClick={() => isEdit ? setShowEditModal(false) : setShowCreateModal(false)}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{isEdit ? 'Edit ERG' : 'New ERG'}</h3>
          <button className="modal-close" onClick={() => isEdit ? setShowEditModal(false) : setShowCreateModal(false)}>&times;</button>
        </div>
        <div className="modal-body">
          <form onSubmit={isEdit ? handleEdit : handleCreate}>
            <div className="form-grid">
              <div className="form-group">
                <label>ERG Name</label>
                <input
                  type="text"
                  name="erg_name"
                  value={formData.erg_name}
                  onChange={handleFormChange}
                  required
                  placeholder="e.g. Women in Tech"
                />
              </div>
              <div className="form-group">
                <label>Focus Area</label>
                <input
                  type="text"
                  name="focus_area"
                  value={formData.focus_area}
                  onChange={handleFormChange}
                  required
                  placeholder="e.g. Gender Equity"
                />
              </div>
              <div className="form-group">
                <label>Membership Count</label>
                <input
                  type="number"
                  name="membership_count"
                  value={formData.membership_count}
                  onChange={handleFormChange}
                  required
                  placeholder="e.g. 150"
                />
              </div>
              <div className="form-group">
                <label>Active Members</label>
                <input
                  type="number"
                  name="active_members"
                  value={formData.active_members}
                  onChange={handleFormChange}
                  required
                  placeholder="e.g. 85"
                />
              </div>
              <div className="form-group">
                <label>Executive Sponsor</label>
                <input
                  type="text"
                  name="executive_sponsor"
                  value={formData.executive_sponsor}
                  onChange={handleFormChange}
                  required
                  placeholder="e.g. Jane Smith, VP Engineering"
                />
              </div>
              <div className="form-group">
                <label>Budget ($)</label>
                <input
                  type="number"
                  name="budget"
                  value={formData.budget}
                  onChange={handleFormChange}
                  required
                  placeholder="e.g. 25000"
                />
              </div>
              <div className="form-group">
                <label>Events Held</label>
                <input
                  type="number"
                  name="events_held"
                  value={formData.events_held}
                  onChange={handleFormChange}
                  required
                  placeholder="e.g. 12"
                />
              </div>
              <div className="form-group">
                <label>Engagement Score</label>
                <input
                  type="number"
                  step="0.1"
                  name="engagement_score"
                  value={formData.engagement_score}
                  onChange={handleFormChange}
                  required
                  placeholder="e.g. 8.5"
                />
              </div>
              <div className="form-group">
                <label>Year Founded</label>
                <input
                  type="number"
                  name="year_founded"
                  value={formData.year_founded}
                  onChange={handleFormChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Status</label>
                <select name="status" value={formData.status} onChange={handleFormChange} required>
                  {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label>Impact Summary</label>
                <textarea
                  name="impact_summary"
                  value={formData.impact_summary}
                  onChange={handleFormChange}
                  rows="3"
                  placeholder="Describe the ERG's impact..."
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
                {isEdit ? 'Update ERG' : 'Create ERG'}
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
          <h2>ERG Management</h2>
          <p>Manage Employee Resource Groups, track engagement and budget</p>
        </div>
        <div className="header-actions">
          <button className="btn-ai" onClick={handleAiAnalysis}>
            AI Analysis
          </button>
          <button className="btn-primary" onClick={() => { setFormData({ ...emptyForm }); setShowCreateModal(true); }}>
            + New ERG
          </button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="stats-bar">
        <div className="stat-card">
          <div className="stat-number">{totalERGs}</div>
          <div className="stat-text">Total ERGs</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{totalMembers.toLocaleString()}</div>
          <div className="stat-text">Total Members</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{avgEngagement}</div>
          <div className="stat-text">Avg Engagement Score</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{formatBudget(totalBudget)}</div>
          <div className="stat-text">Total Budget</div>
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
          <p style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>Loading ERG data...</p>
        ) : data.length === 0 ? (
          <p style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>No ERGs found. Click "New ERG" to add one.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>ERG Name</th>
                <th>Focus Area</th>
                <th>Members</th>
                <th>Active</th>
                <th>Sponsor</th>
                <th>Budget ($)</th>
                <th>Events</th>
                <th>Engagement</th>
                <th>Status</th>
                <th>AI</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row) => (
                <tr key={row.id} onClick={() => openDetail(row)} style={{ cursor: 'pointer' }}>
                  <td>{row.erg_name}</td>
                  <td>{row.focus_area}</td>
                  <td>{parseInt(row.membership_count || 0).toLocaleString()}</td>
                  <td>{parseInt(row.active_members || 0).toLocaleString()}</td>
                  <td>{row.executive_sponsor}</td>
                  <td>{formatBudget(row.budget)}</td>
                  <td>{row.events_held}</td>
                  <td>{parseFloat(row.engagement_score || 0).toFixed(1)}</td>
                  <td>{getStatusBadge(row.status)}</td>
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
              <h3>ERG Details</h3>
              <button className="modal-close" onClick={() => setShowDetailModal(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="detail-grid">
                <div className="detail-item">
                  <div className="detail-label">ERG Name</div>
                  <div className="detail-value">{selectedRecord.erg_name}</div>
                </div>
                <div className="detail-item">
                  <div className="detail-label">Focus Area</div>
                  <div className="detail-value">{selectedRecord.focus_area}</div>
                </div>
                <div className="detail-item">
                  <div className="detail-label">Membership Count</div>
                  <div className="detail-value">{parseInt(selectedRecord.membership_count || 0).toLocaleString()}</div>
                </div>
                <div className="detail-item">
                  <div className="detail-label">Active Members</div>
                  <div className="detail-value">{parseInt(selectedRecord.active_members || 0).toLocaleString()}</div>
                </div>
                <div className="detail-item">
                  <div className="detail-label">Executive Sponsor</div>
                  <div className="detail-value">{selectedRecord.executive_sponsor}</div>
                </div>
                <div className="detail-item">
                  <div className="detail-label">Budget</div>
                  <div className="detail-value">{formatBudget(selectedRecord.budget)}</div>
                </div>
                <div className="detail-item">
                  <div className="detail-label">Events Held</div>
                  <div className="detail-value">{selectedRecord.events_held}</div>
                </div>
                <div className="detail-item">
                  <div className="detail-label">Engagement Score</div>
                  <div className="detail-value">{parseFloat(selectedRecord.engagement_score || 0).toFixed(1)}</div>
                </div>
                <div className="detail-item">
                  <div className="detail-label">Year Founded</div>
                  <div className="detail-value">{selectedRecord.year_founded}</div>
                </div>
                <div className="detail-item">
                  <div className="detail-label">Status</div>
                  <div className="detail-value">{getStatusBadge(selectedRecord.status)}</div>
                </div>
                <div className="detail-item" style={{ gridColumn: '1 / -1' }}>
                  <div className="detail-label">Impact Summary</div>
                  <div className="detail-value">{selectedRecord.impact_summary || 'No impact summary'}</div>
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

export default ERGManagement;
