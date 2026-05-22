import React from 'react';

function colorFor(value, scale) {
  const min = (scale && scale.min) || 0;
  const max = (scale && scale.max) || 15;
  const mid = (scale && scale.mid) || (min + max) / 2;
  const v = Math.max(min, Math.min(max, Number(value) || 0));
  // 0 (green) -> mid (yellow) -> max (red)
  let r, g, b;
  if (v <= mid) {
    const t = (v - min) / Math.max(0.0001, (mid - min));
    r = Math.round(16 + (245 - 16) * t);
    g = Math.round(185 - (185 - 158) * t);
    b = Math.round(129 - (129 - 11) * t);
  } else {
    const t = (v - mid) / Math.max(0.0001, (max - mid));
    r = Math.round(245 + (239 - 245) * t);
    g = Math.round(158 - (158 - 68) * t);
    b = Math.round(11 + (68 - 11) * t);
  }
  return `rgb(${r}, ${g}, ${b})`;
}

function PayEquityHeatmap({ data }) {
  if (!data || !data.matrix || data.matrix.length === 0) {
    return <div style={{ padding: 24, color: '#94a3b8' }}>No pay equity data available.</div>;
  }
  const cols = data.columns || [];
  return (
    <div className="custom-card" data-testid="pay-equity-heatmap" style={{ background: '#0f172a', padding: 20, borderRadius: 12, border: '1px solid #1e293b', overflowX: 'auto' }}>
      <h3 style={{ margin: 0, marginBottom: 4, color: '#e2e8f0' }}>{data.title || 'Pay Equity Heatmap'}</h3>
      <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 16 }}>Heatmap — {data.yAxis} x {data.xAxis} (gap %)</div>

      <table style={{ borderCollapse: 'separate', borderSpacing: 4, width: '100%', minWidth: 600 }}>
        <thead>
          <tr>
            <th style={{ textAlign: 'left', padding: 6, color: '#cbd5e1', fontSize: 12, fontWeight: 600 }}>Role</th>
            {cols.map(c => (
              <th key={c} style={{ padding: 6, color: '#cbd5e1', fontSize: 11, fontWeight: 600, textAlign: 'center' }}>{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.matrix.map(row => (
            <tr key={row.role}>
              <td style={{ padding: '6px 10px', color: '#e2e8f0', fontSize: 12, fontWeight: 500, background: '#1e293b', borderRadius: 4 }}>{row.role}</td>
              {cols.map(c => {
                const v = (row.gaps || {})[c];
                const val = v == null ? '-' : Number(v).toFixed(1) + '%';
                return (
                  <td key={c} style={{
                    padding: '10px 6px', textAlign: 'center', minWidth: 100,
                    color: '#0f172a', background: v == null ? '#334155' : colorFor(v, data.scale),
                    fontWeight: 600, fontSize: 12, borderRadius: 4
                  }} title={`${row.role} — ${c}: ${val}`}>
                    {val}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 14, fontSize: 11, color: '#94a3b8' }}>
        <span>Lower gap</span>
        <div style={{ width: 180, height: 10, background: 'linear-gradient(to right, rgb(16,185,129), rgb(245,158,11), rgb(239,68,68))', borderRadius: 2 }} />
        <span>Higher gap</span>
      </div>
    </div>
  );
}

export default PayEquityHeatmap;
