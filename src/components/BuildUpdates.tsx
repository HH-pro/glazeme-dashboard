// src/components/BuildUpdates.tsx
import React, { useState, useEffect } from 'react';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs, 
  query, 
  orderBy,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../services/firebase';
import PasswordModal from './PasswordModal';

// Types
type UpdateCategory = 'development' | 'design' | 'ai-integration' | 'testing' | 'deployment';
type UpdateStatus = 'planned' | 'in-progress' | 'completed';
type UpdatePriority = 'low' | 'medium' | 'high';

interface BuildUpdate {
  id: string;
  weekNumber: number;
  title: string;
  description: string;
  category: UpdateCategory;
  status: UpdateStatus;
  priority?: UpdatePriority;
  timeSpent?: number;
  date: Date;
  createdAt?: Date;
}

interface Props {
  initialEditMode?: boolean;
}

const COLLECTION_NAME = 'buildUpdates';

const BuildUpdates: React.FC<Props> = ({ initialEditMode = false }) => {
  const [updates, setUpdates] = useState<BuildUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false); // Start with false, require password
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingUpdate, setEditingUpdate] = useState<BuildUpdate | null>(null);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  
  const [newUpdate, setNewUpdate] = useState<Omit<BuildUpdate, 'id'>>({
    weekNumber: 1,
    title: '',
    description: '',
    category: 'development' as UpdateCategory,
    status: 'in-progress' as UpdateStatus,
    priority: 'medium' as UpdatePriority,
    timeSpent: 0,
    date: new Date()
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

  // Load updates on mount
  useEffect(() => {
    fetchUpdates();
  }, []);

  // Convert Firestore timestamp to Date
  const convertTimestampToDate = (data: any, docId: string): BuildUpdate => {
    return {
      id: docId,
      weekNumber: data.weekNumber || 1,
      title: data.title || '',
      description: data.description || '',
      category: data.category || 'development',
      status: data.status || 'planned',
      priority: data.priority || 'medium',
      timeSpent: data.timeSpent || 0,
      date: data.date?.toDate() || new Date(),
      createdAt: data.createdAt?.toDate()
    };
  };

  // Fetch all updates from Firebase
  const fetchUpdates = async () => {
    try {
      setLoading(true);
      const updatesRef = collection(db, COLLECTION_NAME);
      const q = query(updatesRef, orderBy('date', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const fetchedUpdates = querySnapshot.docs.map(doc => 
        convertTimestampToDate(doc.data(), doc.id)
      );
      
      setUpdates(fetchedUpdates);
      setError(null);
    } catch (err) {
      console.error('Error fetching updates:', err);
      setError('Failed to load updates');
    } finally {
      setLoading(false);
    }
  };

  // Add new update to Firebase
  const handleAddUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      const updatesRef = collection(db, COLLECTION_NAME);
      const updateWithTimestamp = {
        ...newUpdate,
        date: Timestamp.fromDate(newUpdate.date),
        createdAt: Timestamp.now()
      };
      
      const docRef = await addDoc(updatesRef, updateWithTimestamp);
      
      const newUpdateWithId: BuildUpdate = {
        id: docRef.id,
        ...newUpdate
      };
      
      setUpdates(prev => [newUpdateWithId, ...prev]);
      setShowAddForm(false);
      resetForm();
      setError(null);
    } catch (err) {
      console.error('Error adding update:', err);
      setError('Failed to add update');
    } finally {
      setLoading(false);
    }
  };

  // Edit update in Firebase
  const handleEditUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingUpdate) return;
    
    try {
      setLoading(true);
      const updateRef = doc(db, COLLECTION_NAME, editingUpdate.id);
      const updateWithTimestamp = {
        ...newUpdate,
        date: Timestamp.fromDate(newUpdate.date),
        updatedAt: Timestamp.now()
      };
      
      await updateDoc(updateRef, updateWithTimestamp);
      
      setUpdates(prev => 
        prev.map(u => u.id === editingUpdate.id ? { ...newUpdate, id: editingUpdate.id } : u)
      );
      
      setShowAddForm(false);
      setEditingUpdate(null);
      resetForm();
      setError(null);
    } catch (err) {
      console.error('Error editing update:', err);
      setError('Failed to edit update');
    } finally {
      setLoading(false);
    }
  };

  // Delete update from Firebase
  const handleDeleteUpdate = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this update?')) return;
    
    try {
      setLoading(true);
      const updateRef = doc(db, COLLECTION_NAME, id);
      await deleteDoc(updateRef);
      
      setUpdates(prev => prev.filter(u => u.id !== id));
      setError(null);
    } catch (err) {
      console.error('Error deleting update:', err);
      setError('Failed to delete update');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setNewUpdate({
      weekNumber: 1,
      title: '',
      description: '',
      category: 'development',
      status: 'in-progress',
      priority: 'medium',
      timeSpent: 0,
      date: new Date()
    });
  };

  const handleEnableEditMode = () => {
    setIsPasswordModalOpen(true);
  };

  const handlePasswordSuccess = () => {
    setIsEditMode(true);
    setIsPasswordModalOpen(false);
  };

  const handleAddClick = () => {
    if (!isEditMode) {
      handleEnableEditMode();
      return;
    }
    setShowAddForm(true);
    setEditingUpdate(null);
    resetForm();
  };

  const handleEditClick = (update: BuildUpdate) => {
    if (!isEditMode) {
      handleEnableEditMode();
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
      timeSpent: update.timeSpent || 0,
      date: update.date
    });
    setShowAddForm(true);
  };

  const cancelForm = () => {
    setShowAddForm(false);
    setEditingUpdate(null);
    resetForm();
  };

  const getStatusColor = (status: UpdateStatus) => {
    switch(status) {
      case 'completed': return '#28a745';
      case 'in-progress': return '#ffc107';
      case 'planned': return '#6c757d';
      default: return '#6c757d';
    }
  };

  const getPriorityColor = (priority: UpdatePriority | undefined) => {
    if (!priority) return '#6c757d';
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

  if (loading && updates.length === 0) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loadingSpinner}></div>
        <p>Loading updates...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Password Modal */}
      <PasswordModal 
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        onSuccess={handlePasswordSuccess}
      />

      {/* Error Banner */}
      {error && (
        <div style={styles.errorBanner}>
          <span>{error}</span>
          <button onClick={fetchUpdates} style={styles.retryButton}>
            Retry
          </button>
        </div>
      )}

      {/* Header */}
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
            width: isMobile ? '100%' : 'auto'
          }}
        >
          {isEditMode ? '+ Add Update' : '🔒 Enable Edit Mode'}
        </button>
      </div>

      {/* Edit Mode Indicator */}
      {isEditMode && !showAddForm && (
        <div style={styles.editModeIndicator}>
          ✏️ Edit Mode Active - You can manage updates
        </div>
      )}

      {/* Add/Edit Form */}
      {showAddForm && isEditMode && (
        <form onSubmit={editingUpdate ? handleEditUpdate : handleAddUpdate} style={styles.form}>
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
              onChange={(e) => setNewUpdate({...newUpdate, weekNumber: parseInt(e.target.value) || 1})}
              style={{...styles.input, width: isMobile ? '100%' : '100px'}}
              required
              min="1"
            />
            <input
              type="number"
              placeholder="Time Spent (hours)"
              value={newUpdate.timeSpent || ''}
              onChange={(e) => setNewUpdate({...newUpdate, timeSpent: parseInt(e.target.value) || 0})}
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
              onChange={(e) => setNewUpdate({...newUpdate, category: e.target.value as UpdateCategory})}
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
              onChange={(e) => setNewUpdate({...newUpdate, status: e.target.value as UpdateStatus})}
              style={styles.select}
            >
              <option value="planned">Planned</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
            
            <select
              value={newUpdate.priority}
              onChange={(e) => setNewUpdate({...newUpdate, priority: e.target.value as UpdatePriority})}
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
              disabled={loading}
            >
              {loading ? 'Saving...' : (editingUpdate ? 'Update' : 'Post Update')}
            </button>
          </div>
        </form>
      )}

      {/* Updates Timeline */}
      <div style={styles.timeline}>
        {updates.length === 0 ? (
          <div style={styles.emptyState}>
            <p>No updates yet. Click "Add Update" to create your first build update!</p>
          </div>
        ) : (
          updates.map((update) => (
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
                  {update.priority && (
                    <span style={{...styles.priorityBadge, backgroundColor: getPriorityColor(update.priority)}}>
                      {update.priority} priority
                    </span>
                  )}
                </div>
                <div style={styles.rightHeader}>
                  {isEditMode && (
                    <>
                      <button 
                        onClick={() => handleEditClick(update)}
                        style={styles.editButton}
                        title="Edit update"
                        disabled={loading}
                      >
                        ✏️
                      </button>
                      <button 
                        onClick={() => handleDeleteUpdate(update.id)}
                        style={styles.deleteButton}
                        title="Delete update"
                        disabled={loading}
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
                  {update.timeSpent && update.timeSpent > 0 && (
                    <span style={styles.timeSpent}>⏱️ {update.timeSpent}h</span>
                  )}
                </div>
                <span style={styles.date}>{new Date(update.date).toLocaleDateString()}</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Edit Mode Prompt */}
      {!isEditMode && updates.length > 0 && (
        <div style={styles.editModePrompt}>
          <p>🔒 View only mode. Click "Enable Edit Mode" to add or edit updates.</p>
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
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    padding: '60px',
    textAlign: 'center' as const,
  },
  loadingSpinner: {
    width: '50px',
    height: '50px',
    border: '4px solid #f3f3f3',
    borderTop: '4px solid #FF8C42',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    marginBottom: '20px',
  },
  errorBanner: {
    backgroundColor: '#f8d7da',
    color: '#721c24',
    padding: '12px 20px',
    borderRadius: '8px',
    marginBottom: '20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap' as const,
    gap: '10px',
  },
  retryButton: {
    padding: '6px 16px',
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
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
  editModePrompt: {
    textAlign: 'center' as const,
    marginTop: '30px',
    padding: '15px',
    backgroundColor: '#e9ecef',
    borderRadius: '8px',
    color: '#495057',
    fontSize: '14px',
  },
  emptyState: {
    textAlign: 'center' as const,
    padding: '40px',
    backgroundColor: '#f8f9fa',
    borderRadius: '16px',
    color: '#6c757d',
    fontSize: '16px',
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
    transition: 'opacity 0.2s',
    ':disabled': {
      opacity: 0.5,
      cursor: 'not-allowed',
    },
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
    ':disabled': {
      opacity: 0.5,
      cursor: 'not-allowed',
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
    ':disabled': {
      opacity: 0.5,
      cursor: 'not-allowed',
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

// Add global styles for animations
const style = document.createElement('style');
style.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
document.head.appendChild(style);

export default BuildUpdates;