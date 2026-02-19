// src/components/BuildUpdates.tsx
import React, { useState } from 'react';
import { BuildUpdate } from '../types';

interface Props {
  updates: BuildUpdate[];
  onAddUpdate: (update: Omit<BuildUpdate, 'id'>) => void;
  onEditUpdate: (id: string, update: Partial<BuildUpdate>) => void;
  onDeleteUpdate: (id: string) => void;
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
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [newUpdate, setNewUpdate] = useState({
    weekNumber: 1,
    title: '',
    description: '',
    category: 'development' as const,
    status: 'in-progress' as const,
    priority: 'medium' as const,
    timeSpent: 0
  });

  const handleAddClick = () => {
    if (!isEditMode && onEditAction) {
      onEditAction();
      return;
    }
    setShowAddForm(true);
    setEditingUpdate(null);
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

  const handleDeleteClick = (id: string) => {
    if (!isEditMode && onEditAction) {
      onEditAction();
      return;
    }
    setDeleteConfirm(id);
  };

  const confirmDelete = (id: string) => {
    onDeleteUpdate(id);
    setDeleteConfirm(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingUpdate) {
      onEditUpdate(editingUpdate.id, {
        ...newUpdate,
        date: editingUpdate.date // Keep original date
      });
    } else {
      onAddUpdate({
        ...newUpdate,
        date: new Date(),
        priority: newUpdate.priority,
        timeSpent: newUpdate.timeSpent
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

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.titleSection}>
          <h2 style={styles.sectionTitle}>📋 Live Build Updates</h2>
          <span style={styles.updateCount}>{updates.length} updates</span>
        </div>
        <button 
          onClick={handleAddClick}
          style={{
            ...styles.addButton,
            backgroundColor: isEditMode ? '#FF8C42' : '#6c757d',
            cursor: isEditMode ? 'pointer' : 'not-allowed',
            opacity: isEditMode ? 1 : 0.7
          }}
          disabled={!isEditMode}
        >
          {isEditMode ? '+ Add Update' : '🔒 Edit Mode Required'}
        </button>
      </div>

      {/* Edit Mode Indicator */}
      {isEditMode && !showAddForm && (
        <div style={styles.editModeIndicator}>
          ✏️ Edit Mode Active - You can add, edit, or delete updates
        </div>
      )}

      {/* Add/Edit Form */}
      {showAddForm && isEditMode && (
        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.formHeader}>
            <h3 style={styles.formTitle}>
              {editingUpdate ? '✏️ Edit Update' : '➕ Add New Update'}
            </h3>
            <button 
              type="button" 
              onClick={() => {
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
              }}
              style={styles.closeButton}
            >
              ×
            </button>
          </div>

          <div style={styles.formGrid}>
            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Week Number</label>
                <input
                  type="number"
                  value={newUpdate.weekNumber}
                  onChange={(e) => setNewUpdate({...newUpdate, weekNumber: parseInt(e.target.value)})}
                  style={styles.input}
                  required
                  min="1"
                />
              </div>
              
              <div style={styles.formGroup}>
                <label style={styles.label}>Time Spent (hours)</label>
                <input
                  type="number"
                  value={newUpdate.timeSpent || ''}
                  onChange={(e) => setNewUpdate({...newUpdate, timeSpent: parseInt(e.target.value) || 0})}
                  style={styles.input}
                  min="0"
                />
              </div>
            </div>
            
            <div style={styles.formGroup}>
              <label style={styles.label}>Title</label>
              <input
                type="text"
                placeholder="Enter update title"
                value={newUpdate.title}
                onChange={(e) => setNewUpdate({...newUpdate, title: e.target.value})}
                style={styles.input}
                required
              />
            </div>
            
            <div style={styles.formGroup}>
              <label style={styles.label}>Description</label>
              <textarea
                placeholder="Enter detailed description"
                value={newUpdate.description}
                onChange={(e) => setNewUpdate({...newUpdate, description: e.target.value})}
                style={styles.textarea}
                required
              />
            </div>
            
            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Category</label>
                <select
                  value={newUpdate.category}
                  onChange={(e) => setNewUpdate({...newUpdate, category: e.target.value as any})}
                  style={styles.select}
                >
                  <option value="development">💻 Development</option>
                  <option value="design">🎨 Design</option>
                  <option value="ai-integration">🤖 AI Integration</option>
                  <option value="testing">🧪 Testing</option>
                  <option value="deployment">🚀 Deployment</option>
                </select>
              </div>
              
              <div style={styles.formGroup}>
                <label style={styles.label}>Status</label>
                <select
                  value={newUpdate.status}
                  onChange={(e) => setNewUpdate({...newUpdate, status: e.target.value as any})}
                  style={styles.select}
                >
                  <option value="planned">📅 Planned</option>
                  <option value="in-progress">⚙️ In Progress</option>
                  <option value="completed">✅ Completed</option>
                </select>
              </div>
              
              <div style={styles.formGroup}>
                <label style={styles.label}>Priority</label>
                <select
                  value={newUpdate.priority}
                  onChange={(e) => setNewUpdate({...newUpdate, priority: e.target.value as any})}
                  style={styles.select}
                >
                  <option value="low">🔵 Low</option>
                  <option value="medium">🟡 Medium</option>
                  <option value="high">🔴 High</option>
                </select>
              </div>
            </div>
          </div>
          
          <div style={styles.formButtons}>
            <button 
              type="button" 
              onClick={() => {
                setShowAddForm(false);
                setEditingUpdate(null);
              }} 
              style={styles.cancelButton}
            >
              Cancel
            </button>
            <button type="submit" style={styles.submitButton}>
              {editingUpdate ? 'Save Changes' : 'Post Update'}
            </button>
          </div>
        </form>
      )}

      {/* Timeline */}
      <div style={styles.timeline}>
        {updates.map((update) => (
          <div key={update.id} style={styles.updateCard}>
            {isEditMode && (
              <div style={styles.cardActions}>
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
              </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteConfirm === update.id && (
              <div style={styles.deleteConfirmOverlay}>
                <div style={styles.deleteConfirm}>
                  <p style={styles.deleteConfirmText}>Delete this update?</p>
                  <div style={styles.deleteConfirmButtons}>
                    <button
                      onClick={() => setDeleteConfirm(null)}
                      style={styles.deleteCancelButton}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => confirmDelete(update.id)}
                      style={styles.deleteConfirmButton}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            <div style={styles.updateHeader}>
              <div style={styles.leftHeader}>
                <span style={styles.weekBadge}>Week {update.weekNumber}</span>
                <span style={{...styles.priorityBadge, backgroundColor: getPriorityColor(update.priority || 'medium')}}>
                  {update.priority || 'medium'} priority
                </span>
              </div>
              <span style={{...styles.statusBadge, backgroundColor: getStatusColor(update.status)}}>
                {update.status === 'in-progress' ? 'In Progress' : 
                 update.status === 'completed' ? 'Completed' : 'Planned'}
              </span>
            </div>
            
            <h3 style={styles.updateTitle}>{update.title}</h3>
            <p style={styles.updateDescription}>{update.description}</p>
            
            <div style={styles.updateFooter}>
              <div style={styles.leftFooter}>
                <span style={styles.categoryTag}>
                  {update.category === 'development' && '💻 '}
                  {update.category === 'design' && '🎨 '}
                  {update.category === 'ai-integration' && '🤖 '}
                  {update.category === 'testing' && '🧪 '}
                  {update.category === 'deployment' && '🚀 '}
                  {update.category.replace('-', ' ')}
                </span>
                {update.timeSpent > 0 && (
                  <span style={styles.timeSpent}>⏱️ {update.timeSpent}h</span>
                )}
              </div>
              <span style={styles.date}>
                {new Date(update.date).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {updates.length === 0 && (
        <div style={styles.emptyState}>
          <span style={styles.emptyStateIcon}>📋</span>
          <h3 style={styles.emptyStateTitle}>No Updates Yet</h3>
          <p style={styles.emptyStateText}>
            {isEditMode 
              ? 'Click the "Add Update" button to create your first build update.'
              : 'No updates have been added yet. Enable edit mode to add updates.'}
          </p>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    width: '100%',
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '20px',
    boxSizing: 'border-box' as const
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    flexWrap: 'wrap' as const,
    gap: '15px'
  },
  titleSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    flexWrap: 'wrap' as const
  },
  sectionTitle: {
    fontSize: 'clamp(20px, 4vw, 24px)',
    margin: 0,
    color: '#333'
  },
  updateCount: {
    padding: '4px 8px',
    backgroundColor: '#e9ecef',
    borderRadius: '12px',
    fontSize: '12px',
    color: '#495057',
    fontWeight: '500'
  },
  addButton: {
    padding: '10px 20px',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'background-color 0.2s',
    whiteSpace: 'nowrap' as const,
    cursor: 'pointer'
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
    backgroundColor: '#f8f9fa',
    borderRadius: '12px',
    padding: '20px',
    marginBottom: '30px',
    border: '2px solid #FF8C42',
    boxShadow: '0 4px 12px rgba(255, 140, 66, 0.1)'
  },
  formHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px'
  },
  formTitle: {
    fontSize: '18px',
    margin: 0,
    color: '#333'
  },
  closeButton: {
    width: '30px',
    height: '30px',
    borderRadius: '50%',
    border: 'none',
    backgroundColor: '#6c757d',
    color: 'white',
    fontSize: '20px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background-color 0.2s'
  },
  formGrid: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '15px'
  },
  formRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '15px'
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '5px'
  },
  label: {
    fontSize: '12px',
    color: '#666',
    fontWeight: '500'
  },
  input: {
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '14px',
    outline: 'none',
    transition: 'border-color 0.2s',
    width: '100%',
    boxSizing: 'border-box' as const
  },
  textarea: {
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '14px',
    minHeight: '100px',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box' as const,
    resize: 'vertical' as const
  },
  select: {
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '14px',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box' as const
  },
  formButtons: {
    display: 'flex',
    gap: '10px',
    justifyContent: 'flex-end',
    marginTop: '20px',
    flexWrap: 'wrap' as const
  },
  submitButton: {
    padding: '12px 24px',
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'background-color 0.2s'
  },
  cancelButton: {
    padding: '12px 24px',
    backgroundColor: '#6c757d',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'background-color 0.2s'
  },
  timeline: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '15px'
  },
  updateCard: {
    padding: '20px',
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    border: '1px solid #eee',
    position: 'relative' as const,
    transition: 'transform 0.2s, boxShadow 0.2s'
  },
  cardActions: {
    position: 'absolute' as const,
    top: '10px',
    right: '10px',
    display: 'flex',
    gap: '5px',
    zIndex: 1
  },
  editButton: {
    padding: '6px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    transition: 'background-color 0.2s'
  },
  deleteButton: {
    padding: '6px',
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    transition: 'background-color 0.2s'
  },
  deleteConfirmOverlay: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2
  },
  deleteConfirm: {
    backgroundColor: 'white',
    padding: '15px',
    borderRadius: '8px',
    textAlign: 'center' as const,
    maxWidth: '250px',
    width: '90%'
  },
  deleteConfirmText: {
    margin: '0 0 15px 0',
    fontSize: '14px',
    color: '#333'
  },
  deleteConfirmButtons: {
    display: 'flex',
    gap: '10px',
    justifyContent: 'center'
  },
  deleteCancelButton: {
    padding: '8px 16px',
    backgroundColor: '#6c757d',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px'
  },
  deleteConfirmButton: {
    padding: '8px 16px',
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px'
  },
  updateHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '15px',
    flexWrap: 'wrap' as const,
    gap: '10px'
  },
  leftHeader: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
    flexWrap: 'wrap' as const
  },
  weekBadge: {
    padding: '4px 8px',
    backgroundColor: '#e9ecef',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: 'bold'
  },
  priorityBadge: {
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '12px',
    color: 'white',
    textTransform: 'capitalize' as const
  },
  statusBadge: {
    padding: '4px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    color: 'white',
    textTransform: 'capitalize' as const
  },
  updateTitle: {
    fontSize: 'clamp(16px, 3vw, 18px)',
    margin: '0 0 10px 0',
    color: '#333',
    paddingRight: isEditMode ? '60px' : '0'
  },
  updateDescription: {
    fontSize: '14px',
    color: '#666',
    margin: '0 0 15px 0',
    lineHeight: '1.6'
  },
  updateFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTop: '1px solid #eee',
    paddingTop: '15px',
    flexWrap: 'wrap' as const,
    gap: '10px'
  },
  leftFooter: {
    display: 'flex',
    gap: '10px',
    alignItems: 'center',
    flexWrap: 'wrap' as const
  },
  categoryTag: {
    padding: '4px 10px',
    backgroundColor: '#f8f9fa',
    borderRadius: '20px',
    fontSize: '12px',
    color: '#495057',
    border: '1px solid #dee2e6',
    textTransform: 'capitalize' as const
  },
  timeSpent: {
    fontSize: '12px',
    color: '#666',
    display: 'flex',
    alignItems: 'center',
    gap: '4px'
  },
  date: {
    fontSize: '12px',
    color: '#999'
  },
  emptyState: {
    textAlign: 'center' as const,
    padding: 'clamp(40px, 8vw, 60px) 20px',
    backgroundColor: '#f8f9fa',
    borderRadius: '12px',
    border: '2px dashed #dee2e6'
  },
  emptyStateIcon: {
    fontSize: 'clamp(40px, 6vw, 48px)',
    display: 'block',
    marginBottom: '16px'
  },
  emptyStateTitle: {
    fontSize: 'clamp(18px, 4vw, 20px)',
    color: '#333',
    marginBottom: '8px'
  },
  emptyStateText: {
    fontSize: '14px',
    color: '#6c757d',
    maxWidth: '400px',
    margin: '0 auto'
  }
};

export default BuildUpdates;