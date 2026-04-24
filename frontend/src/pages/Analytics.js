import React, { useState, useEffect } from 'react';

const API = 'http://localhost:3001/api';

function Analytics({ token }) {
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const headers = { Authorization: `Bearer ${token}` };
    const endpoints = [
      { key: 'diversity', url: '/diversity-metrics' },
      { key: 'payEquity', url: '/pay-equity' },
      { key: 'hiringBias', url: '/hiring-bias' },
      { key: 'retention', url: '/retention-analysis' },
      { key: 'training', url: '/training-programs' },
      { key: 'incidents', url: '/incident-reports' },
      { key: 'surveys', url: '/employee-surveys' },
      { key: 'ergs', url: '/erg-management' }
    ];

    Promise.all(
      endpoints.map(ep =>
        fetch(`${API}${ep.url}`, { headers })
          .then(r => r.json())
          .then(d => ({ key: ep.key, data: Array.isArray(d) ? d : [] }))
          .catch(() => ({ key: ep.key, data: [] }))
      )
    ).then(results => {
      const d = {};
      results.forEach(r => d[r.key] = r.data);
      setData(d);
      setLoading(false);
    });
  }, [token]);

  // Bar chart component (pure CSS)
  const BarChart = ({ title, items, color, maxVal }) => {
    const max = maxVal || Math.max(...items.map(i => i.value), 1);
    return (
      <div style={{
        background: 'rgba(30,41,59,0.6)', border: '1px solid rgba(99,102,241,0.1)',
        borderRadius: '16px', padding: '24px'
      }}>
        <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#f1f5f9', marginBottom: '20px' }}>{title}</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {items.map((item, i) => (
            <div key={i}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ fontSize: '13px', color: '#94a3b8' }}>{item.label}</span>
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#f1f5f9' }}>{item.display || item.value}</span>
              </div>
              <div style={{ background: 'rgba(15,23,42,0.6)', borderRadius: '6px', height: '24px', overflow: 'hidden' }}>
                <div style={{
                  height: '100%', borderRadius: '6px', width: `${Math.min((item.value / max) * 100, 100)}%`,
                  background: `linear-gradient(90deg, ${color}, ${color}88)`,
                  transition: 'width 1s ease'
                }}></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Donut chart (SVG)
  const DonutChart = ({ title, segments, total }) => {
    let offset = 0;
    const radius = 60;
    const circumference = 2 * Math.PI * radius;

    return (
      <div style={{
        background: 'rgba(30,41,59,0.6)', border: '1px solid rgba(99,102,241,0.1)',
        borderRadius: '16px', padding: '24px'
      }}>
        <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#f1f5f9', marginBottom: '20px' }}>{title}</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <svg width="160" height="160" viewBox="0 0 160 160">
            {segments.map((seg, i) => {
              const pct = total > 0 ? seg.value / total : 0;
              const dashArray = pct * circumference;
              const dashOffset = -offset * circumference;
              offset += pct;
              return (
                <circle key={i} cx="80" cy="80" r={radius}
                  fill="none" stroke={seg.color} strokeWidth="20"
                  strokeDasharray={`${dashArray} ${circumference - dashArray}`}
                  strokeDashoffset={dashOffset}
                  transform="rotate(-90 80 80)"
                />
              );
            })}
            <text x="80" y="75" textAnchor="middle" fill="#f1f5f9" fontSize="24" fontWeight="700">{total}</text>
            <text x="80" y="95" textAnchor="middle" fill="#64748b" fontSize="11">TOTAL</text>
          </svg>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {segments.map((seg, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '3px', background: seg.color }}></div>
                <span style={{ fontSize: '13px', color: '#94a3b8' }}>{seg.label}</span>
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#f1f5f9', marginLeft: 'auto' }}>{seg.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Metric card
  const MetricCard = ({ label, value, subtext, color, trend }) => (
    <div style={{
      background: 'rgba(30,41,59,0.6)', border: '1px solid rgba(99,102,241,0.1)',
      borderRadius: '16px', padding: '24px', textAlign: 'center'
    }}>
      <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>{label}</div>
      <div style={{ fontSize: '36px', fontWeight: 800, color: color || '#a5b4fc', lineHeight: 1.2 }}>{value}</div>
      {subtext && <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>{subtext}</div>}
      {trend && <div style={{ fontSize: '12px', color: trend > 0 ? '#34d399' : '#f87171', marginTop: '4px' }}>{trend > 0 ? '+' : ''}{trend}%</div>}
    </div>
  );

  if (loading) {
    return (
      <div>
        <div className="page-header"><div><h2>Visual Analytics</h2><p>Loading data...</p></div></div>
        <div style={{ textAlign: 'center', padding: '60px' }}>
          <div className="ai-spinner" style={{ margin: '0 auto', borderTopColor: '#6366f1', borderColor: 'rgba(99,102,241,0.2)' }}></div>
        </div>
      </div>
    );
  }

  // Compute chart data
  const diversityByDept = {};
  (data.diversity || []).forEach(d => {
    diversityByDept[d.department] = (diversityByDept[d.department] || 0) + 1;
  });
  const deptBars = Object.entries(diversityByDept).slice(0, 8).map(([dept, count]) => ({ label: dept, value: count }));

  const payGapByGroup = {};
  (data.payEquity || []).forEach(d => {
    const g = d.demographic_group;
    if (!payGapByGroup[g]) payGapByGroup[g] = [];
    payGapByGroup[g].push(parseFloat(d.pay_gap_percentage) || 0);
  });
  const payGapBars = Object.entries(payGapByGroup).slice(0, 8).map(([group, gaps]) => ({
    label: group,
    value: Math.abs(gaps.reduce((a, b) => a + b, 0) / gaps.length),
    display: (gaps.reduce((a, b) => a + b, 0) / gaps.length).toFixed(1) + '%'
  }));

  const turnoverByDept = {};
  (data.retention || []).forEach(d => {
    if (!turnoverByDept[d.department]) turnoverByDept[d.department] = [];
    turnoverByDept[d.department].push(parseFloat(d.turnover_rate) || 0);
  });
  const turnoverBars = Object.entries(turnoverByDept).slice(0, 8).map(([dept, rates]) => ({
    label: dept,
    value: rates.reduce((a, b) => a + b, 0) / rates.length,
    display: (rates.reduce((a, b) => a + b, 0) / rates.length).toFixed(1) + '%'
  }));

  const incidentBySeverity = {};
  (data.incidents || []).forEach(d => {
    incidentBySeverity[d.severity] = (incidentBySeverity[d.severity] || 0) + 1;
  });
  const severityColors = { critical: '#ef4444', high: '#f97316', medium: '#f59e0b', low: '#22c55e' };
  const incidentSegments = Object.entries(incidentBySeverity).map(([sev, count]) => ({
    label: sev, value: count, color: severityColors[sev] || '#94a3b8'
  }));

  const trainingByType = {};
  (data.training || []).forEach(d => {
    trainingByType[d.training_type] = (trainingByType[d.training_type] || 0) + 1;
  });
  const trainingColors = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#06b6d4', '#a855f7'];
  const trainingSegments = Object.entries(trainingByType).map(([type, count], i) => ({
    label: type, value: count, color: trainingColors[i % trainingColors.length]
  }));

  const avgCompletionRate = (data.training || []).length > 0
    ? ((data.training || []).reduce((s, d) => s + (parseFloat(d.completion_rate) || 0), 0) / data.training.length).toFixed(1)
    : '0';

  const avgSurveyScore = (data.surveys || []).length > 0
    ? ((data.surveys || []).reduce((s, d) => s + (parseFloat(d.score) || 0), 0) / data.surveys.length).toFixed(1)
    : '0';

  const totalERGMembers = (data.ergs || []).reduce((s, d) => s + (parseInt(d.membership_count) || 0), 0);

  const overallPayGap = (data.payEquity || []).length > 0
    ? ((data.payEquity || []).reduce((s, d) => s + (parseFloat(d.pay_gap_percentage) || 0), 0) / data.payEquity.length).toFixed(1)
    : '0';

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Visual Analytics</h2>
          <p>Interactive charts and visualizations across all DEI data</p>
        </div>
      </div>

      {/* Key Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        <MetricCard label="Diversity Records" value={data.diversity?.length || 0} color="#6366f1" />
        <MetricCard label="Avg Pay Gap" value={`${overallPayGap}%`} color={parseFloat(overallPayGap) > 5 ? '#ef4444' : '#10b981'} />
        <MetricCard label="Training Completion" value={`${avgCompletionRate}%`} color="#14b8a6" />
        <MetricCard label="Avg Survey Score" value={avgSurveyScore} subtext="out of 5.0" color="#ec4899" />
        <MetricCard label="Open Incidents" value={(data.incidents || []).filter(i => i.status !== 'resolved' && i.status !== 'closed').length} color="#ef4444" />
        <MetricCard label="ERG Members" value={totalERGMembers} color="#3b82f6" />
      </div>

      {/* Charts Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px', marginBottom: '32px' }}>
        {deptBars.length > 0 && (
          <BarChart title="Diversity Metrics by Department" items={deptBars} color="#6366f1" />
        )}
        {payGapBars.length > 0 && (
          <BarChart title="Average Pay Gap by Group" items={payGapBars} color="#ef4444" maxVal={Math.max(...payGapBars.map(b => b.value), 20)} />
        )}
        {turnoverBars.length > 0 && (
          <BarChart title="Avg Turnover Rate by Department" items={turnoverBars} color="#f97316" maxVal={Math.max(...turnoverBars.map(b => b.value), 30)} />
        )}

        {incidentSegments.length > 0 && (
          <DonutChart title="Incidents by Severity" segments={incidentSegments} total={data.incidents?.length || 0} />
        )}
        {trainingSegments.length > 0 && (
          <DonutChart title="Training Programs by Type" segments={trainingSegments} total={data.training?.length || 0} />
        )}

        {/* Hiring funnel */}
        {(data.hiringBias || []).length > 0 && (
          <div style={{
            background: 'rgba(30,41,59,0.6)', border: '1px solid rgba(99,102,241,0.1)',
            borderRadius: '16px', padding: '24px'
          }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#f1f5f9', marginBottom: '20px' }}>Hiring Funnel Overview</h3>
            {(() => {
              const totals = (data.hiringBias || []).reduce((acc, d) => ({
                applicants: acc.applicants + (parseInt(d.applicants_in_group) || 0),
                interviewed: acc.interviewed + (parseInt(d.interviewed) || 0),
                offered: acc.offered + (parseInt(d.offered) || 0),
                hired: acc.hired + (parseInt(d.hired) || 0)
              }), { applicants: 0, interviewed: 0, offered: 0, hired: 0 });

              const stages = [
                { label: 'Applied', value: totals.applicants, color: '#6366f1' },
                { label: 'Interviewed', value: totals.interviewed, color: '#8b5cf6' },
                { label: 'Offered', value: totals.offered, color: '#a855f7' },
                { label: 'Hired', value: totals.hired, color: '#10b981' }
              ];
              const max = Math.max(...stages.map(s => s.value), 1);

              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {stages.map((stage, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div style={{ width: '100px', fontSize: '13px', color: '#94a3b8', textAlign: 'right' }}>{stage.label}</div>
                      <div style={{ flex: 1, position: 'relative' }}>
                        <div style={{
                          height: '36px', borderRadius: '8px',
                          background: 'rgba(15,23,42,0.6)', overflow: 'hidden'
                        }}>
                          <div style={{
                            height: '100%', borderRadius: '8px',
                            width: `${(stage.value / max) * 100}%`,
                            background: `linear-gradient(90deg, ${stage.color}, ${stage.color}88)`,
                            display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: '10px',
                            transition: 'width 1s ease'
                          }}>
                            <span style={{ fontSize: '13px', fontWeight: 700, color: 'white' }}>{stage.value}</span>
                          </div>
                        </div>
                      </div>
                      {i > 0 && (
                        <div style={{ width: '50px', fontSize: '12px', color: '#64748b' }}>
                          {max > 0 ? ((stage.value / stages[i - 1].value) * 100).toFixed(0) : 0}%
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        )}
      </div>

      {/* Survey Scores by Department */}
      {(data.surveys || []).length > 0 && (() => {
        const surveyByDept = {};
        data.surveys.forEach(s => {
          if (!surveyByDept[s.department]) surveyByDept[s.department] = [];
          surveyByDept[s.department].push(parseFloat(s.score) || 0);
        });
        const surveyBars = Object.entries(surveyByDept).slice(0, 8).map(([dept, scores]) => ({
          label: dept,
          value: scores.reduce((a, b) => a + b, 0) / scores.length,
          display: (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1)
        }));
        return (
          <div style={{ marginBottom: '32px' }}>
            <BarChart title="Average Survey Score by Department" items={surveyBars} color="#ec4899" maxVal={5} />
          </div>
        );
      })()}
    </div>
  );
}

export default Analytics;
