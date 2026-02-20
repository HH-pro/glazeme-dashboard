// src/components/BuildUpdates.tsx
import React, { useState, useEffect } from 'react';
import { db } from '../firebase/config';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
  Timestamp
} from 'firebase/firestore';

interface BuildUpdate {
  id?: string;
  title: string;
  description: string;
  type: 'feature' | 'fix' | 'improvement' | 'release';
  status: 'planned' | 'in-progress' | 'completed' | 'blocked';
  date: Date | Timestamp;
  author?: string;
  version?: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  tags?: string[];
  attachments?: string[];
  comments?: number;
  likes?: number;
}

interface Props {
  updates?: BuildUpdate[]; // Optional: for backward compatibility
  onAddUpdate?: (update: Omit<BuildUpdate, 'id'>) => void;
  onEditUpdate?: (id: string, update: Partial<BuildUpdate>) => void;
  onDeleteUpdate?: (id: string) => void;
  isEditMode?: boolean;
  projectId?: string;
  userId?: string;
}

const BuildUpdates: React.FC<Props> = ({
  updates: propUpdates,
  onAddUpdate: propOnAddUpdate,
  onEditUpdate: propOnEditUpdate,
  onDeleteUpdate: propOnDeleteUpdate,
  isEditMode = false,
  projectId = 'default',
  userId
}) => {
  const [updates, setUpdates] = useState<BuildUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<BuildUpdate>>({});
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  const [newUpdate, setNewUpdate] = useState<Partial<BuildUpdate>>({
    title: '',
    description: '',
    type: 'feature',
    status: 'planned',
    priority: 'medium',
    tags: [],
    date: new Date(),
    comments: 0,
    likes: 0
  });

  // Firebase collection reference
  const updatesCollection = collection(db, `projects/${projectId}/updates`);

  // Fetch data from Firebase if no props provided
  useEffect(() => {
    if (propUpdates) {
      setUpdates(propUpdates);
      setLoading(false);
      return;
    }

    setLoading(true);
    const updatesQuery = query(updatesCollection, orderBy('date', 'desc'));
    
    const unsubscribe = onSnapshot(updatesQuery, 
      (snapshot) => {
        const updatesData: BuildUpdate[] = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          date: doc.data().date?.toDate() || new Date()
        })) as BuildUpdate[];
        
        setUpdates(updatesData);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Error fetching updates:', err);
        setError('Failed to load updates from Firebase');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [projectId, propUpdates]);

  // Resize listener
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleAddUpdate = async () => {
    if (!newUpdate.title || !newUpdate.description) {
      setError('Please fill in title and description');
      return;
    }

    try {
      const updateToAdd: Omit<BuildUpdate, 'id'> = {
        title: newUpdate.title,
        description: newUpdate.description,
        type: newUpdate.type as any,
        status: newUpdate.status as any,
        priority: newUpdate.priority as any,
        tags: newUpdate.tags || [],
        date: Timestamp.fromDate(new Date()),
        comments: 0,
        likes: 0,
        author: userId || 'Anonymous'
      };

      if (propOnAddUpdate) {
        // Use prop callback if provided
        propOnAddUpdate(updateToAdd);
      } else {
        // Save to Firebase
        await addDoc(updatesCollection, updateToAdd);
      }
      
      setShowAddForm(false);
      setNewUpdate({
        title: '',
        description: '',
        type: 'feature',
        status: 'planned',
        priority: 'medium',
        tags: [],
        date: new Date(),
        comments: 0,
        likes: 0
      });
      setError(null);
    } catch (err) {
      console.error('Error adding update:', err);
      setError('Failed to add update');
    }
  };

  const handleEditClick = (update: BuildUpdate) => {
    setEditingId(update.id || null);
    setEditForm(update);
  };

  const handleSaveEdit = async () => {
    if (!editingId || !editForm) return;

    try {
      if (propOnEditUpdate) {
        // Use prop callback if provided
        propOnEditUpdate(editingId, editForm);
      } else {
        // Save to Firebase
        const updateDoc = doc(db, `projects/${projectId}/updates`, editingId);
        await updateDoc(updateDoc, {
          ...editForm,
          date: editForm.date instanceof Date ? Timestamp.fromDate(editForm.date) : editForm.date
        });
      }
      
      setEditingId(null);
      setEditForm({});
    } catch (err) {
      console.error('Error updating update:', err);
      setError('Failed to update');
    }
  };

  const handleDeleteUpdate = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this update?')) return;

    try {
      if (propOnDeleteUpdate) {
        // Use prop callback if provided
        propOnDeleteUpdate(id);
      } else {
        // Delete from Firebase
        const updateDoc = doc(db, `projects/${projectId}/updates`, id);
        await deleteDoc(updateDoc);
      }
    } catch (err) {
      console.error('Error deleting update:', err);
      setError('Failed to delete update');
    }
  };

  const handleLike = async (id: string, currentLikes: number = 0) => {
    if (!isEditMode) return;

    try {
      if (propOnEditUpdate) {
        propOnEditUpdate(id, { likes: currentLikes + 1 });
      } else {
        const updateDoc = doc(db, `projects/${projectId}/updates`, id);
        await updateDoc(updateDoc, { likes: currentLikes + 1 });
      }
    } catch (err) {
      console.error('Error liking update:', err);
    }
  };

  // Filter updates
  const filteredUpdates = updates.filter(update => {
    const matchesType = selectedType === 'all' || update.type === selectedType;
    const matchesStatus = selectedStatus === 'all' || update.status === selectedStatus;
    const matchesSearch = searchTerm === '' || 
      update.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      update.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      update.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchesType && matchesStatus && matchesSearch;
  });

  // Get statistics
  const stats = {
    total: updates.length,
    features: updates.filter(u => u.type === 'feature').length,
    fixes: updates.filter(u => u.type === 'fix').length,
    improvements: updates.filter(u => u.type === 'improvement').length,
    releases: updates.filter(u => u.type === 'release').length,
    completed: updates.filter(u => u.status === 'completed').length,
    inProgress: updates.filter(u => u.status === 'in-progress').length,
    planned: updates.filter(u => u.status === 'planned').length,
    blocked: updates.filter(u => u.status === 'blocked').length
  };

  const getTypeIcon = (type: string) => {
    switch(type) {
      case 'feature': return '✨';
      case 'fix': return '🐛';
      case 'improvement': return '⚡';
      case 'release': return '🚀';
      default: return '📝';
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'completed': return '#28a745';
      case 'in-progress': return '#007bff';
      case 'planned': return '#ffc107';
      case 'blocked': return '#dc3545';
      default: return '#6c757d';
    }
  };

  const getPriorityBadge = (priority: string = 'medium') => {
    const colors = {
      low: '#6c757d',
      medium: '#007bff',
      high: '#fd7e14',
      critical: '#dc3545'
    };
    return {
      color: colors[priority as keyof typeof colors],
      text: priority.toUpperCase()
    };
  };

  const formatDate = (date: Date | Timestamp) => {
    if (date instanceof Timestamp) {
      date = date.toDate();
    }
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const mobileStyles = {
    filters: {
      flexDirection: 'column' as const,
      gap: '10px',
    },
    filterGroup: {
      width: '100%',
    },
    statsGrid: {
      gridTemplateColumns: 'repeat(2, 1fr)',
    },
    updateCard: {
      padding: '16px',
    },
    updateHeader: {
      flexDirection: 'column' as const,
      alignItems: 'flex-start',
      gap: '10px',
    },
    actions: {
      width: '100%',
      justifyContent: 'flex-end',
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingContainer}>
          <div style={styles.loadingSpinner}></div>
          <p style={styles.loadingText}>Loading build updates...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>📋 Build Updates</h2>
          <p style={styles.subtitle}>Track development progress and updates</p>
        </div>
        {isEditMode && (
          <button 
            onClick={() => setShowAddForm(true)} 
            style={styles.addButton}
          >
            + New Update
          </button>
        )}
      </div>

      {error && (
        <div style={styles.errorMessage}>
          <span>❌ {error}</span>
          <button onClick={() => setError(null)} style={styles.errorClose}>×</button>
        </div>
      )}

      {/* Stats Overview */}
      <div style={{
        ...styles.statsGrid,
        ...(isMobile ? mobileStyles.statsGrid : {})
      }}>
        <div style={styles.statCard}>
          <span style={styles.statIcon}>📊</span>
          <div>
            <span style={styles.statValue}>{stats.total}</span>
            <span style={styles.statLabel}>Total Updates</span>
          </div>
        </div>
        <div style={styles.statCard}>
          <span style={styles.statIcon}>✨</span>
          <div>
            <span style={styles.statValue}>{stats.features}</span>
            <span style={styles.statLabel}>Features</span>
          </div>
        </div>
        <div style={styles.statCard}>
          <span style={styles.statIcon}>🐛</span>
          <div>
            <span style={styles.statValue}>{stats.fixes}</span>
            <span style={styles.statLabel}>Fixes</span>
          </div>
        </div>
        <div style={styles.statCard}>
          <span style={styles.statIcon}>⚡</span>
          <div>
            <span style={styles.statValue}>{stats.improvements}</span>
            <span style={styles.statLabel}>Improvements</span>
          </div>
        </div>
        <div style={styles.statCard}>
          <span style={styles.statIcon}>✅</span>
          <div>
            <span style={styles.statValue}>{stats.completed}</span>
            <span style={styles.statLabel}>Completed</span>
          </div>
        </div>
        <div style={styles.statCard}>
          <span style={styles.statIcon}>🚧</span>
          <div>
            <span style={styles.statValue}>{stats.inProgress}</span>
            <span style={styles.statLabel}>In Progress</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div style={{
        ...styles.filters,
        ...(isMobile ? mobileStyles.filters : {})
      }}>
        <div style={{
          ...styles.filterGroup,
          ...(isMobile ? mobileStyles.filterGroup : {})
        }}>
          <input
            type="text"
            placeholder="🔍 Search updates..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={styles.searchInput}
          />
        </div>
        <div style={{
          ...styles.filterGroup,
          ...(isMobile ? mobileStyles.filterGroup : {})
        }}>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            style={styles.select}
          >
            <option value="all">All Types</option>
            <option value="feature">Features</option>
            <option value="fix">Fixes</option>
            <option value="improvement">Improvements</option>
            <option value="release">Releases</option>
          </select>
        </div>
        <div style={{
          ...styles.filterGroup,
          ...(isMobile ? mobileStyles.filterGroup : {})
        }}>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            style={styles.select}
          >
            <option value="all">All Status</option>
            <option value="planned">Planned</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="blocked">Blocked</option>
          </select>
        </div>
      </div>

      {/* Add Update Form */}
      {isEditMode && showAddForm && (
        <div style={styles.addForm}>
          <h3 style={styles.formTitle}>➕ New Build Update</h3>
          
          <input
            type="text"
            placeholder="Update Title"
            value={newUpdate.title}
            onChange={(e) => setNewUpdate({...newUpdate, title: e.target.value})}
            style={styles.input}
          />

          <textarea
            placeholder="Detailed description of the update..."
            value={newUpdate.description}
            onChange={(e) => setNewUpdate({...newUpdate, description: e.target.value})}
            style={styles.textarea}
            rows={4}
          />

          <div style={styles.formRow}>
            <select
              value={newUpdate.type}
              onChange={(e) => setNewUpdate({...newUpdate, type: e.target.value as any})}
              style={{...styles.select, flex: 1}}
            >
              <option value="feature">✨ Feature</option>
              <option value="fix">🐛 Fix</option>
              <option value="improvement">⚡ Improvement</option>
              <option value="release">🚀 Release</option>
            </select>

            <select
              value={newUpdate.status}
              onChange={(e) => setNewUpdate({...newUpdate, status: e.target.value as any})}
              style={{...styles.select, flex: 1}}
            >
              <option value="planned">📅 Planned</option>
              <option value="in-progress">🚧 In Progress</option>
              <option value="completed">✅ Completed</option>
              <option value="blocked">⛔ Blocked</option>
            </select>
          </div>

          <div style={styles.formRow}>
            <select
              value={newUpdate.priority}
              onChange={(e) => setNewUpdate({...newUpdate, priority: e.target.value as any})}
              style={{...styles.select, flex: 1}}
            >
              <option value="low">🔽 Low Priority</option>
              <option value="medium">⏺️ Medium Priority</option>
              <option value="high">🔼 High Priority</option>
              <option value="critical">🔥 Critical</option>
            </select>

            <input
              type="text"
              placeholder="Version (optional)"
              value={newUpdate.version || ''}
              onChange={(e) => setNewUpdate({...newUpdate, version: e.target.value})}
              style={{...styles.input, flex: 1}}
            />
          </div>

          <input
            type="text"
            placeholder="Tags (comma-separated)"
            value={newUpdate.tags?.join(', ') || ''}
            onChange={(e) => setNewUpdate({
              ...newUpdate, 
              tags: e.target.value.split(',').map(t => t.trim()).filter(t => t)
            })}
            style={styles.input}
          />

          <div style={styles.formButtons}>
            <button onClick={() => setShowAddForm(false)} style={styles.cancelButton}>
              Cancel
            </button>
            <button onClick={handleAddUpdate} style={styles.saveButton}>
              Add Update
            </button>
          </div>
        </div>
      )}

      {/* Updates List */}
      <div style={styles.updatesList}>
        {filteredUpdates.length === 0 ? (
          <div style={styles.emptyState}>
            <p style={styles.emptyStateText}>No updates found</p>
            {isEditMode && (
              <button onClick={() => setShowAddForm(true)} style={styles.emptyStateButton}>
                Add Your First Update
              </button>
            )}
          </div>
        ) : (
          filteredUpdates.map((update) => (
            <div key={update.id} style={{
              ...styles.updateCard,
              ...(isMobile ? mobileStyles.updateCard : {})
            }}>
              {editingId === update.id ? (
                // Edit Mode
                <div style={styles.editForm}>
                  <input
                    type="text"
                    value={editForm.title || ''}
                    onChange={(e) => setEditForm({...editForm, title: e.target.value})}
                    style={styles.input}
                    placeholder="Title"
                  />
                  <textarea
                    value={editForm.description || ''}
                    onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                    style={styles.textarea}
                    rows={3}
                  />
                  <div style={styles.formRow}>
                    <select
                      value={editForm.type || 'feature'}
                      onChange={(e) => setEditForm({...editForm, type: e.target.value as any})}
                      style={styles.select}
                    >
                      <option value="feature">Feature</option>
                      <option value="fix">Fix</option>
                      <option value="improvement">Improvement</option>
                      <option value="release">Release</option>
                    </select>
                    <select
                      value={editForm.status || 'planned'}
                      onChange={(e) => setEditForm({...editForm, status: e.target.value as any})}
                      style={styles.select}
                    >
                      <option value="planned">Planned</option>
                      <option value="in-progress">In Progress</option>
                      <option value="completed">Completed</option>
                      <option value="blocked">Blocked</option>
                    </select>
                  </div>
                  <div style={styles.editButtons}>
                    <button onClick={() => setEditingId(null)} style={styles.cancelButton}>
                      Cancel
                    </button>
                    <button onClick={handleSaveEdit} style={styles.saveButton}>
                      Save
                    </button>
                  </div>
                </div>
              ) : (
                // View Mode
                <>
                  <div style={{
                    ...styles.updateHeader,
                    ...(isMobile ? mobileStyles.updateHeader : {})
                  }}>
                    <div style={styles.updateHeaderLeft}>
                      <span style={styles.updateTypeIcon}>
                        {getTypeIcon(update.type)}
                      </span>
                      <div>
                        <h3 style={styles.updateTitle}>{update.title}</h3>
                        <div style={styles.updateMeta}>
                          <span style={{
                            ...styles.statusBadge,
                            backgroundColor: getStatusColor(update.status)
                          }}>
                            {update.status}
                          </span>
                          {update.version && (
                            <span style={styles.versionBadge}>
                              v{update.version}
                            </span>
                          )}
                          <span style={styles.priorityBadge}>
                            <span style={{
                              ...styles.priorityDot,
                              backgroundColor: getPriorityBadge(update.priority).color
                            }} />
                            {getPriorityBadge(update.priority).text}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div style={{
                      ...styles.updateHeaderRight,
                      ...(isMobile ? mobileStyles.actions : {})
                    }}>
                      <span style={styles.updateDate}>
                        {formatDate(update.date)}
                      </span>
                      {isEditMode && (
                        <div style={styles.updateActions}>
                          <button 
                            onClick={() => handleEditClick(update)}
                            style={styles.editButton}
                            title="Edit"
                          >
                            ✏️
                          </button>
                          <button 
                            onClick={() => update.id && handleDeleteUpdate(update.id)}
                            style={styles.deleteButton}
                            title="Delete"
                          >
                            🗑️
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <p style={styles.updateDescription}>
                    {update.description}
                  </p>

                  {update.tags && update.tags.length > 0 && (
                    <div style={styles.tags}>
                      {update.tags.map((tag, index) => (
                        <span key={index} style={styles.tag}>
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}

                  <div style={styles.updateFooter}>
                    <div style={styles.updateStats}>
                      <button 
                        onClick={() => update.id && handleLike(update.id, update.likes)}
                        style={styles.likeButton}
                        disabled={!isEditMode}
                      >
                        ❤️ {update.likes || 0}
                      </button>
                      <span style={styles.commentCount}>
                        💬 {update.comments || 0}
                      </span>
                    </div>
                    <span style={styles.updateAuthor}>
                      By {update.author || 'Anonymous'}
                    </span>
                  </div>
                </>
              )}
            </div>
          ))
        )}
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
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '400px',
  },
  loadingSpinner: {
    width: '50px',
    height: '50px',
    border: '5px solid #f3f3f3',
    borderTop: '5px solid #007bff',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    marginBottom: '20px',
  },
  loadingText: {
    fontSize: '16px',
    color: '#666',
  },
  errorMessage: {
    backgroundColor: '#f8d7da',
    color: '#721c24',
    padding: '12px 16px',
    borderRadius: '8px',
    marginBottom: '20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '14px',
  },
  errorClose: {
    background: 'none',
    border: 'none',
    color: '#721c24',
    fontSize: '20px',
    cursor: 'pointer',
    padding: '0 5px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    flexWrap: 'wrap' as const,
    gap: '15px',
  },
  title: {
    fontSize: 'clamp(20px, 5vw, 24px)',
    margin: '0 0 10px 0',
    color: '#333',
  },
  subtitle: {
    fontSize: 'clamp(12px, 4vw, 14px)',
    color: '#666',
    margin: 0,
  },
  addButton: {
    padding: '10px 20px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: 'clamp(14px, 4vw, 16px)',
    fontWeight: '500',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(6, 1fr)',
    gap: '15px',
    marginBottom: '20px',
  },
  statCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '15px',
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    border: '1px solid #eee',
  },
  statIcon: {
    fontSize: 'clamp(20px, 5vw, 24px)',
  },
  statValue: {
    display: 'block',
    fontSize: 'clamp(16px, 5vw, 18px)',
    fontWeight: 'bold',
    color: '#007bff',
    lineHeight: '1.2',
  },
  statLabel: {
    fontSize: 'clamp(10px, 3vw, 11px)',
    color: '#666',
  },
  filters: {
    display: 'flex',
    gap: '15px',
    marginBottom: '20px',
    flexWrap: 'wrap' as const,
  },
  filterGroup: {
    flex: 1,
    minWidth: '200px',
  },
  searchInput: {
    width: '100%',
    padding: '12px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    fontSize: '14px',
    boxSizing: 'border-box' as const,
  },
  select: {
    width: '100%',
    padding: '12px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    fontSize: '14px',
    backgroundColor: 'white',
    cursor: 'pointer',
  },
  addForm: {
    backgroundColor: '#f8f9fa',
    padding: '20px',
    borderRadius: '16px',
    marginBottom: '20px',
    border: '2px solid #007bff',
  },
  formTitle: {
    margin: '0 0 15px 0',
    fontSize: 'clamp(16px, 5vw, 18px)',
    color: '#333',
  },
  input: {
    padding: '12px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    fontSize: 'clamp(14px, 4vw, 16px)',
    width: '100%',
    boxSizing: 'border-box' as const,
    marginBottom: '10px',
  },
  textarea: {
    padding: '12px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    fontSize: 'clamp(14px, 4vw, 16px)',
    width: '100%',
    boxSizing: 'border-box' as const,
    marginBottom: '10px',
    resize: 'vertical' as const,
  },
  formRow: {
    display: 'flex',
    gap: '10px',
    marginBottom: '10px',
    flexWrap: 'wrap' as const,
  },
  formButtons: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'flex-end',
    marginTop: '10px',
  },
  cancelButton: {
    padding: '10px 20px',
    backgroundColor: '#6c757d',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: 'clamp(14px, 4vw, 16px)',
  },
  saveButton: {
    padding: '10px 20px',
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: 'clamp(14px, 4vw, 16px)',
  },
  updatesList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '20px',
  },
  updateCard: {
    padding: '20px',
    backgroundColor: 'white',
    borderRadius: '16px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
    border: '1px solid #eee',
  },
  updateHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '15px',
    flexWrap: 'wrap' as const,
    gap: '15px',
  },
  updateHeaderLeft: {
    display: 'flex',
    gap: '15px',
    alignItems: 'flex-start',
  },
  updateHeaderRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
  },
  updateTypeIcon: {
    fontSize: '24px',
  },
  updateTitle: {
    fontSize: 'clamp(16px, 5vw, 18px)',
    margin: '0 0 8px 0',
    color: '#333',
  },
  updateMeta: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap' as const,
  },
  statusBadge: {
    padding: '4px 8px',
    borderRadius: '4px',
    color: 'white',
    fontSize: '11px',
    fontWeight: '500',
    textTransform: 'uppercase' as const,
  },
  versionBadge: {
    padding: '4px 8px',
    backgroundColor: '#6c757d',
    color: 'white',
    borderRadius: '4px',
    fontSize: '11px',
  },
  priorityBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    padding: '4px 8px',
    backgroundColor: '#f8f9fa',
    borderRadius: '4px',
    fontSize: '11px',
  },
  priorityDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    display: 'inline-block',
  },
  updateDate: {
    fontSize: '12px',
    color: '#6c757d',
  },
  updateActions: {
    display: 'flex',
    gap: '8px',
  },
  editButton: {
    padding: '6px 10px',
    backgroundColor: '#f8f9fa',
    border: '1px solid #dee2e6',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
  },
  deleteButton: {
    padding: '6px 10px',
    backgroundColor: '#fff',
    border: '1px solid #dc3545',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    color: '#dc3545',
  },
  updateDescription: {
    fontSize: 'clamp(13px, 4vw, 14px)',
    lineHeight: '1.6',
    color: '#666',
    margin: '0 0 15px 0',
  },
  tags: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap' as const,
    marginBottom: '15px',
  },
  tag: {
    padding: '4px 10px',
    backgroundColor: '#e9ecef',
    borderRadius: '20px',
    fontSize: '12px',
    color: '#495057',
  },
  updateFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTop: '1px solid #eee',
    paddingTop: '15px',
  },
  updateStats: {
    display: 'flex',
    gap: '15px',
  },
  likeButton: {
    background: 'none',
    border: 'none',
    color: '#dc3545',
    cursor: 'pointer',
    fontSize: '14px',
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    padding: 0,
  },
  commentCount: {
    fontSize: '14px',
    color: '#6c757d',
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
  },
  updateAuthor: {
    fontSize: '12px',
    color: '#6c757d',
  },
  editForm: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '15px',
  },
  editButtons: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'flex-end',
  },
  emptyState: {
    textAlign: 'center' as const,
    padding: '40px',
    backgroundColor: '#f8f9fa',
    borderRadius: '12px',
  },
  emptyStateText: {
    fontSize: '16px',
    color: '#666',
    marginBottom: '20px',
  },
  emptyStateButton: {
    padding: '12px 24px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '16px',
  },
};

// Add keyframe animation
const style = document.createElement('style');
style.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
document.head.appendChild(style);

export default BuildUpdates;