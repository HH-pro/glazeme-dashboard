// src/components/BuildUpdates.tsx
import React, { useState, useEffect } from 'react';
import { BuildUpdate } from '../types';

interface Props {
  updates: BuildUpdate[];
  onAddUpdate: (update: Omit<BuildUpdate, 'id'>) => void;
  onEditUpdate?: (id: number, update: Omit<BuildUpdate, 'id'>) => void;
  onDeleteUpdate?: (id: number) => void;
  isEditMode?: boolean;
  onEditAction?: () => void;
}

const BuildUpdates: React.FC<Props> = ({ 
  updates, 
  onAddUpdate, 
  onEditUpdate,
  onDeleteUpdate,
  isEditMode = false, 
  onEditAction 
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingUpdate, setEditingUpdate] = useState<BuildUpdate | null>(null);
  const [newUpdate, setNewUpdate] = useState({
    weekNumber: 1,
    title: '',
    description: '',
    category: 'development' as const,
    status: 'in-progress' as const,
    priority: 'medium' as const,
    timeSpent: 0
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

  const handleAddClick = () => {
    if (!isEditMode && onEditAction) {
      onEditAction();
      return;
    }
    setShowAddForm(true);
    setEditingUpdate(null);
    setNewUpdate({
      weekNumber: 1,
      title: '',
      description: '',
      category: 'development',
      status: 'in-progress',
      priority: 'medium',
      timeSpent: 0
    });
  };

  const handleEditClick = (update: BuildUpdate) => {
    if (!isEditMode && onEditAction) {
      onEditAction();
      return;
    }
    setEditingUpdate(update);
    setNewUpdate({
      weekNumber: update.weekNumber,
      title: update.title,
      description: update.description,
      category: update.category,
      status: update.status,
      priority: update.priority || 'medium',
      timeSpent: update.timeSpent || 0
    });
    setShowAddForm(true);
  };

  const handleDeleteClick = (id: number) => {
    if (!isEditMode && onEditAction) {
      onEditAction();
      return;
    }
    
    if (window.confirm('Are you sure you want to delete this update?')) {
      onDeleteUpdate?.(id);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingUpdate) {
      onEditUpdate?.(editingUpdate.id, {
        ...newUpdate,
        date: editingUpdate.date
      });
    } else {
      onAddUpdate({
        ...newUpdate,
        date: new Date()
      });
    }
    
    setShowAddForm(false);
    setEditingUpdate(null);
    setNewUpdate({
      weekNumber: 1,
      title: '',
      description: '',
      category: 'development',
      status: 'in-progress',
      priority: 'medium',
      timeSpent: 0
    });
  };

  const cancelForm = () => {
    setShowAddForm(false);
    setEditingUpdate(null);
    setNewUpdate({
      weekNumber: 1,
      title: '',
      description: '',
      category: 'development',
      status: 'in-progress',
      priority: 'medium',
      timeSpent: 0
    });
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'completed': return '#28a745';
      case 'in-progress': return '#ffc107';
      case 'planned': return '#6c757d';
      default: return '#6c757d';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch(priority) {
      case 'high': return '#dc3545';
      case 'medium': return '#ffc107';
      case 'low': return '#28a745';
      default: return '#6c757d';
    }
  };

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
    updateHeader: {
      flexDirection: 'column' as const,
      alignItems: 'flex-start',
      gap: '10px',
    },
    leftHeader: {
      width: '100%',
      justifyContent: 'space-between',
    },
    updateFooter: {
      flexDirection: 'column' as const,
      alignItems: 'flex-start',
      gap: '10px',
    },
    leftFooter: {
      width: '100%',
      justifyContent: 'space-between',
    },
  };

  return (
    <div style={styles.container}>
      <div style={{
        ...styles.header,
        ...(isMobile ? mobileStyles.header : {})
      }}>
        <h2 style={styles.sectionTitle}>📋 Live Build Updates</h2>
        <button 
          onClick={handleAddClick}
          style={{
            ...styles.addButton,
            backgroundColor: isEditMode ? '#FF8C42' : '#6c757d',
            cursor: isEditMode ? 'pointer' : 'not-allowed',
            width: isMobile ? '100%' : 'auto'
          }}
        >
          {isEditMode ? '+ Add Update' : '🔒 Edit Mode Required'}
        </button>
      </div>

      {/* Edit Mode Indicator */}
      {isEditMode && !showAddForm && (
        <div style={styles.editModeIndicator}>
          ✏️ Edit Mode Active - You can manage updates
        </div>
      )}

      {showAddForm && isEditMode && (
        <form onSubmit={handleSubmit} style={styles.form}>
          <h4 style={styles.formTitle}>
            {editingUpdate ? '✏️ Edit Update' : '➕ Add New Update'}
          </h4>
          
          <div style={{
            ...styles.formRow,
            ...(isMobile ? mobileStyles.formRow : {})
          }}>
            <input
              type="number"
              placeholder="Week Number"
              value={newUpdate.weekNumber}
              onChange={(e) => setNewUpdate({...newUpdate, weekNumber: parseInt(e.target.value)})}
              style={{...styles.input, width: isMobile ? '100%' : '100px'}}
              required
              min="1"
            />
            <input
              type="number"
              placeholder="Time Spent (hours)"
              value={newUpdate.timeSpent || ''}
              onChange={(e) => setNewUpdate({...newUpdate, timeSpent: parseInt(e.target.value)})}
              style={{...styles.input, width: isMobile ? '100%' : '150px'}}
              min="0"
            />
          </div>
          
          <input
            type="text"
            placeholder="Title"
            value={newUpdate.title}
            onChange={(e) => setNewUpdate({...newUpdate, title: e.target.value})}
            style={styles.input}
            required
          />
          
          <textarea
            placeholder="Description"
            value={newUpdate.description}
            onChange={(e) => setNewUpdate({...newUpdate, description: e.target.value})}
            style={styles.textarea}
            required
          />
          
          <div style={{
            ...styles.formRow,
            ...(isMobile ? mobileStyles.formRow : {})
          }}>
            <select
              value={newUpdate.category}
              onChange={(e) => setNewUpdate({...newUpdate, category: e.target.value as any})}
              style={styles.select}
            >
              <option value="development">Development</option>
              <option value="design">Design</option>
              <option value="ai-integration">AI Integration</option>
              <option value="testing">Testing</option>
              <option value="deployment">Deployment</option>
            </select>
            
            <select
              value={newUpdate.status}
              onChange={(e) => setNewUpdate({...newUpdate, status: e.target.value as any})}
              style={styles.select}
            >
              <option value="planned">Planned</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
            
            <select
              value={newUpdate.priority}
              onChange={(e) => setNewUpdate({...newUpdate, priority: e.target.value as any})}
              style={styles.select}
            >
              <option value="low">Low Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="high">High Priority</option>
            </select>
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
              {editingUpdate ? 'Update' : 'Post Update'}
            </button>
          </div>
        </form>
      )}

      <div style={styles.timeline}>
        {updates.map((update) => (
          <div key={update.id} style={styles.updateCard}>
            <div style={{
              ...styles.updateHeader,
              ...(isMobile ? mobileStyles.updateHeader : {})
            }}>
              <div style={{
                ...styles.leftHeader,
                ...(isMobile ? mobileStyles.leftHeader : {})
              }}>
                <span style={styles.weekBadge}>Week {update.weekNumber}</span>
                <span style={{...styles.priorityBadge, backgroundColor: getPriorityColor(update.priority || 'medium')}}>
                  {update.priority || 'medium'} priority
                </span>
              </div>
              <div style={styles.rightHeader}>
                {isEditMode && (
                  <>
                    <button 
                      onClick={() => handleEditClick(update)}
                      style={styles.editButton}
                      title="Edit update"
                    >
                      ✏️
                    </button>
                    <button 
                      onClick={() => handleDeleteClick(update.id)}
                      style={styles.deleteButton}
                      title="Delete update"
                    >
                      🗑️
                    </button>
                  </>
                )}
                <span style={{...styles.statusBadge, backgroundColor: getStatusColor(update.status)}}>
                  {update.status}
                </span>
              </div>
            </div>
            
            <h3 style={styles.updateTitle}>{update.title}</h3>
            <p style={styles.updateDescription}>{update.description}</p>
            
            <div style={{
              ...styles.updateFooter,
              ...(isMobile ? mobileStyles.updateFooter : {})
            }}>
              <div style={{
                ...styles.leftFooter,
                ...(isMobile ? mobileStyles.leftFooter : {})
              }}>
                <span style={styles.categoryTag}>{update.category}</span>
                {update.timeSpent > 0 && (
                  <span style={styles.timeSpent}>⏱️ {update.timeSpent}h</span>
                )}
              </div>
              <span style={styles.date}>{new Date(update.date).toLocaleDateString()}</span>
            </div>
          </div>
        ))}
      </div>
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
    fontSize: 'clamp(20px, 5vw, 24px)',
    margin: 0,
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
    outline: 'none',
    transition: 'border-color 0.2s',
    width: '100%',
    boxSizing: 'border-box' as const,
  },
  textarea: {
    padding: '12px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    fontSize: 'clamp(14px, 4vw, 16px)',
    minHeight: '100px',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box' as const,
    resize: 'vertical' as const,
  },
  select: {
    padding: '12px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    fontSize: 'clamp(14px, 4vw, 16px)',
    flex: 1,
    outline: 'none',
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
  timeline: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '15px'
  },
  updateCard: {
    padding: '20px',
    backgroundColor: 'white',
    borderRadius: '16px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
    border: '1px solid #eee',
    transition: 'transform 0.2s',
    ':active': {
      transform: 'scale(0.99)',
    },
    '@media (max-width: 768px)': {
      padding: '16px',
    },
  },
  updateHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '15px'
  },
  leftHeader: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
    flexWrap: 'wrap' as const,
  },
  rightHeader: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
    flexWrap: 'wrap' as const,
  },
  weekBadge: {
    padding: '6px 12px',
    backgroundColor: '#e9ecef',
    borderRadius: '6px',
    fontSize: 'clamp(12px, 3vw, 13px)',
    fontWeight: 'bold'
  },
  priorityBadge: {
    padding: '6px 12px',
    borderRadius: '6px',
    fontSize: 'clamp(12px, 3vw, 13px)',
    color: 'white',
    fontWeight: '500',
  },
  statusBadge: {
    padding: '6px 12px',
    borderRadius: '6px',
    fontSize: 'clamp(12px, 3vw, 13px)',
    color: 'white',
    fontWeight: '500',
  },
  editButton: {
    padding: '8px 12px',
    backgroundColor: '#f8f9fa',
    border: '1px solid #dee2e6',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    transition: 'all 0.2s',
    ':hover': {
      backgroundColor: '#e9ecef',
    },
  },
  deleteButton: {
    padding: '8px 12px',
    backgroundColor: '#f8d7da',
    border: '1px solid #f5c6cb',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    transition: 'all 0.2s',
    ':hover': {
      backgroundColor: '#dc3545',
      color: 'white',
    },
  },
  updateTitle: {
    fontSize: 'clamp(16px, 4vw, 18px)',
    margin: '0 0 10px 0',
    color: '#333'
  },
  updateDescription: {
    fontSize: 'clamp(14px, 4vw, 15px)',
    color: '#666',
    margin: '0 0 15px 0',
    lineHeight: '1.5'
  },
  updateFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTop: '1px solid #eee',
    paddingTop: '15px',
    flexWrap: 'wrap' as const,
    gap: '10px',
  },
  leftFooter: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
    flexWrap: 'wrap' as const,
  },
  categoryTag: {
    padding: '4px 10px',
    backgroundColor: '#f8f9fa',
    borderRadius: '6px',
    fontSize: 'clamp(12px, 3vw, 13px)',
    color: '#666',
    border: '1px solid #dee2e6',
  },
  timeSpent: {
    fontSize: 'clamp(12px, 3vw, 13px)',
    color: '#666',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  date: {
    fontSize: 'clamp(12px, 3vw, 13px)',
    color: '#999'
  }
};

export default BuildUpdates;