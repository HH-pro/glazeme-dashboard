// src/components/ClientReview.tsx
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
  where,
  Timestamp,
  getDoc
} from 'firebase/firestore';
import { db } from '../services/firebase';

// Types
type ReviewStatus = 'pending' | 'approved' | 'changes-requested' | 'in-review';
type FeedbackPriority = 'low' | 'medium' | 'high' | 'critical';
type FeedbackType = 'general' | 'bug' | 'feature-request' | 'design' | 'content';

interface ClientReview {
  id: string;
  updateId: string;
  updateTitle: string;
  clientName: string;
  clientEmail: string;
  rating?: number; // 1-5 stars
  feedback: string;
  feedbackType: FeedbackType;
  priority: FeedbackPriority;
  status: ReviewStatus;
  attachments?: string[]; // URLs to attached files
  createdAt: Date;
  reviewedAt?: Date;
  tags?: string[];
}

interface BuildUpdate {
  id: string;
  weekNumber: number;
  title: string;
  description: string;
  category: string;
  status: string;
}

interface Props {
  clientEmail?: string; // Optional: filter by client email
  showFilters?: boolean;
}

const ClientReview: React.FC<Props> = ({ clientEmail, showFilters = true }) => {
  const [reviews, setReviews] = useState<ClientReview[]>([]);
  const [updates, setUpdates] = useState<BuildUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUpdate, setSelectedUpdate] = useState<string>('');
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState<ReviewStatus | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedReview, setExpandedReview] = useState<string | null>(null);
  const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null);

  // Mobile responsiveness
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  // New review form state
  const [newReview, setNewReview] = useState<Omit<ClientReview, 'id' | 'createdAt' | 'status'>>({
    updateId: '',
    updateTitle: '',
    clientName: '',
    clientEmail: clientEmail || '',
    rating: 5,
    feedback: '',
    feedbackType: 'general',
    priority: 'medium',
    attachments: []
  });

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Load data on mount
  useEffect(() => {
    fetchUpdates();
    fetchReviews();
  }, []);

  // Show notification helper
  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  // Fetch all updates
  const fetchUpdates = async () => {
    try {
      const updatesRef = collection(db, 'buildUpdates');
      const q = query(updatesRef, orderBy('date', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const fetchedUpdates = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date?.toDate()
      })) as BuildUpdate[];
      
      setUpdates(fetchedUpdates);
    } catch (err) {
      console.error('Error fetching updates:', err);
    }
  };

  // Fetch reviews
  const fetchReviews = async () => {
    try {
      setLoading(true);
      const reviewsRef = collection(db, 'clientReviews');
      let q;
      
      if (clientEmail) {
        q = query(
          reviewsRef, 
          where('clientEmail', '==', clientEmail),
          orderBy('createdAt', 'desc')
        );
      } else {
        q = query(reviewsRef, orderBy('createdAt', 'desc'));
      }
      
      const querySnapshot = await getDocs(q);
      
      const fetchedReviews = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate(),
          reviewedAt: data.reviewedAt?.toDate()
        } as ClientReview;
      });
      
      setReviews(fetchedReviews);
      setError(null);
    } catch (err) {
      console.error('Error fetching reviews:', err);
      setError('Failed to load reviews');
      showNotification('error', 'Failed to load reviews');
    } finally {
      setLoading(false);
    }
  };

  // Submit new review
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      const reviewsRef = collection(db, 'clientReviews');
      
      const reviewData = {
        ...newReview,
        status: 'pending' as ReviewStatus,
        createdAt: Timestamp.now()
      };
      
      const docRef = await addDoc(reviewsRef, reviewData);
      
      const newReviewWithId: ClientReview = {
        id: docRef.id,
        ...newReview,
        status: 'pending',
        createdAt: new Date()
      };
      
      setReviews(prev => [newReviewWithId, ...prev]);
      setShowReviewForm(false);
      resetForm();
      showNotification('success', 'Review submitted successfully!');
      
    } catch (err) {
      console.error('Error submitting review:', err);
      setError('Failed to submit review');
      showNotification('error', 'Failed to submit review');
    } finally {
      setLoading(false);
    }
  };

  // Update review status (for admin use)
  const handleUpdateStatus = async (reviewId: string, status: ReviewStatus) => {
    try {
      const reviewRef = doc(db, 'clientReviews', reviewId);
      await updateDoc(reviewRef, {
        status,
        reviewedAt: Timestamp.now()
      });
      
      setReviews(prev => 
        prev.map(r => r.id === reviewId ? { ...r, status, reviewedAt: new Date() } : r)
      );
      
      showNotification('success', `Review marked as ${status}`);
    } catch (err) {
      console.error('Error updating review status:', err);
      showNotification('error', 'Failed to update status');
    }
  };

  // Delete review
  const handleDeleteReview = async (reviewId: string) => {
    if (!window.confirm('Are you sure you want to delete this review?')) return;
    
    try {
      const reviewRef = doc(db, 'clientReviews', reviewId);
      await deleteDoc(reviewRef);
      
      setReviews(prev => prev.filter(r => r.id !== reviewId));
      showNotification('success', 'Review deleted successfully');
    } catch (err) {
      console.error('Error deleting review:', err);
      showNotification('error', 'Failed to delete review');
    }
  };

  const resetForm = () => {
    setNewReview({
      updateId: '',
      updateTitle: '',
      clientName: '',
      clientEmail: clientEmail || '',
      rating: 5,
      feedback: '',
      feedbackType: 'general',
      priority: 'medium',
      attachments: []
    });
    setSelectedUpdate('');
  };

  const handleUpdateSelect = (updateId: string) => {
    const update = updates.find(u => u.id === updateId);
    if (update) {
      setNewReview({
        ...newReview,
        updateId: update.id,
        updateTitle: `Week ${update.weekNumber}: ${update.title}`
      });
    }
  };

  // Filter reviews based on status and search
  const filteredReviews = reviews.filter(review => {
    const matchesStatus = filterStatus === 'all' || review.status === filterStatus;
    const matchesSearch = searchTerm === '' || 
      review.updateTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.feedback.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.clientName.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesStatus && matchesSearch;
  });

  const getStatusColor = (status: ReviewStatus) => {
    switch(status) {
      case 'approved': return '#28a745';
      case 'changes-requested': return '#dc3545';
      case 'in-review': return '#ffc107';
      case 'pending': return '#6c757d';
      default: return '#6c757d';
    }
  };

  const getPriorityColor = (priority: FeedbackPriority) => {
    switch(priority) {
      case 'critical': return '#dc3545';
      case 'high': return '#ff8c42';
      case 'medium': return '#ffc107';
      case 'low': return '#28a745';
      default: return '#6c757d';
    }
  };

  const getFeedbackTypeIcon = (type: FeedbackType) => {
    switch(type) {
      case 'bug': return '🐛';
      case 'feature-request': return '✨';
      case 'design': return '🎨';
      case 'content': return '📝';
      default: return '💬';
    }
  };

  const renderStars = (rating: number) => {
    return '★'.repeat(rating) + '☆'.repeat(5 - rating);
  };

  // Mobile styles
  const mobileStyles = {
    header: {
      flexDirection: 'column' as const,
      alignItems: 'flex-start',
      gap: '10px',
    },
    filters: {
      flexDirection: 'column' as const,
      width: '100%',
    },
    reviewCard: {
      padding: '15px',
    },
    reviewHeader: {
      flexDirection: 'column' as const,
      alignItems: 'flex-start',
      gap: '10px',
    },
    actions: {
      width: '100%',
      justifyContent: 'flex-end',
    }
  };

  return (
    <div style={styles.container}>
      {/* Notification Toast */}
      {notification && (
        <div style={{
          ...styles.notification,
          backgroundColor: notification.type === 'success' ? '#d4edda' : '#f8d7da',
          color: notification.type === 'success' ? '#155724' : '#721c24',
        }}>
          {notification.message}
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div style={styles.errorBanner}>
          <span>{error}</span>
          <button onClick={fetchReviews} style={styles.retryButton}>
            Retry
          </button>
        </div>
      )}

      {/* Header */}
      <div style={{
        ...styles.header,
        ...(isMobile ? mobileStyles.header : {})
      }}>
        <div>
          <h2 style={styles.sectionTitle}>📝 Client Reviews</h2>
          <p style={styles.subtitle}>Share your feedback on our build progress</p>
        </div>
        <button 
          onClick={() => setShowReviewForm(!showReviewForm)}
          style={styles.addButton}
        >
          {showReviewForm ? '✕ Cancel' : '+ New Review'}
        </button>
      </div>

      {/* Filters */}
      {showFilters && (
        <div style={{
          ...styles.filters,
          ...(isMobile ? mobileStyles.filters : {})
        }}>
          <div style={styles.searchBox}>
            <input
              type="text"
              placeholder="🔍 Search reviews..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={styles.searchInput}
            />
          </div>
          
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as ReviewStatus | 'all')}
            style={styles.filterSelect}
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="in-review">In Review</option>
            <option value="approved">Approved</option>
            <option value="changes-requested">Changes Requested</option>
          </select>
        </div>
      )}

      {/* Review Form */}
      {showReviewForm && (
        <form onSubmit={handleSubmitReview} style={styles.form}>
          <h3 style={styles.formTitle}>Share Your Feedback</h3>
          
          <div style={styles.formGrid}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Your Name *</label>
              <input
                type="text"
                value={newReview.clientName}
                onChange={(e) => setNewReview({...newReview, clientName: e.target.value})}
                style={styles.input}
                required
                placeholder="Enter your name"
              />
            </div>
            
            <div style={styles.formGroup}>
              <label style={styles.label}>Email *</label>
              <input
                type="email"
                value={newReview.clientEmail}
                onChange={(e) => setNewReview({...newReview, clientEmail: e.target.value})}
                style={styles.input}
                required
                placeholder="Your email"
                readOnly={!!clientEmail}
              />
            </div>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Select Update *</label>
            <select
              value={selectedUpdate}
              onChange={(e) => {
                setSelectedUpdate(e.target.value);
                handleUpdateSelect(e.target.value);
              }}
              style={styles.select}
              required
            >
              <option value="">Choose an update to review...</option>
              {updates.map(update => (
                <option key={update.id} value={update.id}>
                  Week {update.weekNumber}: {update.title}
                </option>
              ))}
            </select>
          </div>

          <div style={styles.formGrid}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Feedback Type</label>
              <select
                value={newReview.feedbackType}
                onChange={(e) => setNewReview({...newReview, feedbackType: e.target.value as FeedbackType})}
                style={styles.select}
              >
                <option value="general">💬 General Feedback</option>
                <option value="bug">🐛 Bug Report</option>
                <option value="feature-request">✨ Feature Request</option>
                <option value="design">🎨 Design Feedback</option>
                <option value="content">📝 Content Review</option>
              </select>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Priority</label>
              <select
                value={newReview.priority}
                onChange={(e) => setNewReview({...newReview, priority: e.target.value as FeedbackPriority})}
                style={styles.select}
              >
                <option value="low">🔵 Low</option>
                <option value="medium">🟡 Medium</option>
                <option value="high">🟠 High</option>
                <option value="critical">🔴 Critical</option>
              </select>
            </div>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Rating</label>
            <div style={styles.ratingContainer}>
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setNewReview({...newReview, rating: star})}
                  style={{
                    ...styles.starButton,
                    color: star <= (newReview.rating || 0) ? '#ffc107' : '#e4e5e9'
                  }}
                >
                  ★
                </button>
              ))}
              <span style={styles.ratingText}>{newReview.rating} out of 5 stars</span>
            </div>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Your Feedback *</label>
            <textarea
              value={newReview.feedback}
              onChange={(e) => setNewReview({...newReview, feedback: e.target.value})}
              style={styles.textarea}
              required
              placeholder="Please share your thoughts, suggestions, or concerns..."
              rows={5}
            />
          </div>

          <div style={styles.formButtons}>
            <button 
              type="button" 
              onClick={() => setShowReviewForm(false)}
              style={styles.cancelButton}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              style={styles.submitButton}
              disabled={loading}
            >
              {loading ? 'Submitting...' : 'Submit Review'}
            </button>
          </div>
        </form>
      )}

      {/* Reviews List */}
      <div style={styles.reviewsList}>
        {loading && reviews.length === 0 ? (
          <div style={styles.loadingContainer}>
            <div style={styles.loadingSpinner}></div>
            <p>Loading reviews...</p>
          </div>
        ) : filteredReviews.length === 0 ? (
          <div style={styles.emptyState}>
            <p>No reviews yet. Be the first to share your feedback!</p>
          </div>
        ) : (
          filteredReviews.map((review) => (
            <div 
              key={review.id} 
              style={{
                ...styles.reviewCard,
                ...(isMobile ? mobileStyles.reviewCard : {})
              }}
            >
              <div style={{
                ...styles.reviewHeader,
                ...(isMobile ? mobileStyles.reviewHeader : {})
              }}>
                <div style={styles.reviewMeta}>
                  <span style={styles.reviewTitle}>{review.updateTitle}</span>
                  <div style={styles.badgeContainer}>
                    <span style={{
                      ...styles.statusBadge,
                      backgroundColor: getStatusColor(review.status)
                    }}>
                      {review.status}
                    </span>
                    <span style={{
                      ...styles.priorityBadge,
                      backgroundColor: getPriorityColor(review.priority)
                    }}>
                      {review.priority} priority
                    </span>
                    <span style={styles.typeBadge}>
                      {getFeedbackTypeIcon(review.feedbackType)} {review.feedbackType}
                    </span>
                  </div>
                </div>
                
                <div style={styles.reviewActions}>
                  <button
                    onClick={() => setExpandedReview(expandedReview === review.id ? null : review.id)}
                    style={styles.expandButton}
                  >
                    {expandedReview === review.id ? '▼ Show Less' : '▶ Read More'}
                  </button>
                  <button
                    onClick={() => handleDeleteReview(review.id)}
                    style={styles.deleteButton}
                    title="Delete review"
                  >
                    🗑️
                  </button>
                </div>
              </div>

              <div style={styles.clientInfo}>
                <span style={styles.clientName}>{review.clientName}</span>
                <span style={styles.reviewDate}>
                  {review.createdAt.toLocaleDateString()} at {review.createdAt.toLocaleTimeString()}
                </span>
              </div>

              {review.rating && (
                <div style={styles.rating}>
                  <span style={styles.stars}>{renderStars(review.rating)}</span>
                </div>
              )}

              <div style={styles.feedbackContent}>
                <p style={expandedReview === review.id ? {} : styles.feedbackPreview}>
                  {review.feedback}
                </p>
              </div>

              {/* Admin Actions (can be conditionally shown based on user role) */}
              {!clientEmail && (
                <div style={styles.adminActions}>
                  <button
                    onClick={() => handleUpdateStatus(review.id, 'in-review')}
                    style={styles.actionButton}
                  >
                   🔍 Mark In Review
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(review.id, 'approved')}
                    style={{...styles.actionButton, backgroundColor: '#28a745'}}
                  >
                    ✅ Approve
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(review.id, 'changes-requested')}
                    style={{...styles.actionButton, backgroundColor: '#dc3545'}}
                  >
                    🔄 Request Changes
                  </button>
                </div>
              )}

              {review.reviewedAt && (
                <div style={styles.reviewedInfo}>
                  Reviewed on {review.reviewedAt.toLocaleDateString()}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Summary Stats */}
      {reviews.length > 0 && (
        <div style={styles.statsContainer}>
          <div style={styles.statCard}>
            <span style={styles.statValue}>{reviews.length}</span>
            <span style={styles.statLabel}>Total Reviews</span>
          </div>
          <div style={styles.statCard}>
            <span style={styles.statValue}>
              {reviews.filter(r => r.status === 'approved').length}
            </span>
            <span style={styles.statLabel}>Approved</span>
          </div>
          <div style={styles.statCard}>
            <span style={styles.statValue}>
              {reviews.filter(r => r.priority === 'critical' || r.priority === 'high').length}
            </span>
            <span style={styles.statLabel}>High Priority</span>
          </div>
          <div style={styles.statCard}>
            <span style={styles.statValue}>
              {Math.round(reviews.reduce((acc, r) => acc + (r.rating || 0), 0) / reviews.length * 10) / 10}
            </span>
            <span style={styles.statLabel}>Avg Rating</span>
          </div>
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
    position: 'relative' as const,
  },
  notification: {
    position: 'fixed' as const,
    top: '20px',
    right: '20px',
    padding: '12px 24px',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    zIndex: 1000,
    animation: 'slideIn 0.3s ease-out',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '30px',
    flexWrap: 'wrap' as const,
    gap: '15px',
  },
  sectionTitle: {
    fontSize: 'clamp(24px, 5vw, 28px)',
    margin: 0,
    color: '#333',
    fontWeight: 600,
  },
  subtitle: {
    margin: '5px 0 0',
    color: '#666',
    fontSize: '16px',
  },
  addButton: {
    padding: '12px 24px',
    backgroundColor: '#FF8C42',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: 500,
    transition: 'all 0.2s',
    ':hover': {
      backgroundColor: '#e07b3a',
      transform: 'translateY(-2px)',
    },
  },
  filters: {
    display: 'flex',
    gap: '15px',
    marginBottom: '30px',
    flexWrap: 'wrap' as const,
  },
  searchBox: {
    flex: 1,
    minWidth: '250px',
  },
  searchInput: {
    width: '100%',
    padding: '12px 16px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    fontSize: '15px',
    outline: 'none',
    transition: 'border-color 0.2s',
    ':focus': {
      borderColor: '#FF8C42',
    },
  },
  filterSelect: {
    padding: '12px 24px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    fontSize: '15px',
    backgroundColor: 'white',
    cursor: 'pointer',
    outline: 'none',
    minWidth: '150px',
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
  },
  retryButton: {
    padding: '6px 16px',
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    padding: '60px',
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
  form: {
    backgroundColor: '#f8f9fa',
    padding: '30px',
    borderRadius: '16px',
    marginBottom: '30px',
    border: '2px solid #FF8C42',
  },
  formTitle: {
    margin: '0 0 20px 0',
    fontSize: '20px',
    color: '#333',
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '15px',
    marginBottom: '15px',
  },
  formGroup: {
    marginBottom: '15px',
  },
  label: {
    display: 'block',
    marginBottom: '5px',
    fontWeight: 500,
    color: '#555',
  },
  input: {
    width: '100%',
    padding: '12px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    fontSize: '15px',
    outline: 'none',
    transition: 'border-color 0.2s',
    ':focus': {
      borderColor: '#FF8C42',
    },
  },
  select: {
    width: '100%',
    padding: '12px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    fontSize: '15px',
    backgroundColor: 'white',
    outline: 'none',
  },
  textarea: {
    width: '100%',
    padding: '12px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    fontSize: '15px',
    outline: 'none',
    resize: 'vertical' as const,
    ':focus': {
      borderColor: '#FF8C42',
    },
  },
  ratingContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    flexWrap: 'wrap' as const,
  },
  starButton: {
    background: 'none',
    border: 'none',
    fontSize: '30px',
    cursor: 'pointer',
    padding: '0 5px',
    transition: 'transform 0.1s',
    ':hover': {
      transform: 'scale(1.2)',
    },
  },
  ratingText: {
    color: '#666',
    fontSize: '14px',
    marginLeft: '10px',
  },
  formButtons: {
    display: 'flex',
    gap: '15px',
    justifyContent: 'flex-end',
    marginTop: '20px',
  },
  submitButton: {
    padding: '12px 30px',
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: 500,
    transition: 'background-color 0.2s',
    ':disabled': {
      opacity: 0.5,
      cursor: 'not-allowed',
    },
  },
  cancelButton: {
    padding: '12px 30px',
    backgroundColor: '#6c757d',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '16px',
    transition: 'background-color 0.2s',
  },
  reviewsList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '20px',
    marginBottom: '40px',
  },
  emptyState: {
    textAlign: 'center' as const,
    padding: '60px',
    backgroundColor: '#f8f9fa',
    borderRadius: '16px',
    color: '#6c757d',
  },
  reviewCard: {
    backgroundColor: 'white',
    borderRadius: '16px',
    padding: '25px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
    border: '1px solid #eee',
    transition: 'transform 0.2s',
    ':hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 6px 16px rgba(0,0,0,0.1)',
    },
  },
  reviewHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '15px',
    flexWrap: 'wrap' as const,
    gap: '10px',
  },
  reviewMeta: {
    flex: 1,
  },
  reviewTitle: {
    fontSize: '18px',
    fontWeight: 600,
    color: '#333',
    marginBottom: '10px',
    display: 'block',
  },
  badgeContainer: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap' as const,
  },
  statusBadge: {
    padding: '4px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: 500,
    color: 'white',
  },
  priorityBadge: {
    padding: '4px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: 500,
    color: 'white',
  },
  typeBadge: {
    padding: '4px 12px',
    backgroundColor: '#e9ecef',
    borderRadius: '20px',
    fontSize: '12px',
    color: '#495057',
  },
  reviewActions: {
    display: 'flex',
    gap: '10px',
    alignItems: 'center',
  },
  expandButton: {
    padding: '6px 12px',
    backgroundColor: '#f8f9fa',
    border: '1px solid #dee2e6',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '13px',
    color: '#495057',
    transition: 'all 0.2s',
  },
  deleteButton: {
    padding: '6px 12px',
    backgroundColor: '#f8d7da',
    border: '1px solid #f5c6cb',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    transition: 'all 0.2s',
  },
  clientInfo: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px',
    flexWrap: 'wrap' as const,
    gap: '10px',
  },
  clientName: {
    fontWeight: 500,
    color: '#555',
  },
  reviewDate: {
    color: '#999',
    fontSize: '13px',
  },
  rating: {
    marginBottom: '15px',
  },
  stars: {
    color: '#ffc107',
    fontSize: '18px',
    letterSpacing: '2px',
  },
  feedbackContent: {
    marginBottom: '15px',
    lineHeight: '1.6',
    color: '#444',
  },
  feedbackPreview: {
    overflow: 'hidden',
    display: '-webkit-box',
    WebkitLineClamp: 3,
    WebkitBoxOrient: 'vertical' as const,
  },
  adminActions: {
    display: 'flex',
    gap: '10px',
    marginTop: '15px',
    paddingTop: '15px',
    borderTop: '1px solid #eee',
    flexWrap: 'wrap' as const,
  },
  actionButton: {
    padding: '8px 16px',
    backgroundColor: '#ffc107',
    color: '#333',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 500,
    transition: 'opacity 0.2s',
    ':hover': {
      opacity: 0.9,
    },
  },
  reviewedInfo: {
    marginTop: '10px',
    fontSize: '13px',
    color: '#999',
    fontStyle: 'italic',
  },
  statsContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '20px',
    marginTop: '40px',
    padding: '20px',
    backgroundColor: '#f8f9fa',
    borderRadius: '16px',
  },
  statCard: {
    textAlign: 'center' as const,
    padding: '15px',
  },
  statValue: {
    display: 'block',
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#FF8C42',
    marginBottom: '5px',
  },
  statLabel: {
    color: '#666',
    fontSize: '14px',
  },
};

// Add global styles for animations
const style = document.createElement('style');
style.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
`;
document.head.appendChild(style);

export default ClientReview;