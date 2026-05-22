import React, { useState } from 'react';

const empty = {
  metric_name: '', category: 'representation', description: '',
  warning_threshold: '', critical_threshold: '',
  unit: '%', comparison: 'gte', enabled: true
};

function ReportingRulesEditor({ rules, onCreate, onUpdate, onDelete, busy }) {
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState(null);

  function startEdit(rule) {
    setEditingId(rule.id);
    setForm({
      metric_name: rule.metric_name || '',
      category: rule.category || 'representation',
      description: rule.description || '',
      warning_threshold: rule.warning_threshold ?? '',
      critical_threshold: rule.critical_threshold ?? '',
      unit: rule.unit || '%',
      comparison: rule.comparison || 'gte',
      enabled: rule.enabled !== false
    });
  }

  function cancelEdit() { setEditingId(null); setForm(empty); }

  async function submit(e) {
    e.preventDefault();
    const payload = {
      ...form,
      warning_threshold: form.warning_threshold === '' ? null : Number(form.warning_threshold),
      critical_threshold: form.critical_threshold === '' ? null : Number(form.critical_threshold)
    };
    if (editingId) {
      await onUpdate(editingId, payload);
      cancelEdit();
    } else {
      await onCreate(payload);
      setForm(empty);
    }
  }

  return (
    <div className="custom-card" data-testid="reporting-rules-editor" style={{ background: '#0f172a', padding: 24, borderRadius: 12, border: '1px solid #1e293b' }}>
      <h3 style={{ margin: 0, marginBottom: 4, color: '#e2e8f0' }}>Reporting Rules Editor</h3>
      <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 16 }}>Define metrics, thresholds, and alert rules for DEI reports.</div>

      <form onSubmit={submit} style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, marginBottom: 18, background: '#1e293b', padding: 14, borderRadius: 8 }}>
        <label style={{ gridColumn: '1 / -1', fontSize: 12, color: '#cbd5e1' }}>
          Metric name
          <input required value={form.metric_name} onChange={e => setForm({ ...form, metric_name: e.target.value })}
            style={inp} placeholder="e.g. Leadership Gender Representation" />
        </label>
        <label style={{ fontSize: 12, color: '#cbd5e1' }}>
          Category
          <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} style={inp}>
            <option value="representation">representation</option>
            <option value="pay_equity">pay_equity</option>
            <option value="hiring">hiring</option>
            <option value="promotion">promotion</option>
            <option value="retention">retention</option>
            <option value="training">training</option>
          </select>
        </label>
        <label style={{ fontSize: 12, color: '#cbd5e1' }}>
          Unit
          <select value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })} style={inp}>
            <option value="%">%</option>
            <option value="ratio">ratio</option>
            <option value="count">count</option>
          </select>
        </label>
        <label style={{ fontSize: 12, color: '#cbd5e1' }}>
          Warning threshold
          <input type="number" step="0.01" value={form.warning_threshold}
            onChange={e => setForm({ ...form, warning_threshold: e.target.value })} style={inp} />
        </label>
        <label style={{ fontSize: 12, color: '#cbd5e1' }}>
          Critical threshold
          <input type="number" step="0.01" value={form.critical_threshold}
            onChange={e => setForm({ ...form, critical_threshold: e.target.value })} style={inp} />
        </label>
        <label style={{ fontSize: 12, color: '#cbd5e1' }}>
          Comparison
          <select value={form.comparison} onChange={e => setForm({ ...form, comparison: e.target.value })} style={inp}>
            <option value="gte">Greater than or equal (gte)</option>
            <option value="lte">Less than or equal (lte)</option>
            <option value="eq">Equal (eq)</option>
          </select>
        </label>
        <label style={{ fontSize: 12, color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: 6 }}>
          <input type="checkbox" checked={form.enabled} onChange={e => setForm({ ...form, enabled: e.target.checked })} />
          Enabled
        </label>
        <label style={{ gridColumn: '1 / -1', fontSize: 12, color: '#cbd5e1' }}>
          Description
          <textarea rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} style={inp} />
        </label>
        <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 8 }}>
          <button type="submit" disabled={busy} style={btnPrimary}>
            {editingId ? 'Update rule' : 'Add rule'}
          </button>
          {editingId && <button type="button" onClick={cancelEdit} style={btnSecondary}>Cancel</button>}
        </div>
      </form>

      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, color: '#cbd5e1' }}>
        <thead>
          <tr style={{ background: '#1e293b' }}>
            <th style={th}>Metric</th><th style={th}>Category</th>
            <th style={th}>Warn</th><th style={th}>Crit</th>
            <th style={th}>Unit</th><th style={th}>Cmp</th>
            <th style={th}>On</th><th style={th}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {(rules || []).map(r => (
            <tr key={r.id} style={{ borderBottom: '1px solid #334155' }}>
              <td style={td}>{r.metric_name}</td>
              <td style={td}>{r.category}</td>
              <td style={td}>{r.warning_threshold ?? '-'}</td>
              <td style={td}>{r.critical_threshold ?? '-'}</td>
              <td style={td}>{r.unit}</td>
              <td style={td}>{r.comparison}</td>
              <td style={td}>{r.enabled ? 'Y' : 'N'}</td>
              <td style={td}>
                <button onClick={() => startEdit(r)} style={btnLink}>Edit</button>
                <button onClick={() => onDelete(r.id)} style={{ ...btnLink, color: '#ef4444' }}>Delete</button>
              </td>
            </tr>
          ))}
          {(!rules || rules.length === 0) && (
            <tr><td colSpan={8} style={{ ...td, textAlign: 'center', color: '#64748b' }}>No rules yet.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

const inp = {
  width: '100%', marginTop: 4, padding: '6px 8px', borderRadius: 4,
  border: '1px solid #334155', background: '#0f172a', color: '#e2e8f0', fontSize: 12
};
const btnPrimary = { background: '#10b981', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: 6, cursor: 'pointer', fontWeight: 600 };
const btnSecondary = { background: '#334155', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: 6, cursor: 'pointer' };
const btnLink = { background: 'none', border: 'none', color: '#6366f1', cursor: 'pointer', marginRight: 8, fontSize: 12 };
const th = { padding: 8, textAlign: 'left', fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', borderBottom: '1px solid #334155' };
const td = { padding: 8 };

export default ReportingRulesEditor;
