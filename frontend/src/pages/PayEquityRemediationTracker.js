import React, { useEffect, useState } from 'react';

export default function PayEquityRemediationTracker() {
  const [data, setData] = useState(null);
  useEffect(() => {
    fetch('http://localhost:3001/api/pay-equity-remediation-tracker').then((res) => res.json()).then(setData).catch(() => setData(null));
  }, []);
  return (
    <div className="page">
      <h1>Pay Equity Remediation Tracker</h1>
      <p>Convert pay-equity findings into budgeted remediation plans and closure tracking.</p>
      <div className="stats-grid">
        {data && Object.entries(data.summary).map(([key, value]) => <div className="stat-card" key={key}><span>{key.replaceAll('_', ' ')}</span><strong>{value}</strong></div>)}
      </div>
      <div className="card">
        {(data?.plans || []).map((item) => <div key={item.cohort} style={{ padding: 12, borderBottom: '1px solid #e5e7eb' }}><strong>{item.cohort}</strong><div>{item.gap} gap - {item.owner} - {item.action} - {item.status}</div></div>)}
      </div>
    </div>
  );
}
