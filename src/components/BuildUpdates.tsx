// src/components/BuildUpdates.tsx
import React, { useState } from 'react';
import { BuildUpdate } from '../types';

interface Props {
  updates: BuildUpdate[];
  onAddUpdate: (update: Omit<BuildUpdate, 'id'>) => void;
}

const BuildUpdates: React.FC<Props> = ({ updates, onAddUpdate }) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newUpdate, setNewUpdate] = useState({
    weekNumber: 1,
    title: '',
    description: '',
    category: 'development' as const,
    status: 'in-progress' as const
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddUpdate({
  ...newUpdate,
  date: new Date(),
  priority: "medium",     // 👈 add this
  timeSpent: 2            // 👈 add this (hours ya jo bhi format hai)
});
    setShowAddForm(false);
    setNewUpdate({
      weekNumber: 1,
      title: '',
      description: '',
      category: 'development',
      status: 'in-progress'
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

  return (
    <div>
      <div style={styles.header}>
        <h2 style={styles.sectionTitle}>Live Build Updates</h2>
        <button 
          onClick={() => setShowAddForm(!showAddForm)}
          style={styles.addButton}
        >
          + Add Update
        </button>
      </div>

      {showAddForm && (
        <form onSubmit={handleSubmit} style={styles.form}>
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
          <button type="submit" style={styles.submitButton}>Post Update</button>
        </form>
      )}

      <div style={styles.timeline}>
        {updates.map((update) => (
          <div key={update.id} style={styles.updateCard}>
            <div style={styles.updateHeader}>
              <span style={styles.weekBadge}>Week {update.weekNumber}</span>
              <span style={{...styles.statusBadge, backgroundColor: getStatusColor(update.status)}}>
                {update.status}
              </span>
            </div>
            <h3 style={styles.updateTitle}>{update.title}</h3>
            <p style={styles.updateDescription}>{update.description}</p>
            <div style={styles.updateFooter}>
              <span style={styles.categoryTag}>{update.category}</span>
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
    backgroundColor: '#FF8C42',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px'
  },
  form: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '10px',
    padding: '20px',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    marginBottom: '20px'
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
    minHeight: '80px'
  },
  select: {
    padding: '8px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px'
  },
  submitButton: {
    padding: '10px',
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
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
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    border: '1px solid #eee'
  },
  updateHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px'
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