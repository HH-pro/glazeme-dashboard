// src/components/DeploymentTracker.tsx
import React, { useState } from 'react';

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

  return (
    <div>
      <div style={styles.header}>
        <h2 style={styles.sectionTitle}>🚀 Deployment Pipeline</h2>
        <button 
          onClick={handleAddClick}
          style={{
            ...styles.addButton,
            backgroundColor: isEditMode ? '#FF8C42' : '#6c757d',
            cursor: isEditMode ? 'pointer' : 'not-allowed'
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
          
          <div style={styles.formRow}>
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
              style={{...styles.input, width: 'auto'}}
              required
            />
          </div>

          <div style={styles.formRow}>
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

          <div style={styles.formRow}>
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
              style={{...styles.input, width: '120px'}}
              min="0"
              max="100"
            />
          </div>

          <div style={styles.formButtons}>
            <button type="button" onClick={cancelForm} style={styles.cancelButton}>
              Cancel
            </button>
            <button type="submit" style={styles.submitButton}>
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
            <button style={styles.envAction}>Trigger Build</button>
          )}
        </div>
        <div style={styles.environment}>
          <h3 style={styles.envTitle}>🟡 Staging</h3>
          <p style={styles.envVersion}>Latest: {stagingStatus.version}</p>
          <p style={styles.envStatus}>Status: {stagingStatus.status}</p>
          {isEditMode && (
            <button style={styles.envAction}>Deploy to Staging</button>
          )}
        </div>
        <div style={styles.environment}>
          <h3 style={styles.envTitle}>🔵 Production</h3>
          <p style={styles.envVersion}>Latest: {prodStatus.version}</p>
          <p style={styles.envStatus}>Status: {prodStatus.status}</p>
          {isEditMode && (
            <button style={styles.envAction}>Deploy to Production</button>
          )}
        </div>
      </div>

      <div style={styles.timeline}>
        <h3 style={styles.subTitle}>📅 Deployment History</h3>
        {deployments.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(deploy => (
          <div 
            key={deploy.id} 
            style={styles.deployCard}
            onClick={() => setSelectedDeployment(deploy)}
          >
            <div style={styles.deployHeader}>
              <div style={styles.deployHeaderLeft}>
                <span style={styles.version}>{deploy.version}</span>
                <span style={styles.environmentBadge}>{deploy.environment}</span>
              </div>
              <div style={styles.deployActions}>
                {isEditMode && (
                  <>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditClick(deploy);
                      }}
                      style={styles.editButton}
                      title="Edit deployment"
                    >
                      ✏️
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteClick(deploy.id);
                      }}
                      style={styles.deleteButton}
                      title="Delete deployment"
                    >
                      🗑️
                    </button>
                  </>
                )}
                <span style={{
                  ...styles.status,
                  backgroundColor: deploy.status === 'live' ? '#d4edda' : 
                                 deploy.status === 'in-progress' ? '#fff3cd' :
                                 deploy.status === 'failed' ? '#f8d7da' : '#e9ecef',
                  color: deploy.status === 'live' ? '#155724' : 
                         deploy.status === 'in-progress' ? '#856404' :
                         deploy.status === 'failed' ? '#721c24' : '#495057'
                }}>
                  {deploy.status}
                </span>
              </div>
            </div>
            
            <p style={styles.date}>📅 {new Date(deploy.date).toLocaleDateString()}</p>
            
            {deploy.buildTime && (
              <p style={styles.buildTime}>⏱️ Build Time: {deploy.buildTime}</p>
            )}
            
            {deploy.testCoverage !== undefined && (
              <div style={styles.coverageContainer}>
                <span style={styles.coverageLabel}>Test Coverage:</span>
                <div style={styles.coverageBar}>
                  <div style={{
                    ...styles.coverageFill,
                    width: `${deploy.testCoverage}%`,
                    backgroundColor: deploy.testCoverage >= 80 ? '#28a745' :
                                    deploy.testCoverage >= 60 ? '#ffc107' : '#dc3545'
                  }} />
                  <span style={styles.coverageText}>{deploy.testCoverage}%</span>
                </div>
              </div>
            )}
            
            <div style={styles.features}>
              {deploy.features.map(feature => (
                <span key={feature} style={styles.feature}>✓ {feature}</span>
              ))}
            </div>

            {deploy.issues && deploy.issues.length > 0 && (
              <div style={styles.issues}>
                <span style={styles.issuesLabel}>⚠️ Known Issues:</span>
                {deploy.issues.map(issue => (
                  <span key={issue} style={styles.issue}>• {issue}</span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <div style={styles.nextSteps}>
        <h3 style={styles.nextStepsTitle}>📋 Upcoming Release (Week 4)</h3>
        <ul style={styles.stepsList}>
          <li style={styles.completedStep}>✅ iMessage Extension Foundation</li>
          <li style={styles.completedStep}>✅ AI Integration</li>
          <li style={styles.completedStep}>✅ Basic Prompt Engineering</li>
          <li style={styles.inProgressStep}>🔄 Error Handling System</li>
          <li style={styles.plannedStep}>⏳ Performance Optimization</li>
          <li style={styles.plannedStep}>⏳ TestFlight Distribution</li>
        </ul>
        
        <div style={styles.releaseNotes}>
          <h4 style={styles.releaseNotesTitle}>📝 Release Notes v0.4.0</h4>
          <p style={styles.releaseNoteItem}>• Improved error handling with retry logic</p>
          <p style={styles.releaseNoteItem}>• Added performance monitoring</p>
          <p style={styles.releaseNoteItem}>• Fixed memory leaks in message extension</p>
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
  formTitle: {
    margin: '0 0 10px 0',
    fontSize: '16px',
    color: '#333'
  },
  formRow: {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap' as const
  },
  input: {
    padding: '8px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px',
    flex: 1
  },
  select: {
    padding: '8px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px',
    flex: 1
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
  environments: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '15px',
    marginBottom: '30px'
  },
  environment: {
    padding: '20px',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    border: '1px solid #e9ecef'
  },
  envTitle: {
    margin: '0 0 10px 0',
    fontSize: '16px',
    color: '#333'
  },
  envVersion: {
    fontSize: '14px',
    color: '#666',
    margin: '0 0 5px 0'
  },
  envStatus: {
    fontSize: '14px',
    color: '#666',
    margin: '0 0 10px 0'
  },
  envAction: {
    padding: '6px 12px',
    backgroundColor: '#FF8C42',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px'
  },
  timeline: {
    marginBottom: '30px'
  },
  subTitle: {
    fontSize: '18px',
    margin: '0 0 15px 0',
    color: '#333'
  },
  deployCard: {
    padding: '15px',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    marginBottom: '10px',
    border: '1px solid #e9ecef',
    cursor: 'pointer',
    transition: 'transform 0.2s, boxShadow 0.2s'
  },
  deployHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px'
  },
  deployHeaderLeft: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center'
  },
  version: {
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#333'
  },
  environmentBadge: {
    padding: '2px 6px',
    backgroundColor: '#e9ecef',
    borderRadius: '4px',
    fontSize: '11px',
    color: '#495057'
  },
  deployActions: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center'
  },
  editButton: {
    padding: '4px 8px',
    backgroundColor: '#f8f9fa',
    border: '1px solid #dee2e6',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px'
  },
  deleteButton: {
    padding: '4px 8px',
    backgroundColor: '#f8d7da',
    border: '1px solid #f5c6cb',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px'
  },
  status: {
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '12px',
    textTransform: 'capitalize' as const
  },
  date: {
    fontSize: '13px',
    color: '#666',
    marginBottom: '5px'
  },
  buildTime: {
    fontSize: '13px',
    color: '#666',
    marginBottom: '5px'
  },
  coverageContainer: {
    marginBottom: '10px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },
  coverageLabel: {
    fontSize: '13px',
    color: '#666',
    minWidth: '90px'
  },
  coverageBar: {
    flex: 1,
    height: '20px',
    backgroundColor: '#e9ecef',
    borderRadius: '10px',
    overflow: 'hidden',
    position: 'relative' as const
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
    fontSize: '11px',
    color: '#fff',
    fontWeight: 'bold'
  },
  features: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: '8px',
    marginBottom: '10px'
  },
  feature: {
    fontSize: '12px',
    color: '#28a745',
    padding: '2px 8px',
    backgroundColor: '#f8f9fa',
    borderRadius: '4px'
  },
  issues: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '4px',
    marginTop: '10px',
    padding: '8px',
    backgroundColor: '#f8d7da',
    borderRadius: '4px'
  },
  issuesLabel: {
    fontSize: '12px',
    color: '#721c24',
    fontWeight: 'bold'
  },
  issue: {
    fontSize: '12px',
    color: '#721c24',
    marginLeft: '12px'
  },
  nextSteps: {
    padding: '20px',
    backgroundColor: '#fff3cd',
    borderRadius: '8px',
    border: '1px solid #ffeeba'
  },
  nextStepsTitle: {
    margin: '0 0 15px 0',
    fontSize: '16px',
    color: '#856404'
  },
  stepsList: {
    listStyle: 'none',
    padding: 0,
    margin: '0 0 15px 0'
  },
  completedStep: {
    padding: '5px 0',
    color: '#28a745'
  },
  inProgressStep: {
    padding: '5px 0',
    color: '#ffc107'
  },
  plannedStep: {
    padding: '5px 0',
    color: '#6c757d'
  },
  releaseNotes: {
    marginTop: '15px',
    padding: '15px',
    backgroundColor: '#fff',
    borderRadius: '8px'
  },
  releaseNotesTitle: {
    margin: '0 0 10px 0',
    fontSize: '14px',
    color: '#333'
  },
  releaseNoteItem: {
    fontSize: '13px',
    color: '#666',
    margin: '5px 0'
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
  modalFeatures: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: '8px'
  },
  modalFeature: {
    fontSize: '12px',
    color: '#28a745',
    padding: '2px 8px',
    backgroundColor: '#f8f9fa',
    borderRadius: '4px'
  },
  modalIssues: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '4px'
  },
  modalIssue: {
    fontSize: '12px',
    color: '#dc3545',
    padding: '2px 8px',
    backgroundColor: '#f8d7da',
    borderRadius: '4px'
  }
};

export default DeploymentTracker;