import React, { useState, useEffect, useCallback } from 'react';
import AIAnalysisPanel from '../components/AIAnalysisPanel';

const API = 'http://localhost:3001/api';

const emptyForm = {
  department: '', job_level: '', demographic_type: 'Gender', demographic_value: '',
  headcount: '', percentage: '', avg_tenure: '', avg_age: '', avg_salary: '',
  period: '', year: new Date().getFullYear(), notes: ''
};

function WorkforceDemographics({ token }) {
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

  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/workforce-demographics`, { headers: { Authorization: `Bearer ${token}` } });
      const json = await res.json();
      setData(Array.isArray(json) ? json : []);
    } catch { setData([]); }
    setLoading(false);
  }, [token]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleCreate = async (e) => {
    e.preventDefault();
    await fetch(`${API}/workforce-demographics`, { method: 'POST', headers, body: JSON.stringify(formData) });
    setShowCreateModal(false); setFormData({ ...emptyForm }); fetchData();
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    await fetch(`${API}/workforce-demographics/${selectedRecord.id}`, { method: 'PUT', headers, body: JSON.stringify(formData) });
    setShowEditModal(false); setShowDetailModal(false); fetchData();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this record?')) return;
    await fetch(`${API}/workforce-demographics/${id}`, { method: 'DELETE', headers });
    setShowDetailModal(false); fetchData();
  };

  const runAiAnalysis = async () => {
    setAiLoading(true); setAiAnalysis(null);
    try {
      const res = await fetch(`${API}/ai/analyze-workforce`, { method: 'POST', headers });
      const json = await res.json();
      setAiAnalysis(json.analysis);
    } catch (err) { setAiAnalysis('Error: ' + err.message); }
    setAiLoading(false);
  };

  const runRecordAi = async (record, e) => {
    e.stopPropagation();
    setRecordAiLoading(true); setRecordAiAnalysis(null);
    setSelectedRecord(record); setShowDetailModal(true);
    try {
      const res = await fetch(`${API}/ai/analyze-record`, { method: 'POST', headers, body: JSON.stringify({ record, type: 'workforce_demographics' }) });
      const json = await res.json();
      setRecordAiAnalysis(json.analysis);
    } catch (err) { setRecordAiAnalysis('Error: ' + err.message); }
    setRecordAiLoading(false);
  };

  const openDetail = (r) => { setSelectedRecord(r); setRecordAiAnalysis(null); setShowDetailModal(true); };
  const openEdit = (r) => { setFormData({ ...r }); setShowEditModal(true); };
  const fmt$ = (v) => v ? `$${Number(v).toLocaleString()}` : '-';

  const stats = {
    total: data.length,
    totalHeadcount: data.reduce((a, d) => a + (Number(d.headcount) || 0), 0),
    depts: [...new Set(data.map(d => d.department))].length,
    avgTenure: data.length ? (data.reduce((a, d) => a + (Number(d.avg_tenure) || 0), 0) / data.length).toFixed(1) : 0
  };

  const onChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const FormFields = () => (
    <div className="form-grid">
      <div className="form-group"><label>Department</label><input name="department" value={formData.department} onChange={onChange} required /></div>
      <div className="form-group"><label>Job Level</label><input name="job_level" value={formData.job_level} onChange={onChange} required /></div>
      <div className="form-group"><label>Demographic Type</label>
        <select name="demographic_type" value={formData.demographic_type} onChange={onChange}>
          {['Gender','Ethnicity','Age','Disability','Veteran Status'].map(o => <option key={o}>{o}</option>)}
        </select></div>
      <div className="form-group"><label>Demographic Value</label><input name="demographic_value" value={formData.demographic_value} onChange={onChange} required /></div>
      <div className="form-group"><label>Headcount</label><input name="headcount" type="number" value={formData.headcount} onChange={onChange} required /></div>
      <div className="form-group"><label>Percentage</label><input name="percentage" type="number" step="0.01" value={formData.percentage} onChange={onChange} required /></div>
      <div className="form-group"><label>Avg Tenure (yrs)</label><input name="avg_tenure" type="number" step="0.1" value={formData.avg_tenure} onChange={onChange} /></div>
      <div className="form-group"><label>Avg Age</label><input name="avg_age" type="number" step="0.1" value={formData.avg_age} onChange={onChange} /></div>
      <div className="form-group"><label>Avg Salary</label><input name="avg_salary" type="number" value={formData.avg_salary} onChange={onChange} /></div>
      <div className="form-group"><label>Period</label><input name="period" value={formData.period} onChange={onChange} required /></div>
      <div className="form-group"><label>Year</label><input name="year" type="number" value={formData.year} onChange={onChange} required /></div>
      <div className="form-group full-width"><label>Notes</label><textarea name="notes" value={formData.notes} onChange={onChange} /></div>
    </div>
  );

  return (
    <div>
      <div className="page-header">
        <div><h2>Workforce Demographics</h2><p>Overall workforce composition by department, level, and demographic groups</p></div>
        <div className="header-actions">
          <button className="btn-ai" onClick={runAiAnalysis} disabled={aiLoading}>AI Analysis</button>
          <button className="btn-primary" onClick={() => { setFormData({ ...emptyForm }); setShowCreateModal(true); }}>+ New Record</button>
        </div>
      </div>

      <div className="stats-bar">
        <div className="stat-card"><div className="stat-number">{stats.total}</div><div className="stat-text">Total Records</div></div>
        <div className="stat-card"><div className="stat-number">{stats.totalHeadcount}</div><div className="stat-text">Total Headcount</div></div>
        <div className="stat-card"><div className="stat-number">{stats.depts}</div><div className="stat-text">Departments</div></div>
        <div className="stat-card"><div className="stat-number">{stats.avgTenure} yrs</div><div className="stat-text">Avg Tenure</div></div>
      </div>

      <AIAnalysisPanel analysis={aiAnalysis} loading={aiLoading} onClose={() => setAiAnalysis(null)} />

      <div className="data-table-container">
        <table className="data-table">
          <thead><tr>
            <th>Department</th><th>Job Level</th><th>Demo Type</th><th>Demo Value</th><th>Headcount</th><th>%</th><th>Tenure</th><th>Avg Age</th><th>Avg Salary</th><th>Period</th><th>AI</th>
          </tr></thead>
          <tbody>
            {loading ? <tr><td colSpan="11" style={{textAlign:'center',padding:'40px'}}>Loading...</td></tr> :
            data.length === 0 ? <tr><td colSpan="11" style={{textAlign:'center',padding:'40px'}}>No records found</td></tr> :
            data.map(r => (
              <tr key={r.id} onClick={() => openDetail(r)} style={Number(r.percentage) < 10 ? {background: 'rgba(239,68,68,0.05)'} : {}}>
                <td>{r.department}</td>
                <td>{r.job_level}</td>
                <td>{r.demographic_type}</td>
                <td>{r.demographic_value}</td>
                <td>{r.headcount}</td>
                <td><span className={`badge ${Number(r.percentage) >= 30 ? 'badge-success' : Number(r.percentage) >= 15 ? 'badge-warning' : 'badge-danger'}`}>{Number(r.percentage).toFixed(1)}%</span></td>
                <td>{r.avg_tenure ? `${r.avg_tenure} yrs` : '-'}</td>
                <td>{r.avg_age || '-'}</td>
                <td>{fmt$(r.avg_salary)}</td>
                <td>{r.period} {r.year}</td>
                <td><button className="btn-ai" style={{padding:'4px 10px',fontSize:'12px'}} onClick={(e) => runRecordAi(r, e)}>AI</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3>New Workforce Demographic Record</h3><button className="modal-close" onClick={() => setShowCreateModal(false)}>&times;</button></div>
            <form className="modal-body" onSubmit={handleCreate}><FormFields /><div className="form-actions"><button type="button" className="btn-secondary" onClick={() => setShowCreateModal(false)}>Cancel</button><button type="submit" className="btn-primary">Create</button></div></form>
          </div>
        </div>
      )}

      {showEditModal && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3>Edit Workforce Demographic Record</h3><button className="modal-close" onClick={() => setShowEditModal(false)}>&times;</button></div>
            <form className="modal-body" onSubmit={handleEdit}><FormFields /><div className="form-actions"><button type="button" className="btn-secondary" onClick={() => setShowEditModal(false)}>Cancel</button><button type="submit" className="btn-primary">Save Changes</button></div></form>
          </div>
        </div>
      )}

      {showDetailModal && selectedRecord && (
        <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3>{selectedRecord.department} - {selectedRecord.demographic_value}</h3><button className="modal-close" onClick={() => setShowDetailModal(false)}>&times;</button></div>
            <div className="modal-body">
              <div className="detail-grid">
                <div className="detail-item"><div className="detail-label">Department</div><div className="detail-value">{selectedRecord.department}</div></div>
                <div className="detail-item"><div className="detail-label">Job Level</div><div className="detail-value">{selectedRecord.job_level}</div></div>
                <div className="detail-item"><div className="detail-label">Demographic Type</div><div className="detail-value">{selectedRecord.demographic_type}</div></div>
                <div className="detail-item"><div className="detail-label">Demographic Value</div><div className="detail-value">{selectedRecord.demographic_value}</div></div>
                <div className="detail-item"><div className="detail-label">Headcount</div><div className="detail-value">{selectedRecord.headcount}</div></div>
                <div className="detail-item"><div className="detail-label">Percentage</div><div className="detail-value">{Number(selectedRecord.percentage).toFixed(1)}%</div></div>
                <div className="detail-item"><div className="detail-label">Avg Tenure</div><div className="detail-value">{selectedRecord.avg_tenure ? `${selectedRecord.avg_tenure} yrs` : '-'}</div></div>
                <div className="detail-item"><div className="detail-label">Avg Age</div><div className="detail-value">{selectedRecord.avg_age || '-'}</div></div>
                <div className="detail-item"><div className="detail-label">Avg Salary</div><div className="detail-value">{fmt$(selectedRecord.avg_salary)}</div></div>
                <div className="detail-item"><div className="detail-label">Period</div><div className="detail-value">{selectedRecord.period} {selectedRecord.year}</div></div>
                {selectedRecord.notes && <div className="detail-item full-width"><div className="detail-label">Notes</div><div className="detail-value">{selectedRecord.notes}</div></div>}
              </div>
              {(recordAiAnalysis || recordAiLoading) && <AIAnalysisPanel analysis={recordAiAnalysis} loading={recordAiLoading} />}
            </div>
            <div className="modal-actions">
              <button className="btn-edit" onClick={() => openEdit(selectedRecord)}>Edit</button>
              <button className="btn-danger" onClick={() => handleDelete(selectedRecord.id)}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default WorkforceDemographics;
