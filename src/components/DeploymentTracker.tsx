// src/components/DeploymentTracker.tsx
import React, { useState, useEffect } from 'react';

interface Deployment {
  id: number;
  version: string;
  date: string;
  status: 'live' | 'in-progress' | 'planned' | 'failed';
  environment: 'development' | 'staging' | 'production';
  features: string[];
  buildTime?: string;
  testCoverage?: number;
  issues?: string[];
}

interface Props {
  isEditMode?: boolean;
  onEditAction?: () => void;
}

const DeploymentTracker: React.FC<Props> = ({ isEditMode = false, onEditAction }) => {
  const [deployments, setDeployments] = useState<Deployment[]>([
    {
      id: 1,
      version: 'v1.0.0',
      date: '2024-03-15',
      status: 'live',
      environment: 'production',
      features: ['User Authentication', 'Basic Profile', 'Home Feed'],
      buildTime: '5m 23s',
      testCoverage: 95,
      issues: []
    },
    {
      id: 2,
      version: 'v1.1.0',
      date: '2024-03-10',
      status: 'live',
      environment: 'staging',
      features: ['Push Notifications', 'Comments', 'Share Feature'],
      buildTime: '4m 45s',
      testCoverage: 92,
      issues: ['Notification delay on iOS']
    },
    {
      id: 3,
      version: 'v1.2.0',
      date: '2024-03-05',
      status: 'in-progress',
      environment: 'development',
      features: ['Offline Mode', 'Cache System', 'Sync Feature'],
      buildTime: '6m 12s',
      testCoverage: 78,
      issues: ['Sync conflicts', 'Memory leak']
    },
    {
      id: 4,
      version: 'v2.0.0',
      date: '2024-03-20',
      status: 'planned',
      environment: 'development',
      features: ['AI Recommendations', 'Advanced Analytics', 'Premium Features'],
      testCoverage: 0,
      issues: []
    }
  ]);

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingDeployment, setEditingDeployment] = useState<Deployment | null>(null);
  const [selectedDeployment, setSelectedDeployment] = useState<Deployment | null>(null);
  const [newDeployment, setNewDeployment] = useState<Partial<Deployment>>({
    version: '',
    date: new Date().toISOString().split('T')[0],
    status: 'planned',
    environment: 'development',
    features: [],
    issues: []
  });

  // Add resize listener for mobile responsiveness
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Calculate environment status
  const getEnvironmentStatus = (env: string) => {
    const envDeployments = deployments.filter(d => d.environment === env);
    const latest = envDeployments.sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    )[0];
    
    if (!latest) return { version: 'N/A', status: 'Not deployed' };
    
    return {
      version: latest.version,
      status: latest.status === 'live' ? 'Live' : 
              latest.status === 'in-progress' ? 'Updating' : 'Stable'
    };
  };

  const handleAddClick = () => {
    if (!isEditMode && onEditAction) {
      onEditAction();
      return;
    }
    setShowAddForm(true);
    setEditingDeployment(null);
    setNewDeployment({
      version: '',
      date: new Date().toISOString().split('T')[0],
      status: 'planned',
      environment: 'development',
      features: [],
      issues: []
    });
  };

  const handleEditClick = (deployment: Deployment) => {
    if (!isEditMode && onEditAction) {
      onEditAction();
      return;
    }
    setEditingDeployment(deployment);
    setNewDeployment(deployment);
    setShowAddForm(true);
  };

  const handleDeleteClick = (id: number) => {
    if (!isEditMode && onEditAction) {
      onEditAction();
      return;
    }
    
    if (window.confirm('Are you sure you want to delete this deployment?')) {
      setDeployments(deployments.filter(d => d.id !== id));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isEditMode && onEditAction) {
      onEditAction();
      return;
    }

    if (editingDeployment) {
      // Update existing deployment
      setDeployments(deployments.map(d => 
        d.id === editingDeployment.id ? { ...d, ...newDeployment, id: d.id } : d
      ));
    } else {
      // Add new deployment
      const newId = Math.max(...deployments.map(d => d.id), 0) + 1;
      setDeployments([...deployments, { ...newDeployment, id: newId } as Deployment]);
    }
    
    setShowAddForm(false);
    setEditingDeployment(null);
    setNewDeployment({
      version: '',
      date: new Date().toISOString().split('T')[0],
      status: 'planned',
      environment: 'development',
      features: [],
      issues: []
    });
  };

  const cancelForm = () => {
    setShowAddForm(false);
    setEditingDeployment(null);
    setNewDeployment({
      version: '',
      date: new Date().toISOString().split('T')[0],
      status: 'planned',
      environment: 'development',
      features: [],
      issues: []
    });
  };

  const handleFeaturesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const features = e.target.value.split(',').map(f => f.trim()).filter(f => f);
    setNewDeployment({...newDeployment, features});
  };

  const handleIssuesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const issues = e.target.value.split(',').map(i => i.trim()).filter(i => i);
    setNewDeployment({...newDeployment, issues});
  };

  const devStatus = getEnvironmentStatus('development');
  const stagingStatus = getEnvironmentStatus('staging');
  const prodStatus = getEnvironmentStatus('production');

  // Mobile-specific styles
  const mobileStyles = {
    header: {
      flexDirection: 'column' as const,
      alignItems: 'flex-start',
      gap: '10px',
    },
    formRow: {
      flexDirection: 'column' as const,
      gap: '10px',
    },
    deployHeader: {
      flexDirection: 'column' as const,
      alignItems: 'flex-start',
      gap: '10px',
    },
    deployHeaderLeft: {
      width: '100%',
      justifyContent: 'space-between',
    },
    deployActions: {
      width: '100%',
      justifyContent: 'space-between',
    },
    coverageContainer: {
      flexDirection: 'column' as const,
      alignItems: 'flex-start',
      gap: '5px',
    },
    coverageLabel: {
      minWidth: 'auto',
    },
    features: {
      flexDirection: 'column' as const,
    },
  };

  return (
    <div style={styles.container}>
      <div style={{
        ...styles.header,
        ...(isMobile ? mobileStyles.header : {})
      }}>
        <h2 style={styles.sectionTitle}>🚀 Deployment Pipeline</h2>
        <button 
          onClick={handleAddClick}
          style={{
            ...styles.addButton,
            backgroundColor: isEditMode ? '#FF8C42' : '#6c757d',
            cursor: isEditMode ? 'pointer' : 'not-allowed',
            width: isMobile ? '100%' : 'auto'
          }}
        >
          {isEditMode ? '+ Add Deployment' : '🔒 Edit Mode Required'}
        </button>
      </div>

      {/* Edit Mode Indicator */}
      {isEditMode && !showAddForm && (
        <div style={styles.editModeIndicator}>
          ✏️ Edit Mode Active - You can manage deployments
        </div>
      )}

      {/* Add/Edit Form */}
      {isEditMode && showAddForm && (
        <form onSubmit={handleSubmit} style={styles.form}>
          <h4 style={styles.formTitle}>
            {editingDeployment ? '✏️ Edit Deployment' : '➕ Add New Deployment'}
          </h4>
          
          <div style={{
            ...styles.formRow,
            ...(isMobile ? mobileStyles.formRow : {})
          }}>
            <input
              type="text"
              placeholder="Version (e.g., v1.0.0)"
              value={newDeployment.version || ''}
              onChange={(e) => setNewDeployment({...newDeployment, version: e.target.value})}
              style={{...styles.input, flex: 1}}
              required
            />
            <input
              type="date"
              value={newDeployment.date || ''}
              onChange={(e) => setNewDeployment({...newDeployment, date: e.target.value})}
              style={{...styles.input, width: isMobile ? '100%' : 'auto'}}
              required
            />
          </div>

          <div style={{
            ...styles.formRow,
            ...(isMobile ? mobileStyles.formRow : {})
          }}>
            <select
              value={newDeployment.environment || 'development'}
              onChange={(e) => setNewDeployment({...newDeployment, environment: e.target.value as any})}
              style={styles.select}
            >
              <option value="development">Development</option>
              <option value="staging">Staging</option>
              <option value="production">Production</option>
            </select>

            <select
              value={newDeployment.status || 'planned'}
              onChange={(e) => setNewDeployment({...newDeployment, status: e.target.value as any})}
              style={styles.select}
            >
              <option value="planned">Planned</option>
              <option value="in-progress">In Progress</option>
              <option value="live">Live</option>
              <option value="failed">Failed</option>
            </select>
          </div>

          <input
            type="text"
            placeholder="Features (comma-separated)"
            value={newDeployment.features?.join(', ') || ''}
            onChange={handleFeaturesChange}
            style={styles.input}
          />

          <input
            type="text"
            placeholder="Issues (comma-separated, optional)"
            value={newDeployment.issues?.join(', ') || ''}
            onChange={handleIssuesChange}
            style={styles.input}
          />

          <div style={{
            ...styles.formRow,
            ...(isMobile ? mobileStyles.formRow : {})
          }}>
            <input
              type="text"
              placeholder="Build Time (e.g., 5m 23s)"
              value={newDeployment.buildTime || ''}
              onChange={(e) => setNewDeployment({...newDeployment, buildTime: e.target.value})}
              style={{...styles.input, flex: 1}}
            />
            <input
              type="number"
              placeholder="Test Coverage %"
              value={newDeployment.testCoverage || ''}
              onChange={(e) => setNewDeployment({...newDeployment, testCoverage: parseInt(e.target.value)})}
              style={{...styles.input, width: isMobile ? '100%' : '120px'}}
              min="0"
              max="100"
            />
          </div>

          <div style={styles.formButtons}>
            <button 
              type="button" 
              onClick={cancelForm} 
              style={{
                ...styles.cancelButton,
                ...(isMobile ? { flex: '1' } : {})
              }}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              style={{
                ...styles.submitButton,
                ...(isMobile ? { flex: '1' } : {})
              }}
            >
              {editingDeployment ? 'Update Deployment' : 'Add Deployment'}
            </button>
          </div>
        </form>
      )}
      
      <div style={styles.environments}>
        <div style={styles.environment}>
          <h3 style={styles.envTitle}>🟢 Development</h3>
          <p style={styles.envVersion}>Latest: {devStatus.version}</p>
          <p style={styles.envStatus}>Status: {devStatus.status}</p>
          {isEditMode && (
            <button 
              style={{
                ...styles.envAction,
                width: isMobile ? '100%' : 'auto'
              }}
            >
              Trigger Build
            </button>
          )}
        </div>
        <div style={styles.environment}>
          <h3 style={styles.envTitle}>🟡 Staging</h3>
          <p style={styles.envVersion}>Latest: {stagingStatus.version}</p>
          <p style={styles.envStatus}>Status: {stagingStatus.status}</p>
          {isEditMode && (
            <button 
              style={{
                ...styles.envAction,
                width: isMobile ? '100%' : 'auto'
              }}
            >
              Deploy to Staging
            </button>
          )}
        </div>
        <div style={styles.environment}>
          <h3 style={styles.envTitle}>🔵 Production</h3>
          <p style={styles.envVersion}>Latest: {prodStatus.version}</p>
          <p style={styles.envStatus}>Status: {prodStatus.status}</p>
          {isEditMode && (
            <button 
              style={{
                ...styles.envAction,
                width: isMobile ? '100%' : 'auto'
              }}
            >
              Deploy to Production
            </button>
          )}
        </div>
      </div>

     

      {/* Deployment Detail Modal */}
      {selectedDeployment && (
        <div style={styles.modal} onClick={() => setSelectedDeployment(null)}>
          <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
            <button style={styles.modalClose} onClick={() => setSelectedDeployment(null)}>×</button>
            <h3 style={styles.modalTitle}>Deployment Details</h3>
            
            <div style={styles.modalDetails}>
              <div style={styles.modalRow}>
                <span style={styles.modalLabel}>Version:</span>
                <span style={styles.modalValue}>{selectedDeployment.version}</span>
              </div>
              <div style={styles.modalRow}>
                <span style={styles.modalLabel}>Date:</span>
                <span style={styles.modalValue}>{new Date(selectedDeployment.date).toLocaleDateString()}</span>
              </div>
              <div style={styles.modalRow}>
                <span style={styles.modalLabel}>Environment:</span>
                <span style={styles.modalValue}>{selectedDeployment.environment}</span>
              </div>
              <div style={styles.modalRow}>
                <span style={styles.modalLabel}>Status:</span>
                <span style={styles.modalValue}>{selectedDeployment.status}</span>
              </div>
              {selectedDeployment.buildTime && (
                <div style={styles.modalRow}>
                  <span style={styles.modalLabel}>Build Time:</span>
                  <span style={styles.modalValue}>{selectedDeployment.buildTime}</span>
                </div>
              )}
              {selectedDeployment.testCoverage !== undefined && (
                <div style={styles.modalRow}>
                  <span style={styles.modalLabel}>Test Coverage:</span>
                  <span style={styles.modalValue}>{selectedDeployment.testCoverage}%</span>
                </div>
              )}
              <div style={styles.modalRow}>
                <span style={styles.modalLabel}>Features:</span>
                <div style={styles.modalFeatures}>
                  {selectedDeployment.features.map((feature, index) => (
                    <span key={index} style={styles.modalFeature}>✓ {feature}</span>
                  ))}
                </div>
              </div>
              {selectedDeployment.issues && selectedDeployment.issues.length > 0 && (
                <div style={styles.modalRow}>
                  <span style={styles.modalLabel}>Issues:</span>
                  <div style={styles.modalIssues}>
                    {selectedDeployment.issues.map((issue, index) => (
                      <span key={index} style={styles.modalIssue}>⚠️ {issue}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '20px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    flexWrap: 'wrap' as const,
    gap: '15px',
  },
  sectionTitle: {
    fontSize: 'clamp(20px, 5vw, 22px)',
    margin: '0 0 20px 0',
    color: '#333'
  },
  addButton: {
    padding: '10px 20px',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: 'clamp(14px, 4vw, 16px)',
    transition: 'background-color 0.2s',
    fontWeight: '500',
  },
  editModeIndicator: {
    backgroundColor: '#fff3cd',
    color: '#856404',
    padding: '12px 16px',
    borderRadius: '8px',
    marginBottom: '20px',
    fontSize: 'clamp(13px, 4vw, 14px)',
    fontWeight: '500',
    textAlign: 'center' as const,
  },
  form: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '15px',
    padding: '20px',
    backgroundColor: '#f8f9fa',
    borderRadius: '16px',
    marginBottom: '20px',
    border: '2px solid #FF8C42',
  },
  formTitle: {
    margin: '0 0 10px 0',
    fontSize: 'clamp(16px, 4vw, 18px)',
    color: '#333'
  },
  formRow: {
    display: 'flex',
    gap: '15px',
    flexWrap: 'wrap' as const
  },
  input: {
    padding: '12px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    fontSize: 'clamp(14px, 4vw, 16px)',
    flex: 1,
    width: '100%',
    boxSizing: 'border-box' as const,
  },
  select: {
    padding: '12px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    fontSize: 'clamp(14px, 4vw, 16px)',
    flex: 1,
    width: '100%',
    backgroundColor: 'white',
  },
  formButtons: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'flex-end',
    marginTop: '10px',
    flexWrap: 'wrap' as const,
  },
  submitButton: {
    padding: '12px 24px',
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: 'clamp(14px, 4vw, 16px)',
  },
  cancelButton: {
    padding: '12px 24px',
    backgroundColor: '#6c757d',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: 'clamp(14px, 4vw, 16px)',
  },
  environments: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '15px',
    marginBottom: '30px'
  },
  environment: {
    padding: '20px',
    backgroundColor: '#f8f9fa',
    borderRadius: '12px',
    border: '1px solid #e9ecef',
    '@media (max-width: 768px)': {
      padding: '16px',
    },
  },
  envTitle: {
    margin: '0 0 10px 0',
    fontSize: 'clamp(16px, 4vw, 18px)',
    color: '#333'
  },
  envVersion: {
    fontSize: 'clamp(13px, 4vw, 14px)',
    color: '#666',
    margin: '0 0 5px 0'
  },
  envStatus: {
    fontSize: 'clamp(13px, 4vw, 14px)',
    color: '#666',
    margin: '0 0 10px 0'
  },
  envAction: {
    padding: '8px 16px',
    backgroundColor: '#FF8C42',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: 'clamp(12px, 3vw, 14px)',
  },
  timeline: {
    marginBottom: '30px'
  },
  subTitle: {
    fontSize: 'clamp(18px, 5vw, 20px)',
    margin: '0 0 15px 0',
    color: '#333'
  },
  deployCard: {
    padding: '20px',
    backgroundColor: '#f8f9fa',
    borderRadius: '12px',
    marginBottom: '15px',
    border: '1px solid #e9ecef',
    cursor: 'pointer',
    transition: 'transform 0.2s, boxShadow 0.2s',
    ':active': {
      transform: 'scale(0.99)',
    },
    '@media (max-width: 768px)': {
      padding: '16px',
    },
  },
  deployHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px'
  },
  deployHeaderLeft: {
    display: 'flex',
    gap: '10px',
    alignItems: 'center',
    flexWrap: 'wrap' as const,
  },
  version: {
    fontSize: 'clamp(16px, 4vw, 18px)',
    fontWeight: 'bold',
    color: '#333'
  },
  environmentBadge: {
    padding: '4px 8px',
    backgroundColor: '#e9ecef',
    borderRadius: '6px',
    fontSize: 'clamp(11px, 3vw, 12px)',
    color: '#495057'
  },
  deployActions: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
    flexWrap: 'wrap' as const,
  },
  editButton: {
    padding: '8px 12px',
    backgroundColor: '#f8f9fa',
    border: '1px solid #dee2e6',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    transition: 'all 0.2s',
  },
  deleteButton: {
    padding: '8px 12px',
    backgroundColor: '#f8d7da',
    border: '1px solid #f5c6cb',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    transition: 'all 0.2s',
  },
  status: {
    padding: '6px 12px',
    borderRadius: '6px',
    fontSize: 'clamp(12px, 3vw, 13px)',
    textTransform: 'capitalize' as const,
    fontWeight: '500',
  },
  date: {
    fontSize: 'clamp(13px, 3vw, 14px)',
    color: '#666',
    marginBottom: '8px'
  },
  buildTime: {
    fontSize: 'clamp(13px, 3vw, 14px)',
    color: '#666',
    marginBottom: '8px'
  },
  coverageContainer: {
    marginBottom: '12px',
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
    flexWrap: 'wrap' as const,
  },
  coverageLabel: {
    fontSize: 'clamp(13px, 3vw, 14px)',
    color: '#666',
    minWidth: '90px'
  },
  coverageBar: {
    flex: 1,
    height: '24px',
    backgroundColor: '#e9ecef',
    borderRadius: '12px',
    overflow: 'hidden',
    position: 'relative' as const,
    minWidth: '150px',
  },
  coverageFill: {
    height: '100%',
    transition: 'width 0.3s ease'
  },
  coverageText: {
    position: 'absolute' as const,
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    fontSize: '12px',
    color: '#fff',
    fontWeight: 'bold',
    textShadow: '0 1px 2px rgba(0,0,0,0.2)',
  },
  features: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: '8px',
    marginBottom: '10px'
  },
  feature: {
    fontSize: 'clamp(12px, 3vw, 13px)',
    color: '#28a745',
    padding: '4px 10px',
    backgroundColor: '#f8f9fa',
    borderRadius: '6px',
    border: '1px solid #d4edda',
  },
  issues: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '6px',
    marginTop: '12px',
    padding: '12px',
    backgroundColor: '#f8d7da',
    borderRadius: '8px'
  },
  issuesLabel: {
    fontSize: 'clamp(12px, 3vw, 13px)',
    color: '#721c24',
    fontWeight: 'bold'
  },
  issue: {
    fontSize: 'clamp(12px, 3vw, 13px)',
    color: '#721c24',
    marginLeft: '16px'
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
    zIndex: 1000,
    padding: '20px',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: '20px',
    padding: '24px',
    maxWidth: '500px',
    width: '100%',
    maxHeight: '80vh',
    overflow: 'auto',
    position: 'relative' as const,
  },
  modalClose: {
    position: 'absolute' as const,
    top: '15px',
    right: '15px',
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    border: 'none',
    backgroundColor: '#ff4444',
    color: 'white',
    fontSize: '24px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 'clamp(18px, 5vw, 20px)',
    margin: '0 0 20px 0',
    color: '#333',
    paddingRight: '30px',
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
    fontSize: 'clamp(12px, 3vw, 13px)',
    color: '#6c757d',
    textTransform: 'uppercase' as const
  },
  modalValue: {
    fontSize: 'clamp(14px, 4vw, 16px)',
    color: '#333'
  },
  modalFeatures: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: '8px'
  },
  modalFeature: {
    fontSize: 'clamp(12px, 3vw, 13px)',
    color: '#28a745',
    padding: '4px 10px',
    backgroundColor: '#f8f9fa',
    borderRadius: '6px'
  },
  modalIssues: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '6px'
  },
  modalIssue: {
    fontSize: 'clamp(12px, 3vw, 13px)',
    color: '#dc3545',
    padding: '4px 10px',
    backgroundColor: '#f8d7da',
    borderRadius: '6px'
  }
};

export default DeploymentTracker;