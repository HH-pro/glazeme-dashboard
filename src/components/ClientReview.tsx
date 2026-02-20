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
type FeedbackType = 'general' | 'bug' | 'feature-request' | 'design' | 'content' | 'ux' | 'performance';

interface ReviewPoint {
  id: string;
  text: string;
  type: 'praise' | 'issue' | 'suggestion' | 'question';
  priority?: FeedbackPriority;
  isResolved?: boolean;
}

interface ClientReview {
  id: string;
  updateId: string;
  updateTitle: string;
  clientName: string;
  clientEmail: string;
  rating?: number; // 1-5 stars
  feedback: string; // Keep for backward compatibility
  points: ReviewPoint[]; // New points system
  summary?: string;
  feedbackType: FeedbackType;
  priority: FeedbackPriority;
  status: ReviewStatus;
  attachments?: string[]; // URLs to attached files
  createdAt: Date;
  reviewedAt?: Date;
  tags?: string[];
  timeToReview?: number; // in minutes
  isUrgent: boolean;
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
  const [filterPriority, setFilterPriority] = useState<FeedbackPriority | 'all'>('all');
  const [filterType, setFilterType] = useState<FeedbackType | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedReview, setExpandedReview] = useState<string | null>(null);
  const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [dateRange, setDateRange] = useState<{start: Date | null, end: Date | null}>({start: null, end: null});
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Mobile responsiveness
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isTablet, setIsTablet] = useState(window.innerWidth > 768 && window.innerWidth <= 1024);

  // New review form state with points
  const [newReview, setNewReview] = useState<{
    updateId: string;
    updateTitle: string;
    clientName: string;
    clientEmail: string;
    rating: number;
    summary: string;
    points: ReviewPoint[];
    feedbackType: FeedbackType;
    priority: FeedbackPriority;
    isUrgent: boolean;
    attachments: string[];
  }>({
    updateId: '',
    updateTitle: '',
    clientName: '',
    clientEmail: clientEmail || '',
    rating: 5,
    summary: '',
    points: [],
    feedbackType: 'general',
    priority: 'medium',
    isUrgent: false,
    attachments: []
  });

  // Current point being added
  const [currentPoint, setCurrentPoint] = useState<{
    text: string;
    type: 'praise' | 'issue' | 'suggestion' | 'question';
    priority: FeedbackPriority;
  }>({
    text: '',
    type: 'issue',
    priority: 'medium'
  });

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
      setIsTablet(window.innerWidth > 768 && window.innerWidth <= 1024);
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

      const fetchedUpdates: BuildUpdate[] = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          weekNumber: data.weekNumber,
          title: data.title,
          description: data.description,
          category: data.category,
          status: data.status,
          author: data.author,
          priority: data.priority,
          timeSpent: data.timeSpent,
          date: data.date?.toDate() || null,
        };
      });

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
          points: data.points || [],
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

  // Add a point to the review
  const addPoint = () => {
    if (!currentPoint.text.trim()) {
      showNotification('error', 'Point text cannot be empty');
      return;
    }

    const newPoint: ReviewPoint = {
      id: Date.now().toString(),
      text: currentPoint.text,
      type: currentPoint.type,
      priority: currentPoint.priority,
      isResolved: false
    };

    setNewReview({
      ...newReview,
      points: [...newReview.points, newPoint]
    });

    setCurrentPoint({
      text: '',
      type: 'issue',
      priority: 'medium'
    });
  };

  // Remove a point
  const removePoint = (pointId: string) => {
    setNewReview({
      ...newReview,
      points: newReview.points.filter(p => p.id !== pointId)
    });
  };

  // Submit new review
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newReview.points.length === 0) {
      showNotification('error', 'Please add at least one point');
      return;
    }

    try {
      setLoading(true);
      const reviewsRef = collection(db, 'clientReviews');
      
      // Combine points into feedback text for backward compatibility
      const feedbackText = newReview.points.map(p => 
        `[${p.type.toUpperCase()}] ${p.text}${p.priority ? ` (${p.priority} priority)` : ''}`
      ).join('\n\n');

      const reviewData = {
        ...newReview,
        feedback: feedbackText,
        status: 'pending' as ReviewStatus,
        createdAt: Timestamp.now(),
        timeToReview: 0
      };
      
      const docRef = await addDoc(reviewsRef, reviewData);
      
      const newReviewWithId: ClientReview = {
        id: docRef.id,
        ...newReview,
        feedback: feedbackText,
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

  // Toggle point resolution
  const togglePointResolution = (reviewId: string, pointId: string) => {
    setReviews(prev => prev.map(review => {
      if (review.id === reviewId && review.points) {
        return {
          ...review,
          points: review.points.map(point => 
            point.id === pointId ? { ...point, isResolved: !point.isResolved } : point
          )
        };
      }
      return review;
    }));
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
      summary: '',
      points: [],
      feedbackType: 'general',
      priority: 'medium',
      isUrgent: false,
      attachments: []
    });
    setSelectedUpdate('');
    setCurrentPoint({
      text: '',
      type: 'issue',
      priority: 'medium'
    });
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

  // Filter reviews based on status, priority, type, and search
  const filteredReviews = reviews.filter(review => {
    const matchesStatus = filterStatus === 'all' || review.status === filterStatus;
    const matchesPriority = filterPriority === 'all' || review.priority === filterPriority;
    const matchesType = filterType === 'all' || review.feedbackType === filterType;
    
    const matchesSearch = searchTerm === '' || 
      review.updateTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.summary?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.points?.some(p => p.text.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesDateRange = (!dateRange.start || review.createdAt >= dateRange.start) &&
                            (!dateRange.end || review.createdAt <= dateRange.end);
    
    return matchesStatus && matchesPriority && matchesType && matchesSearch && matchesDateRange;
  });

  // Calculate statistics
  const reviewStats = {
    total: reviews.length,
    pending: reviews.filter(r => r.status === 'pending').length,
    approved: reviews.filter(r => r.status === 'approved').length,
    changesRequested: reviews.filter(r => r.status === 'changes-requested').length,
    inReview: reviews.filter(r => r.status === 'in-review').length,
    urgent: reviews.filter(r => r.isUrgent).length,
    totalPoints: reviews.reduce((acc, r) => acc + (r.points?.length || 0), 0),
    unresolvedPoints: reviews.reduce((acc, r) => 
      acc + (r.points?.filter(p => !p.isResolved).length || 0), 0
    ),
    averageRating: reviews.reduce((acc, r) => acc + (r.rating || 0), 0) / (reviews.length || 1),
    criticalIssues: reviews.filter(r => r.priority === 'critical' || r.priority === 'high').length
  };

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

  const getPointTypeIcon = (type: string) => {
    switch(type) {
      case 'praise': return '👍';
      case 'issue': return '🔴';
      case 'suggestion': return '💡';
      case 'question': return '❓';
      default: return '📌';
    }
  };

  const getFeedbackTypeIcon = (type: FeedbackType) => {
    switch(type) {
      case 'bug': return '🐛';
      case 'feature-request': return '✨';
      case 'design': return '🎨';
      case 'content': return '📝';
      case 'ux': return '🖱️';
      case 'performance': return '⚡';
      default: return '💬';
    }
  };

  const renderStars = (rating: number) => {
    return '★'.repeat(rating) + '☆'.repeat(5 - rating);
  };

  // Mobile styles
  const mobileStyles = {
    container: {
      padding: '10px',
    },
    header: {
      flexDirection: 'column' as const,
      alignItems: 'stretch',
      gap: '15px',
    },
    headerTitle: {
      textAlign: 'center' as const,
    },
    addButton: {
      width: '100%',
      padding: '14px',
    },
    statsGrid: {
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: '10px',
    },
    filters: {
      flexDirection: 'column' as const,
      width: '100%',
      gap: '10px',
    },
    searchBox: {
      width: '100%',
    },
    filterSelect: {
      width: '100%',
      padding: '12px',
    },
    viewToggle: {
      width: '100%',
      justifyContent: 'center',
    },
    form: {
      padding: '15px',
    },
    formGrid: {
      gridTemplateColumns: '1fr',
      gap: '10px',
    },
    formRow: {
      flexDirection: 'column' as const,
      gap: '10px',
    },
    pointInputGroup: {
      flexDirection: 'column' as const,
      gap: '8px',
    },
    pointTypeSelect: {
      width: '100%',
    },
    pointPrioritySelect: {
      width: '100%',
    },
    pointInput: {
      width: '100%',
    },
    addPointButton: {
      width: '100%',
    },
    pointsGrid: {
      gridTemplateColumns: '1fr',
    },
    reviewCard: {
      padding: '15px',
    },
    reviewHeader: {
      flexDirection: 'column' as const,
      alignItems: 'flex-start',
      gap: '10px',
    },
    badgeContainer: {
      flexWrap: 'wrap' as const,
    },
    reviewActions: {
      width: '100%',
      justifyContent: 'space-between',
    },
    adminActions: {
      flexDirection: 'column' as const,
      gap: '8px',
    },
    actionButton: {
      width: '100%',
    },
    pointHeader: {
      flexWrap: 'wrap' as const,
    },
    resolveButton: {
      width: '100%',
      marginTop: '5px',
    },
  };

  // Tablet styles
  const tabletStyles = {
    statsGrid: {
      gridTemplateColumns: 'repeat(3, 1fr)',
    },
    reviewsGrid: {
      gridTemplateColumns: 'repeat(2, 1fr)',
    },
    formGrid: {
      gridTemplateColumns: '1fr 1fr',
    },
  };

  return (
    <div style={{
      ...styles.container,
      ...(isMobile ? mobileStyles.container : {})
    }}>
      {/* Notification Toast */}
      {notification && (
        <div style={{
          ...styles.notification,
          ...(isMobile ? { width: '90%', right: '5%', left: '5%' } : {}),
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
        <div style={isMobile ? mobileStyles.headerTitle : {}}>
          <h2 style={styles.sectionTitle}>📝 Client Reviews</h2>
          <p style={styles.subtitle}>Share structured feedback on our build progress</p>
        </div>
        <button 
          onClick={() => setShowReviewForm(!showReviewForm)}
          style={{
            ...styles.addButton,
            ...(isMobile ? mobileStyles.addButton : {})
          }}
        >
          {showReviewForm ? '✕ Cancel' : '+ New Review'}
        </button>
      </div>

      {/* Stats Cards */}
      <div style={{
        ...styles.statsGrid,
        ...(isMobile ? mobileStyles.statsGrid : {}),
        ...(isTablet ? tabletStyles.statsGrid : {})
      }}>
        <div style={styles.statCard}>
          <div style={styles.statValue}>{reviewStats.total}</div>
          <div style={styles.statLabel}>Total</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statValue}>{reviewStats.pending}</div>
          <div style={styles.statLabel}>Pending</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statValue}>{reviewStats.urgent}</div>
          <div style={styles.statLabel}>Urgent</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statValue}>{reviewStats.unresolvedPoints}</div>
          <div style={styles.statLabel}>Open Points</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statValue}>{reviewStats.averageRating.toFixed(1)}</div>
          <div style={styles.statLabel}>Rating</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statValue}>{reviewStats.criticalIssues}</div>
          <div style={styles.statLabel}>Critical</div>
        </div>
      </div>

      {/* Mobile Filter Toggle */}
      {isMobile && showFilters && (
        <button 
          onClick={() => setShowMobileFilters(!showMobileFilters)}
          style={styles.mobileFilterToggle}
        >
          {showMobileFilters ? '▲ Hide Filters' : '▼ Show Filters'}
        </button>
      )}

      {/* Advanced Filters */}
      {showFilters && (!isMobile || showMobileFilters) && (
        <div style={{
          ...styles.filters,
          ...(isMobile ? mobileStyles.filters : {})
        }}>
          <div style={isMobile ? mobileStyles.searchBox : styles.searchBox}>
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
            style={isMobile ? mobileStyles.filterSelect : styles.filterSelect}
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="in-review">In Review</option>
            <option value="approved">Approved</option>
            <option value="changes-requested">Changes</option>
          </select>

          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value as FeedbackPriority | 'all')}
            style={isMobile ? mobileStyles.filterSelect : styles.filterSelect}
          >
            <option value="all">All Priorities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as FeedbackType | 'all')}
            style={isMobile ? mobileStyles.filterSelect : styles.filterSelect}
          >
            <option value="all">All Types</option>
            <option value="bug">Bug</option>
            <option value="feature-request">Feature</option>
            <option value="design">Design</option>
            <option value="ux">UX</option>
            <option value="performance">Performance</option>
            <option value="content">Content</option>
          </select>

          <div style={isMobile ? mobileStyles.viewToggle : styles.viewToggle}>
            <button
              onClick={() => setViewMode('list')}
              style={{
                ...styles.viewButton,
                backgroundColor: viewMode === 'list' ? '#FF8C42' : '#f8f9fa',
                color: viewMode === 'list' ? 'white' : '#666',
                ...(isMobile ? { flex: 1 } : {})
              }}
            >
              📋 List
            </button>
            <button
              onClick={() => setViewMode('grid')}
              style={{
                ...styles.viewButton,
                backgroundColor: viewMode === 'grid' ? '#FF8C42' : '#f8f9fa',
                color: viewMode === 'grid' ? 'white' : '#666',
                ...(isMobile ? { flex: 1 } : {})
              }}
            >
              📊 Grid
            </button>
          </div>
        </div>
      )}

      {/* Advanced Review Form with Points */}
      {showReviewForm && (
        <form onSubmit={handleSubmitReview} style={{
          ...styles.form,
          ...(isMobile ? mobileStyles.form : {})
        }}>
          <h3 style={styles.formTitle}>Share Structured Feedback</h3>
          
          <div style={{
            ...styles.formGrid,
            ...(isMobile ? mobileStyles.formGrid : {}),
            ...(isTablet ? tabletStyles.formGrid : {})
          }}>
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
              <option value="">Choose an update...</option>
              {updates.map(update => (
                <option key={update.id} value={update.id}>
                  Week {update.weekNumber}: {update.title}
                </option>
              ))}
            </select>
          </div>

          <div style={{
            ...styles.formRow,
            ...(isMobile ? mobileStyles.formRow : {})
          }}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Feedback Type</label>
              <select
                value={newReview.feedbackType}
                onChange={(e) => setNewReview({...newReview, feedbackType: e.target.value as FeedbackType})}
                style={styles.select}
              >
                <option value="general">💬 General</option>
                <option value="bug">🐛 Bug</option>
                <option value="feature-request">✨ Feature</option>
                <option value="design">🎨 Design</option>
                <option value="ux">🖱️ UX</option>
                <option value="performance">⚡ Performance</option>
              </select>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Overall Priority</label>
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

          <div style={{
            ...styles.formRow,
            ...(isMobile ? mobileStyles.formRow : {})
          }}>
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
                      fontSize: isMobile ? '24px' : '30px',
                      color: star <= (newReview.rating || 0) ? '#ffc107' : '#e4e5e9'
                    }}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>
                <input
                  type="checkbox"
                  checked={newReview.isUrgent}
                  onChange={(e) => setNewReview({...newReview, isUrgent: e.target.checked})}
                  style={styles.checkbox}
                />
                Mark as Urgent
              </label>
            </div>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Executive Summary (Optional)</label>
            <input
              type="text"
              value={newReview.summary}
              onChange={(e) => setNewReview({...newReview, summary: e.target.value})}
              style={styles.input}
              placeholder="Brief summary of your feedback"
            />
          </div>

          {/* Points Builder */}
          <div style={styles.pointsBuilder}>
            <h4 style={styles.pointsTitle}>Add Feedback Points</h4>
            
            <div style={{
              ...styles.pointInputGroup,
              ...(isMobile ? mobileStyles.pointInputGroup : {})
            }}>
              <select
                value={currentPoint.type}
                onChange={(e) => setCurrentPoint({...currentPoint, type: e.target.value as any})}
                style={isMobile ? mobileStyles.pointTypeSelect : styles.pointTypeSelect}
              >
                <option value="praise">👍 Praise</option>
                <option value="issue">🔴 Issue</option>
                <option value="suggestion">💡 Suggestion</option>
                <option value="question">❓ Question</option>
              </select>

              <select
                value={currentPoint.priority}
                onChange={(e) => setCurrentPoint({...currentPoint, priority: e.target.value as FeedbackPriority})}
                style={isMobile ? mobileStyles.pointPrioritySelect : styles.pointPrioritySelect}
              >
                <option value="low">🔵 Low</option>
                <option value="medium">🟡 Medium</option>
                <option value="high">🟠 High</option>
                <option value="critical">🔴 Critical</option>
              </select>

              <input
                type="text"
                value={currentPoint.text}
                onChange={(e) => setCurrentPoint({...currentPoint, text: e.target.value})}
                style={isMobile ? mobileStyles.pointInput : styles.pointInput}
                placeholder="Enter your point..."
              />

              <button
                type="button"
                onClick={addPoint}
                style={isMobile ? mobileStyles.addPointButton : styles.addPointButton}
              >
                Add Point
              </button>
            </div>

            {/* Points List */}
            {newReview.points.length > 0 && (
              <div style={styles.pointsList}>
                {newReview.points.map((point, index) => (
                  <div key={point.id} style={styles.pointItem}>
                    <span style={styles.pointIcon}>{getPointTypeIcon(point.type)}</span>
                    <span style={{
                      ...styles.pointPriority,
                      backgroundColor: getPriorityColor(point.priority || 'medium')
                    }}>
                      {point.priority}
                    </span>
                    <span style={styles.pointText}>{point.text}</span>
                    <button
                      type="button"
                      onClick={() => removePoint(point.id)}
                      style={styles.removePointButton}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={styles.formButtons}>
            <button 
              type="button" 
              onClick={() => setShowReviewForm(false)}
              style={{
                ...styles.cancelButton,
                ...(isMobile ? { flex: 1 } : {})
              }}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              style={{
                ...styles.submitButton,
                ...(isMobile ? { flex: 1 } : {})
              }}
              disabled={loading || newReview.points.length === 0}
            >
              {loading ? 'Submitting...' : `Submit (${newReview.points.length} pts)`}
            </button>
          </div>
        </form>
      )}

      {/* Reviews Display */}
      <div style={{
        ...styles.reviewsContainer,
        ...(viewMode === 'grid' ? {
          ...styles.reviewsGrid,
          ...(isTablet ? tabletStyles.reviewsGrid : {})
        } : {}),
        ...(isMobile ? { gap: '10px' } : {})
      }}>
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
                ...(viewMode === 'grid' ? styles.gridCard : {}),
                ...(isMobile ? mobileStyles.reviewCard : {})
              }}
            >
              <div style={{
                ...styles.reviewHeader,
                ...(isMobile ? mobileStyles.reviewHeader : {})
              }}>
                <div style={styles.reviewMeta}>
                  <span style={styles.reviewTitle}>{review.updateTitle}</span>
                  <div style={{
                    ...styles.badgeContainer,
                    ...(isMobile ? mobileStyles.badgeContainer : {})
                  }}>
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
                      {review.priority}
                    </span>
                    <span style={styles.typeBadge}>
                      {getFeedbackTypeIcon(review.feedbackType)}
                    </span>
                    {review.isUrgent && (
                      <span style={styles.urgentBadge}>🚨</span>
                    )}
                  </div>
                </div>
                
                <div style={{
                  ...styles.reviewActions,
                  ...(isMobile ? mobileStyles.reviewActions : {})
                }}>
                  <button
                    onClick={() => setExpandedReview(expandedReview === review.id ? null : review.id)}
                    style={styles.expandButton}
                  >
                    {expandedReview === review.id ? '▼' : '▶'}
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

              <div style={styles.reviewDate}>
                {review.createdAt.toLocaleDateString()}
              </div>

              {review.summary && (
                <div style={styles.summary}>
                  <strong>Summary:</strong> {review.summary}
                </div>
              )}

              {review.rating && (
                <div style={styles.rating}>
                  <span style={styles.stars}>{renderStars(review.rating)}</span>
                </div>
              )}

              {/* Points Display */}
              {review.points && review.points.length > 0 && (
                <div style={styles.pointsDisplay}>
                  <h4 style={styles.pointsDisplayTitle}>Points:</h4>
                  <div style={{
                    ...styles.pointsGrid,
                    ...(isMobile ? mobileStyles.pointsGrid : {})
                  }}>
                    {review.points.slice(0, expandedReview === review.id ? undefined : 2).map((point) => (
                      <div 
                        key={point.id} 
                        style={{
                          ...styles.displayPoint,
                          opacity: point.isResolved ? 0.6 : 1,
                          backgroundColor: point.isResolved ? '#f8f9fa' : 'white'
                        }}
                      >
                        <div style={styles.pointHeader}>
                          <span style={styles.pointIcon}>{getPointTypeIcon(point.type)}</span>
                          {point.priority && (
                            <span style={{
                              ...styles.pointPriorityBadge,
                              backgroundColor: getPriorityColor(point.priority)
                            }}>
                              {point.priority}
                            </span>
                          )}
                        </div>
                        <p style={styles.pointText}>{point.text}</p>
                        {!clientEmail && (
                          <button
                            onClick={() => togglePointResolution(review.id, point.id)}
                            style={{
                              ...styles.resolveButton,
                              ...(isMobile ? mobileStyles.resolveButton : {}),
                              backgroundColor: point.isResolved ? '#28a745' : '#6c757d'
                            }}
                          >
                            {point.isResolved ? '✓' : '○'}
                          </button>
                        )}
                      </div>
                    ))}
                    {review.points.length > 2 && expandedReview !== review.id && (
                      <button
                        onClick={() => setExpandedReview(review.id)}
                        style={styles.showMoreButton}
                      >
                        +{review.points.length - 2} more
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Admin Actions */}
              {!clientEmail && (
                <div style={{
                  ...styles.adminActions,
                  ...(isMobile ? mobileStyles.adminActions : {})
                }}>
                  <button
                    onClick={() => handleUpdateStatus(review.id, 'in-review')}
                    style={{
                      ...styles.actionButton,
                      ...(isMobile ? mobileStyles.actionButton : {})
                    }}
                  >
                   🔍 Review
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(review.id, 'approved')}
                    style={{
                      ...styles.actionButton,
                      backgroundColor: '#28a745',
                      ...(isMobile ? mobileStyles.actionButton : {})
                    }}
                  >
                    ✅ Approve
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(review.id, 'changes-requested')}
                    style={{
                      ...styles.actionButton,
                      backgroundColor: '#dc3545',
                      ...(isMobile ? mobileStyles.actionButton : {})
                    }}
                  >
                    🔄 Changes
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Add global styles for animations and mobile optimizations */}
      <style>{`
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

        /* Mobile optimizations */
        @media (max-width: 768px) {
          input, select, textarea, button {
            font-size: 16px !important; /* Prevents zoom on iOS */
          }
          
          .review-card {
            margin-bottom: 10px;
          }
        }
      `}</style>
    </div>
  );
};

const styles = {
  container: {
    maxWidth: '1400px',
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
    fontSize: 'clamp(20px, 5vw, 28px)',
    margin: 0,
    color: '#333',
    fontWeight: 600,
  },
  subtitle: {
    margin: '5px 0 0',
    color: '#666',
    fontSize: 'clamp(13px, 4vw, 16px)',
  },
  addButton: {
    padding: '12px 24px',
    backgroundColor: '#FF8C42',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: 'clamp(14px, 4vw, 16px)',
    fontWeight: 500,
    transition: 'all 0.2s',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
    gap: '15px',
    marginBottom: '25px',
  },
  statCard: {
    backgroundColor: 'white',
    padding: '15px',
    borderRadius: '12px',
    textAlign: 'center' as const,
    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
  },
  statValue: {
    fontSize: 'clamp(20px, 4vw, 28px)',
    fontWeight: 'bold' as const,
    color: '#FF8C42',
    marginBottom: '5px',
  },
  statLabel: {
    fontSize: 'clamp(11px, 3vw, 13px)',
    color: '#666',
  },
  mobileFilterToggle: {
    width: '100%',
    padding: '12px',
    backgroundColor: '#f8f9fa',
    border: '1px solid #dee2e6',
    borderRadius: '8px',
    marginBottom: '15px',
    fontSize: '14px',
    color: '#495057',
    cursor: 'pointer',
  },
  filters: {
    display: 'flex',
    gap: '15px',
    marginBottom: '30px',
    flexWrap: 'wrap' as const,
    alignItems: 'center',
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
    fontSize: 'clamp(14px, 4vw, 15px)',
    outline: 'none',
  },
  filterSelect: {
    padding: '12px 24px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    fontSize: 'clamp(14px, 4vw, 15px)',
    backgroundColor: 'white',
    cursor: 'pointer',
    outline: 'none',
    minWidth: '140px',
  },
  viewToggle: {
    display: 'flex',
    gap: '5px',
  },
  viewButton: {
    padding: '10px 16px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: 'clamp(12px, 3.5vw, 14px)',
    transition: 'all 0.2s',
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
    fontSize: 'clamp(18px, 4vw, 20px)',
    color: '#333',
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '15px',
    marginBottom: '15px',
  },
  formRow: {
    display: 'flex',
    gap: '20px',
    alignItems: 'center',
    marginBottom: '15px',
    flexWrap: 'wrap' as const,
  },
  formGroup: {
    flex: 1,
    minWidth: '200px',
  },
  label: {
    display: 'block',
    marginBottom: '5px',
    fontWeight: 500,
    color: '#555',
    fontSize: 'clamp(13px, 3.5vw, 14px)',
  },
  input: {
    width: '100%',
    padding: '12px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    fontSize: 'clamp(14px, 4vw, 15px)',
    outline: 'none',
    boxSizing: 'border-box' as const,
  },
  select: {
    width: '100%',
    padding: '12px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    fontSize: 'clamp(14px, 4vw, 15px)',
    backgroundColor: 'white',
    outline: 'none',
  },
  checkbox: {
    marginRight: '8px',
    width: '18px',
    height: '18px',
  },
  ratingContainer: {
    display: 'flex',
    gap: '5px',
    flexWrap: 'wrap' as const,
  },
  starButton: {
    background: 'none',
    border: 'none',
    fontSize: '30px',
    cursor: 'pointer',
    padding: '0',
  },
  pointsBuilder: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '12px',
    marginBottom: '20px',
    border: '1px solid #dee2e6',
  },
  pointsTitle: {
    margin: '0 0 15px 0',
    fontSize: 'clamp(15px, 4vw, 16px)',
    color: '#333',
  },
  pointInputGroup: {
    display: 'flex',
    gap: '10px',
    marginBottom: '20px',
    flexWrap: 'wrap' as const,
  },
  pointTypeSelect: {
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: 'clamp(13px, 3.5vw, 14px)',
    minWidth: '100px',
  },
  pointPrioritySelect: {
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: 'clamp(13px, 3.5vw, 14px)',
    minWidth: '100px',
  },
  pointInput: {
    flex: 1,
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: 'clamp(13px, 3.5vw, 14px)',
    minWidth: '200px',
  },
  addPointButton: {
    padding: '10px 20px',
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: 'clamp(13px, 3.5vw, 14px)',
    whiteSpace: 'nowrap' as const,
  },
  pointsList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '10px',
  },
  pointItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    flexWrap: 'wrap' as const,
  },
  pointIcon: {
    fontSize: '18px',
  },
  pointPriority: {
    padding: '2px 8px',
    borderRadius: '12px',
    fontSize: '11px',
    color: 'white',
    textTransform: 'uppercase' as const,
  },
  pointText: {
    flex: 1,
    fontSize: 'clamp(13px, 3.5vw, 14px)',
    color: '#333',
    wordBreak: 'break-word' as const,
  },
  removePointButton: {
    background: 'none',
    border: 'none',
    fontSize: '16px',
    cursor: 'pointer',
    color: '#dc3545',
    padding: '5px',
  },
  formButtons: {
    display: 'flex',
    gap: '15px',
    justifyContent: 'flex-end',
    marginTop: '20px',
    flexWrap: 'wrap' as const,
  },
  submitButton: {
    padding: '12px 30px',
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: 'clamp(14px, 4vw, 16px)',
    fontWeight: 500,
  },
  cancelButton: {
    padding: '12px 30px',
    backgroundColor: '#6c757d',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: 'clamp(14px, 4vw, 16px)',
  },
  reviewsContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '20px',
    marginBottom: '40px',
  },
  reviewsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '20px',
  },
  reviewCard: {
    backgroundColor: 'white',
    borderRadius: '16px',
    padding: '25px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
    border: '1px solid #eee',
  },
  gridCard: {
    height: 'fit-content',
  },
  reviewHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '10px',
    flexWrap: 'wrap' as const,
    gap: '10px',
  },
  reviewMeta: {
    flex: 1,
  },
  reviewTitle: {
    fontSize: 'clamp(15px, 4vw, 18px)',
    fontWeight: 600,
    color: '#333',
    marginBottom: '8px',
    display: 'block',
    wordBreak: 'break-word' as const,
  },
  badgeContainer: {
    display: 'flex',
    gap: '5px',
    flexWrap: 'wrap' as const,
  },
  statusBadge: {
    padding: '4px 8px',
    borderRadius: '12px',
    fontSize: 'clamp(10px, 2.5vw, 11px)',
    fontWeight: 500,
    color: 'white',
  },
  priorityBadge: {
    padding: '4px 8px',
    borderRadius: '12px',
    fontSize: 'clamp(10px, 2.5vw, 11px)',
    fontWeight: 500,
    color: 'white',
  },
  typeBadge: {
    padding: '4px 8px',
    backgroundColor: '#e9ecef',
    borderRadius: '12px',
    fontSize: 'clamp(10px, 2.5vw, 11px)',
    color: '#495057',
  },
  urgentBadge: {
    padding: '4px 8px',
    backgroundColor: '#dc3545',
    borderRadius: '12px',
    fontSize: 'clamp(10px, 2.5vw, 11px)',
    color: 'white',
  },
  reviewActions: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
  },
  expandButton: {
    padding: '6px 12px',
    backgroundColor: '#f8f9fa',
    border: '1px solid #dee2e6',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: 'clamp(12px, 3vw, 13px)',
    color: '#495057',
  },
  deleteButton: {
    padding: '6px 12px',
    backgroundColor: '#f8d7da',
    border: '1px solid #f5c6cb',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: 'clamp(12px, 3vw, 14px)',
  },
  reviewDate: {
    color: '#999',
    fontSize: 'clamp(11px, 3vw, 12px)',
    marginBottom: '10px',
  },
  summary: {
    backgroundColor: '#f8f9fa',
    padding: '10px',
    borderRadius: '8px',
    marginBottom: '10px',
    fontSize: 'clamp(12px, 3.5vw, 14px)',
    color: '#666',
  },
  rating: {
    marginBottom: '15px',
  },
  stars: {
    color: '#ffc107',
    fontSize: 'clamp(16px, 4vw, 18px)',
    letterSpacing: '2px',
  },
  pointsDisplay: {
    marginTop: '15px',
  },
  pointsDisplayTitle: {
    fontSize: 'clamp(13px, 3.5vw, 14px)',
    fontWeight: 600,
    color: '#333',
    marginBottom: '10px',
  },
  pointsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: '10px',
  },
  displayPoint: {
    padding: '12px',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    border: '1px solid #eee',
    position: 'relative' as const,
  },
  pointHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '8px',
    flexWrap: 'wrap' as const,
  },
  pointPriorityBadge: {
    padding: '2px 6px',
    borderRadius: '10px',
    fontSize: '9px',
    color: 'white',
    textTransform: 'uppercase' as const,
  },
  resolveButton: {
    padding: '4px 8px',
    border: 'none',
    borderRadius: '4px',
    fontSize: '12px',
    color: 'white',
    cursor: 'pointer',
    marginTop: '8px',
    width: '100%',
  },
  showMoreButton: {
    padding: '8px',
    backgroundColor: '#f8f9fa',
    border: '1px dashed #dee2e6',
    borderRadius: '8px',
    fontSize: '12px',
    color: '#666',
    cursor: 'pointer',
    textAlign: 'center' as const,
  },
  adminActions: {
    display: 'flex',
    gap: '8px',
    marginTop: '15px',
    paddingTop: '15px',
    borderTop: '1px solid #eee',
    flexWrap: 'wrap' as const,
  },
  actionButton: {
    padding: '8px 12px',
    backgroundColor: '#ffc107',
    color: '#333',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: 'clamp(11px, 3vw, 12px)',
    flex: 1,
  },
  emptyState: {
    textAlign: 'center' as const,
    padding: '40px',
    backgroundColor: '#f8f9fa',
    borderRadius: '16px',
    color: '#6c757d',
    fontSize: 'clamp(14px, 4vw, 16px)',
  },
};

export default ClientReview;