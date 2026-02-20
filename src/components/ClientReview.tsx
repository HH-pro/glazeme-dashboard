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
  Timestamp,
  getDoc
} from 'firebase/firestore';
import { db } from '../services/firebase';

// Types
type ReviewStatus = 'pending' | 'in-review' | 'resolved';
type FeedbackType = 'bug' | 'feature' | 'design' | 'general' | 'idea';

interface ReviewPoint {
  id: string;
  text: string;
  type: 'praise' | 'issue' | 'suggestion' | 'question';
  isResolved: boolean;
}

interface ClientReview {
  id: string;
  updateId: string;
  updateTitle: string;
  feedback: string;
  points: ReviewPoint[];
  type: FeedbackType;
  status: ReviewStatus;
  createdAt: Date;
  updatedAt?: Date;
  resolvedAt?: Date;
}

interface BuildUpdate {
  id: string;
  weekNumber: number;
  title: string;
}

interface Props {
  isAdmin?: boolean;
}

// Icons
const Icons = {
  Plus: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>,
  X: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>,
  Check: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  Trash: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>,
  Edit: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  MessageSquare: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  Bug: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="8" height="14" x="8" y="6" rx="4"/><path d="m18 8 2 2"/><path d="m22 8-2 2"/><path d="m18 16 2-2"/><path d="m22 16-2-2"/><path d="M8 10h.01"/><path d="M8 14h.01"/></svg>,
  Lightbulb: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></svg>,
  Palette: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="13.5" cy="6.5" r=".5"/><circle cx="17.5" cy="10.5" r=".5"/><circle cx="8.5" cy="7.5" r=".5"/><circle cx="6.5" cy="12.5" r=".5"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/></svg>,
  MessageCircle: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></svg>,
  Clock: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  CheckCircle: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>,
  Inbox: () => <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg>,
  ThumbsUp: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg>,
  AlertCircle: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>,
  HelpCircle: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" x2="12.01" y1="17" y2="17"/></svg>
};

