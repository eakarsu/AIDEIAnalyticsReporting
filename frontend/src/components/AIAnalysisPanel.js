import React from 'react';
import ReactMarkdown from 'react-markdown';

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
        {loading ? (
          <div className="ai-loading">
            <div className="ai-spinner"></div>
            <span>Analyzing data with AI...</span>
          </div>
        ) : (
          <div className="ai-content">
            <ReactMarkdown>{analysis}</ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}

export default AIAnalysisPanel;
