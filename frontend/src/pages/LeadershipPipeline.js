import React, { useState, useEffect, useCallback } from 'react';
import AIAnalysisPanel from '../components/AIAnalysisPanel';

const API = 'http://localhost:3001/api';

const emptyForm = {
  level: '',
  department: '',
  demographic_group: '',
  total_positions: '',
  filled_positions: '',
  representation_pct: '',
  ready_now: '',
  ready_1_2_years: '',
  ready_3_5_years: '',
  succession_coverage: '',
  period: '',
  notes: ''
};

function LeadershipPipeline({ token }) {
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
      const res = await fetch(`${API}/leadership-pipeline`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      setData(Array.isArray(json) ? json : []);
    } catch (err) {
      console.error('Failed to fetch leadership pipeline:', err);
      setData([]);
    }
    setLoading(false);
  }, [token]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Stats
  const totalRecords = data.length;
  const avgRepresentation = totalRecords > 0
    ? (data.reduce((sum, d) => sum + (parseFloat(d.representation_pct) || 0), 0) / totalRecords).toFixed(1)
    : '0.0';
  const avgSuccessionCoverage = totalRecords > 0
    ? (data.reduce((sum, d) => sum + (parseFloat(d.succession_coverage) || 0), 0) / totalRecords).toFixed(1)
    : '0.0';
  const zeroRepresentationCount = data.filter(d => parseFloat(d.representation_pct) === 0).length;

  // Create
  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API}/leadership-pipeline`, {
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
      const res = await fetch(`${API}/leadership-pipeline/${selectedRecord.id}`, {
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
      const res = await fetch(`${API}/leadership-pipeline/${selectedRecord.id}`, {
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
      const res = await fetch(`${API}/ai/analyze-leadership`, {
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
        body: JSON.stringify({ record, type: 'leadership_pipeline' })
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
      level: selectedRecord.level || '',
      department: selectedRecord.department || '',
      demographic_group: selectedRecord.demographic_group || '',
      total_positions: selectedRecord.total_positions || '',
      filled_positions: selectedRecord.filled_positions || '',
      representation_pct: selectedRecord.representation_pct || '',
      ready_now: selectedRecord.ready_now || '',
      ready_1_2_years: selectedRecord.ready_1_2_years || '',
      ready_3_5_years: selectedRecord.ready_3_5_years || '',
      succession_coverage: selectedRecord.succession_coverage || '',
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

  const getRepresentationBadge = (pct) => {
    const v = parseFloat(pct) || 0;
    if (v >= 30) return <span className="badge-success">{v.toFixed(1)}%</span>;
    if (v >= 15) return <span className="badge-warning">{v.toFixed(1)}%</span>;
    return <span className="badge-danger">{v.toFixed(1)}%</span>;
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
                <label>Level</label>
                <input
                  type="text"
                  name="level"
                  value={formData.level}
                  onChange={handleFormChange}
                  required
                  placeholder="e.g. Director, VP, C-Suite"
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
                <label>Total Positions</label>
                <input
                  type="number"
                  name="total_positions"
                  value={formData.total_positions}
                  onChange={handleFormChange}
                  required
                  placeholder="e.g. 20"
                />
              </div>
              <div className="form-group">
                <label>Filled Positions</label>
                <input
                  type="number"
                  name="filled_positions"
                  value={formData.filled_positions}
                  onChange={handleFormChange}
                  required
                  placeholder="e.g. 18"
                />
              </div>
              <div className="form-group">
                <label>Representation %</label>
                <input
                  type="number"
                  step="0.1"
                  name="representation_pct"
                  value={formData.representation_pct}
                  onChange={handleFormChange}
                  required
                  placeholder="e.g. 25.0"
                />
              </div>
              <div className="form-group">
                <label>Ready Now</label>
                <input
                  type="number"
                  name="ready_now"
                  value={formData.ready_now}
                  onChange={handleFormChange}
                  placeholder="e.g. 3"
                />
              </div>
              <div className="form-group">
                <label>Ready 1-2 Years</label>
                <input
                  type="number"
                  name="ready_1_2_years"
                  value={formData.ready_1_2_years}
                  onChange={handleFormChange}
                  placeholder="e.g. 5"
                />
              </div>
              <div className="form-group">
                <label>Ready 3-5 Years</label>
                <input
                  type="number"
                  name="ready_3_5_years"
                  value={formData.ready_3_5_years}
                  onChange={handleFormChange}
                  placeholder="e.g. 7"
                />
              </div>
              <div className="form-group">
                <label>Succession Coverage %</label>
                <input
                  type="number"
                  step="0.1"
                  name="succession_coverage"
                  value={formData.succession_coverage}
                  onChange={handleFormChange}
                  placeholder="e.g. 75.0"
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
          <h2>Leadership Pipeline</h2>
          <p>Track leadership representation and succession readiness across demographics</p>
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
          <div className="stat-number">{avgRepresentation}%</div>
          <div className="stat-text">Avg Representation</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{avgSuccessionCoverage}%</div>
          <div className="stat-text">Avg Succession Coverage</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{zeroRepresentationCount}</div>
          <div className="stat-text">Zero Representation</div>
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
          <p style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>Loading leadership pipeline...</p>
        ) : data.length === 0 ? (
          <p style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>No leadership pipeline records found. Click "New Record" to add one.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Level</th>
                <th>Department</th>
                <th>Demo Group</th>
                <th>Positions</th>
                <th>Filled</th>
                <th>Representation%</th>
                <th>Ready Now</th>
                <th>1-2 Yrs</th>
                <th>3-5 Yrs</th>
                <th>Succession%</th>
                <th>AI</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row) => (
                <tr key={row.id} onClick={() => openDetail(row)} style={{ cursor: 'pointer' }}>
                  <td>{row.level}</td>
                  <td>{row.department}</td>
                  <td>{row.demographic_group}</td>
                  <td>{row.total_positions}</td>
                  <td>{row.filled_positions}</td>
                  <td>{getRepresentationBadge(row.representation_pct)}</td>
                  <td>{row.ready_now}</td>
                  <td>{row.ready_1_2_years}</td>
                  <td>{row.ready_3_5_years}</td>
                  <td>{parseFloat(row.succession_coverage || 0).toFixed(1)}%</td>
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
                  <div className="detail-label">Level</div>
                  <div className="detail-value">{selectedRecord.level}</div>
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
                  <div className="detail-label">Total Positions</div>
                  <div className="detail-value">{selectedRecord.total_positions}</div>
                </div>
                <div className="detail-item">
                  <div className="detail-label">Filled Positions</div>
                  <div className="detail-value">{selectedRecord.filled_positions}</div>
                </div>
                <div className="detail-item">
                  <div className="detail-label">Representation %</div>
                  <div className="detail-value">{getRepresentationBadge(selectedRecord.representation_pct)}</div>
                </div>
                <div className="detail-item">
                  <div className="detail-label">Ready Now</div>
                  <div className="detail-value">{selectedRecord.ready_now}</div>
                </div>
                <div className="detail-item">
                  <div className="detail-label">Ready 1-2 Years</div>
                  <div className="detail-value">{selectedRecord.ready_1_2_years}</div>
                </div>
                <div className="detail-item">
                  <div className="detail-label">Ready 3-5 Years</div>
                  <div className="detail-value">{selectedRecord.ready_3_5_years}</div>
                </div>
                <div className="detail-item">
                  <div className="detail-label">Succession Coverage %</div>
                  <div className="detail-value">{parseFloat(selectedRecord.succession_coverage || 0).toFixed(1)}%</div>
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

export default LeadershipPipeline;
