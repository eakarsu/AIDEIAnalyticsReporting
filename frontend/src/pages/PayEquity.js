import React, { useState, useEffect, useCallback } from 'react';
import AIAnalysisPanel from '../components/AIAnalysisPanel';

const API = 'http://localhost:3001/api';

const emptyForm = {
  department: '',
  role_title: '',
  demographic_group: '',
  avg_salary: '',
  median_salary: '',
  salary_range_min: '',
  salary_range_max: '',
  pay_gap_percentage: '',
  sample_size: '',
  analysis_period: '',
  notes: ''
};

function formatSalary(value) {
  const num = parseFloat(value);
  if (isNaN(num)) return '--';
  return '$' + num.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function getGapBadgeClass(gap) {
  const g = parseFloat(gap);
  if (isNaN(g)) return 'badge-success';
  if (g >= -2) return 'badge-success';
  if (g >= -5) return 'badge-warning';
  return 'badge-danger';
}

function PayEquity({ token }) {
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
      const res = await fetch(`${API}/pay-equity`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      setData(Array.isArray(json) ? json : []);
    } catch (err) {
      console.error('Failed to fetch pay equity data:', err);
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
  const avgPayGap = totalRecords > 0
    ? (data.reduce((sum, d) => sum + (parseFloat(d.pay_gap_percentage) || 0), 0) / totalRecords).toFixed(1)
    : '0.0';
  const maxGap = totalRecords > 0
    ? Math.max(...data.map(d => Math.abs(parseFloat(d.pay_gap_percentage) || 0))).toFixed(1)
    : '0.0';

  // Create
  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API}/pay-equity`, {
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
      console.error('Failed to create pay equity record:', err);
    }
  };

  // Edit
  const handleEdit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API}/pay-equity/${selectedRecord.id}`, {
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
      console.error('Failed to update pay equity record:', err);
    }
  };

  // Delete
  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this record?')) return;
    try {
      const res = await fetch(`${API}/pay-equity/${selectedRecord.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setShowDetailModal(false);
        setSelectedRecord(null);
        fetchData();
      }
    } catch (err) {
      console.error('Failed to delete pay equity record:', err);
    }
  };

  // AI Analysis (full dataset)
  const handleAiAnalysis = async () => {
    setAiLoading(true);
    setAiAnalysis(null);
    try {
      const res = await fetch(`${API}/ai/analyze-pay-equity`, {
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
        body: JSON.stringify({ record, type: 'pay_equity' })
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
      role_title: selectedRecord.role_title || '',
      demographic_group: selectedRecord.demographic_group || '',
      avg_salary: selectedRecord.avg_salary || '',
      median_salary: selectedRecord.median_salary || '',
      salary_range_min: selectedRecord.salary_range_min || '',
      salary_range_max: selectedRecord.salary_range_max || '',
      pay_gap_percentage: selectedRecord.pay_gap_percentage || '',
      sample_size: selectedRecord.sample_size || '',
      analysis_period: selectedRecord.analysis_period || '',
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
          <h3>{isEdit ? 'Edit Pay Equity Record' : 'New Pay Equity Record'}</h3>
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
                <label>Role Title</label>
                <input
                  type="text"
                  name="role_title"
                  value={formData.role_title}
                  onChange={handleFormChange}
                  required
                  placeholder="e.g. Software Engineer"
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
                <label>Avg Salary ($)</label>
                <input
                  type="number"
                  step="0.01"
                  name="avg_salary"
                  value={formData.avg_salary}
                  onChange={handleFormChange}
                  required
                  placeholder="e.g. 95000"
                />
              </div>
              <div className="form-group">
                <label>Median Salary ($)</label>
                <input
                  type="number"
                  step="0.01"
                  name="median_salary"
                  value={formData.median_salary}
                  onChange={handleFormChange}
                  required
                  placeholder="e.g. 92000"
                />
              </div>
              <div className="form-group">
                <label>Salary Range Min ($)</label>
                <input
                  type="number"
                  step="0.01"
                  name="salary_range_min"
                  value={formData.salary_range_min}
                  onChange={handleFormChange}
                  placeholder="e.g. 70000"
                />
              </div>
              <div className="form-group">
                <label>Salary Range Max ($)</label>
                <input
                  type="number"
                  step="0.01"
                  name="salary_range_max"
                  value={formData.salary_range_max}
                  onChange={handleFormChange}
                  placeholder="e.g. 120000"
                />
              </div>
              <div className="form-group">
                <label>Pay Gap %</label>
                <input
                  type="number"
                  step="0.1"
                  name="pay_gap_percentage"
                  value={formData.pay_gap_percentage}
                  onChange={handleFormChange}
                  required
                  placeholder="e.g. -3.5"
                />
              </div>
              <div className="form-group">
                <label>Sample Size</label>
                <input
                  type="number"
                  name="sample_size"
                  value={formData.sample_size}
                  onChange={handleFormChange}
                  required
                  placeholder="e.g. 45"
                />
              </div>
              <div className="form-group">
                <label>Analysis Period</label>
                <input
                  type="text"
                  name="analysis_period"
                  value={formData.analysis_period}
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
          <h2>Pay Equity</h2>
          <p>Analyze compensation equity across demographics and roles</p>
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
          <div className="stat-number">{avgPayGap}%</div>
          <div className="stat-text">Avg Pay Gap</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{departments}</div>
          <div className="stat-text">Departments</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{maxGap}%</div>
          <div className="stat-text">Max Gap</div>
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
          <p style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>Loading pay equity data...</p>
        ) : data.length === 0 ? (
          <p style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>No pay equity records found. Click "+ New Record" to add one.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Department</th>
                <th>Role</th>
                <th>Demo Group</th>
                <th>Avg Salary</th>
                <th>Median Salary</th>
                <th>Pay Gap%</th>
                <th>Sample Size</th>
                <th>Period</th>
                <th>AI</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row) => (
                <tr key={row.id} onClick={() => openDetail(row)} style={{ cursor: 'pointer' }}>
                  <td>{row.department}</td>
                  <td>{row.role_title}</td>
                  <td>{row.demographic_group}</td>
                  <td>{formatSalary(row.avg_salary)}</td>
                  <td>{formatSalary(row.median_salary)}</td>
                  <td>
                    <span className={getGapBadgeClass(row.pay_gap_percentage)}>
                      {parseFloat(row.pay_gap_percentage || 0).toFixed(1)}%
                    </span>
                  </td>
                  <td>{row.sample_size}</td>
                  <td>{row.analysis_period}</td>
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
              <h3>Pay Equity Details</h3>
              <button className="modal-close" onClick={() => setShowDetailModal(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="detail-grid">
                <div className="detail-item">
                  <div className="detail-label">Department</div>
                  <div className="detail-value">{selectedRecord.department}</div>
                </div>
                <div className="detail-item">
                  <div className="detail-label">Role Title</div>
                  <div className="detail-value">{selectedRecord.role_title}</div>
                </div>
                <div className="detail-item">
                  <div className="detail-label">Demographic Group</div>
                  <div className="detail-value">{selectedRecord.demographic_group}</div>
                </div>
                <div className="detail-item">
                  <div className="detail-label">Avg Salary</div>
                  <div className="detail-value">{formatSalary(selectedRecord.avg_salary)}</div>
                </div>
                <div className="detail-item">
                  <div className="detail-label">Median Salary</div>
                  <div className="detail-value">{formatSalary(selectedRecord.median_salary)}</div>
                </div>
                <div className="detail-item">
                  <div className="detail-label">Salary Range Min</div>
                  <div className="detail-value">{formatSalary(selectedRecord.salary_range_min)}</div>
                </div>
                <div className="detail-item">
                  <div className="detail-label">Salary Range Max</div>
                  <div className="detail-value">{formatSalary(selectedRecord.salary_range_max)}</div>
                </div>
                <div className="detail-item">
                  <div className="detail-label">Pay Gap</div>
                  <div className="detail-value">
                    <span className={getGapBadgeClass(selectedRecord.pay_gap_percentage)}>
                      {parseFloat(selectedRecord.pay_gap_percentage || 0).toFixed(1)}%
                    </span>
                  </div>
                </div>
                <div className="detail-item">
                  <div className="detail-label">Sample Size</div>
                  <div className="detail-value">{selectedRecord.sample_size}</div>
                </div>
                <div className="detail-item">
                  <div className="detail-label">Analysis Period</div>
                  <div className="detail-value">{selectedRecord.analysis_period}</div>
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

export default PayEquity;
