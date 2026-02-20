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

// --- Icons ---
const Icons = {
  Plus: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>,
  Edit: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  Trash: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>,
  Lock: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
  Clock: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  Calendar: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>,
  Check: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  X: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>,
  AlertCircle: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>,
  RefreshCw: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/></svg>
};

const BuildUpdates: React.FC<Props> = ({ initialEditMode = false }) => {
  const [updates, setUpdates] = useState<BuildUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(initialEditMode);
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

  // Responsive detection
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 640);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 640);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Load updates on mount
  useEffect(() => {
    fetchUpdates();
  }, []);

  const convertTimestampToDate = (data: any, docId: string): BuildUpdate => ({
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
  });

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
      const newUpdateWithId: BuildUpdate = { id: docRef.id, ...newUpdate };
      
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

  const handleEnableEditMode = () => setIsPasswordModalOpen(true);
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

  // Status and priority configurations
  const statusConfig = {
    completed: { color: '#059669', bg: '#ecfdf5', label: 'Completed', icon: '✓' },
    'in-progress': { color: '#d97706', bg: '#fffbeb', label: 'In Progress', icon: '◐' },
    planned: { color: '#6b7280', bg: '#f3f4f6', label: 'Planned', icon: '○' }
  };

  const priorityConfig = {
    high: { color: '#dc2626', bg: '#fef2f2', label: 'High' },
    medium: { color: '#d97706', bg: '#fffbeb', label: 'Medium' },
    low: { color: '#059669', bg: '#ecfdf5', label: 'Low' }
  };

  const categoryConfig = {
    development: { color: '#7c3aed', bg: '#f5f3ff', icon: '💻' },
    design: { color: '#db2777', bg: '#fdf2f8', icon: '🎨' },
    'ai-integration': { color: '#0891b2', bg: '#ecfeff', icon: '🤖' },
    testing: { color: '#ea580c', bg: '#fff7ed', icon: '🧪' },
    deployment: { color: '#059669', bg: '#ecfdf5', icon: '🚀' }
  };

  if (loading && updates.length === 0) {
    return (
      <div className="build-updates-loading">
        <div className="spinner"></div>
        <p>Loading updates...</p>
      </div>
    );
  }

  return (
    <div className="build-updates-container">
      <PasswordModal 
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        onSuccess={handlePasswordSuccess}
      />

      {/* Error Banner */}
      {error && (
        <div className="error-banner">
          <div className="error-content">
            <Icons.AlertCircle />
            <span>{error}</span>
          </div>
          <button onClick={fetchUpdates} className="retry-btn">
            <Icons.RefreshCw /> Retry
          </button>
        </div>
      )}

      {/* Header */}
      <div className="build-updates-header">
        <div className="header-title">
          <h2>Build Updates</h2>
          <span className="update-count">{updates.length} updates</span>
        </div>
        <button 
          onClick={handleAddClick}
          className={`add-update-btn ${isEditMode ? 'active' : 'locked'}`}
        >
          {isEditMode ? <><Icons.Plus /> Add Update</> : <><Icons.Lock /> Enable Edit</>}
        </button>
      </div>

      {/* Edit Mode Banner */}
      {isEditMode && !showAddForm && (
        <div className="edit-mode-banner">
          <Icons.Check />
          <span>Edit Mode Active — You can now manage updates</span>
        </div>
      )}

      {/* Add/Edit Form */}
      {showAddForm && isEditMode && (
        <div className="update-form-container">
          <form onSubmit={editingUpdate ? handleEditUpdate : handleAddUpdate} className="update-form">
            <div className="form-header">
              <h3>{editingUpdate ? 'Edit Update' : 'New Update'}</h3>
              <button type="button" onClick={cancelForm} className="close-form-btn">
                <Icons.X />
              </button>
            </div>
            
            <div className={`form-grid ${isMobile ? 'mobile' : ''}`}>
              <div className="form-group">
                <label>Week</label>
                <input
                  type="number"
                  value={newUpdate.weekNumber}
                  onChange={(e) => setNewUpdate({...newUpdate, weekNumber: parseInt(e.target.value) || 1})}
                  min="1"
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Time Spent (hrs)</label>
                <input
                  type="number"
                  value={newUpdate.timeSpent || ''}
                  onChange={(e) => setNewUpdate({...newUpdate, timeSpent: parseInt(e.target.value) || 0})}
                  min="0"
                />
              </div>
              
              <div className="form-group wide">
                <label>Title</label>
                <input
                  type="text"
                  value={newUpdate.title}
                  onChange={(e) => setNewUpdate({...newUpdate, title: e.target.value})}
                  placeholder="Enter update title..."
                  required
                />
              </div>
              
              <div className="form-group wide">
                <label>Description</label>
                <textarea
                  value={newUpdate.description}
                  onChange={(e) => setNewUpdate({...newUpdate, description: e.target.value})}
                  placeholder="Describe the update..."
                  rows={3}
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Category</label>
                <select
                  value={newUpdate.category}
                  onChange={(e) => setNewUpdate({...newUpdate, category: e.target.value as UpdateCategory})}
                >
                  <option value="development">Development</option>
                  <option value="design">Design</option>
                  <option value="ai-integration">AI Integration</option>
                  <option value="testing">Testing</option>
                  <option value="deployment">Deployment</option>
                </select>
              </div>
              
              <div className="form-group">
                <label>Status</label>
                <select
                  value={newUpdate.status}
                  onChange={(e) => setNewUpdate({...newUpdate, status: e.target.value as UpdateStatus})}
                >
                  <option value="planned">Planned</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
              
              <div className="form-group">
                <label>Priority</label>
                <select
                  value={newUpdate.priority}
                  onChange={(e) => setNewUpdate({...newUpdate, priority: e.target.value as UpdatePriority})}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>
            
            <div className="form-actions">
              <button type="button" onClick={cancelForm} className="btn-secondary">
                Cancel
              </button>
              <button 
                type="submit" 
                className="btn-primary"
                disabled={loading}
              >
                {loading ? 'Saving...' : (editingUpdate ? 'Save Changes' : 'Post Update')}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Updates List */}
      <div className="updates-list">
        {updates.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <h3>No updates yet</h3>
            <p>Get started by adding your first build update</p>
            {!isEditMode && (
              <button onClick={handleAddClick} className="btn-outline">
                <Icons.Lock /> Enable Edit Mode
              </button>
            )}
          </div>
        ) : (
          updates.map((update) => {
            const status = statusConfig[update.status];
            const priority = update.priority ? priorityConfig[update.priority] : null;
            const category = categoryConfig[update.category];
            
            return (
              <div key={update.id} className="update-card">
                <div className="update-card-header">
                  <div className="update-badges">
                    <span 
                      className="badge-category"
                      style={{ background: category.bg, color: category.color }}
                    >
                      <span className="category-icon">{category.icon}</span>
                      {update.category}
                    </span>
                    <span 
                      className="badge-status"
                      style={{ background: status.bg, color: status.color }}
                    >
                      <span className="status-icon">{status.icon}</span>
                      {status.label}
                    </span>
                    {priority && (
                      <span 
                        className="badge-priority"
                        style={{ background: priority.bg, color: priority.color }}
                      >
                        {priority.label}
                      </span>
                    )}
                  </div>
                  
                  <div className="update-actions">
                    {isEditMode && (
                      <>
                        <button 
                          onClick={() => handleEditClick(update)}
                          className="action-btn edit"
                          disabled={loading}
                          title="Edit"
                        >
                          <Icons.Edit />
                        </button>
                        <button 
                          onClick={() => handleDeleteUpdate(update.id)}
                          className="action-btn delete"
                          disabled={loading}
                          title="Delete"
                        >
                          <Icons.Trash />
                        </button>
                      </>
                    )}
                  </div>
                </div>
                
                <div className="update-card-body">
                  <div className="week-indicator">Week {update.weekNumber}</div>
                  <h3 className="update-title">{update.title}</h3>
                  <p className="update-description">{update.description}</p>
                </div>
                
                <div className="update-card-footer">
                  <div className="footer-meta">
                    {update.timeSpent ? (
                      <span className="meta-item time">
                        <Icons.Clock />
                        {update.timeSpent}h
                      </span>
                    ) : null}
                    <span className="meta-item date">
                      <Icons.Calendar />
                      {new Date(update.date).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* View Only Notice */}
      {!isEditMode && updates.length > 0 && (
        <div className="view-only-notice">
          <Icons.Lock />
          <span>View only mode. Enable edit mode to make changes.</span>
        </div>
      )}

      <style>{`
        .build-updates-container {
          --primary-50: #fff7ed;
          --primary-100: #ffedd5;
          --primary-500: #f97316;
          --primary-600: #ea580c;
          --primary-700: #c2410c;
          --gray-0: #ffffff;
          --gray-50: #f8fafc;
          --gray-100: #f1f5f9;
          --gray-200: #e2e8f0;
          --gray-300: #cbd5e1;
          --gray-400: #94a3b8;
          --gray-500: #64748b;
          --gray-600: #475569;
          --gray-700: #334155;
          --gray-800: #1e293b;
          --gray-900: #0f172a;
          --success-50: #ecfdf5;
          --success-500: #10b981;
          --success-600: #059669;
          --warning-50: #fffbeb;
          --warning-500: #f59e0b;
          --warning-600: #d97706;
          --error-50: #fef2f2;
          --error-500: #ef4444;
          --error-600: #dc2626;
          --radius-sm: 6px;
          --radius-md: 8px;
          --radius-lg: 12px;
          --radius-xl: 16px;
          --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
          --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
          --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);
          --transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          
          width: 100%;
          max-width: 1200px;
          margin: 0 auto;
        }

        /* Loading State */
        .build-updates-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px 20px;
          color: var(--gray-500);
        }

        .spinner {
          width: 40px;
          height: 40px;
          border: 3px solid var(--gray-200);
          border-top-color: var(--primary-500);
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 16px;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* Error Banner */
        .error-banner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 16px;
          background: var(--error-50);
          border: 1px solid var(--error-200);
          border-radius: var(--radius-lg);
          margin-bottom: 20px;
          color: var(--error-600);
          flex-wrap: wrap;
          gap: 12px;
        }

        .error-content {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          font-weight: 500;
        }

        .retry-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          background: var(--error-600);
          color: white;
          border: none;
          border-radius: var(--radius-md);
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: var(--transition);
        }

        .retry-btn:hover {
          background: var(--error-700);
        }

        /* Header */
        .build-updates-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
          flex-wrap: wrap;
          gap: 16px;
        }

        .header-title {
          display: flex;
          align-items: baseline;
          gap: 12px;
        }

        .header-title h2 {
          margin: 0;
          font-size: 24px;
          font-weight: 700;
          color: var(--gray-900);
          letter-spacing: -0.025em;
        }

        .update-count {
          font-size: 14px;
          color: var(--gray-500);
          font-weight: 500;
          background: var(--gray-100);
          padding: 4px 10px;
          border-radius: 20px;
        }

        .add-update-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
          border-radius: var(--radius-xl);
          border: none;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: var(--transition);
        }

        .add-update-btn.active {
          background: var(--primary-500);
          color: white;
          box-shadow: 0 4px 12px rgba(249, 115, 22, 0.3);
        }

        .add-update-btn.active:hover {
          background: var(--primary-600);
          transform: translateY(-1px);
        }

        .add-update-btn.locked {
          background: var(--gray-100);
          color: var(--gray-600);
          border: 1px solid var(--gray-200);
        }

        .add-update-btn.locked:hover {
          background: var(--gray-200);
          color: var(--gray-700);
        }

        /* Edit Mode Banner */
        .edit-mode-banner {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 16px;
          background: var(--success-50);
          border: 1px solid #86efac;
          border-radius: var(--radius-lg);
          color: var(--success-600);
          font-size: 14px;
          font-weight: 500;
          margin-bottom: 20px;
        }

        .edit-mode-banner svg {
          color: var(--success-600);
        }

        /* Form */
        .update-form-container {
          margin-bottom: 24px;
          animation: slideDown 0.3s ease;
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .update-form {
          background: var(--gray-0);
          border: 1px solid var(--gray-200);
          border-radius: var(--radius-xl);
          box-shadow: var(--shadow-lg);
          overflow: hidden;
        }

        .form-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 24px;
          background: linear-gradient(135deg, var(--primary-50), #fff7ed);
          border-bottom: 1px solid var(--primary-100);
        }

        .form-header h3 {
          margin: 0;
          font-size: 18px;
          font-weight: 700;
          color: var(--primary-700);
        }

        .close-form-btn {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: white;
          border: 1px solid var(--gray-200);
          border-radius: var(--radius-md);
          color: var(--gray-500);
          cursor: pointer;
          transition: var(--transition);
        }

        .close-form-btn:hover {
          background: var(--gray-100);
          color: var(--gray-700);
        }

        .form-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          padding: 24px;
        }

        .form-grid.mobile {
          grid-template-columns: 1fr;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .form-group.wide {
          grid-column: 1 / -1;
        }

        .form-group label {
          font-size: 13px;
          font-weight: 600;
          color: var(--gray-700);
          text-transform: uppercase;
          letter-spacing: 0.025em;
        }

        .form-group input,
        .form-group select,
        .form-group textarea {
          padding: 10px 14px;
          border: 1px solid var(--gray-300);
          border-radius: var(--radius-md);
          font-size: 14px;
          color: var(--gray-900);
          background: var(--gray-0);
          transition: var(--transition);
          outline: none;
        }

        .form-group input:focus,
        .form-group select:focus,
        .form-group textarea:focus {
          border-color: var(--primary-400);
          box-shadow: 0 0 0 3px var(--primary-100);
        }

        .form-group textarea {
          resize: vertical;
          min-height: 80px;
          font-family: inherit;
        }

        .form-actions {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          padding: 20px 24px;
          background: var(--gray-50);
          border-top: 1px solid var(--gray-200);
        }

        .btn-primary {
          padding: 10px 20px;
          background: var(--primary-500);
          color: white;
          border: none;
          border-radius: var(--radius-lg);
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: var(--transition);
        }

        .btn-primary:hover:not(:disabled) {
          background: var(--primary-600);
        }

        .btn-primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .btn-secondary {
          padding: 10px 20px;
          background: var(--gray-0);
          color: var(--gray-700);
          border: 1px solid var(--gray-300);
          border-radius: var(--radius-lg);
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: var(--transition);
        }

        .btn-secondary:hover {
          background: var(--gray-100);
        }

        .btn-outline {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
          background: transparent;
          color: var(--gray-600);
          border: 1px solid var(--gray-300);
          border-radius: var(--radius-lg);
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: var(--transition);
        }

        .btn-outline:hover {
          background: var(--gray-50);
          color: var(--gray-900);
        }

        /* Updates List */
        .updates-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        /* Empty State */
        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px 20px;
          text-align: center;
          background: var(--gray-50);
          border-radius: var(--radius-xl);
          border: 2px dashed var(--gray-200);
        }

        .empty-icon {
          font-size: 48px;
          margin-bottom: 16px;
          opacity: 0.6;
        }

        .empty-state h3 {
          margin: 0 0 8px 0;
          font-size: 18px;
          font-weight: 600;
          color: var(--gray-700);
        }

        .empty-state p {
          margin: 0 0 20px 0;
          color: var(--gray-500);
          font-size: 14px;
        }

        /* Update Card */
        .update-card {
          background: var(--gray-0);
          border: 1px solid var(--gray-200);
          border-radius: var(--radius-xl);
          box-shadow: var(--shadow-sm);
          transition: var(--transition);
          overflow: hidden;
        }

        .update-card:hover {
          box-shadow: var(--shadow-md);
          border-color: var(--gray-300);
          transform: translateY(-2px);
        }

        .update-card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding: 16px 20px;
          background: var(--gray-50);
          border-bottom: 1px solid var(--gray-100);
          flex-wrap: wrap;
          gap: 12px;
        }

        .update-badges {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .badge-category,
        .badge-status,
        .badge-priority {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          text-transform: capitalize;
        }

        .category-icon,
        .status-icon {
          font-size: 14px;
          line-height: 1;
        }

        .update-actions {
          display: flex;
          gap: 8px;
        }

        .action-btn {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: none;
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: var(--transition);
          color: var(--gray-500);
        }

        .action-btn.edit {
          background: var(--gray-0);
          border: 1px solid var(--gray-200);
        }

        .action-btn.edit:hover:not(:disabled) {
          background: var(--primary-50);
          color: var(--primary-600);
          border-color: var(--primary-200);
        }

        .action-btn.delete {
          background: var(--error-50);
          border: 1px solid var(--error-200);
          color: var(--error-500);
        }

        .action-btn.delete:hover:not(:disabled) {
          background: var(--error-100);
          color: var(--error-600);
        }

        .action-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .update-card-body {
          padding: 20px;
        }

        .week-indicator {
          display: inline-block;
          font-size: 12px;
          font-weight: 700;
          color: var(--primary-600);
          background: var(--primary-50);
          padding: 4px 10px;
          border-radius: 20px;
          margin-bottom: 12px;
          text-transform: uppercase;
          letter-spacing: 0.025em;
        }

        .update-title {
          margin: 0 0 10px 0;
          font-size: 18px;
          font-weight: 700;
          color: var(--gray-900);
          line-height: 1.4;
          letter-spacing: -0.025em;
        }

        .update-description {
          margin: 0;
          font-size: 15px;
          color: var(--gray-600);
          line-height: 1.6;
        }

        .update-card-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 20px;
          background: var(--gray-50);
          border-top: 1px solid var(--gray-100);
          flex-wrap: wrap;
          gap: 12px;
        }

        .footer-meta {
          display: flex;
          gap: 16px;
          flex-wrap: wrap;
        }

        .meta-item {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          color: var(--gray-500);
          font-weight: 500;
        }

        .meta-item svg {
          color: var(--gray-400);
        }

        .meta-item.time {
          color: var(--primary-600);
        }

        .meta-item.time svg {
          color: var(--primary-500);
        }

        /* View Only Notice */
        .view-only-notice {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          margin-top: 24px;
          padding: 16px;
          background: var(--gray-100);
          border-radius: var(--radius-lg);
          color: var(--gray-600);
          font-size: 14px;
          font-weight: 500;
        }

        .view-only-notice svg {
          color: var(--gray-400);
        }

        /* Mobile Responsive */
        @media (max-width: 640px) {
          .build-updates-header {
            flex-direction: column;
            align-items: stretch;
          }

          .header-title {
            justify-content: space-between;
          }

          .add-update-btn {
            width: 100%;
            justify-content: center;
          }

          .form-grid {
            grid-template-columns: 1fr;
            padding: 16px;
          }

          .form-actions {
            flex-direction: column;
            padding: 16px;
          }

          .form-actions button {
            width: 100%;
            justify-content: center;
          }

          .update-card-header {
            flex-direction: column;
            align-items: stretch;
          }

          .update-badges {
            order: 2;
          }

          .update-actions {
            order: 1;
            align-self: flex-end;
          }

          .update-card-footer {
            flex-direction: column;
            align-items: flex-start;
          }
        }

        /* Touch Optimization */
        @media (hover: none) {
          .update-card:hover,
          .add-update-btn:hover,
          .action-btn:hover {
            transform: none;
          }

          .update-card:active,
          .add-update-btn:active,
          .action-btn:active {
            transform: scale(0.98);
          }
        }

        /* Reduced Motion */
        @media (prefers-reduced-motion: reduce) {
          * {
            animation-duration: 0.01ms !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>
    </div>
  );
};

export default BuildUpdates;