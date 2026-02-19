// src/components/CodeMetrics.tsx
import React from 'react';
import { CodeCommit } from '../types';

interface Props {
  commits: CodeCommit[];
}

const CodeMetrics: React.FC<Props> = ({ commits }) => {
  const totalAdditions = commits.reduce((acc, c) => acc + c.additions, 0);
  const totalDeletions = commits.reduce((acc, c) => acc + c.deletions, 0);
  const filesChanged = new Set(commits.flatMap(c => c.files)).size;

  return (
    <div>
      <h2 style={styles.sectionTitle}>💻 Code Development Metrics</h2>
      
      <div style={styles.metricsGrid}>
        <div style={styles.metricCard}>
          <span style={styles.metricValue}>{commits.length}</span>
          <span style={styles.metricLabel}>Total Commits</span>
        </div>
        <div style={styles.metricCard}>
          <span style={styles.metricValue}>+{totalAdditions}</span>
          <span style={styles.metricLabel}>Lines Added</span>
        </div>
        <div style={styles.metricCard}>
          <span style={styles.metricValue}>-{totalDeletions}</span>
          <span style={styles.metricLabel}>Lines Removed</span>
        </div>
        <div style={styles.metricCard}>
          <span style={styles.metricValue}>{filesChanged}</span>
          <span style={styles.metricLabel}>Files Modified</span>
        </div>
      </div>

      <div style={styles.commitList}>
        <h3>Recent Commits</h3>
        {commits.slice(0, 10).map(commit => (
          <div key={commit.id} style={styles.commitCard}>
            <div style={styles.commitHeader}>
              <span style={styles.commitMessage}>{commit.message}</span>
              <span style={styles.commitBranch}>{commit.branch}</span>
            </div>
            <div style={styles.commitStats}>
              <span style={styles.commitAuthor}>👤 {commit.author}</span>
              <span style={styles.commitFiles}>📁 {commit.files.length} files</span>
              <span style={styles.commitAdd}>+{commit.additions}</span>
              <span style={styles.commitDel}>-{commit.deletions}</span>
            </div>
            <small style={styles.commitTime}>
              {new Date(commit.timestamp).toLocaleString()}
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
  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '15px',
    marginBottom: '30px'
  },
  metricCard: {
    padding: '20px',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    textAlign: 'center' as const,
    border: '1px solid #e9ecef'
  },
  metricValue: {
    display: 'block',
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#FF8C42',
    marginBottom: '5px'
  },
  metricLabel: {
    fontSize: '13px',
    color: '#6c757d'
  },
  commitList: {
    marginTop: '20px'
  },
  commitCard: {
    padding: '15px',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    marginBottom: '10px',
    border: '1px solid #e9ecef'
  },
  commitHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px'
  },
  commitMessage: {
    fontSize: '15px',
    fontWeight: '500',
    color: '#333'
  },
  commitBranch: {
    padding: '2px 8px',
    backgroundColor: '#e9ecef',
    borderRadius: '4px',
    fontSize: '12px'
  },
  commitStats: {
    display: 'flex',
    gap: '15px',
    marginBottom: '5px',
    fontSize: '13px'
  },
  commitAuthor: {
    color: '#495057'
  },
  commitFiles: {
    color: '#495057'
  },
  commitAdd: {
    color: '#28a745'
  },
  commitDel: {
    color: '#dc3545'
  },
  commitTime: {
    color: '#999',
    fontSize: '12px'
  }
};

export default CodeMetrics;