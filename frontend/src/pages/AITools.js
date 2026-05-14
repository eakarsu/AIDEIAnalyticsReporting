import React, { useState, useEffect } from 'react';

const API = 'http://localhost:3001/api';

const MODULES = [
  { key: 'diversity', label: 'Diversity' },
  { key: 'pay_equity', label: 'Pay Equity' },
  { key: 'hiring', label: 'Hiring' },
  { key: 'promotion', label: 'Promotion' },
  { key: 'retention', label: 'Retention' },
  { key: 'leadership', label: 'Leadership' },
  { key: 'compliance', label: 'Compliance' },
  { key: 'benchmarking', label: 'Benchmarking' },
  { key: 'surveys', label: 'Surveys' },
  { key: 'incidents', label: 'Incidents' }
];

function AITools({ token }) {
  const [tab, setTab] = useState('threshold');
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  // Threshold check
  const [tForm, setTForm] = useState({ metric_type: 'pay_gap_percentage', current_value: '', threshold: '' });
  const [tResult, setTResult] = useState(null);
  const [tLoading, setTLoading] = useState(false);
  const [tError, setTError] = useState('');

  // Executive report
  const [selModules, setSelModules] = useState({ diversity: true, pay_equity: true, hiring: true });
  const [eReport, setEReport] = useState(null);
  const [eLoading, setELoading] = useState(false);
  const [eError, setEError] = useState('');

  // Attrition predictor
  const [aForm, setAForm] = useState({ department: 'Engineering', time_horizon_months: 12 });
  const [aResult, setAResult] = useState(null);
  const [aLoading, setALoading] = useState(false);
  const [aError, setAError] = useState('');

  // Compliance calendar
  const [cJurisdiction, setCJurisdiction] = useState('US');
  const [cResult, setCResult] = useState(null);
  const [cLoading, setCLoading] = useState(false);
  const [cError, setCError] = useState('');

  // Intersectionality
  const [iForm, setIForm] = useState({ dimensions: 'gender,race', focus_metric: 'pay_gap_percentage' });
  const [iResult, setIResult] = useState(null);
  const [iLoading, setILoading] = useState(false);
  const [iError, setIError] = useState('');

  // Talent pipeline simulation
  const [pForm, setPForm] = useState({ policy_changes: 'Anonymized resume screening; mandatory diverse slate for VP hires; mentorship program for high-potential URM staff', time_horizon_years: 3, target_groups: 'women, URM' });
  const [pResult, setPResult] = useState(null);
  const [pLoading, setPLoading] = useState(false);
  const [pError, setPError] = useState('');

  // Bias mitigation playbook
  const [bForm, setBForm] = useState({ bias_type: 'hiring', severity: 'high', context: '' });
  const [bResult, setBResult] = useState(null);
  const [bLoading, setBLoading] = useState(false);
  const [bError, setBError] = useState('');

  // History (ai_analyses)
  const [history, setHistory] = useState([]);
  const [historyType, setHistoryType] = useState('');

  const loadHistory = async () => {
    try {
      const url = historyType
        ? `${API}/ai-analyses?analysis_type=${historyType}&limit=20`
        : `${API}/ai-analyses?limit=20`;
      const r = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      const j = await r.json();
      setHistory(j.data || []);
    } catch (_) {}
  };

  useEffect(() => { if (tab === 'history') loadHistory(); }, [tab, historyType]);

  const runThreshold = async () => {
    setTLoading(true); setTError(''); setTResult(null);
    try {
      const r = await fetch(`${API}/ai/threshold-check`, {
        method: 'POST', headers, body: JSON.stringify(tForm)
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'Threshold check failed');
      setTResult(j);
    } catch (e) { setTError(e.message); }
    finally { setTLoading(false); }
  };

  const runExecutive = async () => {
    setELoading(true); setEError(''); setEReport(null);
    try {
      const modules = Object.entries(selModules).filter(([, v]) => v).map(([k]) => k);
      if (modules.length === 0) throw new Error('Select at least one module');
      const r = await fetch(`${API}/ai/executive-report`, {
        method: 'POST', headers, body: JSON.stringify({ modules })
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'Executive report failed');
      setEReport(j);
    } catch (e) { setEError(e.message); }
    finally { setELoading(false); }
  };

  const runAttrition = async () => {
    setALoading(true); setAError(''); setAResult(null);
    try {
      const r = await fetch(`${API}/ai/attrition-predictor`, {
        method: 'POST', headers, body: JSON.stringify(aForm)
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'Attrition prediction failed');
      setAResult(j);
    } catch (e) { setAError(e.message); }
    finally { setALoading(false); }
  };

  const runCompliance = async () => {
    setCLoading(true); setCError(''); setCResult(null);
    try {
      const r = await fetch(`${API}/ai/compliance-calendar`, {
        method: 'POST', headers, body: JSON.stringify({ jurisdiction: cJurisdiction })
      });
      const j = await r.json();
      if (!r.ok) throw new Error(r.status === 503 ? (j.error || 'AI service unavailable') : (j.error || 'Compliance calendar failed'));
      setCResult(j);
    } catch (e) { setCError(e.message); }
    finally { setCLoading(false); }
  };

  const runIntersectionality = async () => {
    setILoading(true); setIError(''); setIResult(null);
    try {
      const dimensions = iForm.dimensions.split(',').map(s => s.trim()).filter(Boolean);
      if (dimensions.length < 2) throw new Error('Provide at least 2 comma-separated demographic dimensions');
      const r = await fetch(`${API}/ai/intersectionality-analysis`, {
        method: 'POST', headers, body: JSON.stringify({ dimensions, focus_metric: iForm.focus_metric })
      });
      const j = await r.json();
      if (!r.ok) throw new Error(r.status === 503 ? (j.error || 'AI service unavailable') : (j.error || 'Intersectionality analysis failed'));
      setIResult(j);
    } catch (e) { setIError(e.message); }
    finally { setILoading(false); }
  };

  const runPipeline = async () => {
    setPLoading(true); setPError(''); setPResult(null);
    try {
      const policy_changes = pForm.policy_changes.split(';').map(s => s.trim()).filter(Boolean);
      if (policy_changes.length === 0) throw new Error('Provide at least one policy change (use ";" to separate multiple)');
      const target_groups = pForm.target_groups ? pForm.target_groups.split(',').map(s => s.trim()).filter(Boolean) : null;
      const r = await fetch(`${API}/ai/talent-pipeline-simulation`, {
        method: 'POST', headers, body: JSON.stringify({ policy_changes, time_horizon_years: parseInt(pForm.time_horizon_years || '3', 10), target_groups })
      });
      const j = await r.json();
      if (!r.ok) throw new Error(r.status === 503 ? (j.error || 'AI service unavailable') : (j.error || 'Pipeline simulation failed'));
      setPResult(j);
    } catch (e) { setPError(e.message); }
    finally { setPLoading(false); }
  };

  const runBiasPlaybook = async () => {
    setBLoading(true); setBError(''); setBResult(null);
    try {
      if (!bForm.bias_type) throw new Error('bias_type is required');
      const r = await fetch(`${API}/ai/bias-mitigation-playbook`, {
        method: 'POST', headers, body: JSON.stringify({ bias_type: bForm.bias_type, severity: bForm.severity, context: bForm.context || undefined })
      });
      const j = await r.json();
      if (!r.ok) throw new Error(r.status === 503 ? (j.error || 'AI service unavailable') : (j.error || 'Bias playbook failed'));
      setBResult(j);
    } catch (e) { setBError(e.message); }
    finally { setBLoading(false); }
  };

  const tabBtn = (k, label) => (
    <button key={k} onClick={() => setTab(k)}
      style={{
        padding: '8px 16px', marginRight: 8, borderRadius: 8, border: '1px solid',
        borderColor: tab === k ? '#2563eb' : '#cbd5e1',
        background: tab === k ? '#dbeafe' : 'white', color: tab === k ? '#1d4ed8' : '#334155',
        cursor: 'pointer', fontSize: 13, fontWeight: 500
      }}>{label}</button>
  );

  return (
    <div style={{ padding: 24, maxWidth: 1100 }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>AI Tools</h1>
      <p style={{ color: '#64748b', fontSize: 14, marginBottom: 24 }}>Threshold alerting, executive reports, attrition prediction, and compliance calendar.</p>

      <div style={{ marginBottom: 20, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {tabBtn('threshold', 'Threshold Check')}
        {tabBtn('executive', 'Executive Report')}
        {tabBtn('attrition', 'Attrition Predictor')}
        {tabBtn('compliance', 'Compliance Calendar')}
        {tabBtn('intersectionality', 'Intersectionality')}
        {tabBtn('pipeline', 'Pipeline Simulator')}
        {tabBtn('biasplaybook', 'Bias Mitigation')}
        {tabBtn('history', 'AI History')}
      </div>

      {tab === 'threshold' && (
        <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 12, padding: 20 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Metric Threshold Check</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 12 }}>
            <input value={tForm.metric_type} onChange={e => setTForm({ ...tForm, metric_type: e.target.value })} placeholder="metric type (e.g. pay_gap_percentage)" style={inp} />
            <input type="number" value={tForm.current_value} onChange={e => setTForm({ ...tForm, current_value: e.target.value })} placeholder="current value" style={inp} />
            <input type="number" value={tForm.threshold} onChange={e => setTForm({ ...tForm, threshold: e.target.value })} placeholder="threshold" style={inp} />
          </div>
          <button disabled={tLoading} onClick={runThreshold} style={btn}>{tLoading ? 'Checking...' : 'Run check'}</button>
          {tError && <div style={{ color: '#dc2626', fontSize: 13, marginTop: 12 }}>{tError}</div>}
          {tResult && <pre style={pre}>{JSON.stringify(tResult, null, 2)}</pre>}
        </div>
      )}

      {tab === 'executive' && (
        <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 12, padding: 20 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Executive DEI Report</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, marginBottom: 12 }}>
            {MODULES.map(m => (
              <label key={m.key} style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                <input type="checkbox" checked={!!selModules[m.key]} onChange={e => setSelModules({ ...selModules, [m.key]: e.target.checked })} />
                {m.label}
              </label>
            ))}
          </div>
          <button disabled={eLoading} onClick={runExecutive} style={btn}>{eLoading ? 'Generating...' : 'Generate executive report'}</button>
          {eError && <div style={{ color: '#dc2626', fontSize: 13, marginTop: 12 }}>{eError}</div>}
          {eReport && (
            <div style={{ marginTop: 16 }}>
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: 12, marginBottom: 12 }}>
                <div style={{ fontSize: 12, color: '#64748b' }}>Generated: {eReport.generated_at}</div>
                <div style={{ fontSize: 12, color: '#64748b' }}>Modules: {eReport.modules_included?.join(', ')}</div>
              </div>
              <pre style={{ ...pre, whiteSpace: 'pre-wrap' }}>{eReport.narrative}</pre>
            </div>
          )}
        </div>
      )}

      {tab === 'attrition' && (
        <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 12, padding: 20 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Attrition Risk Predictor</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginBottom: 12 }}>
            <input value={aForm.department} onChange={e => setAForm({ ...aForm, department: e.target.value })} placeholder="Department" style={inp} />
            <input type="number" value={aForm.time_horizon_months} onChange={e => setAForm({ ...aForm, time_horizon_months: parseInt(e.target.value || '12', 10) })} placeholder="Horizon (months)" style={inp} />
          </div>
          <button disabled={aLoading} onClick={runAttrition} style={btn}>{aLoading ? 'Analyzing...' : 'Predict attrition risk'}</button>
          {aError && <div style={{ color: '#dc2626', fontSize: 13, marginTop: 12 }}>{aError}</div>}
          {aResult && (
            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: 13, color: '#64748b', marginBottom: 8 }}>Data sources: retention {aResult.data_sources?.retention_records} · surveys {aResult.data_sources?.survey_records} · promotion {aResult.data_sources?.promotion_records}</div>
              <pre style={{ ...pre, whiteSpace: 'pre-wrap' }}>{aResult.analysis}</pre>
            </div>
          )}
        </div>
      )}

      {tab === 'compliance' && (
        <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 12, padding: 20 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Compliance Calendar</h2>
          <div style={{ marginBottom: 12 }}>
            <input value={cJurisdiction} onChange={e => setCJurisdiction(e.target.value)} placeholder="US, UK, EU, California, ..." style={{ ...inp, width: 280 }} />
          </div>
          <button disabled={cLoading} onClick={runCompliance} style={btn}>{cLoading ? 'Generating...' : 'Generate calendar'}</button>
          {cError && <div style={{ color: '#dc2626', fontSize: 13, marginTop: 12 }}>{cError}</div>}
          {cResult && (
            <div style={{ marginTop: 16 }}>
              <pre style={{ ...pre, whiteSpace: 'pre-wrap' }}>{cResult.compliance_calendar}</pre>
            </div>
          )}
        </div>
      )}

      {tab === 'intersectionality' && (
        <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 12, padding: 20 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Intersectionality Analysis</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginBottom: 12 }}>
            <input value={iForm.dimensions} onChange={e => setIForm({ ...iForm, dimensions: e.target.value })} placeholder="comma-separated dimensions (e.g. gender,race)" style={inp} />
            <input value={iForm.focus_metric} onChange={e => setIForm({ ...iForm, focus_metric: e.target.value })} placeholder="focus metric" style={inp} />
          </div>
          <button disabled={iLoading} onClick={runIntersectionality} style={btn}>{iLoading ? 'Analyzing...' : 'Run intersectionality analysis'}</button>
          {iError && <div style={{ color: '#dc2626', fontSize: 13, marginTop: 12 }}>{iError}</div>}
          {iResult && <pre style={{ ...pre, whiteSpace: 'pre-wrap' }}>{iResult.analysis}</pre>}
        </div>
      )}

      {tab === 'pipeline' && (
        <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 12, padding: 20 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Talent Pipeline Simulation</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 8, marginBottom: 12 }}>
            <textarea value={pForm.policy_changes} onChange={e => setPForm({ ...pForm, policy_changes: e.target.value })} placeholder="Policy changes (use ';' to separate)" style={{ ...inp, minHeight: 80 }} />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
              <input type="number" value={pForm.time_horizon_years} onChange={e => setPForm({ ...pForm, time_horizon_years: e.target.value })} placeholder="Time horizon (years)" style={inp} />
              <input value={pForm.target_groups} onChange={e => setPForm({ ...pForm, target_groups: e.target.value })} placeholder="Target groups (comma-sep, optional)" style={inp} />
            </div>
          </div>
          <button disabled={pLoading} onClick={runPipeline} style={btn}>{pLoading ? 'Simulating...' : 'Simulate pipeline'}</button>
          {pError && <div style={{ color: '#dc2626', fontSize: 13, marginTop: 12 }}>{pError}</div>}
          {pResult && <pre style={{ ...pre, whiteSpace: 'pre-wrap' }}>{pResult.analysis}</pre>}
        </div>
      )}

      {tab === 'biasplaybook' && (
        <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 12, padding: 20 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Bias Mitigation Playbook</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginBottom: 12 }}>
            <input value={bForm.bias_type} onChange={e => setBForm({ ...bForm, bias_type: e.target.value })} placeholder="Bias type (hiring, promotion, pay, training)" style={inp} />
            <select value={bForm.severity} onChange={e => setBForm({ ...bForm, severity: e.target.value })} style={inp}>
              <option value="low">low</option>
              <option value="medium">medium</option>
              <option value="high">high</option>
              <option value="critical">critical</option>
            </select>
          </div>
          <textarea value={bForm.context} onChange={e => setBForm({ ...bForm, context: e.target.value })} placeholder="Context (optional)" style={{ ...inp, minHeight: 60, marginBottom: 12 }} />
          <button disabled={bLoading} onClick={runBiasPlaybook} style={btn}>{bLoading ? 'Generating...' : 'Generate playbook'}</button>
          {bError && <div style={{ color: '#dc2626', fontSize: 13, marginTop: 12 }}>{bError}</div>}
          {bResult && <pre style={{ ...pre, whiteSpace: 'pre-wrap' }}>{bResult.analysis}</pre>}
        </div>
      )}

      {tab === 'history' && (
        <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 12, padding: 20 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Persisted AI Analyses</h2>
          <div style={{ marginBottom: 12 }}>
            <input value={historyType} onChange={e => setHistoryType(e.target.value)} placeholder="Filter by analysis_type (optional)" style={{ ...inp, width: 320 }} />
            <button onClick={loadHistory} style={{ ...btn, marginLeft: 8 }}>Refresh</button>
          </div>
          {history.length === 0 ? (
            <div style={{ fontSize: 13, color: '#64748b' }}>No persisted analyses yet.</div>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {history.map(h => (
                <li key={h.id} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: 12, marginBottom: 8 }}>
                  <div style={{ fontSize: 12, color: '#64748b' }}>{h.created_at} · {h.entity_type} · {h.analysis_type}</div>
                  <div style={{ fontSize: 13, marginTop: 6, whiteSpace: 'pre-wrap' }}>{(h.findings_text || '').substring(0, 600)}{(h.findings_text || '').length > 600 ? '…' : ''}</div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

const inp = { padding: '8px 12px', fontSize: 13, border: '1px solid #cbd5e1', borderRadius: 8, width: '100%' };
const btn = { padding: '8px 16px', background: '#2563eb', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 500 };
const pre = { fontSize: 12, background: '#0f172a', color: '#e2e8f0', padding: 12, borderRadius: 8, overflow: 'auto', maxHeight: 480, marginTop: 12 };

export default AITools;
