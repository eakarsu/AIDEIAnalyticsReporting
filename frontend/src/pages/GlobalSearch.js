import React, { useState } from 'react';

const API = 'http://localhost:3001/api';

const moduleColors = {
  'Diversity Metrics': '#6366f1',
  'Pay Equity': '#10b981',
  'Hiring Bias': '#f59e0b',
  'Promotion Bias': '#ef4444',
  'Compliance Reports': '#8b5cf6',
  'Employee Surveys': '#ec4899',
  'Training Programs': '#14b8a6',
  'Retention Analysis': '#f97316',
  'Incident Reports': '#dc2626',
  'ERG Management': '#3b82f6'
};

function GlobalSearch({ token }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e) => {
    e && e.preventDefault();
    if (!query.trim() || query.trim().length < 2) return;

    setLoading(true);
    setSearched(true);
    try {
      const res = await fetch(`${API}/search?q=${encodeURIComponent(query)}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      setResults(json);
    } catch (err) {
      console.error('Search failed:', err);
      setResults({ results: [], total: 0 });
    }
    setLoading(false);
  };

  const groupedResults = results?.results?.reduce((acc, r) => {
    if (!acc[r.module]) acc[r.module] = [];
    acc[r.module].push(r);
    return acc;
  }, {}) || {};

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Global Search</h2>
          <p>Search across all DEI modules and data</p>
        </div>
      </div>

      <div style={{ marginBottom: '32px' }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '12px', maxWidth: '600px' }}>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search departments, groups, titles, incidents..."
            style={{
              flex: 1,
              padding: '14px 20px',
              background: 'rgba(15, 23, 42, 0.6)',
              border: '1px solid rgba(99, 102, 241, 0.2)',
              borderRadius: '12px',
              color: '#e2e8f0',
              fontSize: '15px'
            }}
          />
          <button type="submit" className="btn-primary" disabled={loading || query.trim().length < 2}>
            {loading ? 'Searching...' : 'Search'}
          </button>
        </form>
      </div>

      {loading && (
        <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
          <div className="ai-spinner" style={{ margin: '0 auto 12px', borderTopColor: '#6366f1', borderColor: 'rgba(99,102,241,0.2)' }}></div>
          Searching all modules...
        </div>
      )}

      {searched && !loading && results && (
        <div>
          <div style={{ marginBottom: '20px', color: '#94a3b8', fontSize: '14px' }}>
            Found <strong style={{ color: '#f1f5f9' }}>{results.total}</strong> results for "<strong style={{ color: '#a5b4fc' }}>{results.query}</strong>"
          </div>

          {results.total === 0 ? (
            <div className="data-table-container" style={{ padding: '40px', textAlign: 'center' }}>
              <h3 style={{ color: '#94a3b8', marginBottom: '8px' }}>No results found</h3>
              <p style={{ color: '#64748b' }}>Try a different search term or check your spelling</p>
            </div>
          ) : (
            Object.entries(groupedResults).map(([module, items]) => (
              <div key={module} style={{ marginBottom: '24px' }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px'
                }}>
                  <div style={{
                    width: '8px', height: '8px', borderRadius: '50%',
                    background: moduleColors[module] || '#6366f1'
                  }}></div>
                  <h3 style={{ fontSize: '16px', color: '#f1f5f9', fontWeight: 600 }}>
                    {module}
                  </h3>
                  <span className="badge-info" style={{ fontSize: '11px' }}>{items.length}</span>
                </div>

                <div className="data-table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Title</th>
                        <th>Category</th>
                        <th>Department</th>
                        <th>Detail</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item, idx) => (
                        <tr key={idx}>
                          <td style={{ fontWeight: 600, color: '#f1f5f9' }}>{item.title}</td>
                          <td>{item.subtitle}</td>
                          <td>{item.department}</td>
                          <td><span className="badge-info">{item.detail}</span></td>
                          <td>
                            <button
                              className="btn-edit"
                              onClick={() => window.location.href = item.path}
                              style={{ padding: '4px 12px', fontSize: '12px' }}
                            >
                              View Module
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {!searched && (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <svg width="64" height="64" fill="none" stroke="#64748b" strokeWidth="1.5" viewBox="0 0 24 24" style={{ marginBottom: '16px' }}>
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <h3 style={{ color: '#94a3b8', marginBottom: '8px' }}>Search across all DEI data</h3>
          <p style={{ color: '#64748b' }}>Find records by department, demographic group, title, or any keyword</p>
        </div>
      )}
    </div>
  );
}

export default GlobalSearch;
