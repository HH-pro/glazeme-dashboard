// src/components/AIDashboard.tsx
import React, { useState } from 'react';
import { AIPromptMetric } from '../types';

interface Props {
  metrics: AIPromptMetric[];
  isEditMode?: boolean;
  onAddMetric?: () => void;
}

const AIDashboard: React.FC<Props> = ({ metrics, isEditMode = false, onAddMetric }) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newMetric, setNewMetric] = useState({
    promptType: '',
    responseTime: 0,
    tokensUsed: 0,
    success: true,
    errorType: ''
  });

  const successRate = metrics.length > 0
    ? (metrics.filter(m => m.success).length / metrics.length * 100).toFixed(1)
    : 0;

  const avgTokens = metrics.length > 0
    ? Math.round(metrics.reduce((acc, m) => acc + m.tokensUsed, 0) / metrics.length)
    : 0;

  const avgResponseTime = metrics.length > 0
    ? Math.round(metrics.reduce((acc, m) => acc + m.responseTime, 0) / metrics.length)
    : 0;

  const handleAddClick = () => {
    if (!isEditMode && onAddMetric) {
      onAddMetric();
      return;
    }
    setShowAddForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Here you would typically call an API to add the metric
    console.log('New metric:', newMetric);
    setShowAddForm(false);
    setNewMetric({
      promptType: '',
      responseTime: 0,
      tokensUsed: 0,
      success: true,
      errorType: ''
    });
  };

  return (
    <div>
      <div style={styles.header}>
        <h2 style={styles.sectionTitle}>🤖 AI Integration Dashboard</h2>
        {isEditMode && (
          <button 
            onClick={handleAddClick}
            style={styles.addButton}
          >
            + Add AI Metric
          </button>
        )}
      </div>

      {isEditMode && showAddForm && (
        <form onSubmit={handleSubmit} style={styles.form}>
          <input
            type="text"
            placeholder="Prompt Type (e.g., compliment-generation)"
            value={newMetric.promptType}
            onChange={(e) => setNewMetric({...newMetric, promptType: e.target.value})}
            style={styles.input}
            required
          />
          <input
            type="number"
            placeholder="Response Time (ms)"
            value={newMetric.responseTime}
            onChange={(e) => setNewMetric({...newMetric, responseTime: parseInt(e.target.value)})}
            style={styles.input}
            required
          />
          <input
            type="number"
            placeholder="Tokens Used"
            value={newMetric.tokensUsed}
            onChange={(e) => setNewMetric({...newMetric, tokensUsed: parseInt(e.target.value)})}
            style={styles.input}
            required
          />
          <select
            value={newMetric.success.toString()}
            onChange={(e) => setNewMetric({...newMetric, success: e.target.value === 'true'})}
            style={styles.select}
          >
            <option value="true">Success</option>
            <option value="false">Failed</option>
          </select>
          {!newMetric.success && (
            <input
              type="text"
              placeholder="Error Type"
              value={newMetric.errorType}
              onChange={(e) => setNewMetric({...newMetric, errorType: e.target.value})}
              style={styles.input}
            />
          )}
          <div style={styles.formButtons}>
            <button type="button" onClick={() => setShowAddForm(false)} style={styles.cancelButton}>
              Cancel
            </button>
            <button type="submit" style={styles.submitButton}>
              Add Metric
            </button>
          </div>
        </form>
      )}

      {/* Edit Mode Indicator */}
      {isEditMode && !showAddForm && (
        <div style={styles.editModeIndicator}>
          ✏️ Edit Mode Active - You can add new metrics
        </div>
      )}
      
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
        <div style={styles.statCard}>
          <span style={styles.statValue}>{avgResponseTime}ms</span>
          <span style={styles.statLabel}>Avg Response</span>
        </div>
      </div>

      <div style={styles.promptList}>
        <h3 style={styles.subTitle}>Recent AI Prompts</h3>
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
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px'
  },
  sectionTitle: {
    fontSize: '24px',
    margin: 0,
    color: '#333'
  },
  addButton: {
    padding: '8px 16px',
    backgroundColor: '#FF8C42',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    transition: 'background-color 0.2s'
  },
  editModeIndicator: {
    backgroundColor: '#fff3cd',
    color: '#856404',
    padding: '8px 12px',
    borderRadius: '6px',
    marginBottom: '20px',
    fontSize: '14px',
    fontWeight: '500'
  },
  form: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '10px',
    padding: '20px',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    marginBottom: '20px',
    border: '2px solid #FF8C42'
  },
  input: {
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px',
    outline: 'none',
    transition: 'border-color 0.2s'
  },
  select: {
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px',
    outline: 'none'
  },
  formButtons: {
    display: 'flex',
    gap: '10px',
    justifyContent: 'flex-end',
    marginTop: '10px'
  },
  submitButton: {
    padding: '10px 20px',
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px'
  },
  cancelButton: {
    padding: '10px 20px',
    backgroundColor: '#6c757d',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px'
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
  subTitle: {
    fontSize: '18px',
    margin: '0 0 15px 0',
    color: '#333'
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