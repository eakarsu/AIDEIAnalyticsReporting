import React, { useEffect, useState, useCallback } from 'react';
import WorkforceRepresentationChart from '../components/WorkforceRepresentationChart';
import PayEquityHeatmap from '../components/PayEquityHeatmap';
import AnnualReportPanel from '../components/AnnualReportPanel';
import ReportingRulesEditor from '../components/ReportingRulesEditor';

const API = 'http://localhost:3001/api/custom-views';

function CustomViewsPage({ token: tokenProp }) {
  const token = tokenProp || localStorage.getItem('token');
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  const [tab, setTab] = useState('representation');
  const [workforce, setWorkforce] = useState(null);
  const [heatmap, setHeatmap] = useState(null);
  const [report, setReport] = useState(null);
  const [rules, setRules] = useState([]);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const loadAll = useCallback(async () => {
    setError(null);
    try {
      const [w, h, r, rl] = await Promise.all([
        fetch(`${API}/workforce-representation`, { headers }).then(r => r.json()),
        fetch(`${API}/pay-equity-heatmap`, { headers }).then(r => r.json()),
        fetch(`${API}/annual-report`, { headers }).then(r => r.json()),
        fetch(`${API}/reporting-rules`, { headers }).then(r => r.json())
      ]);
      setWorkforce(w);
      setHeatmap(h);
      setReport(r);
      setRules(rl.rules || []);
    } catch (e) {
      setError(e.message);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => { loadAll(); }, [loadAll]);

  async function createRule(payload) {
    setBusy(true);
    try {
      const r = await fetch(`${API}/reporting-rules`, { method: 'POST', headers, body: JSON.stringify(payload) });
      if (!r.ok) throw new Error('Create failed');
      const created = await r.json();
      setRules(prev => [...prev, created]);
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  }
  async function updateRule(id, payload) {
    setBusy(true);
    try {
      const r = await fetch(`${API}/reporting-rules/${id}`, { method: 'PUT', headers, body: JSON.stringify(payload) });
      if (!r.ok) throw new Error('Update failed');
      const updated = await r.json();
      setRules(prev => prev.map(x => x.id === id ? updated : x));
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  }
  async function deleteRule(id) {
    setBusy(true);
    try {
      const r = await fetch(`${API}/reporting-rules/${id}`, { method: 'DELETE', headers });
      if (!r.ok) throw new Error('Delete failed');
      setRules(prev => prev.filter(x => x.id !== id));
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  }

  const tabs = [
    { key: 'representation', label: 'Workforce Representation (VIZ)' },
    { key: 'heatmap', label: 'Pay Equity Heatmap (VIZ)' },
    { key: 'annual', label: 'Annual DEI Report' },
    { key: 'rules', label: 'Reporting Rules' }
  ];

  return (
    <div data-testid="custom-views-page" style={{ padding: 24, maxWidth: 1280, margin: '0 auto' }}>
      <header style={{ marginBottom: 18 }}>
        <h1 style={{ margin: 0, color: '#e2e8f0' }}>DEI Custom Views</h1>
        <p style={{ color: '#94a3b8', fontSize: 13 }}>Bespoke DEI analytics, reports, and rule definitions.</p>
      </header>

      {error && (
        <div style={{ background: '#7f1d1d', color: '#fee2e2', padding: 10, borderRadius: 6, marginBottom: 12 }} data-testid="custom-views-error">
          Error: {error}
        </div>
      )}

      <div role="tablist" style={{ display: 'flex', gap: 6, marginBottom: 16, borderBottom: '1px solid #334155' }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            data-testid={`tab-${t.key}`}
            style={{
              background: tab === t.key ? '#6366f1' : 'transparent',
              color: tab === t.key ? '#fff' : '#cbd5e1',
              border: 'none', padding: '10px 16px', cursor: 'pointer',
              borderRadius: '6px 6px 0 0', fontWeight: 600, fontSize: 13
            }}>{t.label}</button>
        ))}
      </div>

      {tab === 'representation' && <WorkforceRepresentationChart data={workforce} />}
      {tab === 'heatmap' && <PayEquityHeatmap data={heatmap} />}
      {tab === 'annual' && <AnnualReportPanel data={report} />}
      {tab === 'rules' && (
        <ReportingRulesEditor
          rules={rules}
          busy={busy}
          onCreate={createRule}
          onUpdate={updateRule}
          onDelete={deleteRule}
        />
      )}
    </div>
  );
}

export default CustomViewsPage;
