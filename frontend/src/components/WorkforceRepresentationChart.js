import React from 'react';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#06b6d4', '#a855f7', '#ef4444'];

function WorkforceRepresentationChart({ data }) {
  if (!data || !data.series || data.series.length === 0) {
    return <div style={{ padding: 24, color: '#94a3b8' }}>No representation data available.</div>;
  }
  const cats = data.categories || [];
  // Compute max for scaling
  const totals = data.series.map(s => Object.values(s.values || {}).reduce((a, b) => a + (parseFloat(b) || 0), 0));
  const maxTotal = Math.max(1, ...totals);
  const chartH = 280;

  return (
    <div className="custom-card" data-testid="workforce-representation-chart" style={{ background: '#0f172a', padding: 20, borderRadius: 12, border: '1px solid #1e293b' }}>
      <h3 style={{ margin: 0, marginBottom: 4, color: '#e2e8f0' }}>{data.title || 'Workforce Representation'}</h3>
      <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 16 }}>Stacked bar — {data.xAxis} x {data.yAxis}</div>

      {/* Legend */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 12 }}>
        {cats.map((c, i) => (
          <div key={c} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#cbd5e1' }}>
            <span style={{ width: 12, height: 12, background: COLORS[i % COLORS.length], borderRadius: 2, display: 'inline-block' }} />
            {c}
          </div>
        ))}
      </div>

      {/* Chart */}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 18, height: chartH, borderBottom: '1px solid #334155', paddingBottom: 4 }}>
        {data.series.map((s, si) => {
          const total = totals[si] || 0;
          const barH = (total / maxTotal) * (chartH - 30);
          let offset = 0;
          return (
            <div key={s.level} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
              <div style={{ width: '70%', height: barH, position: 'relative', borderRadius: '4px 4px 0 0', overflow: 'hidden' }}>
                {cats.map((c, ci) => {
                  const v = parseFloat((s.values || {})[c]) || 0;
                  const segH = (v / total) * barH || 0;
                  const block = (
                    <div key={c} style={{
                      position: 'absolute', bottom: offset, left: 0, right: 0,
                      height: segH, background: COLORS[ci % COLORS.length],
                      borderTop: ci === 0 ? 'none' : '1px solid rgba(0,0,0,0.25)'
                    }} title={`${c}: ${v}`} />
                  );
                  offset += segH;
                  return block;
                })}
              </div>
              <div style={{ fontSize: 11, color: '#cbd5e1', marginTop: 6, textAlign: 'center' }}>{s.level}</div>
              <div style={{ fontSize: 10, color: '#64748b' }}>{total}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default WorkforceRepresentationChart;
