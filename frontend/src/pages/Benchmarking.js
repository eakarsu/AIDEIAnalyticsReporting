import React, { useState, useEffect, useCallback } from 'react';
import AIAnalysisPanel from '../components/AIAnalysisPanel';

const API = 'http://localhost:3001/api';

const emptyForm = {
  metric_name: '',
  category: '',
  our_value: '',
  industry_avg: '',
  top_performer: '',
  percentile_rank: '',
  industry: '',
  source: '',
  measurement_date: '',
  trend: 'Stable',
  notes: ''
};

function getTrendBadgeClass(trend) {
  switch (trend) {
    case 'Improving': return 'badge-success';
    case 'Stable': return 'badge-info';
    case 'Declining': return 'badge-danger';
    default: return 'badge-info';
  }
}

function Benchmarking({ token }) {
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
      const res = await fetch(`${API}/benchmarking`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      setData(Array.isArray(json) ? json : []);
    } catch (err) {
      console.error('Failed to fetch benchmarking data:', err);
      setData([]);
    }
    setLoading(false);
  }, [token]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Stats
  const totalMetrics = data.length;
  const avgPercentile = totalMetrics > 0
    ? (data.reduce((sum, d) => sum + (parseFloat(d.percentile_rank) || 0), 0) / totalMetrics).toFixed(1)
    : '0.0';
  const metricsAboveAvg = data.filter(d => parseFloat(d.our_value) > parseFloat(d.industry_avg)).length;
  const improvingCount = data.filter(d => d.trend === 'Improving').length;

  // Create
  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API}/benchmarking`, {
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
      console.error('Failed to create benchmarking record:', err);
    }
  };

  // Edit
  const handleEdit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API}/benchmarking/${selectedRecord.id}`, {
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
      console.error('Failed to update benchmarking record:', err);
    }
  };

  // Delete
  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this metric?')) return;
    try {
      const res = await fetch(`${API}/benchmarking/${selectedRecord.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setShowDetailModal(false);
        setSelectedRecord(null);
        fetchData();
      }
    } catch (err) {
      console.error('Failed to delete benchmarking record:', err);
    }
  };

  // AI Analysis (full dataset)
  const handleAiAnalysis = async () => {
    setAiLoading(true);
    setAiAnalysis(null);
    try {
      const res = await fetch(`${API}/ai/analyze-benchmarking`, {
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
        body: JSON.stringify({ record, type: 'benchmarking' })
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
      metric_name: selectedRecord.metric_name || '',
      category: selectedRecord.category || '',
      our_value: selectedRecord.our_value || '',
      industry_avg: selectedRecord.industry_avg || '',
      top_performer: selectedRecord.top_performer || '',
      percentile_rank: selectedRecord.percentile_rank || '',
      industry: selectedRecord.industry || '',
      source: selectedRecord.source || '',
      measurement_date: selectedRecord.measurement_date ? selectedRecord.measurement_date.substring(0, 10) : '',
      trend: selectedRecord.trend || 'Stable',
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
          <h3>{isEdit ? 'Edit Benchmarking Metric' : 'New Benchmarking Metric'}</h3>
          <button className="modal-close" onClick={() => isEdit ? setShowEditModal(false) : setShowCreateModal(false)}>&times;</button>
        </div>
        <div className="modal-body">
          <form onSubmit={isEdit ? handleEdit : handleCreate}>
            <div className="form-grid">
              <div className="form-group">
                <label>Metric Name</label>
                <input
                  type="text"
                  name="metric_name"
                  value={formData.metric_name}
                  onChange={handleFormChange}
                  required
                  placeholder="e.g. Gender Diversity Ratio"
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
                  placeholder="e.g. Diversity"
                />
              </div>
              <div className="form-group">
                <label>Our Value</label>
                <input
                  type="number"
                  step="0.01"
                  name="our_value"
                  value={formData.our_value}
                  onChange={handleFormChange}
                  required
                  placeholder="e.g. 42.5"
                />
              </div>
              <div className="form-group">
                <label>Industry Avg</label>
                <input
                  type="number"
                  step="0.01"
                  name="industry_avg"
                  value={formData.industry_avg}
                  onChange={handleFormChange}
                  required
                  placeholder="e.g. 38.0"
                />
              </div>
              <div className="form-group">
                <label>Top Performer</label>
                <input
                  type="number"
                  step="0.01"
                  name="top_performer"
                  value={formData.top_performer}
                  onChange={handleFormChange}
                  placeholder="e.g. 55.0"
                />
              </div>
              <div className="form-group">
                <label>Percentile Rank</label>
                <input
                  type="number"
                  step="0.1"
                  name="percentile_rank"
                  value={formData.percentile_rank}
                  onChange={handleFormChange}
                  required
                  placeholder="e.g. 72"
                  min="0"
                  max="100"
                />
              </div>
              <div className="form-group">
                <label>Industry</label>
                <input
                  type="text"
                  name="industry"
                  value={formData.industry}
                  onChange={handleFormChange}
                  required
                  placeholder="e.g. Technology"
                />
              </div>
              <div className="form-group">
                <label>Source</label>
                <input
                  type="text"
                  name="source"
                  value={formData.source}
                  onChange={handleFormChange}
                  placeholder="e.g. McKinsey 2026 Report"
                />
              </div>
              <div className="form-group">
                <label>Measurement Date</label>
                <input
                  type="date"
                  name="measurement_date"
                  value={formData.measurement_date}
                  onChange={handleFormChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Trend</label>
                <select
                  name="trend"
                  value={formData.trend}
                  onChange={handleFormChange}
                  required
                >
                  <option value="Improving">Improving</option>
                  <option value="Stable">Stable</option>
                  <option value="Declining">Declining</option>
                </select>
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
          <h2>Benchmarking</h2>
          <p>Compare your DEI metrics against industry standards and top performers</p>
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
          <div className="stat-number">{totalMetrics}</div>
          <div className="stat-text">Total Metrics</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{avgPercentile}%</div>
          <div className="stat-text">Avg Percentile Rank</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{metricsAboveAvg}</div>
          <div className="stat-text">Above Industry Avg</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{improvingCount}</div>
          <div className="stat-text">Improving Trends</div>
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
          <p style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>Loading benchmarking data...</p>
        ) : data.length === 0 ? (
          <p style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>No benchmarking metrics found. Click "+ New Metric" to add one.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Metric Name</th>
                <th>Category</th>
                <th>Our Value</th>
                <th>Industry Avg</th>
                <th>Top Performer</th>
                <th>Percentile</th>
                <th>Industry</th>
                <th>Trend</th>
                <th>AI</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row) => {
                const aboveAvg = parseFloat(row.our_value) > parseFloat(row.industry_avg);
                const percentile = parseFloat(row.percentile_rank) || 0;
                return (
                  <tr
                    key={row.id}
                    onClick={() => openDetail(row)}
                    style={{
                      cursor: 'pointer',
                      backgroundColor: aboveAvg ? 'rgba(16, 185, 129, 0.08)' : undefined
                    }}
                  >
                    <td>{row.metric_name}</td>
                    <td>{row.category}</td>
                    <td>{parseFloat(row.our_value || 0).toFixed(1)}</td>
                    <td>{parseFloat(row.industry_avg || 0).toFixed(1)}</td>
                    <td>{row.top_performer ? parseFloat(row.top_performer).toFixed(1) : '--'}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{
                          width: '60px',
                          height: '8px',
                          backgroundColor: '#1e293b',
                          borderRadius: '4px',
                          overflow: 'hidden'
                        }}>
                          <div style={{
                            width: `${Math.min(percentile, 100)}%`,
                            height: '100%',
                            backgroundColor: percentile >= 75 ? '#10b981' : percentile >= 50 ? '#f59e0b' : '#ef4444',
                            borderRadius: '4px',
                            transition: 'width 0.3s ease'
                          }} />
                        </div>
                        <span>{percentile.toFixed(0)}%</span>
                      </div>
                    </td>
                    <td>{row.industry}</td>
                    <td>
                      <span className={getTrendBadgeClass(row.trend)}>
                        {row.trend || 'N/A'}
                      </span>
                    </td>
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
                );
              })}
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
              <h3>Benchmarking Metric Details</h3>
              <button className="modal-close" onClick={() => setShowDetailModal(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="detail-grid">
                <div className="detail-item">
                  <div className="detail-label">Metric Name</div>
                  <div className="detail-value">{selectedRecord.metric_name}</div>
                </div>
                <div className="detail-item">
                  <div className="detail-label">Category</div>
                  <div className="detail-value">{selectedRecord.category}</div>
                </div>
                <div className="detail-item">
                  <div className="detail-label">Our Value</div>
                  <div className="detail-value">{parseFloat(selectedRecord.our_value || 0).toFixed(2)}</div>
                </div>
                <div className="detail-item">
                  <div className="detail-label">Industry Avg</div>
                  <div className="detail-value">{parseFloat(selectedRecord.industry_avg || 0).toFixed(2)}</div>
                </div>
                <div className="detail-item">
                  <div className="detail-label">Top Performer</div>
                  <div className="detail-value">{selectedRecord.top_performer ? parseFloat(selectedRecord.top_performer).toFixed(2) : '--'}</div>
                </div>
                <div className="detail-item">
                  <div className="detail-label">Percentile Rank</div>
                  <div className="detail-value">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{
                        width: '80px',
                        height: '10px',
                        backgroundColor: '#1e293b',
                        borderRadius: '5px',
                        overflow: 'hidden'
                      }}>
                        <div style={{
                          width: `${Math.min(parseFloat(selectedRecord.percentile_rank) || 0, 100)}%`,
                          height: '100%',
                          backgroundColor: (parseFloat(selectedRecord.percentile_rank) || 0) >= 75 ? '#10b981' : (parseFloat(selectedRecord.percentile_rank) || 0) >= 50 ? '#f59e0b' : '#ef4444',
                          borderRadius: '5px'
                        }} />
                      </div>
                      <span>{parseFloat(selectedRecord.percentile_rank || 0).toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
                <div className="detail-item">
                  <div className="detail-label">Industry</div>
                  <div className="detail-value">{selectedRecord.industry}</div>
                </div>
                <div className="detail-item">
                  <div className="detail-label">Source</div>
                  <div className="detail-value">{selectedRecord.source || 'N/A'}</div>
                </div>
                <div className="detail-item">
                  <div className="detail-label">Measurement Date</div>
                  <div className="detail-value">{selectedRecord.measurement_date ? new Date(selectedRecord.measurement_date).toLocaleDateString() : 'N/A'}</div>
                </div>
                <div className="detail-item">
                  <div className="detail-label">Trend</div>
                  <div className="detail-value">
                    <span className={getTrendBadgeClass(selectedRecord.trend)}>
                      {selectedRecord.trend || 'N/A'}
                    </span>
                  </div>
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

export default Benchmarking;
