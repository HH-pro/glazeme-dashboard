// src/components/BuildUpdates.tsx
import React, { useState } from 'react';
import { BuildUpdate } from '../types';

// Define the possible types
type UpdateCategory = 'development' | 'design' | 'ai-integration' | 'testing' | 'deployment' | 'backend' | 'security';
type UpdateStatus = 'in-progress' | 'completed' | 'planned' | 'blocked';
type UpdatePriority = 'low' | 'medium' | 'high';

interface Props {
  updates: BuildUpdate[];
  onAddUpdate: (update: Omit<BuildUpdate, 'id'>) => void;
  onEditUpdate?: (updateId: string, updatedData: Partial<BuildUpdate>) => void;
  isAuthenticated?: boolean;
}

interface NewUpdateState {
  weekNumber: number;
  title: string;
  description: string;
  category: UpdateCategory;
  status: UpdateStatus;
  priority: UpdatePriority;
  timeSpent: number;
}

const BuildUpdates: React.FC<Props> = ({ 
  updates, 
  onAddUpdate, 
  onEditUpdate, 
  isAuthenticated = false 
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingUpdate, setEditingUpdate] = useState<BuildUpdate | null>(null);
  const [newUpdate, setNewUpdate] = useState<NewUpdateState>({
    weekNumber: 1,
    title: '',
    description: '',
    category: 'development',
    status: 'in-progress',
    priority: 'medium',
    timeSpent: 2
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingUpdate && onEditUpdate) {
      // Handle edit
      onEditUpdate(editingUpdate.id, {
        ...newUpdate,
        date: new Date()
      });
      setEditingUpdate(null);
    } else {
      // Handle add
      onAddUpdate({
        ...newUpdate,
        date: new Date()
      });
    }
    
    handleCancel();
  };

  const handleEdit = (update: BuildUpdate) => {
    setEditingUpdate(update);
    setNewUpdate({
      weekNumber: update.weekNumber,
      title: update.title,
      description: update.description,
      category: update.category as UpdateCategory,
      status: update.status as UpdateStatus,
      priority: (update.priority as UpdatePriority) || 'medium',
      timeSpent: update.timeSpent || 2
    });
    setShowAddForm(true);
  };

  const handleCancel = () => {
    setShowAddForm(false);
    setEditingUpdate(null);
    setNewUpdate({
      weekNumber: 1,
      title: '',
      description: '',
      category: 'development',
      status: 'in-progress',
      priority: 'medium',
      timeSpent: 2
    });
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

  return (
    <div>
      <div style={styles.header}>
        <h2 style={styles.sectionTitle}>Live Build Updates</h2>
        {isAuthenticated && (
          <button 
            onClick={() => setShowAddForm(!showAddForm)}
            style={styles.addButton}
          >
            + Add Update
          </button>
        )}
      </div>

      {showAddForm && (
        <form onSubmit={handleSubmit} style={styles.form}>
          <h3>{editingUpdate ? '✏️ Edit Update' : '📝 New Update'}</h3>
          
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
              value={newUpdate.weekNumber}
              onChange={(e) => setNewUpdate({...newUpdate, weekNumber: parseInt(e.target.value)})}
              style={styles.select}
            >
              {[1,2,3,4,5,6,7,8,9,10,11,12].map(week => (
                <option key={week} value={week}>Week {week}</option>
              ))}
            </select>

            <select
              value={newUpdate.category}
              onChange={(e) => setNewUpdate({...newUpdate, category: e.target.value as UpdateCategory})}
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
          </div>

          <div style={styles.formRow}>
            <select
              value={newUpdate.status}
              onChange={(e) => setNewUpdate({...newUpdate, status: e.target.value as UpdateStatus})}
              style={styles.select}
            >
              <option value="planned">📅 Planned</option>
              <option value="in-progress">⚙️ In Progress</option>
              <option value="completed">✅ Completed</option>
              <option value="blocked">🚫 Blocked</option>
            </select>

            <select
              value={newUpdate.priority}
              onChange={(e) => setNewUpdate({...newUpdate, priority: e.target.value as UpdatePriority})}
              style={styles.select}
            >
              <option value="low">🔽 Low Priority</option>
              <option value="medium">⏺️ Medium Priority</option>
              <option value="high">🔼 High Priority</option>
            </select>
          </div>

          <div style={styles.formRow}>
            <input
              type="number"
              placeholder="Time spent (hours)"
              value={newUpdate.timeSpent}
              onChange={(e) => setNewUpdate({...newUpdate, timeSpent: parseInt(e.target.value) || 0})}
              style={styles.input}
              min="0"
            />
          </div>

          <div style={styles.buttonGroup}>
            <button type="button" onClick={handleCancel} style={styles.cancelButton}>
              Cancel
            </button>
            <button type="submit" style={styles.submitButton}>
              {editingUpdate ? 'Update Update' : 'Post Update'}
            </button>
          </div>
        </form>
      )}

      <div style={styles.timeline}>
        {updates.map((update) => (
          <div key={update.id} style={styles.updateCard}>
            <div style={styles.updateHeader}>
              <div style={styles.headerLeft}>
                <span style={styles.weekBadge}>Week {update.weekNumber}</span>
                {update.priority && (
                  <span style={{
                    ...styles.priorityBadge,
                    backgroundColor: update.priority === 'high' ? '#dc3545' : 
                                   update.priority === 'medium' ? '#ffc107' : '#28a745',
                    color: update.priority === 'medium' ? '#000' : '#fff'
                  }}>
                    {update.priority === 'high' && '🔥 '}
                    {update.priority === 'medium' && '⚡ '}
                    {update.priority === 'low' && '💤 '}
                    {update.priority} priority
                  </span>
                )}
              </div>
              <div style={styles.headerRight}>
                <span style={{...styles.statusBadge, backgroundColor: getStatusColor(update.status)}}>
                  {update.status === 'completed' && '✅ '}
                  {update.status === 'in-progress' && '⚙️ '}
                  {update.status === 'planned' && '📅 '}
                  {update.status === 'blocked' && '🚫 '}
                  {update.status}
                </span>
                {isAuthenticated && onEditUpdate && (
                  <button 
                    onClick={() => handleEdit(update)}
                    style={styles.editButton}
                    title="Edit update"
                  >
                    ✏️
                  </button>
                )}
              </div>
            </div>
            
            <h3 style={styles.updateTitle}>{update.title}</h3>
            <p style={styles.updateDescription}>{update.description}</p>
            
            {update.timeSpent && (
              <div style={styles.timeSpent}>
                ⏱️ {update.timeSpent} hour{update.timeSpent !== 1 ? 's' : ''} spent
              </div>
            )}
            
            <div style={styles.updateFooter}>
              <span style={styles.categoryTag}>
                {update.category === 'development' && '💻 '}
                {update.category === 'design' && '🎨 '}
                {update.category === 'ai-integration' && '🤖 '}
                {update.category === 'testing' && '🧪 '}
                {update.category === 'deployment' && '🚀 '}
                {update.category === 'backend' && '⚙️ '}
                {update.category === 'security' && '🔒 '}
                {update.category}
              </span>
              <span style={styles.date}>
                📅 {new Date(update.date).toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric',
                  year: 'numeric'
                })}
              </span>
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
    backgroundColor: '#FF8C42',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'background-color 0.2s',
    ':hover': {
      backgroundColor: '#f57c00'
    }
  },
  form: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '10px',
    padding: '20px',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    marginBottom: '20px',
    border: '1px solid #dee2e6'
  },
  formRow: {
    display: 'flex',
    gap: '10px'
  },
  input: {
    flex: 1,
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px'
  },
  textarea: {
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px',
    minHeight: '80px',
    resize: 'vertical' as const,
    fontFamily: 'inherit'
  },
  select: {
    flex: 1,
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px',
    backgroundColor: 'white',
    cursor: 'pointer'
  },
  buttonGroup: {
    display: 'flex',
    gap: '10px',
    justifyContent: 'flex-end',
    marginTop: '10px'
  },
  cancelButton: {
    padding: '10px 20px',
    backgroundColor: '#6c757d',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    transition: 'background-color 0.2s',
    ':hover': {
      backgroundColor: '#5a6268'
    }
  },
  submitButton: {
    padding: '10px 20px',
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    transition: 'background-color 0.2s',
    ':hover': {
      backgroundColor: '#218838'
    }
  },
  timeline: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '15px'
  },
  updateCard: {
    padding: '20px',
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    border: '1px solid #eee',
    transition: 'transform 0.2s, box-shadow 0.2s',
    ':hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 4px 8px rgba(0,0,0,0.15)'
    }
  },
  updateHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px'
  },
  headerLeft: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
    flexWrap: 'wrap' as const
  },
  headerRight: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center'
  },
  weekBadge: {
    padding: '4px 8px',
    backgroundColor: '#e9ecef',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: 'bold',
    color: '#495057'
  },
  priorityBadge: {
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: '500'
  },
  statusBadge: {
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '12px',
    color: 'white',
    fontWeight: '500'
  },
  editButton: {
    padding: '4px 8px',
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
    fontSize: '16px',
    opacity: 0.6,
    transition: 'opacity 0.2s',
    ':hover': {
      opacity: 1
    }
  },
  updateTitle: {
    fontSize: '18px',
    margin: '0 0 10px 0',
    color: '#333',
    fontWeight: '600'
  },
  updateDescription: {
    fontSize: '14px',
    color: '#666',
    margin: '0 0 15px 0',
    lineHeight: '1.6'
  },
  timeSpent: {
    fontSize: '12px',
    color: '#666',
    marginBottom: '15px',
    padding: '4px 8px',
    backgroundColor: '#f8f9fa',
    borderRadius: '4px',
    display: 'inline-block'
  },
  updateFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTop: '1px solid #eee',
    paddingTop: '12px',
    marginTop: '4px'
  },
  categoryTag: {
    padding: '4px 8px',
    backgroundColor: '#f8f9fa',
    borderRadius: '4px',
    fontSize: '12px',
    color: '#495057',
    fontWeight: '500'
  },
  date: {
    fontSize: '12px',
    color: '#999'
  }
};

export default BuildUpdates;