const ClientReview: React.FC<Props> = ({ isAdmin = false }) => {
  const [reviews, setReviews] = useState<ClientReview[]>([]);
  const [updates, setUpdates] = useState<BuildUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingReview, setEditingReview] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<ReviewStatus | 'all'>('all');
  const [filterType, setFilterType] = useState<FeedbackType | 'all'>('all');
  
  const [newReview, setNewReview] = useState({
    updateId: '',
    feedback: '',
    type: 'general' as FeedbackType,
    points: [] as ReviewPoint[]
  });

  const [currentPoint, setCurrentPoint] = useState({
    text: '',
    type: 'suggestion' as 'praise' | 'issue' | 'suggestion' | 'question'
  });

  const [isMobile, setIsMobile] = useState(window.innerWidth <= 640);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 640);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    fetchUpdates();
    fetchReviews();
  }, []);

  const fetchUpdates = async () => {
    try {
      const updatesRef = collection(db, 'buildUpdates');
      const q = query(updatesRef, orderBy('date', 'desc'));
      const snapshot = await getDocs(q);
      const fetchedUpdates = snapshot.docs.map(doc => ({
        id: doc.id,
        weekNumber: doc.data().weekNumber,
        title: doc.data().title
      }));
      setUpdates(fetchedUpdates);
    } catch (err) {
      console.error('Error fetching updates:', err);
    }
  };

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const reviewsRef = collection(db, 'clientReviews');
      const q = query(reviewsRef, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const fetchedReviews = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate()
      })) as ClientReview[];
      setReviews(fetchedReviews);
    } catch (err) {
      console.error('Error fetching reviews:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPoint = () => {
    if (!currentPoint.text.trim()) return;
    
    const point: ReviewPoint = {
      id: Date.now().toString(),
      text: currentPoint.text.trim(),
      type: currentPoint.type,
      isResolved: false
    };

    setNewReview(prev => ({
      ...prev,
      points: [...prev.points, point]
    }));

    setCurrentPoint({ text: '', type: 'suggestion' });
  };

  const handleRemovePoint = (pointId: string) => {
    setNewReview(prev => ({
      ...prev,
      points: prev.points.filter(p => p.id !== pointId)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReview.updateId || !newReview.feedback.trim()) return;

    try {
      setLoading(true);
      const update = updates.find(u => u.id === newReview.updateId);
      
      const reviewData = {
        updateId: newReview.updateId,
        updateTitle: update ? `Week ${update.weekNumber}: ${update.title}` : '',
        feedback: newReview.feedback.trim(),
        points: newReview.points,
        type: newReview.type,
        status: 'pending' as ReviewStatus,
        createdAt: Timestamp.now()
      };

      await addDoc(collection(db, 'clientReviews'), reviewData);
      
      resetForm();
      fetchReviews();
    } catch (err) {
      console.error('Error submitting review:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingReview || !newReview.feedback.trim()) return;

    try {
      setLoading(true);
      const reviewRef = doc(db, 'clientReviews', editingReview);
      
      await updateDoc(reviewRef, {
        feedback: newReview.feedback.trim(),
        points: newReview.points,
        type: newReview.type,
        updatedAt: Timestamp.now()
      });

      resetForm();
      fetchReviews();
    } catch (err) {
      console.error('Error updating review:', err);
    } finally {
      setLoading(false);
    }
  };

  const startEditing = (review: ClientReview) => {
    setEditingReview(review.id);
    setNewReview({
      updateId: review.updateId,
      feedback: review.feedback,
      type: review.type,
      points: review.points || []
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (reviewId: string) => {
    if (!window.confirm('Are you sure you want to delete this feedback?')) return;
    
    try {
      await deleteDoc(doc(db, 'clientReviews', reviewId));
      fetchReviews();
    } catch (err) {
      console.error('Error deleting review:', err);
    }
  };

  const handleStatusChange = async (reviewId: string, status: ReviewStatus) => {
    try {
      const reviewRef = doc(db, 'clientReviews', reviewId);
      await updateDoc(reviewRef, {
        status,
        resolvedAt: status === 'resolved' ? Timestamp.now() : null
      });
      fetchReviews();
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  const togglePointResolve = async (reviewId: string, pointId: string) => {
    try {
      const review = reviews.find(r => r.id === reviewId);
      if (!review) return;

      const updatedPoints = review.points.map(p => 
        p.id === pointId ? { ...p, isResolved: !p.isResolved } : p
      );

      const reviewRef = doc(db, 'clientReviews', reviewId);
      await updateDoc(reviewRef, { points: updatedPoints });
      
      fetchReviews();
    } catch (err) {
      console.error('Error toggling point:', err);
    }
  };

  const resetForm = () => {
    setNewReview({
      updateId: '',
      feedback: '',
      type: 'general',
      points: []
    });
    setCurrentPoint({ text: '', type: 'suggestion' });
    setShowForm(false);
    setEditingReview(null);
  };

  const filteredReviews = reviews.filter(review => {
    const matchesStatus = filterStatus === 'all' || review.status === filterStatus;
    const matchesType = filterType === 'all' || review.type === filterType;
    return matchesStatus && matchesType;
  });

  const stats = {
    total: reviews.length,
    pending: reviews.filter(r => r.status === 'pending').length,
    resolved: reviews.filter(r => r.status === 'resolved').length,
    totalPoints: reviews.reduce((acc, r) => acc + (r.points?.length || 0), 0),
    resolvedPoints: reviews.reduce((acc, r) => 
      acc + (r.points?.filter(p => p.isResolved).length || 0), 0
    )
  };

  const typeConfig = {
    bug: { label: 'Bug', color: '#ef4444', bg: '#fef2f2', icon: <Icons.Bug /> },
    feature: { label: 'Feature', color: '#7c3aed', bg: '#f5f3ff', icon: <Icons.Lightbulb /> },
    design: { label: 'Design', color: '#db2777', bg: '#fdf2f8', icon: <Icons.Palette /> },
    general: { label: 'General', color: '#059669', bg: '#ecfdf5', icon: <Icons.MessageCircle /> },
    idea: { label: 'Idea', color: '#d97706', bg: '#fffbeb', icon: <Icons.Lightbulb /> }
  };

  const statusConfig = {
    pending: { label: 'Pending', color: '#d97706', bg: '#fffbeb' },
    'in-review': { label: 'In Review', color: '#2563eb', bg: '#eff6ff' },
    resolved: { label: 'Resolved', color: '#059669', bg: '#ecfdf5' }
  };

  const pointTypeConfig = {
    praise: { icon: <Icons.ThumbsUp />, color: '#059669', bg: '#ecfdf5', label: 'Praise' },
    issue: { icon: <Icons.AlertCircle />, color: '#ef4444', bg: '#fef2f2', label: 'Issue' },
    suggestion: { icon: <Icons.Lightbulb />, color: '#7c3aed', bg: '#f5f3ff', label: 'Idea' },
    question: { icon: <Icons.HelpCircle />, color: '#2563eb', bg: '#eff6ff', label: 'Question' }
  };

  if (loading && reviews.length === 0) {
    return (
      <div className="reviews-loading">
        <div className="spinner"></div>
        <p>Loading feedback...</p>
      </div>
    );
  }

  return (
    <div className="client-reviews">
      {/* Header */}
      <div className="reviews-header">
        <div className="header-content">
          <h2>Client Feedback</h2>
          <p>Share your thoughts, report issues, or suggest ideas</p>
        </div>
        <button 
          onClick={() => editingReview ? resetForm() : setShowForm(!showForm)}
          className={`btn-primary ${showForm ? 'active' : ''}`}
        >
          {showForm ? <><Icons.X /> Cancel</> : <><Icons.Plus /> Add Feedback</>}
        </button>
      </div>

      {/* Stats */}
      <div className="stats-row">
        <div className="stat-pill">
          <span className="stat-value">{stats.total}</span>
          <span className="stat-label">Total</span>
        </div>
        <div className="stat-pill pending">
          <span className="stat-value">{stats.pending}</span>
          <span className="stat-label">Pending</span>
        </div>
        <div className="stat-pill resolved">
          <span className="stat-value">{stats.resolved}</span>
          <span className="stat-label">Resolved</span>
        </div>
        <div className="stat-pill points">
          <span className="stat-value">{stats.resolvedPoints}/{stats.totalPoints}</span>
          <span className="stat-label">Points Done</span>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <select 
          value={filterStatus} 
          onChange={(e) => setFilterStatus(e.target.value as ReviewStatus | 'all')}
          className="filter-select"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="in-review">In Review</option>
          <option value="resolved">Resolved</option>
        </select>
        <select 
          value={filterType} 
          onChange={(e) => setFilterType(e.target.value as FeedbackType | 'all')}
          className="filter-select"
        >
          <option value="all">All Types</option>
          <option value="bug">Bug</option>
          <option value="feature">Feature</option>
          <option value="design">Design</option>
          <option value="idea">Idea</option>
          <option value="general">General</option>
        </select>
      </div>

      {/* Form */}
      {showForm && (
        <form onSubmit={editingReview ? handleEdit : handleSubmit} className="review-form">
          <h3>{editingReview ? 'Edit Feedback' : 'New Feedback'}</h3>
          
          {!editingReview && (
            <div className="form-group">
              <label>Select Update *</label>
              <select
                value={newReview.updateId}
                onChange={(e) => setNewReview({...newReview, updateId: e.target.value})}
                required
              >
                <option value="">Choose an update...</option>
                {updates.map(update => (
                  <option key={update.id} value={update.id}>
                    Week {update.weekNumber}: {update.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="form-group">
            <label>Feedback Type</label>
            <div className="type-buttons">
              {(['bug', 'feature', 'design', 'idea', 'general'] as FeedbackType[]).map(type => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setNewReview({...newReview, type})}
                  className={`type-btn ${newReview.type === type ? 'active' : ''}`}
                  style={{
                    '--type-color': typeConfig[type].color,
                    '--type-bg': typeConfig[type].bg
                  } as React.CSSProperties}
                >
                  {typeConfig[type].icon}
                  <span>{typeConfig[type].label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>Main Feedback *</label>
            <textarea
              value={newReview.feedback}
              onChange={(e) => setNewReview({...newReview, feedback: e.target.value})}
              placeholder="Describe your feedback, issues, or suggestions..."
              rows={3}
              required
            />
          </div>

          {/* Points/Ideas Section */}
          <div className="points-section">
            <label>Detailed Points / Ideas</label>
            <p className="points-hint">Break down your feedback into specific points</p>
            
            <div className="point-input-row">
              <select
                value={currentPoint.type}
                onChange={(e) => setCurrentPoint({...currentPoint, type: e.target.value as any})}
                className="point-type-select"
              >
                {Object.entries(pointTypeConfig).map(([key, config]) => (
                  <option key={key} value={key}>{config.label}</option>
                ))}
              </select>
              <input
                type="text"
                value={currentPoint.text}
                onChange={(e) => setCurrentPoint({...currentPoint, text: e.target.value})}
                placeholder="Add a specific point..."
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddPoint())}
              />
              <button type="button" onClick={handleAddPoint} className="btn-add-point">
                <Icons.Plus />
              </button>
            </div>

            {newReview.points.length > 0 && (
              <div className="points-list">
                {newReview.points.map((point) => (
                  <div key={point.id} className={`point-chip ${point.type}`}>
                    <span className="point-icon">{pointTypeConfig[point.type].icon}</span>
                    <span className="point-text">{point.text}</span>
                    <button 
                      type="button" 
                      onClick={() => handleRemovePoint(point.id)}
                      className="point-remove"
                    >
                      <Icons.X />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="form-actions">
            <button type="button" onClick={resetForm} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Saving...' : (editingReview ? 'Save Changes' : 'Submit Feedback')}
            </button>
          </div>
        </form>
      )}

      {/* Reviews List */}
      <div className="reviews-list">
        {filteredReviews.length === 0 ? (
          <div className="empty-state">
            <Icons.Inbox />
            <p>No feedback yet</p>
            <span>Share your first thoughts on our progress</span>
          </div>
        ) : (
          filteredReviews.map(review => {
            const type = typeConfig[review.type];
            const status = statusConfig[review.status];
            
            return (
              <div key={review.id} className={`review-item ${review.status}`}>
                <div className="review-main">
                  <div className="review-meta-row">
                    <span 
                      className="type-badge"
                      style={{ background: type.bg, color: type.color }}
                    >
                      {type.icon}
                      {type.label}
                    </span>
                    <span 
                      className="status-badge"
                      style={{ background: status.bg, color: status.color }}
                    >
                      {status.label}
                    </span>
                  </div>
                  
                  <h4 className="review-title">{review.updateTitle}</h4>
                  <p className="review-text">{review.feedback}</p>
                  
                  {/* Display Points */}
                  {review.points && review.points.length > 0 && (
                    <div className="review-points">
                      <h5>Detailed Points ({review.points.filter(p => p.isResolved).length}/{review.points.length} resolved)</h5>
                      <div className="points-grid">
                        {review.points.map((point) => {
                          const pointConfig = pointTypeConfig[point.type];
                          return (
                            <div 
                              key={point.id} 
                              className={`point-item ${point.isResolved ? 'resolved' : ''}`}
                              style={{ 
                                borderLeftColor: pointConfig.color,
                                background: point.isResolved ? '#f8fafc' : pointConfig.bg 
                              }}
                            >
                              <div className="point-header">
                                <span 
                                  className="point-type-icon"
                                  style={{ color: pointConfig.color }}
                                >
                                  {pointConfig.icon}
                                </span>
                                <span className="point-type-label">{pointConfig.label}</span>
                                {isAdmin && (
                                  <button
                                    onClick={() => togglePointResolve(review.id, point.id)}
                                    className={`btn-resolve-point ${point.isResolved ? 'resolved' : ''}`}
                                  >
                                    {point.isResolved ? <Icons.Check /> : 'Resolve'}
                                  </button>
                                )}
                              </div>
                              <p className="point-content">{point.text}</p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  
                  <div className="review-footer">
                    <span className="review-date">
                      <Icons.Clock />
                      {review.createdAt.toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                      {review.updatedAt && ' (edited)'}
                    </span>
                    
                    <div className="review-actions">
                      {isAdmin && (
                        <>
                          {review.status !== 'resolved' && (
                            <button 
                              onClick={() => handleStatusChange(review.id, 'resolved')}
                              className="btn-resolve"
                            >
                              <Icons.CheckCircle /> Resolve
                            </button>
                          )}
                          <button 
                            onClick={() => startEditing(review)}
                            className="btn-edit"
                            title="Edit"
                          >
                            <Icons.Edit />
                          </button>
                          <button 
                            onClick={() => handleDelete(review.id)}
                            className="btn-delete"
                            title="Delete"
                          >
                            <Icons.Trash />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <style>{`
        .client-reviews {
          --primary: #f97316;
          --primary-light: #fff7ed;
          --gray-50: #f8fafc;
          --gray-100: #f1f5f9;
          --gray-200: #e2e8f0;
          --gray-300: #cbd5e1;
          --gray-400: #94a3b8;
          --gray-600: #475569;
          --gray-900: #0f172a;
          
          max-width: 900px;
          margin: 0 auto;
          padding: 24px;
        }

        .reviews-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
          flex-wrap: wrap;
          gap: 16px;
        }

        .header-content h2 {
          margin: 0;
          font-size: 24px;
          font-weight: 700;
          color: var(--gray-900);
          letter-spacing: -0.025em;
        }

        .header-content p {
          margin: 4px 0 0;
          color: var(--gray-600);
          font-size: 14px;
        }

        .btn-primary {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 20px;
          background: var(--primary);
          color: white;
          border: none;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-primary:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(249, 115, 22, 0.3);
        }

        .btn-primary.active {
          background: var(--gray-600);
        }

        .stats-row {
          display: flex;
          gap: 12px;
          margin-bottom: 20px;
          flex-wrap: wrap;
        }

        .stat-pill {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          background: white;
          border: 1px solid var(--gray-200);
          border-radius: 20px;
        }

        .stat-pill.pending {
          background: #fffbeb;
          border-color: #fcd34d;
        }

        .stat-pill.resolved {
          background: #ecfdf5;
          border-color: #6ee7b7;
        }

        .stat-pill.points {
          background: #eff6ff;
          border-color: #93c5fd;
        }

        .stat-value {
          font-size: 18px;
          font-weight: 700;
          color: var(--gray-900);
        }

        .stat-pill.pending .stat-value { color: #d97706; }
        .stat-pill.resolved .stat-value { color: #059669; }
        .stat-pill.points .stat-value { color: #2563eb; }

        .stat-label {
          font-size: 13px;
          color: var(--gray-600);
          font-weight: 500;
        }

        .filters-bar {
          display: flex;
          gap: 12px;
          margin-bottom: 20px;
          flex-wrap: wrap;
        }

        .filter-select {
          padding: 10px 16px;
          border: 1px solid var(--gray-200);
          border-radius: 10px;
          font-size: 14px;
          background: white;
          color: var(--gray-600);
          cursor: pointer;
          outline: none;
        }

        .filter-select:focus {
          border-color: var(--primary);
        }

        .review-form {
          background: var(--gray-50);
          padding: 24px;
          border-radius: 16px;
          margin-bottom: 24px;
          border: 2px solid var(--primary);
        }

        .review-form h3 {
          margin: 0 0 20px;
          font-size: 18px;
          color: var(--gray-900);
        }

        .form-group {
          margin-bottom: 20px;
        }

        .form-group label {
          display: block;
          margin-bottom: 8px;
          font-size: 14px;
          font-weight: 600;
          color: var(--gray-900);
        }

        .form-group select,
        .form-group textarea {
          width: 100%;
          padding: 12px;
          border: 1px solid var(--gray-200);
          border-radius: 10px;
          font-size: 15px;
          outline: none;
          transition: all 0.2s;
          font-family: inherit;
          resize: vertical;
        }

        .form-group select:focus,
        .form-group textarea:focus {
          border-color: var(--primary);
          box-shadow: 0 0 0 3px var(--primary-light);
        }

        .type-buttons {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .type-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 10px 16px;
          border: 2px solid transparent;
          border-radius: 10px;
          background: white;
          color: var(--gray-600);
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .type-btn:hover {
          background: var(--gray-100);
        }

        .type-btn.active {
          border-color: var(--type-color);
          background: var(--type-bg);
          color: var(--type-color);
        }

        /* Points Section */
        .points-section {
          background: white;
          padding: 20px;
          border-radius: 12px;
          border: 1px solid var(--gray-200);
          margin-bottom: 20px;
        }

        .points-section > label {
          display: block;
          font-size: 14px;
          font-weight: 600;
          color: var(--gray-900);
          margin-bottom: 4px;
        }

        .points-hint {
          margin: 0 0 12px;
          font-size: 13px;
          color: var(--gray-400);
        }

        .point-input-row {
          display: flex;
          gap: 8px;
          margin-bottom: 12px;
        }

        .point-type-select {
          padding: 10px 12px;
          border: 1px solid var(--gray-200);
          border-radius: 8px;
          font-size: 14px;
          background: white;
          outline: none;
          min-width: 110px;
        }

        .point-input-row input {
          flex: 1;
          padding: 10px 12px;
          border: 1px solid var(--gray-200);
          border-radius: 8px;
          font-size: 14px;
          outline: none;
        }

        .point-input-row input:focus {
          border-color: var(--primary);
        }

        .btn-add-point {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          background: var(--primary);
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-add-point:hover {
          background: #ea580c;
        }

        .points-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .point-chip {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 12px;
          border-radius: 8px;
          font-size: 14px;
          border-left: 3px solid;
        }

        .point-chip.praise { border-left-color: #059669; background: #ecfdf5; }
        .point-chip.issue { border-left-color: #ef4444; background: #fef2f2; }
        .point-chip.suggestion { border-left-color: #7c3aed; background: #f5f3ff; }
        .point-chip.question { border-left-color: #2563eb; background: #eff6ff; }

        .point-icon {
          display: flex;
          color: var(--gray-500);
        }

        .point-text {
          flex: 1;
          color: var(--gray-700);
        }

        .point-remove {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
          background: none;
          border: none;
          color: var(--gray-400);
          cursor: pointer;
          border-radius: 4px;
          transition: all 0.2s;
        }

        .point-remove:hover {
          background: var(--gray-100);
          color: #ef4444;
        }

        .form-actions {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
        }

        .btn-secondary {
          padding: 12px 24px;
          background: white;
          color: var(--gray-600);
          border: 1px solid var(--gray-200);
          border-radius: 10px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-secondary:hover {
          background: var(--gray-100);
        }

        .reviews-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 60px 20px;
          color: var(--gray-400);
          text-align: center;
        }

        .empty-state svg {
          margin-bottom: 16px;
          opacity: 0.5;
        }

        .empty-state p {
          margin: 0 0 4px;
          font-size: 16px;
          font-weight: 500;
          color: var(--gray-600);
        }

        .empty-state span {
          font-size: 14px;
        }

        .review-item {
          background: white;
          border: 1px solid var(--gray-200);
          border-radius: 16px;
          padding: 20px;
          transition: all 0.2s;
        }

        .review-item:hover {
          border-color: var(--gray-300);
          box-shadow: 0 4px 12px rgba(0,0,0,0.05);
        }

        .review-item.resolved {
          opacity: 0.8;
          background: var(--gray-50);
        }

        .review-meta-row {
          display: flex;
          gap: 8px;
          margin-bottom: 12px;
          flex-wrap: wrap;
        }

        .type-badge,
        .status-badge {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
        }

        .review-title {
          margin: 0 0 12px;
          font-size: 16px;
          font-weight: 600;
          color: var(--gray-900);
          line-height: 1.4;
        }

        .review-text {
          margin: 0 0 16px;
          font-size: 15px;
          color: var(--gray-600);
          line-height: 1.6;
        }

        /* Review Points Display */
        .review-points {
          margin: 16px 0;
          padding: 16px;
          background: var(--gray-50);
          border-radius: 12px;
        }

        .review-points h5 {
          margin: 0 0 12px;
          font-size: 13px;
          font-weight: 600;
          color: var(--gray-600);
          text-transform: uppercase;
          letter-spacing: 0.025em;
        }

        .points-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
          gap: 12px;
        }

        .point-item {
          padding: 12px;
          border-radius: 8px;
          border-left: 3px solid;
          transition: all 0.2s;
        }

        .point-item.resolved {
          opacity: 0.6;
        }

        .point-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 8px;
        }

        .point-type-icon {
          display: flex;
        }

        .point-type-label {
          font-size: 12px;
          font-weight: 600;
          color: var(--gray-600);
          text-transform: uppercase;
          flex: 1;
        }

        .btn-resolve-point {
          padding: 4px 10px;
          border: 1px solid var(--gray-300);
          border-radius: 6px;
          background: white;
          font-size: 11px;
          font-weight: 600;
          color: var(--gray-600);
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-resolve-point:hover {
          border-color: #059669;
          color: #059669;
        }

        .btn-resolve-point.resolved {
          background: #ecfdf5;
          border-color: #059669;
          color: #059669;
        }

        .point-content {
          margin: 0;
          font-size: 14px;
          color: var(--gray-700);
          line-height: 1.5;
        }

        .review-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 12px;
          padding-top: 16px;
          border-top: 1px solid var(--gray-100);
        }

        .review-date {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          color: var(--gray-400);
        }

        .review-actions {
          display: flex;
          gap: 8px;
        }

        .btn-resolve {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          background: #ecfdf5;
          color: #059669;
          border: none;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-resolve:hover {
          background: #d1fae5;
        }

        .btn-edit,
        .btn-delete {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-edit {
          background: #eff6ff;
          color: #2563eb;
        }

        .btn-edit:hover {
          background: #dbeafe;
        }

        .btn-delete {
          background: #fef2f2;
          color: #ef4444;
        }

        .btn-delete:hover {
          background: #fee2e2;
        }

        .reviews-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 60px;
          color: var(--gray-400);
        }

        .spinner {
          width: 40px;
          height: 40px;
          border: 3px solid var(--gray-200);
          border-top-color: var(--primary);
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 16px;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @media (max-width: 640px) {
          .client-reviews {
            padding: 16px;
          }

          .reviews-header {
            flex-direction: column;
            align-items: stretch;
          }

          .btn-primary {
            width: 100%;
            justify-content: center;
          }

          .type-buttons {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
          }

          .point-input-row {
            flex-wrap: wrap;
          }

          .point-input-row input {
            width: 100%;
            order: -1;
          }

          .form-actions {
            flex-direction: column;
          }

          .form-actions button {
            width: 100%;
          }

          .points-grid {
            grid-template-columns: 1fr;
          }

          .review-footer {
            flex-direction: column;
            align-items: flex-start;
          }

          .review-actions {
            width: 100%;
            justify-content: flex-end;
          }
        }
      `}</style>
    </div>
  );
};

export default ClientReview;