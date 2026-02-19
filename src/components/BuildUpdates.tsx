// src/components/BuildUpdates.tsx
import React, { useState } from 'react';
import { BuildUpdate } from '../types';

interface Props {
  updates: BuildUpdate[];
  onAddUpdate: (update: Omit<BuildUpdate, 'id'>) => void;
  onUpdateUpdate: (id: string, update: Partial<BuildUpdate>) => void;
  onDeleteUpdate: (id: string) => void;
  isAdmin: boolean;
}

const BuildUpdates: React.FC<Props> = ({ 
  updates, 
  onAddUpdate, 
  onUpdateUpdate, 
  onDeleteUpdate,
  isAdmin 
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newUpdate, setNewUpdate] = useState({
    weekNumber: 1,
    title: '',
    description: '',
    category: 'development' as const,
    status: 'in-progress' as const,
    priority: 'medium' as const,
    timeSpent: 0
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddUpdate({
      ...newUpdate,
      date: new Date()
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

  const handleEdit = (update: BuildUpdate) => {
    setEditingId(update.id);
    setNewUpdate({
      weekNumber: update.weekNumber,
      title: update.title,
      description: update.description,
      category: update.category,
      status: update.status,
      priority: update.priority || 'medium',
      timeSpent: update.timeSpent || 0
    });
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      onUpdateUpdate(editingId, newUpdate);
      setEditingId(null);
      setNewUpdate({
        weekNumber: 1,
        title: '',
        description: '',
        category: 'development',
        status: 'in-progress',
        priority: 'medium',
        timeSpent: 0
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'completed': return '#28a745';
      case 'in-progress': return '#ffc107';
      case 'planned': return '#6c757d';
      case 'blocked': return '#dc3545';
      default: return '#6c757d';
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch(priority) {
      case 'high': return { backgroundColor: '#dc3545', color: 'white' };
      case 'medium': return { backgroundColor: '#ffc107', color: '#333' };
      case 'low': return { backgroundColor: '#28a745', color: 'white' };
      default: return { backgroundColor: '#6c757d', color: 'white' };
    }
  };

  return (
    <div>
      <div style={styles.header}>
        <div>
          <h2 style={styles.sectionTitle}>📋 Build Updates</h2>
          <p style={styles.subtitle}>
            {updates.length} total updates • Last update: {updates[0]?.date ? new Date(updates[0].date).toLocaleString() : 'Never'}
          </p>
        </div>
        {isAdmin && (
          <button 
            onClick={() => setShowAddForm(!showAddForm)}
            style={styles.addButton}
          >
            + New Update
          </button>
        )}
      </div>

      {isAdmin && showAddForm && (
        <form onSubmit={handleSubmit} style={styles.form}>
          <h3 style={styles.formTitle}>Add Build Update</h3>
          <div style={styles.formGrid}>
            <input
              type="text"
              placeholder="Title"
              value={newUpdate.title}
              onChange={(e) => setNewUpdate({...newUpdate, title: e.target.value})}
              style={styles.input}
              required
            />
            <input
              type="number"
              placeholder="Week Number"
              value={newUpdate.weekNumber}
              onChange={(e) => setNewUpdate({...newUpdate, weekNumber: parseInt(e.target.value)})}
              style={styles.input}
              min="1"
              max="6"
              required
            />
            <textarea
              placeholder="Description"
              value={newUpdate.description}
              onChange={(e) => setNewUpdate({...newUpdate, description: e.target.value})}
              style={styles.textarea}
              rows={3}
              required
            />
            <div style={styles.selectGroup}>
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
                <option value="backend">Backend</option>
                <option value="security">Security</option>
              </select>
              <select
                value={newUpdate.status}
                onChange={(e) => setNewUpdate({...newUpdate, status: e.target.value as any})}
                style={styles.select}
              >
                <option value="planned">Planned</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="blocked">Blocked</option>
              </select>
              <select
                value={newUpdate.priority}
                onChange={(e) => setNewUpdate({...newUpdate, priority: e.target.value as any})}
                style={styles.select}
              >
                <option value="high">High Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="low">Low Priority</option>
              </select>
              <input
                type="number"
                placeholder="Hours spent"
                value={newUpdate.timeSpent}
                onChange={(e) => setNewUpdate({...newUpdate, timeSpent: parseInt(e.target.value)})}
                style={styles.input}
                min="0"
              />
            </div>
          </div>
          <div style={styles.formActions}>
            <button type="submit" style={styles.submitButton}>Post Update</button>
            <button type="button" onClick={() => setShowAddForm(false)} style={styles.cancelButton}>Cancel</button>
          </div>
        </form>
      )}

      {isAdmin && editingId && (
        <form onSubmit={handleUpdate} style={styles.form}>
          <h3 style={styles.formTitle}>Edit Update</h3>
          <div style={styles.formGrid}>
            <input
              type="text"
              placeholder="Title"
              value={newUpdate.title}
              onChange={(e) => setNewUpdate({...newUpdate, title: e.target.value})}
              style={styles.input}
              required
            />
            <input
              type="number"
              placeholder="Week Number"
              value={newUpdate.weekNumber}
              onChange={(e) => setNewUpdate({...newUpdate, weekNumber: parseInt(e.target.value)})}
              style={styles.input}
              min="1"
              max="6"
              required
            />
            <textarea
              placeholder="Description"
              value={newUpdate.description}
              onChange={(e) => setNewUpdate({...newUpdate, description: e.target.value})}
              style={styles.textarea}
              rows={3}
              required
            />
            <div style={styles.selectGroup}>
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
                <option value="blocked">Blocked</option>
              </select>
            </div>
          </div>
          <div style={styles.formActions}>
            <button type="submit" style={styles.submitButton}>Update</button>
            <button type="button" onClick={() => setEditingId(null)} style={styles.cancelButton}>Cancel</button>
          </div>
        </form>
      )}

      <div style={styles.timeline}>
        {updates.map((update) => (
          <div key={update.id} style={styles.updateCard}>
            <div style={styles.updateHeader}>
              <div style={styles.updateMeta}>
                <span style={styles.weekBadge}>Week {update.weekNumber}</span>
                <span style={{...styles.statusBadge, backgroundColor: getStatusColor(update.status)}}>
                  {update.status}
                </span>
                {update.priority && (
                  <span style={{...styles.priorityBadge, ...getPriorityBadge(update.priority)}}>
                    {update.priority}
                  </span>
                )}
              </div>
              {isAdmin && (
                <div style={styles.actionButtons}>
                  <button onClick={() => handleEdit(update)} style={styles.editButton}>✏️</button>
                  <button onClick={() => onDeleteUpdate(update.id)} style={styles.deleteButton}>🗑️</button>
                </div>
              )}
            </div>
            <h3 style={styles.updateTitle}>{update.title}</h3>
            <p style={styles.updateDescription}>{update.description}</p>
            {update.timeSpent > 0 && (
              <p style={styles.timeSpent}>⏱️ {update.timeSpent} hours spent</p>
            )}
            <div style={styles.updateFooter}>
              <span style={styles.categoryTag}>{update.category}</span>
              <span style={styles.date}>{new Date(update.date).toLocaleString()}</span>
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
    fontSize: '22px',
    margin: '0 0 5px 0',
    color: '#333'
  },
  subtitle: {
    fontSize: '13px',
    color: '#6c757d',
    margin: 0
  },
  addButton: {
    padding: '10px 20px',
    backgroundColor: '#FF8C42',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500'
  },
  form: {
    padding: '20px',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    marginBottom: '20px',
    border: '1px solid #dee2e6'
  },
  formTitle: {
    margin: '0 0 15px 0',
    fontSize: '16px',
    color: '#333'
  },
  formGrid: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '10px',
    marginBottom: '15px'
  },
  input: {
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '14px'
  },
  textarea: {
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '14px',
    fontFamily: 'inherit'
  },
  selectGroup: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '10px'
  },
  select: {
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '14px',
    backgroundColor: 'white'
  },
  formActions: {
    display: 'flex',
    gap: '10px',
    justifyContent: 'flex-end'
  },
  submitButton: {
    padding: '10px 20px',
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer'
  },
  cancelButton: {
    padding: '10px 20px',
    backgroundColor: '#6c757d',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer'
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
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
    border: '1px solid #e9ecef'
  },
  updateHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px'
  },
  updateMeta: {
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
  statusBadge: {
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '12px',
    color: 'white'
  },
  priorityBadge: {
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '12px',
    textTransform: 'uppercase' as const
  },
  actionButtons: {
    display: 'flex',
    gap: '8px'
  },
  editButton: {
    padding: '4px 8px',
    border: 'none',
    backgroundColor: '#f8f9fa',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px'
  },
  deleteButton: {
    padding: '4px 8px',
    border: 'none',
    backgroundColor: '#f8f9fa',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px'
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
  timeSpent: {
    fontSize: '13px',
    color: '#666',
    margin: '0 0 10px 0'
  },
  updateFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTop: '1px solid #eee',
    paddingTop: '10px'
  },
  categoryTag: {
    padding: '2px 6px',
    backgroundColor: '#f8f9fa',
    borderRadius: '3px',
    fontSize: '12px',
    color: '#666'
  },
  date: {
    fontSize: '12px',
    color: '#999'
  }
};

export default BuildUpdates;