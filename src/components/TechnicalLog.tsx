// src/components/TechnicalLog.tsx
import React, { useState, useEffect } from 'react';
import { db } from '../services/firebase';
import { collection, query, orderBy, onSnapshot, addDoc, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { TechnicalMilestone } from '../types';

interface Props {
  isEditMode?: boolean;
  onEditAction?: () => void;
}

const TechnicalLog: React.FC<Props> = ({ isEditMode = false, onEditAction }) => {
  const [milestones, setMilestones] = useState<TechnicalMilestone[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<TechnicalMilestone | null>(null);
  const [newMilestone, setNewMilestone] = useState({
    week: 1,
    task: '',
    notes: '',
    completed: false
  });

  // GlazeMe technical architecture details
  const technicalSpecs = {
    architecture: "MVVM (Model-View-ViewModel)",
    platform: "iOS / iMessage Extension",
    language: "Swift + SwiftUI",
    aiIntegration: "OpenAI API with lightweight backend proxy",
    security: "API keys stored in backend, not client",
    database: "Firebase for user data (future)",
    api: "RESTful backend service",
    version: "v1.0.0 (MVP)"
  };

  useEffect(() => {
    // Real-time milestones listener
    const milestonesQuery = query(collection(db, 'technicalMilestones'), orderBy('week', 'asc'));
    const unsubscribe = onSnapshot(milestonesQuery, (snapshot) => {
      const milestonesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        completedDate: doc.data().completedDate?.toDate()
      })) as TechnicalMilestone[];
      setMilestones(milestonesData);
    });

    return () => unsubscribe();
  }, []);

  const handleAddClick = () => {
    if (!isEditMode && onEditAction) {
      onEditAction();
      return;
    }
    setShowAddForm(true);
    setEditingMilestone(null);
  };

  const handleEditClick = (milestone: TechnicalMilestone) => {
    if (!isEditMode && onEditAction) {
      onEditAction();
      return;
    }
    setEditingMilestone(milestone);
    setNewMilestone({
      week: milestone.week,
      task: milestone.task,
      notes: milestone.notes,
      completed: milestone.completed
    });
    setShowAddForm(true);
  };

  const handleDeleteClick = async (id: string) => {
    if (!isEditMode && onEditAction) {
      onEditAction();
      return;
    }
    
    if (window.confirm('Are you sure you want to delete this milestone?')) {
      try {
        await deleteDoc(doc(db, 'technicalMilestones', id));
      } catch (error) {
        console.error('Error deleting milestone:', error);
        alert('Failed to delete milestone');
      }
    }
  };

  const handleAddMilestone = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isEditMode && onEditAction) {
      onEditAction();
      return;
    }

    try {
      if (editingMilestone) {
        // Update existing milestone
        const milestoneRef = doc(db, 'technicalMilestones', editingMilestone.id);
        await updateDoc(milestoneRef, {
          week: newMilestone.week,
          task: newMilestone.task,
          notes: newMilestone.notes,
          completed: newMilestone.completed,
          completedDate: newMilestone.completed ? new Date() : null
        });
      } else {
        // Add new milestone
        await addDoc(collection(db, 'technicalMilestones'), {
          ...newMilestone,
          completedDate: null
        });
      }
      
      setShowAddForm(false);
      setEditingMilestone(null);
      setNewMilestone({
        week: 1,
        task: '',
        notes: '',
        completed: false
      });
    } catch (error) {
      console.error('Error saving milestone:', error);
      alert('Failed to save milestone');
    }
  };

  const toggleMilestoneStatus = async (milestone: TechnicalMilestone) => {
    if (!isEditMode && onEditAction) {
      onEditAction();
      return;
    }

    try {
      const milestoneRef = doc(db, 'technicalMilestones', milestone.id);
      await updateDoc(milestoneRef, {
        completed: !milestone.completed,
        completedDate: !milestone.completed ? new Date() : null
      });
    } catch (error) {
      console.error('Error updating milestone:', error);
      alert('Failed to update milestone status');
    }
  };

  const cancelForm = () => {
    setShowAddForm(false);
    setEditingMilestone(null);
    setNewMilestone({
      week: 1,
      task: '',
      notes: '',
      completed: false
    });
  };

  return (
    <div style={styles.container}>
      {/* Header with technical overview */}
      <div style={styles.header}>
        <h2 style={styles.sectionTitle}>⚙️ Technical Implementation</h2>
        <p style={styles.subtitle}>Real-time architecture and development tracking</p>
      </div>

      {/* Edit Mode Indicator */}
      {isEditMode && (
        <div style={styles.editModeIndicator}>
          ✏️ Edit Mode Active - You can add, edit, and delete milestones
        </div>
      )}

      {/* Technical Specs Cards */}
      <div style={styles.specsGrid}>
        <div style={styles.specCard}>
          <span style={styles.specIcon}>🏗️</span>
          <div>
            <h4 style={styles.specLabel}>Architecture</h4>
            <p style={styles.specValue}>{technicalSpecs.architecture}</p>
          </div>
        </div>
        <div style={styles.specCard}>
          <span style={styles.specIcon}>📱</span>
          <div>
            <h4 style={styles.specLabel}>Platform</h4>
            <p style={styles.specValue}>{technicalSpecs.platform}</p>
          </div>
        </div>
        <div style={styles.specCard}>
          <span style={styles.specIcon}>🔤</span>
          <div>
            <h4 style={styles.specLabel}>Language</h4>
            <p style={styles.specValue}>{technicalSpecs.language}</p>
          </div>
        </div>
        <div style={styles.specCard}>
          <span style={styles.specIcon}>🤖</span>
          <div>
            <h4 style={styles.specLabel}>AI Integration</h4>
            <p style={styles.specValue}>{technicalSpecs.aiIntegration}</p>
          </div>
        </div>
        <div style={styles.specCard}>
          <span style={styles.specIcon}>🔒</span>
          <div>
            <h4 style={styles.specLabel}>Security</h4>
            <p style={styles.specValue}>{technicalSpecs.security}</p>
          </div>
        </div>
        <div style={styles.specCard}>
          <span style={styles.specIcon}>💾</span>
          <div>
            <h4 style={styles.specLabel}>Database</h4>
            <p style={styles.specValue}>{technicalSpecs.database}</p>
          </div>
        </div>
      </div>

     

      {/* Technical Milestones Tracker */}
      <div style={styles.milestonesSection}>
     
        {isEditMode && showAddForm && (
          <form onSubmit={handleAddMilestone} style={styles.form}>
            <h4 style={styles.formTitle}>
              {editingMilestone ? '✏️ Edit Milestone' : '➕ Add New Milestone'}
            </h4>
            
            <input
              type="number"
              placeholder="Week Number"
              value={newMilestone.week}
              onChange={(e) => setNewMilestone({...newMilestone, week: parseInt(e.target.value)})}
              style={styles.input}
              min="1"
              max="6"
              required
            />
            
            <input
              type="text"
              placeholder="Task Description"
              value={newMilestone.task}
              onChange={(e) => setNewMilestone({...newMilestone, task: e.target.value})}
              style={styles.input}
              required
            />
            
            <textarea
              placeholder="Technical Notes"
              value={newMilestone.notes}
              onChange={(e) => setNewMilestone({...newMilestone, notes: e.target.value})}
              style={styles.textarea}
              rows={3}
              required
            />
            
            <div style={styles.checkboxContainer}>
              <label style={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={newMilestone.completed}
                  onChange={(e) => setNewMilestone({...newMilestone, completed: e.target.checked})}
                  style={styles.checkbox}
                />
                Mark as completed
              </label>
            </div>
            
            <div style={styles.formButtons}>
              <button type="button" onClick={cancelForm} style={styles.cancelButton}>
                Cancel
              </button>
              <button type="submit" style={styles.submitButton}>
                {editingMilestone ? 'Update Milestone' : 'Add Milestone'}
              </button>
            </div>
          </form>
        )}

        <div style={styles.milestonesList}>
          {milestones.map((milestone) => (
            <div key={milestone.id} style={styles.milestoneCard}>
              <div style={styles.milestoneHeader}>
                <span style={styles.weekBadge}>Week {milestone.week}</span>
                <div style={styles.milestoneActions}>
                  {isEditMode && (
                    <>
                      <button 
                        onClick={() => handleEditClick(milestone)}
                        style={styles.editButton}
                        title="Edit milestone"
                      >
                        ✏️
                      </button>
                      <button 
                        onClick={() => handleDeleteClick(milestone.id)}
                        style={styles.deleteButton}
                        title="Delete milestone"
                      >
                        🗑️
                      </button>
                    </>
                  )}
                  <input
                    type="checkbox"
                    checked={milestone.completed}
                    onChange={() => toggleMilestoneStatus(milestone)}
                    style={styles.checkbox}
                    disabled={!isEditMode}
                  />
                </div>
              </div>
              <h4 style={styles.milestoneTask}>{milestone.task}</h4>
              <p style={styles.milestoneNotes}>{milestone.notes}</p>
              {milestone.completedDate && (
                <small style={styles.completedDate}>
                  ✅ Completed: {new Date(milestone.completedDate).toLocaleDateString()}
                </small>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* API Integration Details */}
      <div style={styles.apiSection}>
        <h3 style={styles.sectionSubtitle}>🔌 API Integration Details</h3>
        <div style={styles.apiGrid}>
          <div style={styles.apiCard}>
            <h4 style={styles.apiTitle}>OpenAI Integration</h4>
            <pre style={styles.codeBlock}>
{`// Prompt Engineering for GlazeMe
let prompt = \`
Generate an over-the-top, 
meme-style compliment 
with emojis. Make it 
funny and encouraging.
Theme: Yellow to orange
Style: American inside joke
\``}
            </pre>
          </div>

          <div style={styles.apiCard}>
            <h4 style={styles.apiTitle}>Backend Proxy</h4>
            <pre style={styles.codeBlock}>
{`// Node.js endpoint
app.post('/api/compliment', 
  verifyAPIKey,
  rateLimit,
  async (req, res) => {
    const compliment = 
      await generateCompliment(
        req.body.prompt
      );
    res.json({ compliment });
});`}
            </pre>
          </div>

          <div style={styles.apiCard}>
            <h4 style={styles.apiTitle}>iMessage Extension</h4>
            <pre style={styles.codeBlock}>
{`// Swift implementation
class MessageViewController: 
    MSMessagesAppViewController {
    
    @IBOutlet weak var 
    complimentView: UIView!
    
    func generateCompliment() {
        // AI call here
    }
}`}
            </pre>
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div style={styles.metricsSection}>
        <h3 style={styles.sectionSubtitle}>📊 Performance Targets</h3>
        <div style={styles.metricsGrid}>
          <div style={styles.metricCard}>
            <span style={styles.metricValue}>&lt; 2s</span>
            <span style={styles.metricLabel}>AI Response Time</span>
          </div>
          <div style={styles.metricCard}>
            <span style={styles.metricValue}>99.9%</span>
            <span style={styles.metricLabel}>Uptime</span>
          </div>
          <div style={styles.metricCard}>
            <span style={styles.metricValue}>&lt; 50MB</span>
            <span style={styles.metricLabel}>App Size</span>
          </div>
          <div style={styles.metricCard}>
            <span style={styles.metricValue}>iOS 15+</span>
            <span style={styles.metricLabel}>Compatibility</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    padding: '20px',
    maxWidth: '1200px',
    margin: '0 auto'
  },
  header: {
    marginBottom: '30px'
  },
  sectionTitle: {
    fontSize: '28px',
    margin: '0 0 10px 0',
    color: '#333',
    fontWeight: 'bold'
  },
  subtitle: {
    fontSize: '16px',
    color: '#666',
    margin: 0
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
  specsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '15px',
    marginBottom: '30px'
  },
  specCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '15px',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    border: '1px solid #e9ecef'
  },
  specIcon: {
    fontSize: '24px'
  },
  specLabel: {
    margin: '0 0 5px 0',
    fontSize: '12px',
    color: '#6c757d',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px'
  },
  specValue: {
    margin: 0,
    fontSize: '14px',
    color: '#333',
    fontWeight: '500'
  },
  architectureSection: {
    marginBottom: '40px'
  },
  sectionSubtitle: {
    fontSize: '20px',
    margin: '0 0 20px 0',
    color: '#333'
  },
  architectureDiagram: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '15px'
  },
  layer: {
    display: 'flex',
    gap: '20px',
    padding: '15px',
    backgroundColor: 'white',
    borderRadius: '8px',
    border: '1px solid #dee2e6',
    position: 'relative' as const
  },
  layerNumber: {
    width: '30px',
    height: '30px',
    backgroundColor: '#FF8C42',
    color: 'white',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold',
    fontSize: '16px'
  },
  layerContent: {
    flex: 1
  },
  layerTitle: {
    margin: '0 0 5px 0',
    fontSize: '16px',
    color: '#333'
  },
  layerDesc: {
    margin: '0 0 10px 0',
    fontSize: '14px',
    color: '#666'
  },
  fileList: {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap' as const
  },
  fileTag: {
    padding: '4px 8px',
    backgroundColor: '#e9ecef',
    borderRadius: '4px',
    fontSize: '12px',
    color: '#495057'
  },
  milestonesSection: {
    marginBottom: '40px'
  },
  milestonesHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px'
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
  textarea: {
    padding: '8px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px',
    fontFamily: 'inherit'
  },
  checkboxContainer: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '10px'
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
    color: '#333'
  },
  formButtons: {
    display: 'flex',
    gap: '10px',
    justifyContent: 'flex-end'
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
  milestonesList: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '15px'
  },
  milestoneCard: {
    padding: '15px',
    backgroundColor: 'white',
    borderRadius: '8px',
    border: '1px solid #e9ecef',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
  },
  milestoneHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px'
  },
  weekBadge: {
    padding: '4px 8px',
    backgroundColor: '#007bff',
    color: 'white',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: 'bold'
  },
  milestoneActions: {
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
  checkbox: {
    width: '20px',
    height: '20px',
    cursor: 'pointer'
  },
  milestoneTask: {
    margin: '0 0 8px 0',
    fontSize: '16px',
    color: '#333'
  },
  milestoneNotes: {
    margin: '0 0 8px 0',
    fontSize: '14px',
    color: '#666',
    lineHeight: '1.4'
  },
  completedDate: {
    fontSize: '12px',
    color: '#28a745'
  },
  apiSection: {
    marginBottom: '40px'
  },
  apiGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '20px'
  },
  apiCard: {
    padding: '20px',
    backgroundColor: '#1e1e1e',
    borderRadius: '8px',
    color: '#fff'
  },
  apiTitle: {
    margin: '0 0 15px 0',
    fontSize: '16px',
    color: '#FF8C42'
  },
  codeBlock: {
    backgroundColor: '#2d2d2d',
    padding: '15px',
    borderRadius: '4px',
    fontSize: '12px',
    lineHeight: '1.5',
    overflowX: 'auto' as const,
    color: '#d4d4d4',
    fontFamily: 'monospace'
  },
  metricsSection: {
    marginBottom: '20px'
  },
  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '15px'
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
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#FF8C42',
    marginBottom: '5px'
  },
  metricLabel: {
    fontSize: '14px',
    color: '#6c757d'
  }
};

export default TechnicalLog;