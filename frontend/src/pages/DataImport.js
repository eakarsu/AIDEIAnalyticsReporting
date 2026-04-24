import React, { useState } from 'react';

const API = 'http://localhost:3001/api';

const modules = [
  { key: 'diversity-metrics', label: 'Diversity Metrics' },
  { key: 'pay-equity', label: 'Pay Equity' },
  { key: 'hiring-bias', label: 'Hiring Bias' },
  { key: 'promotion-bias', label: 'Promotion Bias' },
  { key: 'compliance-reports', label: 'Compliance Reports' },
  { key: 'benchmarking', label: 'Benchmarking' },
  { key: 'employee-surveys', label: 'Employee Surveys' },
  { key: 'training-programs', label: 'Training Programs' },
  { key: 'retention-analysis', label: 'Retention Analysis' },
  { key: 'leadership-pipeline', label: 'Leadership Pipeline' },
  { key: 'supplier-diversity', label: 'Supplier Diversity' },
  { key: 'erg-management', label: 'ERG Management' },
  { key: 'incident-reports', label: 'Incident Reports' },
  { key: 'accessibility', label: 'Accessibility' },
  { key: 'workforce-demographics', label: 'Workforce Demographics' }
];

function DataImport({ token }) {
  const [selectedModule, setSelectedModule] = useState('');
  const [columns, setColumns] = useState([]);
  const [csvText, setCsvText] = useState('');
  const [parsedData, setParsedData] = useState([]);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);
  const [step, setStep] = useState(1);

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`
  };

  const handleModuleSelect = async (moduleKey) => {
    setSelectedModule(moduleKey);
    setResult(null);
    setParsedData([]);
    setCsvText('');
    try {
      const res = await fetch(`${API}/import/columns/${moduleKey}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setColumns(Array.isArray(data) ? data : []);
      setStep(2);
    } catch (err) {
      console.error(err);
    }
  };

  const parseCSV = (text) => {
    const lines = text.trim().split('\n');
    if (lines.length < 2) return [];

    const headerLine = lines[0];
    const csvHeaders = headerLine.split(',').map(h => h.trim().replace(/^"|"$/g, ''));

    const rows = [];
    for (let i = 1; i < lines.length; i++) {
      const values = [];
      let current = '';
      let inQuotes = false;

      for (const char of lines[i]) {
        if (char === '"') { inQuotes = !inQuotes; }
        else if (char === ',' && !inQuotes) { values.push(current.trim()); current = ''; }
        else { current += char; }
      }
      values.push(current.trim());

      const row = {};
      csvHeaders.forEach((h, j) => { row[h] = values[j] || ''; });
      rows.push(row);
    }
    return rows;
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      setCsvText(text);
      const parsed = parseCSV(text);
      setParsedData(parsed);
      setStep(3);
    };
    reader.readAsText(file);
  };

  const handleTextParse = () => {
    const parsed = parseCSV(csvText);
    setParsedData(parsed);
    setStep(3);
  };

  const handleImport = async () => {
    if (parsedData.length === 0) return;
    setImporting(true);
    setResult(null);
    try {
      const res = await fetch(`${API}/import/${selectedModule}`, {
        method: 'POST', headers,
        body: JSON.stringify({ csvData: parsedData })
      });
      const data = await res.json();
      setResult(data);
      setStep(4);
    } catch (err) {
      setResult({ error: err.message });
    }
    setImporting(false);
  };

  const resetImport = () => {
    setSelectedModule('');
    setColumns([]);
    setCsvText('');
    setParsedData([]);
    setResult(null);
    setStep(1);
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Data Import</h2>
          <p>Import data from CSV files into any module</p>
        </div>
        {step > 1 && (
          <button className="btn-secondary" onClick={resetImport}>Start Over</button>
        )}
      </div>

      {/* Steps indicator */}
      <div style={{
        display: 'flex', gap: '8px', marginBottom: '32px', alignItems: 'center'
      }}>
        {['Select Module', 'Upload Data', 'Preview', 'Complete'].map((label, i) => (
          <React.Fragment key={i}>
            {i > 0 && <div style={{ width: '40px', height: '2px', background: step > i ? '#6366f1' : 'rgba(99,102,241,0.2)' }}></div>}
            <div style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '8px 16px', borderRadius: '10px',
              background: step === i + 1 ? 'rgba(99,102,241,0.2)' : step > i + 1 ? 'rgba(16,185,129,0.1)' : 'rgba(30,41,59,0.6)',
              border: `1px solid ${step === i + 1 ? 'rgba(99,102,241,0.3)' : 'transparent'}`,
              color: step >= i + 1 ? '#f1f5f9' : '#64748b',
              fontSize: '13px', fontWeight: 500
            }}>
              <span style={{
                width: '22px', height: '22px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: step > i + 1 ? '#10b981' : step === i + 1 ? '#6366f1' : 'rgba(100,116,139,0.3)',
                fontSize: '11px', fontWeight: 700, color: 'white'
              }}>
                {step > i + 1 ? '✓' : i + 1}
              </span>
              {label}
            </div>
          </React.Fragment>
        ))}
      </div>

      {/* Step 1: Select Module */}
      {step === 1 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '12px' }}>
          {modules.map(mod => (
            <button key={mod.key} onClick={() => handleModuleSelect(mod.key)}
              style={{
                padding: '20px', background: 'rgba(30,41,59,0.6)', border: '1px solid rgba(99,102,241,0.1)',
                borderRadius: '12px', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s',
                color: '#f1f5f9', fontSize: '15px', fontWeight: 600
              }}
              onMouseOver={e => e.currentTarget.style.borderColor = 'rgba(99,102,241,0.3)'}
              onMouseOut={e => e.currentTarget.style.borderColor = 'rgba(99,102,241,0.1)'}
            >
              {mod.label}
            </button>
          ))}
        </div>
      )}

      {/* Step 2: Upload */}
      {step === 2 && (
        <div style={{
          background: 'rgba(30,41,59,0.6)', border: '1px solid rgba(99,102,241,0.1)',
          borderRadius: '16px', padding: '32px'
        }}>
          <h3 style={{ fontSize: '18px', color: '#f1f5f9', marginBottom: '8px' }}>
            Import to: {modules.find(m => m.key === selectedModule)?.label}
          </h3>

          {columns.length > 0 && (
            <div style={{ marginBottom: '24px' }}>
              <p style={{ color: '#94a3b8', fontSize: '13px', marginBottom: '12px' }}>Expected columns:</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {columns.map(col => (
                  <span key={col.column_name} style={{
                    padding: '4px 12px', background: 'rgba(99,102,241,0.1)', borderRadius: '6px',
                    fontSize: '12px', color: '#a5b4fc', fontFamily: 'monospace'
                  }}>
                    {col.column_name}
                    {col.is_nullable === 'NO' && <span style={{ color: '#f87171', marginLeft: '2px' }}>*</span>}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'inline-block', padding: '14px 28px',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              borderRadius: '12px', color: 'white', fontWeight: 600, fontSize: '14px',
              cursor: 'pointer', transition: 'all 0.2s'
            }}>
              Choose CSV File
              <input type="file" accept=".csv" onChange={handleFileUpload} style={{ display: 'none' }} />
            </label>
          </div>

          <div style={{ position: 'relative' }}>
            <p style={{ color: '#94a3b8', fontSize: '13px', marginBottom: '8px' }}>Or paste CSV data directly:</p>
            <textarea
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              rows="8"
              placeholder="column1,column2,column3&#10;value1,value2,value3&#10;..."
              style={{
                width: '100%', padding: '14px', background: 'rgba(15,23,42,0.6)',
                border: '1px solid rgba(99,102,241,0.2)', borderRadius: '10px',
                color: '#e2e8f0', fontSize: '13px', fontFamily: 'monospace',
                resize: 'vertical'
              }}
            />
            {csvText && (
              <button className="btn-primary" onClick={handleTextParse} style={{ marginTop: '12px' }}>
                Parse & Preview
              </button>
            )}
          </div>
        </div>
      )}

      {/* Step 3: Preview */}
      {step === 3 && parsedData.length > 0 && (
        <div>
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            marginBottom: '16px'
          }}>
            <div>
              <h3 style={{ fontSize: '18px', color: '#f1f5f9' }}>Preview Import Data</h3>
              <p style={{ color: '#94a3b8', fontSize: '13px' }}>
                {parsedData.length} rows ready to import into {modules.find(m => m.key === selectedModule)?.label}
              </p>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button className="btn-secondary" onClick={() => setStep(2)}>Back</button>
              <button className="btn-primary" onClick={handleImport} disabled={importing}>
                {importing ? 'Importing...' : `Import ${parsedData.length} Rows`}
              </button>
            </div>
          </div>

          <div className="data-table-container" style={{ overflowX: 'auto' }}>
            <table className="data-table" style={{ fontSize: '12px' }}>
              <thead>
                <tr>
                  <th>#</th>
                  {Object.keys(parsedData[0]).map(k => <th key={k}>{k}</th>)}
                </tr>
              </thead>
              <tbody>
                {parsedData.slice(0, 20).map((row, i) => (
                  <tr key={i} style={{ cursor: 'default' }}>
                    <td style={{ color: '#64748b' }}>{i + 1}</td>
                    {Object.values(row).map((v, j) => (
                      <td key={j}>{v || '--'}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {parsedData.length > 20 && (
              <p style={{ padding: '12px 16px', color: '#64748b', fontSize: '12px' }}>
                Showing 20 of {parsedData.length} rows
              </p>
            )}
          </div>
        </div>
      )}

      {/* Step 4: Results */}
      {step === 4 && result && (
        <div style={{
          background: 'rgba(30,41,59,0.6)', border: '1px solid rgba(99,102,241,0.1)',
          borderRadius: '16px', padding: '32px', textAlign: 'center'
        }}>
          {result.error ? (
            <>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>!</div>
              <h3 style={{ color: '#f87171', marginBottom: '8px' }}>Import Failed</h3>
              <p style={{ color: '#94a3b8' }}>{result.error}</p>
            </>
          ) : (
            <>
              <div style={{ fontSize: '48px', marginBottom: '16px', color: '#10b981' }}>
                {result.imported === result.total ? '✓' : '!'}
              </div>
              <h3 style={{ color: result.failed === 0 ? '#34d399' : '#fbbf24', marginBottom: '8px' }}>
                Import {result.failed === 0 ? 'Complete' : 'Finished with Errors'}
              </h3>

              <div style={{ display: 'flex', justifyContent: 'center', gap: '32px', margin: '24px 0' }}>
                <div>
                  <div style={{ fontSize: '32px', fontWeight: 700, color: '#34d399' }}>{result.imported}</div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>Imported</div>
                </div>
                <div>
                  <div style={{ fontSize: '32px', fontWeight: 700, color: result.failed > 0 ? '#f87171' : '#94a3b8' }}>{result.failed}</div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>Failed</div>
                </div>
                <div>
                  <div style={{ fontSize: '32px', fontWeight: 700, color: '#a5b4fc' }}>{result.total}</div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>Total</div>
                </div>
              </div>

              {result.errors && result.errors.length > 0 && (
                <div style={{ textAlign: 'left', marginTop: '24px' }}>
                  <h4 style={{ color: '#f87171', fontSize: '14px', marginBottom: '8px' }}>Errors:</h4>
                  {result.errors.map((err, i) => (
                    <div key={i} style={{ padding: '8px 12px', background: 'rgba(239,68,68,0.1)', borderRadius: '6px', marginBottom: '4px', fontSize: '13px', color: '#f87171' }}>
                      Row {err.row}: {err.error}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          <div style={{ marginTop: '24px' }}>
            <button className="btn-primary" onClick={resetImport}>Import More Data</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default DataImport;
