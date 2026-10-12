import React from 'react';
import FormattedAIReport from './FormattedAIReport';

function AIAnalysisPanel({ analysis, loading, onClose }) {
  if (!loading && !analysis) return null;

  return (
    <div className="ai-panel">
      <div className="ai-panel-header">
        <span className="ai-badge">AI INSIGHT</span>
        <h3>AI-Powered Analysis</h3>
        {onClose && (
          <button onClick={onClose} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '18px' }}>
            &times;
          </button>
        )}
      </div>
      <div className="ai-panel-body">
        <FormattedAIReport response={analysis} loading={loading} title="AI-powered analysis" />
      </div>
    </div>
  );
}

export default AIAnalysisPanel;
