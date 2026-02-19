// src/components/AIDashboard.tsx
import React from 'react';
import { AIPromptMetric } from '../types';

interface Props {
  metrics: AIPromptMetric[];
}

const AIDashboard: React.FC<Props> = ({ metrics }) => {
  const successRate = metrics.length > 0
    ? (metrics.filter(m => m.success).length / metrics.length * 100).toFixed(1)
    : 0;

  const avgTokens = metrics.length > 0
    ? Math.round(metrics.reduce((acc, m) => acc + m.tokensUsed, 0) / metrics.length)
    : 0;

  return (
    <div>
      <h2 style={styles.sectionTitle}>🤖 AI Integration Dashboard</h2>
      
      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <span style={styles.statValue}>{metrics.length}</span>
          <span style={styles.statLabel}>Total AI Calls</span>
        </div>
        <div style={styles.statCard}>
          <span style={styles.statValue}>{successRate}%</span>
          <span style={styles.statLabel}>Success Rate</span>
        </div>
        <div style={styles.statCard}>
          <span style={styles.statValue}>{avgTokens}</span>
          <span style={styles.statLabel}>Avg Tokens</span>
        </div>
      </div>

      <div style={styles.promptList}>
        <h3>Recent AI Prompts</h3>
        {metrics.slice(0, 10).map(metric => (
          <div key={metric.id} style={styles.promptCard}>
            <div style={styles.promptHeader}>
              <span style={styles.promptType}>{metric.promptType}</span>
              <span style={{
                ...styles.promptStatus,
                backgroundColor: metric.success ? '#d4edda' : '#f8d7da',
                color: metric.success ? '#155724' : '#721c24'
              }}>
                {metric.success ? '✅ Success' : '❌ Failed'}
              </span>
            </div>
            <div style={styles.promptMetrics}>
              <span>⏱️ {metric.responseTime}ms</span>
              <span>📊 {metric.tokensUsed} tokens</span>
              {metric.errorType && <span style={styles.errorType}>⚠️ {metric.errorType}</span>}
            </div>
            <small style={styles.promptTime}>
              {new Date(metric.timestamp).toLocaleString()}
            </small>
          </div>
        ))}
      </div>
    </div>
  );
};

const styles = {
  sectionTitle: {
    fontSize: '22px',
    margin: '0 0 20px 0',
    color: '#333'
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '15px',
    marginBottom: '30px'
  },
  statCard: {
    padding: '20px',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    textAlign: 'center' as const,
    border: '1px solid #e9ecef'
  },
  statValue: {
    display: 'block',
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#FF8C42',
    marginBottom: '5px'
  },
  statLabel: {
    fontSize: '13px',
    color: '#6c757d'
  },
  promptList: {
    marginTop: '20px'
  },
  promptCard: {
    padding: '15px',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    marginBottom: '10px',
    border: '1px solid #e9ecef'
  },
  promptHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px'
  },
  promptType: {
    fontSize: '15px',
    fontWeight: '500',
    color: '#333'
  },
  promptStatus: {
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '12px'
  },
  promptMetrics: {
    display: 'flex',
    gap: '20px',
    marginBottom: '8px',
    fontSize: '13px',
    color: '#666'
  },
  errorType: {
    color: '#dc3545'
  },
  promptTime: {
    color: '#999',
    fontSize: '12px'
  }
};

export default AIDashboard;