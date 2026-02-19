// src/components/BuildUpdates.tsx
import React, { useState } from 'react';
import { BuildUpdate } from '../types';

interface Props {
  updates: BuildUpdate[];
  onAddUpdate: (update: Omit<BuildUpdate, 'id'>) => void;
  isEditMode?: boolean;
  onEditAction?: () => void;
}

const BuildUpdates: React.FC<Props> = ({ updates, onAddUpdate, isEditMode = false, onEditAction }) => {
  const [showAddForm, setShowAddForm] = useState(false);
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
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddUpdate({
      ...newUpdate,
      date: new Date(),
      priority: newUpdate.priority,
      timeSpent: newUpdate.timeSpent
    });
    setShowAddForm(false);
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
    <div>
      <div style={styles.header}>
        <h2 style={styles.sectionTitle}>📋 Live Build Updates</h2>
        <button 
          onClick={handleAddClick}
          style={{
            ...styles.addButton,
            backgroundColor: isEditMode ? '#FF8C42' : '#6c757d'
          }}
        >
          {isEditMode ? '+ Add Update' : '🔒 Edit Mode Required'}
        </button>
      </div>

      {/* Edit Mode Indicator */}
      {isEditMode && !showAddForm && (
        <div style={styles.editModeIndicator}>
          ✏️ Edit Mode Active - You can add new updates
        </div>
      )}

      {showAddForm && isEditMode && (
        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.formRow}>
            <input
              type="number"
              placeholder="Week Number"
              value={newUpdate.weekNumber}
              onChange={(e) => setNewUpdate({...newUpdate, weekNumber: parseInt(e.target.value)})}
              style={{...styles.input, width: '100px'}}
              required
              min="1"
            />
            <input
              type="number"
              placeholder="Time Spent (hours)"
              value={newUpdate.timeSpent || ''}
              onChange={(e) => setNewUpdate({...newUpdate, timeSpent: parseInt(e.target.value)})}
              style={{...styles.input, width: '150px'}}
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
          
          <div style={styles.formRow}>
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
            <button type="button" onClick={() => setShowAddForm(false)} style={styles.cancelButton}>
              Cancel
            </button>
            <button type="submit" style={styles.submitButton}>
              Post Update
            </button>
          </div>
        </form>
      )}

      <div style={styles.timeline}>
        {updates.map((update) => (
          <div key={update.id} style={styles.updateCard}>
            <div style={styles.updateHeader}>
              <div style={styles.leftHeader}>
                <span style={styles.weekBadge}>Week {update.weekNumber}</span>
                <span style={{...styles.priorityBadge, backgroundColor: getPriorityColor(update.priority || 'medium')}}>
                  {update.priority || 'medium'} priority
                </span>
              </div>
              <span style={{...styles.statusBadge, backgroundColor: getStatusColor(update.status)}}>
                {update.status}
              </span>
            </div>
            
            <h3 style={styles.updateTitle}>{update.title}</h3>
            <p style={styles.updateDescription}>{update.description}</p>
            
            <div style={styles.updateFooter}>
              <div style={styles.leftFooter}>
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
  formRow: {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap' as const
  },
  input: {
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px',
    flex: 1,
    outline: 'none',
    transition: 'border-color 0.2s'
  },
  textarea: {
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px',
    minHeight: '80px',
    outline: 'none'
  },
  select: {
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px',
    flex: 1,
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
  timeline: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '15px'
  },
  updateCard: {
    padding: '15px',
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    border: '1px solid #eee'
  },
  updateHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px'
  },
  leftHeader: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center'
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
    color: 'white'
  },
  statusBadge: {
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '12px',
    color: 'white'
  },
  updateTitle: {
    fontSize: '18px',
    margin: '0 0 10px 0',
    color: '#333'
  },
  updateDescription: {
    fontSize: '14px',
    color: '#666',
    margin: '0 0 10px 0',
    lineHeight: '1.5'
  },
  updateFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTop: '1px solid #eee',
    paddingTop: '10px'
  },
  leftFooter: {
    display: 'flex',
    gap: '10px',
    alignItems: 'center'
  },
  categoryTag: {
    padding: '2px 6px',
    backgroundColor: '#f8f9fa',
    borderRadius: '3px',
    fontSize: '12px',
    color: '#666'
  },
  timeSpent: {
    fontSize: '12px',
    color: '#666'
  },
  date: {
    fontSize: '12px',
    color: '#999'
  }
};

export default BuildUpdates;