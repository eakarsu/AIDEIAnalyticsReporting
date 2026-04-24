import React, { useState, useEffect, useCallback } from 'react';
import AIAnalysisPanel from '../components/AIAnalysisPanel';

const API = 'http://localhost:3001/api';

const emptyForm = {
  department: '',
  level_from: '',
  level_to: '',
  demographic_group: '',
  eligible_employees: '',
  nominated: '',
  promoted: '',
  avg_time_to_promotion: '',
  promotion_rate: '',
  bias_indicator: 'Neutral',
  period: '',
  notes: ''
};

const biasIndicatorOptions = [
  'Positive',
  'Neutral',
  'Slight Negative',
  'Negative',
  'Strong Negative'
];

function getBiasIndicatorBadgeClass(indicator) {
  if (!indicator) return 'badge-info';
  if (indicator === 'Positive') return 'badge-success';
  if (indicator === 'Neutral') return 'badge-info';
  if (indicator === 'Slight Negative') return 'badge-warning';
  return 'badge-danger';
}

function PromotionBias({ token }) {
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
      const res = await fetch(`${API}/promotion-bias`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      setData(Array.isArray(json) ? json : []);
    } catch (err) {
      console.error('Failed to fetch promotion bias data:', err);
      setData([]);
    }
    setLoading(false);
  }, [token]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Stats
  const totalRecords = data.length;
  const avgPromotionRate = totalRecords > 0
    ? (data.reduce((sum, d) => sum + (parseFloat(d.promotion_rate) || 0), 0) / totalRecords).toFixed(1)
    : '0.0';
  const departmentsCount = new Set(data.map(d => d.department).filter(Boolean)).size;
  const biasCases = data.filter(d => d.bias_indicator && d.bias_indicator.includes('Negative')).length;

  // Create
  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API}/promotion-bias`, {
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
      console.error('Failed to create promotion bias record:', err);
    }
  };

  // Edit
  const handleEdit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API}/promotion-bias/${selectedRecord.id}`, {
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
      console.error('Failed to update promotion bias record:', err);
    }
  };

  // Delete
  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this record?')) return;
    try {
      const res = await fetch(`${API}/promotion-bias/${selectedRecord.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setShowDetailModal(false);
        setSelectedRecord(null);
        fetchData();
      }
    } catch (err) {
      console.error('Failed to delete promotion bias record:', err);
    }
  };

  // AI Analysis (full dataset)
  const handleAiAnalysis = async () => {
    setAiLoading(true);
    setAiAnalysis(null);
    try {
      const res = await fetch(`${API}/ai/analyze-promotion-bias`, {
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
        body: JSON.stringify({ record, type: 'promotion_bias' })
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
      level_from: selectedRecord.level_from || '',
      level_to: selectedRecord.level_to || '',
      demographic_group: selectedRecord.demographic_group || '',
      eligible_employees: selectedRecord.eligible_employees || '',
      nominated: selectedRecord.nominated || '',
      promoted: selectedRecord.promoted || '',
      avg_time_to_promotion: selectedRecord.avg_time_to_promotion || '',
      promotion_rate: selectedRecord.promotion_rate || '',
      bias_indicator: selectedRecord.bias_indicator || 'Neutral',
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
          <h3>{isEdit ? 'Edit Promotion Bias Record' : 'New Promotion Bias Record'}</h3>
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
                <label>From Level</label>
                <input
                  type="text"
                  name="level_from"
                  value={formData.level_from}
                  onChange={handleFormChange}
                  required
                  placeholder="e.g. Junior"
                />
              </div>
              <div className="form-group">
                <label>To Level</label>
                <input
                  type="text"
                  name="level_to"
                  value={formData.level_to}
                  onChange={handleFormChange}
                  required
                  placeholder="e.g. Senior"
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
                <label>Eligible Employees</label>
                <input
                  type="number"
                  name="eligible_employees"
                  value={formData.eligible_employees}
                  onChange={handleFormChange}
                  required
                  placeholder="e.g. 50"
                />
              </div>
              <div className="form-group">
                <label>Nominated</label>
                <input
                  type="number"
                  name="nominated"
                  value={formData.nominated}
                  onChange={handleFormChange}
                  required
                  placeholder="e.g. 20"
                />
              </div>
              <div className="form-group">
                <label>Promoted</label>
                <input
                  type="number"
                  name="promoted"
                  value={formData.promoted}
                  onChange={handleFormChange}
                  required
                  placeholder="e.g. 10"
                />
              </div>
              <div className="form-group">
                <label>Avg Time to Promotion (yrs)</label>
                <input
                  type="number"
                  step="0.1"
                  name="avg_time_to_promotion"
                  value={formData.avg_time_to_promotion}
                  onChange={handleFormChange}
                  required
                  placeholder="e.g. 2.5"
                />
              </div>
              <div className="form-group">
                <label>Promotion Rate (%)</label>
                <input
                  type="number"
                  step="0.1"
                  name="promotion_rate"
                  value={formData.promotion_rate}
                  onChange={handleFormChange}
                  required
                  placeholder="e.g. 20.0"
                />
              </div>
              <div className="form-group">
                <label>Bias Indicator</label>
                <select
                  name="bias_indicator"
                  value={formData.bias_indicator}
                  onChange={handleFormChange}
                  required
                >
                  {biasIndicatorOptions.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
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
          <h2>Promotion Bias</h2>
          <p>Analyze promotion patterns and bias across demographics and levels</p>
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
          <div className="stat-number">{avgPromotionRate}%</div>
          <div className="stat-text">Avg Promotion Rate</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{departmentsCount}</div>
          <div className="stat-text">Departments</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{biasCases}</div>
          <div className="stat-text">Bias Cases</div>
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
          <p style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>Loading promotion bias data...</p>
        ) : data.length === 0 ? (
          <p style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>No promotion bias records found. Click "+ New Record" to add one.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Department</th>
                <th>From Level</th>
                <th>To Level</th>
                <th>Demo Group</th>
                <th>Eligible</th>
                <th>Nominated</th>
                <th>Promoted</th>
                <th>Rate%</th>
                <th>Time (yrs)</th>
                <th>Bias Indicator</th>
                <th>Period</th>
                <th>AI</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row) => (
                <tr key={row.id} onClick={() => openDetail(row)} style={{ cursor: 'pointer' }}>
                  <td>{row.department}</td>
                  <td>{row.level_from}</td>
                  <td>{row.level_to}</td>
                  <td>{row.demographic_group}</td>
                  <td>{row.eligible_employees}</td>
                  <td>{row.nominated}</td>
                  <td>{row.promoted}</td>
                  <td>{parseFloat(row.promotion_rate || 0).toFixed(1)}%</td>
                  <td>{parseFloat(row.avg_time_to_promotion || 0).toFixed(1)}</td>
                  <td>
                    <span className={getBiasIndicatorBadgeClass(row.bias_indicator)}>
                      {row.bias_indicator}
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
              <h3>Promotion Bias Details</h3>
              <button className="modal-close" onClick={() => setShowDetailModal(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="detail-grid">
                <div className="detail-item">
                  <div className="detail-label">Department</div>
                  <div className="detail-value">{selectedRecord.department}</div>
                </div>
                <div className="detail-item">
                  <div className="detail-label">From Level</div>
                  <div className="detail-value">{selectedRecord.level_from}</div>
                </div>
                <div className="detail-item">
                  <div className="detail-label">To Level</div>
                  <div className="detail-value">{selectedRecord.level_to}</div>
                </div>
                <div className="detail-item">
                  <div className="detail-label">Demographic Group</div>
                  <div className="detail-value">{selectedRecord.demographic_group}</div>
                </div>
                <div className="detail-item">
                  <div className="detail-label">Eligible Employees</div>
                  <div className="detail-value">{selectedRecord.eligible_employees}</div>
                </div>
                <div className="detail-item">
                  <div className="detail-label">Nominated</div>
                  <div className="detail-value">{selectedRecord.nominated}</div>
                </div>
                <div className="detail-item">
                  <div className="detail-label">Promoted</div>
                  <div className="detail-value">{selectedRecord.promoted}</div>
                </div>
                <div className="detail-item">
                  <div className="detail-label">Promotion Rate</div>
                  <div className="detail-value">{parseFloat(selectedRecord.promotion_rate || 0).toFixed(1)}%</div>
                </div>
                <div className="detail-item">
                  <div className="detail-label">Avg Time to Promotion</div>
                  <div className="detail-value">{parseFloat(selectedRecord.avg_time_to_promotion || 0).toFixed(1)} yrs</div>
                </div>
                <div className="detail-item">
                  <div className="detail-label">Bias Indicator</div>
                  <div className="detail-value">
                    <span className={getBiasIndicatorBadgeClass(selectedRecord.bias_indicator)}>
                      {selectedRecord.bias_indicator}
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

export default PromotionBias;
