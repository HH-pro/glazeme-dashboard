// src/components/CodeMetrics.tsx
import React, { useState } from 'react';
import { CodeCommit } from '../types';

interface Props {
  commits: CodeCommit[];
  isEditMode?: boolean;
  onAddCommit?: () => void;
}

const CodeMetrics: React.FC<Props> = ({ commits, isEditMode = false, onAddCommit }) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedCommit, setSelectedCommit] = useState<CodeCommit | null>(null);
  const [newCommit, setNewCommit] = useState({
    message: '',
    author: '',
    branch: 'main',
    files: [] as string[],
    additions: 0,
    deletions: 0
  });

  const totalAdditions = commits.reduce((acc, c) => acc + c.additions, 0);
  const totalDeletions = commits.reduce((acc, c) => acc + c.deletions, 0);
  const filesChanged = new Set(commits.flatMap(c => c.files)).size;

  // Calculate average commit size
  const avgCommitSize = commits.length > 0 
    ? Math.round((totalAdditions + totalDeletions) / commits.length) 
    : 0;

  // Get top contributors
  const contributors = [...new Set(commits.map(c => c.author))];
  const topContributor = contributors.length > 0 ? contributors[0] : 'N/A';

  const handleAddClick = () => {
    if (!isEditMode && onAddCommit) {
      onAddCommit();
      return;
    }
    setShowAddForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Here you would typically call an API to add the commit
    console.log('New commit:', newCommit);
    setShowAddForm(false);
    setNewCommit({
      message: '',
      author: '',
      branch: 'main',
      files: [],
      additions: 0,
      deletions: 0
    });
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.value.split(',').map(f => f.trim()).filter(f => f);
    setNewCommit({...newCommit, files});
  };

  return (
    <div>
      <div style={styles.header}>
        <h2 style={styles.sectionTitle}>💻 Code Development Metrics</h2>
        {isEditMode && (
          <button 
            onClick={handleAddClick}
            style={styles.addButton}
          >
            + Add Commit
          </button>
        )}
      </div>

      {/* Edit Mode Indicator */}
      {isEditMode && !showAddForm && (
        <div style={styles.editModeIndicator}>
          ✏️ Edit Mode Active - You can add new commits
        </div>
      )}

      {/* Add Commit Form */}
      {isEditMode && showAddForm && (
        <form onSubmit={handleSubmit} style={styles.form}>
          <h4 style={styles.formTitle}>➕ Add New Commit</h4>
          
          <input
            type="text"
            placeholder="Commit Message"
            value={newCommit.message}
            onChange={(e) => setNewCommit({...newCommit, message: e.target.value})}
            style={styles.input}
            required
          />
          
          <input
            type="text"
            placeholder="Author"
            value={newCommit.author}
            onChange={(e) => setNewCommit({...newCommit, author: e.target.value})}
            style={styles.input}
            required
          />
          
          <select
            value={newCommit.branch}
            onChange={(e) => setNewCommit({...newCommit, branch: e.target.value})}
            style={styles.select}
          >
            <option value="main">main</option>
            <option value="develop">develop</option>
            <option value="feature">feature</option>
            <option value="release">release</option>
          </select>
          
          <input
            type="text"
            placeholder="Files (comma-separated)"
            value={newCommit.files.join(', ')}
            onChange={handleFileInputChange}
            style={styles.input}
          />
          
          <div style={styles.row}>
            <input
              type="number"
              placeholder="Additions"
              value={newCommit.additions || ''}
              onChange={(e) => setNewCommit({...newCommit, additions: parseInt(e.target.value) || 0})}
              style={{...styles.input, width: '48%'}}
              min="0"
            />
            <input
              type="number"
              placeholder="Deletions"
              value={newCommit.deletions || ''}
              onChange={(e) => setNewCommit({...newCommit, deletions: parseInt(e.target.value) || 0})}
              style={{...styles.input, width: '48%'}}
              min="0"
            />
          </div>
          
          <div style={styles.formButtons}>
            <button type="button" onClick={() => setShowAddForm(false)} style={styles.cancelButton}>
              Cancel
            </button>
            <button type="submit" style={styles.submitButton}>
              Add Commit
            </button>
          </div>
        </form>
      )}
      
      {/* Enhanced Metrics Grid */}
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
        <div style={styles.metricCard}>
          <span style={styles.metricValue}>{avgCommitSize}</span>
          <span style={styles.metricLabel}>Avg Commit Size</span>
        </div>
        <div style={styles.metricCard}>
          <span style={styles.metricValue}>{contributors.length}</span>
          <span style={styles.metricLabel}>Contributors</span>
        </div>
      </div>

      {/* Commit Activity Summary */}
      <div style={styles.summarySection}>
        <h3 style={styles.subTitle}>📊 Commit Activity Summary</h3>
        <div style={styles.summaryGrid}>
          <div style={styles.summaryCard}>
            <span style={styles.summaryLabel}>Most Active Day</span>
            <span style={styles.summaryValue}>
              {commits.length > 0 ? 'Wednesday' : 'N/A'}
            </span>
          </div>
          <div style={styles.summaryCard}>
            <span style={styles.summaryLabel}>Top Contributor</span>
            <span style={styles.summaryValue}>{topContributor}</span>
          </div>
          <div style={styles.summaryCard}>
            <span style={styles.summaryLabel}>Main Branch Commits</span>
            <span style={styles.summaryValue}>
              {commits.filter(c => c.branch === 'main').length}
            </span>
          </div>
          <div style={styles.summaryCard}>
            <span style={styles.summaryLabel}>Net Code Change</span>
            <span style={styles.summaryValue}>
              +{totalAdditions - totalDeletions}
            </span>
          </div>
        </div>
      </div>

      <div style={styles.commitList}>
        <h3 style={styles.subTitle}>Recent Commits</h3>
        {commits.slice(0, 10).map(commit => (
          <div 
            key={commit.id} 
            style={styles.commitCard}
            onClick={() => setSelectedCommit(commit)}
          >
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

      {/* Commit Detail Modal */}
      {selectedCommit && (
        <div style={styles.modal} onClick={() => setSelectedCommit(null)}>
          <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
            <button style={styles.modalClose} onClick={() => setSelectedCommit(null)}>×</button>
            <h3 style={styles.modalTitle}>Commit Details</h3>
            
            <div style={styles.modalDetails}>
              <div style={styles.modalRow}>
                <span style={styles.modalLabel}>Message:</span>
                <span style={styles.modalValue}>{selectedCommit.message}</span>
              </div>
              <div style={styles.modalRow}>
                <span style={styles.modalLabel}>Author:</span>
                <span style={styles.modalValue}>{selectedCommit.author}</span>
              </div>
              <div style={styles.modalRow}>
                <span style={styles.modalLabel}>Branch:</span>
                <span style={styles.modalValue}>{selectedCommit.branch}</span>
              </div>
              <div style={styles.modalRow}>
                <span style={styles.modalLabel}>Timestamp:</span>
                <span style={styles.modalValue}>
                  {new Date(selectedCommit.timestamp).toLocaleString()}
                </span>
              </div>
              <div style={styles.modalRow}>
                <span style={styles.modalLabel}>Changes:</span>
                <span style={styles.modalValue}>
                  +{selectedCommit.additions} / -{selectedCommit.deletions}
                </span>
              </div>
              <div style={styles.modalRow}>
                <span style={styles.modalLabel}>Files:</span>
                <div style={styles.modalFiles}>
                  {selectedCommit.files.map((file, index) => (
                    <span key={index} style={styles.modalFile}>{file}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
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
    fontSize: '22px',
    margin: '0 0 20px 0',
    color: '#333'
  },
  addButton: {
    padding: '8px 16px',
    backgroundColor: '#FF8C42',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px'
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
  formTitle: {
    margin: '0 0 10px 0',
    fontSize: '16px',
    color: '#333'
  },
  input: {
    padding: '8px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px'
  },
  select: {
    padding: '8px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px'
  },
  row: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '10px'
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
    cursor: 'pointer'
  },
  cancelButton: {
    padding: '10px 20px',
    backgroundColor: '#6c757d',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
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
  summarySection: {
    marginBottom: '30px'
  },
  subTitle: {
    fontSize: '18px',
    margin: '0 0 15px 0',
    color: '#333'
  },
  summaryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '15px'
  },
  summaryCard: {
    padding: '15px',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    border: '1px solid #e9ecef'
  },
  summaryLabel: {
    display: 'block',
    fontSize: '12px',
    color: '#6c757d',
    marginBottom: '5px'
  },
  summaryValue: {
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#333'
  },
  commitList: {
    marginTop: '20px'
  },
  commitCard: {
    padding: '15px',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    marginBottom: '10px',
    border: '1px solid #e9ecef',
    cursor: 'pointer',
    transition: 'transform 0.2s, boxShadow 0.2s'
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
    fontSize: '13px',
    flexWrap: 'wrap' as const
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
  },
  modal: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '20px',
    maxWidth: '500px',
    width: '90%',
    maxHeight: '80vh',
    overflow: 'auto',
    position: 'relative' as const
  },
  modalClose: {
    position: 'absolute' as const,
    top: '10px',
    right: '10px',
    width: '30px',
    height: '30px',
    borderRadius: '50%',
    border: 'none',
    backgroundColor: '#ff4444',
    color: 'white',
    fontSize: '20px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  modalTitle: {
    fontSize: '20px',
    margin: '0 0 20px 0',
    color: '#333'
  },
  modalDetails: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '15px'
  },
  modalRow: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '5px'
  },
  modalLabel: {
    fontSize: '12px',
    color: '#6c757d',
    textTransform: 'uppercase' as const
  },
  modalValue: {
    fontSize: '14px',
    color: '#333'
  },
  modalFiles: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: '8px'
  },
  modalFile: {
    padding: '4px 8px',
    backgroundColor: '#f8f9fa',
    borderRadius: '4px',
    fontSize: '12px',
    color: '#495057',
    border: '1px solid #dee2e6'
  }
};

export default CodeMetrics;