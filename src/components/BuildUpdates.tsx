// src/components/BuildUpdates.tsx
import React, { useState } from 'react';
import { BuildUpdate } from '../types';

interface BuildUpdatesProps {
  updates: BuildUpdate[];
  onAddUpdate: (update: Omit<BuildUpdate, 'id'>) => void;
  onEditUpdate?: (update: BuildUpdate) => void;
  isEditMode?: boolean;
  editingUpdate?: BuildUpdate | null;
  onUpdateEdit?: (update: BuildUpdate) => void;
  onCancelEdit?: () => void;
  isAuthenticated: boolean;
}

const BuildUpdates: React.FC<BuildUpdatesProps> = ({
  updates,
  onAddUpdate,
  onEditUpdate,
  isEditMode,
  editingUpdate,
  onUpdateEdit,
  onCancelEdit,
  isAuthenticated
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'feature' | 'fix' | 'improvement'>('feature');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    if (isEditMode && editingUpdate && onUpdateEdit) {
      onUpdateEdit({
        ...editingUpdate,
        title,
        description,
        type
      });
    } else {
      onAddUpdate({
        title,
        description,
        type,
        date: new Date()
      });
    }

    // Reset form
    setTitle('');
    setDescription('');
    setType('feature');
  };

  // Populate form when editing
  React.useEffect(() => {
    if (editingUpdate) {
      setTitle(editingUpdate.title);
      setDescription(editingUpdate.description);
      setType(editingUpdate.type);
    } else {
      setTitle('');
      setDescription('');
      setType('feature');
    }
  }, [editingUpdate]);

  return (
    <div>
      <h2 style={styles.title}>Build Updates</h2>
      
      {/* Add/Edit Update Form - Only visible when authenticated */}
      {isAuthenticated && (
        <form onSubmit={handleSubmit} style={styles.form}>
          <h3 style={styles.formTitle}>
            {isEditMode ? '✏️ Edit Update' : '➕ Add New Update'}
          </h3>
          
          <div style={styles.inputGroup}>
            <label style={styles.label}>Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Added compliment generation"
              style={styles.input}
              required
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what changed..."
              style={styles.textarea}
              rows={3}
              required
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as any)}
              style={styles.select}
            >
              <option value="feature">✨ Feature</option>
              <option value="improvement">📈 Improvement</option>
              <option value="fix">🐛 Fix</option>
            </select>
          </div>

          <div style={styles.buttonGroup}>
            <button type="submit" style={styles.submitButton}>
              {isEditMode ? 'Update Update' : 'Add Update'}
            </button>
            {isEditMode && (
              <button 
                type="button" 
                onClick={onCancelEdit}
                style={styles.cancelButton}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      )}

      {/* Updates List */}
      <div style={styles.updatesList}>
        {updates.map((update) => (
          <div key={update.id} style={styles.updateCard}>
            <div style={styles.updateHeader}>
              <div>
                <span style={styles.updateType}>
                  {update.type === 'feature' && '✨'}
                  {update.type === 'improvement' && '📈'}
                  {update.type === 'fix' && '🐛'}
                </span>
                <span style={styles.updateTitle}>{update.title}</span>
              </div>
              {isAuthenticated && onEditUpdate && (
                <button
                  onClick={() => onEditUpdate(update)}
                  style={styles.editButton}
                >
                  ✏️ Edit
                </button>
              )}
            </div>
            <p style={styles.updateDescription}>{update.description}</p>
            <span style={styles.updateDate}>
              {new Date(update.date).toLocaleDateString()} at{' '}
              {new Date(update.date).toLocaleTimeString()}
            </span>
          </div>
        ))}

        {updates.length === 0 && (
          <p style={styles.empty}>No updates yet. Add your first build update!</p>
        )}
      </div>
    </div>
  );
};

const styles = {
  title: {
    fontSize: '24px',
    margin: '0 0 20px 0',
    color: '#333'
  },
  form: {
    backgroundColor: '#f8f9fa',
    padding: '20px',
    borderRadius: '10px',
    marginBottom: '30px'
  },
  formTitle: {
    fontSize: '18px',
    margin: '0 0 15px 0',
    color: '#FF8C42'
  },
  inputGroup: {
    marginBottom: '15px'
  },
  label: {
    display: 'block',
    marginBottom: '5px',
    fontSize: '14px',
    fontWeight: '500',
    color: '#333'
  },
  input: {
    width: '100%',
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '14px',
    boxSizing: 'border-box' as const
  },
  textarea: {
    width: '100%',
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '14px',
    fontFamily: 'inherit',
    resize: 'vertical' as const,
    boxSizing: 'border-box' as const
  },
  select: {
    width: '100%',
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '14px',
    backgroundColor: 'white',
    boxSizing: 'border-box' as const
  },
  buttonGroup: {
    display: 'flex',
    gap: '10px'
  },
  submitButton: {
    flex: 1,
    padding: '12px',
    backgroundColor: '#FF8C42',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer'
  },
  cancelButton: {
    padding: '12px 20px',
    backgroundColor: '#6c757d',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    cursor: 'pointer'
  },
  updatesList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '15px'
  },
  updateCard: {
    padding: '15px',
    backgroundColor: 'white',
    border: '1px solid #e9ecef',
    borderRadius: '8px'
  },
  updateHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px'
  },
  updateType: {
    marginRight: '8px',
    fontSize: '16px'
  },
  updateTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#333'
  },
  editButton: {
    padding: '4px 8px',
    backgroundColor: '#f8f9fa',
    border: '1px solid #dee2e6',
    borderRadius: '4px',
    fontSize: '12px',
    cursor: 'pointer'
  },
  updateDescription: {
    fontSize: '14px',
    color: '#666',
    margin: '0 0 10px 0',
    lineHeight: '1.5'
  },
  updateDate: {
    fontSize: '12px',
    color: '#999'
  },
  empty: {
    textAlign: 'center' as const,
    color: '#999',
    padding: '40px'
  }
};

export default BuildUpdates;