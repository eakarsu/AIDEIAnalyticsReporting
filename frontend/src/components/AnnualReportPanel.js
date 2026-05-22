import React from 'react';

function AnnualReportPanel({ data, onDownload }) {
  if (!data) return <div style={{ padding: 24, color: '#94a3b8' }}>Loading annual report...</div>;
  const sections = data.sections || [];

  function handleDownload() {
    if (onDownload) return onDownload();
    // Lightweight client-side "PDF" fallback: open print view in new window
    const w = window.open('', '_blank');
    if (!w) return;
    const html = `<!doctype html><html><head><title>${data.title}</title>
      <style>body{font-family:Arial;padding:32px;color:#111} h1{color:#6366f1} h2{margin-top:24px;border-bottom:1px solid #ccc;padding-bottom:6px} li{margin:4px 0}</style></head>
      <body><h1>${data.title}</h1><p><em>Generated ${data.generatedAt} by ${data.author || 'system'}</em></p>
      ${sections.map(s => `<h2>${s.heading}</h2>${s.paragraphs ? s.paragraphs.map(p => `<p>${p}</p>`).join('') : ''}${s.bullets ? `<ul>${s.bullets.map(b => `<li>${b}</li>`).join('')}</ul>` : ''}`).join('')}
      </body></html>`;
    w.document.write(html); w.document.close(); w.focus(); setTimeout(() => w.print(), 250);
  }

  return (
    <div className="custom-card" data-testid="annual-report-panel" style={{ background: '#0f172a', padding: 24, borderRadius: 12, border: '1px solid #1e293b' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <h3 style={{ margin: 0, color: '#e2e8f0' }}>{data.title}</h3>
        <button onClick={handleDownload} style={{
          background: '#6366f1', color: '#fff', border: 'none', padding: '8px 14px',
          borderRadius: 6, cursor: 'pointer', fontWeight: 600, fontSize: 13
        }}>Download PDF</button>
      </div>
      <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 16 }}>
        Year {data.year} - {data.pageCount} pages - {data.format}
      </div>

      <div style={{ background: '#1e293b', padding: 12, borderRadius: 8, marginBottom: 16, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10 }}>
        {Object.entries(data.totals || {}).map(([k, v]) => (
          <div key={k} style={{ background: '#0f172a', padding: 8, borderRadius: 6 }}>
            <div style={{ fontSize: 10, color: '#94a3b8', textTransform: 'uppercase' }}>{k.replace(/([A-Z])/g, ' $1').trim()}</div>
            <div style={{ fontSize: 18, color: '#10b981', fontWeight: 700 }}>{v}</div>
          </div>
        ))}
      </div>

      <div>
        {sections.map((s, i) => (
          <div key={i} style={{ marginBottom: 16, paddingBottom: 12, borderBottom: '1px dashed #334155' }}>
            <h4 style={{ margin: '0 0 6px', color: '#6366f1' }}>{s.heading}</h4>
            {s.paragraphs && s.paragraphs.map((p, j) => (
              <p key={j} style={{ color: '#cbd5e1', fontSize: 13, lineHeight: 1.6, margin: '4px 0' }}>{p}</p>
            ))}
            {s.bullets && (
              <ul style={{ color: '#cbd5e1', fontSize: 13, lineHeight: 1.6, marginTop: 4 }}>
                {s.bullets.map((b, j) => <li key={j}>{b}</li>)}
              </ul>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default AnnualReportPanel;
