import React, { useState, useEffect, useCallback } from 'react';
import AIAnalysisPanel from '../components/AIAnalysisPanel';

const API = 'http://localhost:3001/api';

const CERTIFICATION_TYPES = ['MBE', 'WBE', 'VOSB', 'DOBE', 'LGBTBE', 'HUBZone', '8(a)'];
const TIERS = ['Tier 1', 'Tier 2'];
const STATUSES = ['Active', 'Under Review', 'Pending', 'Expired'];

const emptyForm = {
  supplier_name: '',
  certification_type: 'MBE',
  category: '',
  annual_spend: '',
  contract_value: '',
  tier: 'Tier 1',
  status: 'Active',
  region: '',
  performance_rating: '',
  contract_start: '',
  contract_end: '',
  notes: ''
};

const formatMoney = (val) => {
  const num = parseFloat(val) || 0;
  return '$' + num.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
};

const getStatusBadgeClass = (status) => {
  switch (status) {
    case 'Active': return 'badge-success';
    case 'Under Review': return 'badge-warning';
    case 'Pending': return 'badge-info';
    case 'Expired': return 'badge-danger';
    default: return '';
  }
};

function SupplierDiversity({ token }) {
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
      const res = await fetch(`${API}/supplier-diversity`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      setData(Array.isArray(json) ? json : []);
    } catch (err) {
      console.error('Failed to fetch supplier diversity:', err);
      setData([]);
    }
    setLoading(false);
  }, [token]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Stats
  const totalSuppliers = data.length;
  const totalAnnualSpend = data.reduce((sum, d) => sum + (parseFloat(d.annual_spend) || 0), 0);
  const activeCount = data.filter(d => d.status === 'Active').length;
  const avgPerformanceRating = totalSuppliers > 0
    ? (data.reduce((sum, d) => sum + (parseFloat(d.performance_rating) || 0), 0) / totalSuppliers).toFixed(1)
    : '0.0';

  // Create
  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API}/supplier-diversity`, {
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
      console.error('Failed to create supplier:', err);
    }
  };

  // Edit
  const handleEdit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API}/supplier-diversity/${selectedRecord.id}`, {
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
      console.error('Failed to update supplier:', err);
    }
  };

  // Delete
  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this supplier?')) return;
    try {
      const res = await fetch(`${API}/supplier-diversity/${selectedRecord.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setShowDetailModal(false);
        setSelectedRecord(null);
        fetchData();
      }
    } catch (err) {
      console.error('Failed to delete supplier:', err);
    }
  };

  // AI Analysis (full dataset)
  const handleAiAnalysis = async () => {
    setAiLoading(true);
    setAiAnalysis(null);
    try {
      const res = await fetch(`${API}/ai/analyze-suppliers`, {
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
        body: JSON.stringify({ record, type: 'supplier_diversity' })
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
      supplier_name: selectedRecord.supplier_name || '',
      certification_type: selectedRecord.certification_type || 'MBE',
      category: selectedRecord.category || '',
      annual_spend: selectedRecord.annual_spend || '',
      contract_value: selectedRecord.contract_value || '',
      tier: selectedRecord.tier || 'Tier 1',
      status: selectedRecord.status || 'Active',
      region: selectedRecord.region || '',
      performance_rating: selectedRecord.performance_rating || '',
      contract_start: selectedRecord.contract_start || '',
      contract_end: selectedRecord.contract_end || '',
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
          <h3>{isEdit ? 'Edit Supplier' : 'New Supplier'}</h3>
          <button className="modal-close" onClick={() => isEdit ? setShowEditModal(false) : setShowCreateModal(false)}>&times;</button>
        </div>
        <div className="modal-body">
          <form onSubmit={isEdit ? handleEdit : handleCreate}>
            <div className="form-grid">
              <div className="form-group">
                <label>Supplier Name</label>
                <input
                  type="text"
                  name="supplier_name"
                  value={formData.supplier_name}
                  onChange={handleFormChange}
                  required
                  placeholder="e.g. Acme Corp"
                />
              </div>
              <div className="form-group">
                <label>Certification Type</label>
                <select name="certification_type" value={formData.certification_type} onChange={handleFormChange} required>
                  {CERTIFICATION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
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
                  placeholder="e.g. IT Services"
                />
              </div>
              <div className="form-group">
                <label>Annual Spend ($)</label>
                <input
                  type="number"
                  step="0.01"
                  name="annual_spend"
                  value={formData.annual_spend}
                  onChange={handleFormChange}
                  required
                  placeholder="e.g. 150000"
                />
              </div>
              <div className="form-group">
                <label>Contract Value ($)</label>
                <input
                  type="number"
                  step="0.01"
                  name="contract_value"
                  value={formData.contract_value}
                  onChange={handleFormChange}
                  required
                  placeholder="e.g. 500000"
                />
              </div>
              <div className="form-group">
                <label>Tier</label>
                <select name="tier" value={formData.tier} onChange={handleFormChange} required>
                  {TIERS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Status</label>
                <select name="status" value={formData.status} onChange={handleFormChange} required>
                  {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Region</label>
                <input
                  type="text"
                  name="region"
                  value={formData.region}
                  onChange={handleFormChange}
                  required
                  placeholder="e.g. Northeast"
                />
              </div>
              <div className="form-group">
                <label>Performance Rating</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="5"
                  name="performance_rating"
                  value={formData.performance_rating}
                  onChange={handleFormChange}
                  placeholder="e.g. 4.5"
                />
              </div>
              <div className="form-group">
                <label>Contract Start</label>
                <input
                  type="date"
                  name="contract_start"
                  value={formData.contract_start}
                  onChange={handleFormChange}
                />
              </div>
              <div className="form-group">
                <label>Contract End</label>
                <input
                  type="date"
                  name="contract_end"
                  value={formData.contract_end}
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
                {isEdit ? 'Update Supplier' : 'Create Supplier'}
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
          <h2>Supplier Diversity</h2>
          <p>Track and manage diverse supplier partnerships and spend</p>
        </div>
        <div className="header-actions">
          <button className="btn-ai" onClick={handleAiAnalysis}>
            AI Analysis
          </button>
          <button className="btn-primary" onClick={() => { setFormData({ ...emptyForm }); setShowCreateModal(true); }}>
            + New Supplier
          </button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="stats-bar">
        <div className="stat-card">
          <div className="stat-number">{totalSuppliers}</div>
          <div className="stat-text">Total Suppliers</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{formatMoney(totalAnnualSpend)}</div>
          <div className="stat-text">Total Annual Spend</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{activeCount}</div>
          <div className="stat-text">Active Suppliers</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{avgPerformanceRating}</div>
          <div className="stat-text">Avg Performance Rating</div>
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
          <p style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>Loading supplier diversity data...</p>
        ) : data.length === 0 ? (
          <p style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>No suppliers found. Click "New Supplier" to add one.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Supplier</th>
                <th>Certification</th>
                <th>Category</th>
                <th>Annual Spend ($)</th>
                <th>Contract Value ($)</th>
                <th>Tier</th>
                <th>Status</th>
                <th>Region</th>
                <th>Rating</th>
                <th>AI</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row) => (
                <tr key={row.id} onClick={() => openDetail(row)} style={{ cursor: 'pointer' }}>
                  <td>{row.supplier_name}</td>
                  <td>{row.certification_type}</td>
                  <td>{row.category}</td>
                  <td>{formatMoney(row.annual_spend)}</td>
                  <td>{formatMoney(row.contract_value)}</td>
                  <td>{row.tier}</td>
                  <td><span className={getStatusBadgeClass(row.status)}>{row.status}</span></td>
                  <td>{row.region}</td>
                  <td>{parseFloat(row.performance_rating || 0).toFixed(1)}</td>
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
              <h3>Supplier Details</h3>
              <button className="modal-close" onClick={() => setShowDetailModal(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="detail-grid">
                <div className="detail-item">
                  <div className="detail-label">Supplier Name</div>
                  <div className="detail-value">{selectedRecord.supplier_name}</div>
                </div>
                <div className="detail-item">
                  <div className="detail-label">Certification Type</div>
                  <div className="detail-value">{selectedRecord.certification_type}</div>
                </div>
                <div className="detail-item">
                  <div className="detail-label">Category</div>
                  <div className="detail-value">{selectedRecord.category}</div>
                </div>
                <div className="detail-item">
                  <div className="detail-label">Annual Spend</div>
                  <div className="detail-value">{formatMoney(selectedRecord.annual_spend)}</div>
                </div>
                <div className="detail-item">
                  <div className="detail-label">Contract Value</div>
                  <div className="detail-value">{formatMoney(selectedRecord.contract_value)}</div>
                </div>
                <div className="detail-item">
                  <div className="detail-label">Tier</div>
                  <div className="detail-value">{selectedRecord.tier}</div>
                </div>
                <div className="detail-item">
                  <div className="detail-label">Status</div>
                  <div className="detail-value"><span className={getStatusBadgeClass(selectedRecord.status)}>{selectedRecord.status}</span></div>
                </div>
                <div className="detail-item">
                  <div className="detail-label">Region</div>
                  <div className="detail-value">{selectedRecord.region}</div>
                </div>
                <div className="detail-item">
                  <div className="detail-label">Performance Rating</div>
                  <div className="detail-value">{parseFloat(selectedRecord.performance_rating || 0).toFixed(1)}</div>
                </div>
                <div className="detail-item">
                  <div className="detail-label">Contract Start</div>
                  <div className="detail-value">{selectedRecord.contract_start || '--'}</div>
                </div>
                <div className="detail-item">
                  <div className="detail-label">Contract End</div>
                  <div className="detail-value">{selectedRecord.contract_end || '--'}</div>
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

export default SupplierDiversity;
