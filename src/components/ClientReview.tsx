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
  Timestamp
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
  rating?: number;
  feedback: string;
  points: ReviewPoint[];
  summary?: string;
  feedbackType: FeedbackType;
  priority: FeedbackPriority;
  status: ReviewStatus;
  attachments?: string[];
  createdAt: Date;
  reviewedAt?: Date;
  tags?: string[];
  timeToReview?: number;
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
  clientEmail?: string;
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
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [activeFilterTab, setActiveFilterTab] = useState<'filters' | 'sort'>('filters');

  // Mobile responsiveness
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isTablet, setIsTablet] = useState(window.innerWidth > 768 && window.innerWidth <= 1024);

  // New review form state
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

  useEffect(() => {
    fetchUpdates();
    fetchReviews();
  }, []);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

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

  const removePoint = (pointId: string) => {
    setNewReview({
      ...newReview,
      points: newReview.points.filter(p => p.id !== pointId)
    });
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newReview.points.length === 0) {
      showNotification('error', 'Please add at least one point');
      return;
    }

    try {
      setLoading(true);
      const reviewsRef = collection(db, 'clientReviews');
      
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

  const filteredReviews = reviews.filter(review => {
    const matchesStatus = filterStatus === 'all' || review.status === filterStatus;
    const matchesPriority = filterPriority === 'all' || review.priority === filterPriority;
    const matchesType = filterType === 'all' || review.feedbackType === filterType;
    
    const matchesSearch = searchTerm === '' || 
      review.updateTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.summary?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.points?.some(p => p.text.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchesStatus && matchesPriority && matchesType && matchesSearch;
  });

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
      case 'approved': return '#10b981';
      case 'changes-requested': return '#ef4444';
      case 'in-review': return '#f59e0b';
      case 'pending': return '#6b7280';
      default: return '#6b7280';
    }
  };

  const getPriorityColor = (priority: FeedbackPriority) => {
    switch(priority) {
      case 'critical': return '#ef4444';
      case 'high': return '#f97316';
      case 'medium': return '#f59e0b';
      case 'low': return '#10b981';
      default: return '#6b7280';
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

  // Professional mobile styles - Optimized for full width
  const mobileStyles = {
    container: {
      padding: '0',
      width: '100%',
      maxWidth: '100%',
    },
    header: {
      flexDirection: 'column' as const,
      alignItems: 'stretch',
      gap: '16px',
      marginBottom: '20px',
      padding: '0 16px',
    },
    headerTitle: {
      textAlign: 'left' as const,
    },
    sectionTitle: {
      fontSize: '24px',
      marginBottom: '4px',
    },
    subtitle: {
      fontSize: '14px',
    },
    addButton: {
      width: '100%',
      padding: '16px',
      fontSize: '16px',
      borderRadius: '12px',
      backgroundColor: '#f97316',
    },
    statsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: '12px',
      marginBottom: '20px',
      padding: '0 16px',
    },
    statCard: {
      padding: '16px',
      borderRadius: '14px',
      backgroundColor: 'white',
      boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
    },
    statValue: {
      fontSize: '24px',
      fontWeight: '700',
    },
    statLabel: {
      fontSize: '12px',
      color: '#6b7280',
      marginTop: '4px',
      textTransform: 'uppercase' as const,
      letterSpacing: '0.3px',
    },
    mobileFilterToggle: {
      width: 'calc(100% - 32px)',
      margin: '0 16px 16px 16px',
      padding: '16px',
      backgroundColor: '#f9fafb',
      border: '1px solid #e5e7eb',
      borderRadius: '12px',
      fontSize: '15px',
      fontWeight: '500',
      color: '#374151',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
    },
    filterTabs: {
      display: 'flex',
      gap: '8px',
      marginBottom: '16px',
      padding: '0 16px',
    },
    filterTab: {
      flex: 1,
      padding: '12px',
      backgroundColor: '#f9fafb',
      border: '1px solid #e5e7eb',
      borderRadius: '10px',
      fontSize: '14px',
      fontWeight: '500',
      color: '#6b7280',
      cursor: 'pointer',
      textAlign: 'center' as const,
    },
    activeFilterTab: {
      backgroundColor: '#f97316',
      color: 'white',
      borderColor: '#f97316',
    },
    filters: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '12px',
      margin: '0 16px 20px 16px',
      padding: '20px',
      backgroundColor: '#f9fafb',
      borderRadius: '16px',
    },
    searchBox: {
      width: '100%',
    },
    searchInput: {
      width: '100%',
      padding: '16px',
      fontSize: '16px',
      borderRadius: '12px',
      border: '1px solid #e5e7eb',
      backgroundColor: 'white',
    },
    filterSelect: {
      width: '100%',
      padding: '16px',
      fontSize: '16px',
      borderRadius: '12px',
      border: '1px solid #e5e7eb',
      backgroundColor: 'white',
    },
    viewToggle: {
      display: 'flex',
      gap: '8px',
      marginTop: '4px',
    },
    viewButton: {
      flex: 1,
      padding: '14px',
      fontSize: '15px',
      borderRadius: '10px',
      border: '1px solid #e5e7eb',
      backgroundColor: 'white',
    },
    form: {
      margin: '0 16px 24px 16px',
      padding: '20px',
      borderRadius: '20px',
      backgroundColor: '#f9fafb',
      border: '2px solid #f97316',
    },
    formTitle: {
      fontSize: '22px',
      marginBottom: '20px',
      fontWeight: '600',
    },
    formGrid: {
      gridTemplateColumns: '1fr',
      gap: '16px',
    },
    formGroup: {
      marginBottom: '16px',
    },
    label: {
      fontSize: '14px',
      fontWeight: '600',
      marginBottom: '8px',
      color: '#374151',
    },
    input: {
      width: '100%',
      padding: '16px',
      fontSize: '16px',
      borderRadius: '12px',
      border: '1px solid #e5e7eb',
      backgroundColor: 'white',
    },
    select: {
      width: '100%',
      padding: '16px',
      fontSize: '16px',
      borderRadius: '12px',
      border: '1px solid #e5e7eb',
      backgroundColor: 'white',
    },
    formRow: {
      flexDirection: 'column' as const,
      gap: '16px',
    },
    ratingContainer: {
      justifyContent: 'flex-start',
      padding: '8px 0',
      gap: '12px',
    },
    starButton: {
      fontSize: '32px',
    },
    pointsBuilder: {
      padding: '16px',
      borderRadius: '14px',
    },
    pointsTitle: {
      fontSize: '16px',
      marginBottom: '16px',
      fontWeight: '600',
    },
    pointInputGroup: {
      flexDirection: 'column' as const,
      gap: '12px',
    },
    pointTypeSelect: {
      width: '100%',
      padding: '16px',
      fontSize: '15px',
    },
    pointPrioritySelect: {
      width: '100%',
      padding: '16px',
      fontSize: '15px',
    },
    pointInput: {
      width: '100%',
      padding: '16px',
      fontSize: '15px',
    },
    addPointButton: {
      width: '100%',
      padding: '16px',
      fontSize: '16px',
      backgroundColor: '#10b981',
      borderRadius: '12px',
    },
    pointsList: {
      marginTop: '16px',
    },
    pointItem: {
      flexDirection: 'row' as const,
      flexWrap: 'wrap' as const,
      padding: '14px',
      gap: '10px',
    },
    pointText: {
      width: 'calc(100% - 100px)',
      fontSize: '14px',
    },
    formButtons: {
      flexDirection: 'column' as const,
      gap: '12px',
    },
    submitButton: {
      width: '100%',
      padding: '18px',
      fontSize: '16px',
      borderRadius: '12px',
    },
    cancelButton: {
      width: '100%',
      padding: '18px',
      fontSize: '16px',
      borderRadius: '12px',
      backgroundColor: '#6b7280',
    },
    reviewsContainer: {
      gap: '12px',
      padding: '0 16px',
    },
    reviewsGrid: {
      gridTemplateColumns: '1fr',
      gap: '12px',
    },
    reviewCard: {
      padding: '20px',
      borderRadius: '18px',
      border: '1px solid #f0f0f0',
      marginBottom: '0',
    },
    reviewHeader: {
      flexDirection: 'column' as const,
      alignItems: 'flex-start',
      gap: '12px',
    },
    reviewTitle: {
      fontSize: '18px',
      fontWeight: '600',
      marginBottom: '10px',
      lineHeight: '1.4',
    },
    badgeContainer: {
      gap: '8px',
    },
    statusBadge: {
      padding: '6px 12px',
      fontSize: '12px',
      borderRadius: '20px',
    },
    priorityBadge: {
      padding: '6px 12px',
      fontSize: '12px',
      borderRadius: '20px',
    },
    typeBadge: {
      padding: '6px 12px',
      fontSize: '12px',
      borderRadius: '20px',
    },
    urgentBadge: {
      padding: '6px 12px',
      fontSize: '12px',
      borderRadius: '20px',
    },
    reviewActions: {
      width: '100%',
      justifyContent: 'space-between',
      marginTop: '8px',
    },
    expandButton: {
      padding: '10px 18px',
      fontSize: '14px',
      borderRadius: '10px',
    },
    deleteButton: {
      padding: '10px 18px',
      fontSize: '14px',
      borderRadius: '10px',
    },
    reviewDate: {
      fontSize: '13px',
      color: '#9ca3af',
      marginTop: '8px',
    },
    summary: {
      fontSize: '14px',
      padding: '14px',
      borderRadius: '12px',
      marginTop: '12px',
    },
    stars: {
      fontSize: '18px',
    },
    pointsDisplay: {
      marginTop: '20px',
    },
    pointsDisplayTitle: {
      fontSize: '16px',
      marginBottom: '12px',
      fontWeight: '600',
    },
    pointsGrid: {
      gridTemplateColumns: '1fr',
      gap: '10px',
    },
    displayPoint: {
      padding: '16px',
      borderRadius: '12px',
    },
    pointHeader: {
      marginBottom: '10px',
    },
    pointPriorityBadge: {
      padding: '4px 10px',
      fontSize: '11px',
    },
    resolveButton: {
      width: '100%',
      padding: '12px',
      fontSize: '14px',
      marginTop: '12px',
      borderRadius: '10px',
    },
    showMoreButton: {
      padding: '14px',
      fontSize: '14px',
      borderRadius: '12px',
    },
    adminActions: {
      flexDirection: 'column' as const,
      gap: '10px',
      marginTop: '20px',
      paddingTop: '20px',
    },
    actionButton: {
      width: '100%',
      padding: '16px',
      fontSize: '15px',
      borderRadius: '12px',
    },
    emptyState: {
      padding: '60px 20px',
      fontSize: '16px',
      margin: '0 16px',
    },
    loadingContainer: {
      padding: '60px 20px',
    },
    loadingSpinner: {
      width: '44px',
      height: '44px',
    },
  };

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
          ...(isMobile ? { 
            width: 'calc(100% - 32px)',
            left: '16px',
            right: '16px',
            top: '16px',
            padding: '16px',
            fontSize: '15px',
            borderRadius: '12px',
          } : {}),
          backgroundColor: notification.type === 'success' ? '#d1fae5' : '#fee2e2',
          color: notification.type === 'success' ? '#065f46' : '#991b1b',
          border: `1px solid ${notification.type === 'success' ? '#a7f3d0' : '#fecaca'}`,
        }}>
          {notification.message}
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div style={{
          ...styles.errorBanner,
          ...(isMobile ? { margin: '0 16px 20px 16px', width: 'auto' } : {})
        }}>
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
          <h2 style={{
            ...styles.sectionTitle,
            ...(isMobile ? mobileStyles.sectionTitle : {})
          }}>📝 Client Reviews</h2>
          <p style={{
            ...styles.subtitle,
            ...(isMobile ? mobileStyles.subtitle : {})
          }}>Share structured feedback on our build progress</p>
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
        ...(isTablet && !isMobile ? tabletStyles.statsGrid : {})
      }}>
        <div style={isMobile ? mobileStyles.statCard : styles.statCard}>
          <div style={isMobile ? mobileStyles.statValue : styles.statValue}>{reviewStats.total}</div>
          <div style={isMobile ? mobileStyles.statLabel : styles.statLabel}>Total</div>
        </div>
        <div style={isMobile ? mobileStyles.statCard : styles.statCard}>
          <div style={isMobile ? mobileStyles.statValue : styles.statValue}>{reviewStats.pending}</div>
          <div style={isMobile ? mobileStyles.statLabel : styles.statLabel}>Pending</div>
        </div>
        <div style={isMobile ? mobileStyles.statCard : styles.statCard}>
          <div style={isMobile ? mobileStyles.statValue : styles.statValue}>{reviewStats.urgent}</div>
          <div style={isMobile ? mobileStyles.statLabel : styles.statLabel}>Urgent</div>
        </div>
        <div style={isMobile ? mobileStyles.statCard : styles.statCard}>
          <div style={isMobile ? mobileStyles.statValue : styles.statValue}>{reviewStats.unresolvedPoints}</div>
          <div style={isMobile ? mobileStyles.statLabel : styles.statLabel}>Open</div>
        </div>
        <div style={isMobile ? mobileStyles.statCard : styles.statCard}>
          <div style={isMobile ? mobileStyles.statValue : styles.statValue}>{reviewStats.averageRating.toFixed(1)}</div>
          <div style={isMobile ? mobileStyles.statLabel : styles.statLabel}>Rating</div>
        </div>
        <div style={isMobile ? mobileStyles.statCard : styles.statCard}>
          <div style={isMobile ? mobileStyles.statValue : styles.statValue}>{reviewStats.criticalIssues}</div>
          <div style={isMobile ? mobileStyles.statLabel : styles.statLabel}>Critical</div>
        </div>
      </div>

      {/* Mobile Filter Toggle */}
      {isMobile && showFilters && (
        <button 
          onClick={() => setShowMobileFilters(!showMobileFilters)}
          style={mobileStyles.mobileFilterToggle}
        >
          <span>{showMobileFilters ? '▲' : '▼'}</span>
          {showMobileFilters ? 'Hide Filters' : 'Filter & Sort Reviews'}
        </button>
      )}

      {/* Filter Tabs for Mobile */}
      {isMobile && showMobileFilters && (
        <div style={mobileStyles.filterTabs}>
          <button
            onClick={() => setActiveFilterTab('filters')}
            style={{
              ...mobileStyles.filterTab,
              ...(activeFilterTab === 'filters' ? mobileStyles.activeFilterTab : {})
            }}
          >
            🔍 Filters
          </button>
          <button
            onClick={() => setActiveFilterTab('sort')}
            style={{
              ...mobileStyles.filterTab,
              ...(activeFilterTab === 'sort' ? mobileStyles.activeFilterTab : {})
            }}
          >
            📊 Sort
          </button>
        </div>
      )}

      {/* Advanced Filters */}
      {showFilters && (!isMobile || (showMobileFilters && activeFilterTab === 'filters')) && (
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
              style={isMobile ? mobileStyles.searchInput : styles.searchInput}
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
          </select>
        </div>
      )}

      {/* Sort Options for Mobile */}
      {isMobile && showMobileFilters && activeFilterTab === 'sort' && (
        <div style={mobileStyles.filters}>
          <div style={mobileStyles.viewToggle}>
            <button
              onClick={() => setViewMode('list')}
              style={{
                ...mobileStyles.viewButton,
                backgroundColor: viewMode === 'list' ? '#f97316' : '#ffffff',
                color: viewMode === 'list' ? '#ffffff' : '#374151',
                borderColor: viewMode === 'list' ? '#f97316' : '#e5e7eb',
              }}
            >
              📋 List View
            </button>
            <button
              onClick={() => setViewMode('grid')}
              style={{
                ...mobileStyles.viewButton,
                backgroundColor: viewMode === 'grid' ? '#f97316' : '#ffffff',
                color: viewMode === 'grid' ? '#ffffff' : '#374151',
                borderColor: viewMode === 'grid' ? '#f97316' : '#e5e7eb',
              }}
            >
              📊 Grid View
            </button>
          </div>
          
          <select
            onChange={(e) => {
              const [sortBy, order] = e.target.value.split('-');
              // Implement sorting logic here
            }}
            style={mobileStyles.filterSelect}
          >
            <option value="date-desc">Newest First</option>
            <option value="date-asc">Oldest First</option>
            <option value="priority-desc">Highest Priority</option>
            <option value="rating-desc">Highest Rated</option>
          </select>
        </div>
      )}

      {/* Desktop View Toggle */}
      {!isMobile && (
        <div style={styles.viewToggle}>
          <button
            onClick={() => setViewMode('list')}
            style={{
              ...styles.viewButton,
              backgroundColor: viewMode === 'list' ? '#f97316' : '#ffffff',
              color: viewMode === 'list' ? '#ffffff' : '#374151',
              borderColor: viewMode === 'list' ? '#f97316' : '#e5e7eb',
            }}
          >
            📋 List
          </button>
          <button
            onClick={() => setViewMode('grid')}
            style={{
              ...styles.viewButton,
              backgroundColor: viewMode === 'grid' ? '#f97316' : '#ffffff',
              color: viewMode === 'grid' ? '#ffffff' : '#374151',
              borderColor: viewMode === 'grid' ? '#f97316' : '#e5e7eb',
            }}
          >
            📊 Grid
          </button>
        </div>
      )}

      {/* Review Form */}
      {showReviewForm && (
        <form onSubmit={handleSubmitReview} style={{
          ...styles.form,
          ...(isMobile ? mobileStyles.form : {})
        }}>
          <h3 style={isMobile ? mobileStyles.formTitle : styles.formTitle}>
            Share Structured Feedback
          </h3>
          
          <div style={{
            ...styles.formGrid,
            ...(isMobile ? mobileStyles.formGrid : {}),
            ...(isTablet && !isMobile ? tabletStyles.formGrid : {})
          }}>
            <div style={isMobile ? mobileStyles.formGroup : styles.formGroup}>
              <label style={isMobile ? mobileStyles.label : styles.label}>Your Name *</label>
              <input
                type="text"
                value={newReview.clientName}
                onChange={(e) => setNewReview({...newReview, clientName: e.target.value})}
                style={isMobile ? mobileStyles.input : styles.input}
                required
                placeholder="Enter your name"
              />
            </div>
            
            <div style={isMobile ? mobileStyles.formGroup : styles.formGroup}>
              <label style={isMobile ? mobileStyles.label : styles.label}>Email *</label>
              <input
                type="email"
                value={newReview.clientEmail}
                onChange={(e) => setNewReview({...newReview, clientEmail: e.target.value})}
                style={isMobile ? mobileStyles.input : styles.input}
                required
                placeholder="Your email"
                readOnly={!!clientEmail}
              />
            </div>
          </div>

          <div style={isMobile ? mobileStyles.formGroup : styles.formGroup}>
            <label style={isMobile ? mobileStyles.label : styles.label}>Select Update *</label>
            <select
              value={selectedUpdate}
              onChange={(e) => {
                setSelectedUpdate(e.target.value);
                handleUpdateSelect(e.target.value);
              }}
              style={isMobile ? mobileStyles.select : styles.select}
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
            <div style={isMobile ? mobileStyles.formGroup : styles.formGroup}>
              <label style={isMobile ? mobileStyles.label : styles.label}>Feedback Type</label>
              <select
                value={newReview.feedbackType}
                onChange={(e) => setNewReview({...newReview, feedbackType: e.target.value as FeedbackType})}
                style={isMobile ? mobileStyles.select : styles.select}
              >
                <option value="general">💬 General</option>
                <option value="bug">🐛 Bug</option>
                <option value="feature-request">✨ Feature</option>
                <option value="design">🎨 Design</option>
                <option value="ux">🖱️ UX</option>
                <option value="performance">⚡ Performance</option>
              </select>
            </div>

            <div style={isMobile ? mobileStyles.formGroup : styles.formGroup}>
              <label style={isMobile ? mobileStyles.label : styles.label}>Overall Priority</label>
              <select
                value={newReview.priority}
                onChange={(e) => setNewReview({...newReview, priority: e.target.value as FeedbackPriority})}
                style={isMobile ? mobileStyles.select : styles.select}
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
            <div style={isMobile ? mobileStyles.formGroup : styles.formGroup}>
              <label style={isMobile ? mobileStyles.label : styles.label}>Rating</label>
              <div style={{
                ...styles.ratingContainer,
                ...(isMobile ? mobileStyles.ratingContainer : {})
              }}>
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setNewReview({...newReview, rating: star})}
                    style={{
                      ...styles.starButton,
                      ...(isMobile ? mobileStyles.starButton : {}),
                      color: star <= (newReview.rating || 0) ? '#f59e0b' : '#d1d5db'
                    }}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>

            <div style={isMobile ? mobileStyles.formGroup : styles.formGroup}>
              <label style={isMobile ? mobileStyles.label : styles.label}>
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

          <div style={isMobile ? mobileStyles.formGroup : styles.formGroup}>
            <label style={isMobile ? mobileStyles.label : styles.label}>Executive Summary</label>
            <input
              type="text"
              value={newReview.summary}
              onChange={(e) => setNewReview({...newReview, summary: e.target.value})}
              style={isMobile ? mobileStyles.input : styles.input}
              placeholder="Brief summary of your feedback"
            />
          </div>

          {/* Points Builder */}
          <div style={{
            ...styles.pointsBuilder,
            ...(isMobile ? mobileStyles.pointsBuilder : {})
          }}>
            <h4 style={isMobile ? mobileStyles.pointsTitle : styles.pointsTitle}>
              Add Feedback Points
            </h4>
            
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
              <div style={isMobile ? mobileStyles.pointsList : styles.pointsList}>
                {newReview.points.map((point) => (
                  <div key={point.id} style={{
                    ...styles.pointItem,
                    ...(isMobile ? mobileStyles.pointItem : {})
                  }}>
                    <span style={styles.pointIcon}>{getPointTypeIcon(point.type)}</span>
                    <span style={{
                      ...styles.pointPriority,
                      backgroundColor: getPriorityColor(point.priority || 'medium')
                    }}>
                      {point.priority}
                    </span>
                    <span style={isMobile ? mobileStyles.pointText : styles.pointText}>
                      {point.text}
                    </span>
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

          <div style={{
            ...styles.formButtons,
            ...(isMobile ? mobileStyles.formButtons : {})
          }}>
            <button 
              type="button" 
              onClick={() => setShowReviewForm(false)}
              style={isMobile ? mobileStyles.cancelButton : styles.cancelButton}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              style={isMobile ? mobileStyles.submitButton : styles.submitButton}
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
          ...(isTablet && !isMobile ? tabletStyles.reviewsGrid : {})
        } : {}),
        ...(isMobile ? mobileStyles.reviewsContainer : {})
      }}>
        {loading && reviews.length === 0 ? (
          <div style={isMobile ? mobileStyles.loadingContainer : styles.loadingContainer}>
            <div style={isMobile ? mobileStyles.loadingSpinner : styles.loadingSpinner}></div>
            <p>Loading reviews...</p>
          </div>
        ) : filteredReviews.length === 0 ? (
          <div style={isMobile ? mobileStyles.emptyState : styles.emptyState}>
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
                  <span style={isMobile ? mobileStyles.reviewTitle : styles.reviewTitle}>
                    {review.updateTitle}
                  </span>
                  <div style={{
                    ...styles.badgeContainer,
                    ...(isMobile ? mobileStyles.badgeContainer : {})
                  }}>
                    <span style={{
                      ...styles.statusBadge,
                      ...(isMobile ? mobileStyles.statusBadge : {}),
                      backgroundColor: getStatusColor(review.status)
                    }}>
                      {review.status}
                    </span>
                    <span style={{
                      ...styles.priorityBadge,
                      ...(isMobile ? mobileStyles.priorityBadge : {}),
                      backgroundColor: getPriorityColor(review.priority)
                    }}>
                      {review.priority}
                    </span>
                    <span style={{
                      ...styles.typeBadge,
                      ...(isMobile ? mobileStyles.typeBadge : {})
                    }}>
                      {getFeedbackTypeIcon(review.feedbackType)}
                    </span>
                    {review.isUrgent && (
                      <span style={{
                        ...styles.urgentBadge,
                        ...(isMobile ? mobileStyles.urgentBadge : {})
                      }}>
                        🚨
                      </span>
                    )}
                  </div>
                </div>
                
                <div style={{
                  ...styles.reviewActions,
                  ...(isMobile ? mobileStyles.reviewActions : {})
                }}>
                  <button
                    onClick={() => setExpandedReview(expandedReview === review.id ? null : review.id)}
                    style={isMobile ? mobileStyles.expandButton : styles.expandButton}
                  >
                    {expandedReview === review.id ? '▼' : '▶'} {!isMobile && (expandedReview === review.id ? 'Show Less' : 'Read More')}
                  </button>
                  <button
                    onClick={() => handleDeleteReview(review.id)}
                    style={isMobile ? mobileStyles.deleteButton : styles.deleteButton}
                    title="Delete review"
                  >
                    🗑️
                  </button>
                </div>
              </div>

              <div style={isMobile ? mobileStyles.reviewDate : styles.reviewDate}>
                {review.createdAt.toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric', 
                  year: 'numeric' 
                })}
              </div>

              {review.summary && (
                <div style={isMobile ? mobileStyles.summary : styles.summary}>
                  <strong>Summary:</strong> {review.summary}
                </div>
              )}

              {review.rating && (
                <div style={styles.rating}>
                  <span style={isMobile ? mobileStyles.stars : styles.stars}>
                    {renderStars(review.rating)}
                  </span>
                </div>
              )}

              {/* Points Display */}
              {review.points && review.points.length > 0 && (
                <div style={isMobile ? mobileStyles.pointsDisplay : styles.pointsDisplay}>
                  <h4 style={isMobile ? mobileStyles.pointsDisplayTitle : styles.pointsDisplayTitle}>
                    Feedback Points:
                  </h4>
                  <div style={{
                    ...styles.pointsGrid,
                    ...(isMobile ? mobileStyles.pointsGrid : {})
                  }}>
                    {review.points.slice(0, expandedReview === review.id ? undefined : 2).map((point) => (
                      <div 
                        key={point.id} 
                        style={{
                          ...styles.displayPoint,
                          ...(isMobile ? mobileStyles.displayPoint : {}),
                          opacity: point.isResolved ? 0.6 : 1,
                          backgroundColor: point.isResolved ? '#f9fafb' : '#ffffff'
                        }}
                      >
                        <div style={isMobile ? mobileStyles.pointHeader : styles.pointHeader}>
                          <span style={styles.pointIcon}>{getPointTypeIcon(point.type)}</span>
                          {point.priority && (
                            <span style={{
                              ...styles.pointPriorityBadge,
                              ...(isMobile ? mobileStyles.pointPriorityBadge : {}),
                              backgroundColor: getPriorityColor(point.priority)
                            }}>
                              {point.priority}
                            </span>
                          )}
                        </div>
                        <p style={isMobile ? mobileStyles.pointText : styles.pointText}>
                          {point.text}
                        </p>
                        {!clientEmail && (
                          <button
                            onClick={() => togglePointResolution(review.id, point.id)}
                            style={{
                              ...styles.resolveButton,
                              ...(isMobile ? mobileStyles.resolveButton : {}),
                              backgroundColor: point.isResolved ? '#10b981' : '#6b7280'
                            }}
                          >
                            {point.isResolved ? '✓ Resolved' : '○ Mark Resolved'}
                          </button>
                        )}
                      </div>
                    ))}
                    {review.points.length > 2 && expandedReview !== review.id && (
                      <button
                        onClick={() => setExpandedReview(review.id)}
                        style={isMobile ? mobileStyles.showMoreButton : styles.showMoreButton}
                      >
                        +{review.points.length - 2} more points
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
                      ...(isMobile ? mobileStyles.actionButton : {}),
                      backgroundColor: '#f59e0b'
                    }}
                  >
                   🔍 In Review
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(review.id, 'approved')}
                    style={{
                      ...styles.actionButton,
                      ...(isMobile ? mobileStyles.actionButton : {}),
                      backgroundColor: '#10b981'
                    }}
                  >
                    ✅ Approve
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(review.id, 'changes-requested')}
                    style={{
                      ...styles.actionButton,
                      ...(isMobile ? mobileStyles.actionButton : {}),
                      backgroundColor: '#ef4444'
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

      {/* Global Styles */}
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
            font-size: 16px !important;
          }
          
          /* Prevent zoom on iOS */
          input[type="text"],
          input[type="email"],
          input[type="number"],
          select,
          textarea {
            font-size: 16px !important;
          }
          
          /* Smooth scrolling */
          * {
            -webkit-overflow-scrolling: touch;
          }
          
          /* Better tap targets */
          button, 
          [role="button"],
          input[type="submit"],
          input[type="button"] {
            min-height: 48px;
          }
          
          /* Full width containers */
          .review-card {
            width: 100%;
            margin-left: 0;
            margin-right: 0;
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
    padding: '24px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    position: 'relative' as const,
  },
  notification: {
    position: 'fixed' as const,
    top: '24px',
    right: '24px',
    padding: '16px 24px',
    borderRadius: '12px',
    boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)',
    zIndex: 1000,
    animation: 'slideIn 0.3s ease-out',
    fontSize: '15px',
    fontWeight: '500',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '32px',
    flexWrap: 'wrap' as const,
    gap: '20px',
  },
  sectionTitle: {
    fontSize: '28px',
    margin: 0,
    color: '#111827',
    fontWeight: '600',
    letterSpacing: '-0.02em',
  },
  subtitle: {
    margin: '6px 0 0',
    color: '#6b7280',
    fontSize: '16px',
  },
  addButton: {
    padding: '12px 28px',
    backgroundColor: '#f97316',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: '500',
    transition: 'all 0.2s',
    boxShadow: '0 4px 6px -1px rgba(249,115,22,0.2)',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
    gap: '16px',
    marginBottom: '32px',
  },
  statCard: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '16px',
    textAlign: 'center' as const,
    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
    border: '1px solid #f3f4f6',
  },
  statValue: {
    fontSize: '28px',
    fontWeight: '600',
    color: '#f97316',
    marginBottom: '4px',
  },
  statLabel: {
    fontSize: '13px',
    color: '#6b7280',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
  },
  filters: {
    display: 'flex',
    gap: '16px',
    marginBottom: '32px',
    flexWrap: 'wrap' as const,
    alignItems: 'center',
  },
  searchBox: {
    flex: 1,
    minWidth: '280px',
  },
  searchInput: {
    width: '100%',
    padding: '12px 20px',
    border: '1px solid #e5e7eb',
    borderRadius: '12px',
    fontSize: '15px',
    outline: 'none',
    transition: 'all 0.2s',
    backgroundColor: '#f9fafb',
  },
  filterSelect: {
    padding: '12px 28px',
    border: '1px solid #e5e7eb',
    borderRadius: '12px',
    fontSize: '15px',
    backgroundColor: '#f9fafb',
    cursor: 'pointer',
    outline: 'none',
    minWidth: '150px',
    color: '#374151',
  },
  viewToggle: {
    display: 'flex',
    gap: '8px',
    marginBottom: '24px',
  },
  viewButton: {
    padding: '12px 24px',
    border: '1px solid #e5e7eb',
    borderRadius: '12px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'all 0.2s',
    backgroundColor: '#ffffff',
    color: '#374151',
  },
  errorBanner: {
    backgroundColor: '#fee2e2',
    color: '#991b1b',
    padding: '14px 20px',
    borderRadius: '12px',
    marginBottom: '24px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap' as const,
    gap: '12px',
    border: '1px solid #fecaca',
  },
  retryButton: {
    padding: '8px 20px',
    backgroundColor: '#ef4444',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    padding: '80px',
    backgroundColor: 'white',
    borderRadius: '24px',
  },
  loadingSpinner: {
    width: '48px',
    height: '48px',
    border: '3px solid #f3f4f6',
    borderTop: '3px solid #f97316',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    marginBottom: '20px',
  },
  form: {
    backgroundColor: '#f9fafb',
    padding: '32px',
    borderRadius: '24px',
    marginBottom: '32px',
    border: '2px solid #f97316',
    boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)',
  },
  formTitle: {
    margin: '0 0 24px 0',
    fontSize: '22px',
    color: '#111827',
    fontWeight: '600',
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '20px',
    marginBottom: '20px',
  },
  formGroup: {
    marginBottom: '20px',
  },
  label: {
    display: 'block',
    marginBottom: '8px',
    fontWeight: '500',
    color: '#374151',
    fontSize: '14px',
  },
  input: {
    width: '100%',
    padding: '14px',
    border: '1px solid #e5e7eb',
    borderRadius: '12px',
    fontSize: '15px',
    outline: 'none',
    transition: 'all 0.2s',
    backgroundColor: '#ffffff',
    boxSizing: 'border-box' as const,
  },
  select: {
    width: '100%',
    padding: '14px',
    border: '1px solid #e5e7eb',
    borderRadius: '12px',
    fontSize: '15px',
    backgroundColor: '#ffffff',
    outline: 'none',
    color: '#374151',
  },
  checkbox: {
    marginRight: '10px',
    width: '18px',
    height: '18px',
    cursor: 'pointer',
  },
  formRow: {
    display: 'flex',
    gap: '20px',
    alignItems: 'center',
    marginBottom: '20px',
    flexWrap: 'wrap' as const,
  },
  ratingContainer: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
  },
  starButton: {
    background: 'none',
    border: 'none',
    fontSize: '32px',
    cursor: 'pointer',
    padding: '0 4px',
    transition: 'transform 0.1s',
  },
  pointsBuilder: {
    backgroundColor: '#ffffff',
    padding: '24px',
    borderRadius: '16px',
    marginBottom: '24px',
    border: '1px solid #e5e7eb',
  },
  pointsTitle: {
    margin: '0 0 16px 0',
    fontSize: '16px',
    color: '#111827',
    fontWeight: '600',
  },
  pointInputGroup: {
    display: 'flex',
    gap: '12px',
    marginBottom: '20px',
    flexWrap: 'wrap' as const,
  },
  pointTypeSelect: {
    padding: '12px',
    border: '1px solid #e5e7eb',
    borderRadius: '10px',
    fontSize: '14px',
    minWidth: '110px',
    backgroundColor: '#f9fafb',
  },
  pointPrioritySelect: {
    padding: '12px',
    border: '1px solid #e5e7eb',
    borderRadius: '10px',
    fontSize: '14px',
    minWidth: '110px',
    backgroundColor: '#f9fafb',
  },
  pointInput: {
    flex: 1,
    padding: '12px',
    border: '1px solid #e5e7eb',
    borderRadius: '10px',
    fontSize: '14px',
    minWidth: '240px',
    backgroundColor: '#f9fafb',
  },
  addPointButton: {
    padding: '12px 24px',
    backgroundColor: '#10b981',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
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
    gap: '12px',
    padding: '14px',
    backgroundColor: '#f9fafb',
    borderRadius: '12px',
    border: '1px solid #e5e7eb',
  },
  pointIcon: {
    fontSize: '18px',
  },
  pointPriority: {
    padding: '4px 12px',
    borderRadius: '20px',
    fontSize: '11px',
    color: 'white',
    textTransform: 'uppercase' as const,
    fontWeight: '600',
  },
  pointText: {
    flex: 1,
    fontSize: '14px',
    color: '#374151',
    wordBreak: 'break-word' as const,
  },
  removePointButton: {
    background: 'none',
    border: 'none',
    fontSize: '16px',
    cursor: 'pointer',
    color: '#ef4444',
    padding: '6px',
    borderRadius: '6px',
  },
  formButtons: {
    display: 'flex',
    gap: '16px',
    justifyContent: 'flex-end',
    marginTop: '24px',
  },
  submitButton: {
    padding: '14px 36px',
    backgroundColor: '#10b981',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: '500',
    transition: 'all 0.2s',
    boxShadow: '0 4px 6px -1px rgba(16,185,129,0.2)',
  },
  cancelButton: {
    padding: '14px 36px',
    backgroundColor: '#6b7280',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    fontSize: '16px',
    transition: 'all 0.2s',
  },
  reviewsContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '20px',
    marginBottom: '40px',
  },
  reviewsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
    gap: '24px',
  },
  reviewCard: {
    backgroundColor: 'white',
    borderRadius: '20px',
    padding: '28px',
    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
    border: '1px solid #f3f4f6',
    transition: 'transform 0.2s',
  },
  gridCard: {
    height: 'fit-content',
  },
  reviewHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '12px',
    flexWrap: 'wrap' as const,
    gap: '12px',
  },
  reviewMeta: {
    flex: 1,
  },
  reviewTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#111827',
    marginBottom: '8px',
    display: 'block',
    lineHeight: '1.4',
  },
  badgeContainer: {
    display: 'flex',
    gap: '6px',
    flexWrap: 'wrap' as const,
  },
  statusBadge: {
    padding: '4px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '500',
    color: 'white',
  },
  priorityBadge: {
    padding: '4px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '500',
    color: 'white',
  },
  typeBadge: {
    padding: '4px 12px',
    backgroundColor: '#f3f4f6',
    borderRadius: '20px',
    fontSize: '12px',
    color: '#4b5563',
    fontWeight: '500',
  },
  urgentBadge: {
    padding: '4px 12px',
    backgroundColor: '#ef4444',
    borderRadius: '20px',
    fontSize: '12px',
    color: 'white',
    fontWeight: '500',
  },
  reviewActions: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
  },
  expandButton: {
    padding: '8px 16px',
    backgroundColor: '#f9fafb',
    border: '1px solid #e5e7eb',
    borderRadius: '10px',
    cursor: 'pointer',
    fontSize: '13px',
    color: '#4b5563',
    transition: 'all 0.2s',
    fontWeight: '500',
  },
  deleteButton: {
    padding: '8px 16px',
    backgroundColor: '#fee2e2',
    border: '1px solid #fecaca',
    borderRadius: '10px',
    cursor: 'pointer',
    fontSize: '14px',
    color: '#ef4444',
    transition: 'all 0.2s',
  },
  reviewDate: {
    color: '#9ca3af',
    fontSize: '13px',
    marginBottom: '12px',
  },
  summary: {
    backgroundColor: '#f9fafb',
    padding: '14px',
    borderRadius: '12px',
    marginBottom: '16px',
    fontSize: '14px',
    color: '#4b5563',
    border: '1px solid #f3f4f6',
  },
  rating: {
    marginBottom: '16px',
  },
  stars: {
    color: '#f59e0b',
    fontSize: '18px',
    letterSpacing: '2px',
  },
  pointsDisplay: {
    marginTop: '20px',
  },
  pointsDisplayTitle: {
    fontSize: '15px',
    fontWeight: '600',
    color: '#374151',
    marginBottom: '12px',
  },
  pointsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
    gap: '12px',
  },
  displayPoint: {
    padding: '16px',
    backgroundColor: '#f9fafb',
    borderRadius: '12px',
    border: '1px solid #f3f4f6',
    position: 'relative' as const,
  },
  pointHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '10px',
  },
  pointPriorityBadge: {
    padding: '4px 10px',
    borderRadius: '16px',
    fontSize: '10px',
    color: 'white',
    textTransform: 'uppercase' as const,
    fontWeight: '600',
  },
  resolveButton: {
    padding: '6px 12px',
    border: 'none',
    borderRadius: '8px',
    fontSize: '12px',
    color: 'white',
    cursor: 'pointer',
    marginTop: '10px',
    width: '100%',
    fontWeight: '500',
    transition: 'opacity 0.2s',
  },
  showMoreButton: {
    padding: '12px',
    backgroundColor: '#f9fafb',
    border: '1px dashed #d1d5db',
    borderRadius: '12px',
    fontSize: '13px',
    color: '#6b7280',
    cursor: 'pointer',
    textAlign: 'center' as const,
    fontWeight: '500',
    transition: 'all 0.2s',
  },
  adminActions: {
    display: 'flex',
    gap: '10px',
    marginTop: '20px',
    paddingTop: '20px',
    borderTop: '1px solid #f3f4f6',
    flexWrap: 'wrap' as const,
  },
  actionButton: {
    padding: '10px 16px',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '500',
    color: 'white',
    flex: 1,
    transition: 'opacity 0.2s',
  },
  emptyState: {
    textAlign: 'center' as const,
    padding: '60px',
    backgroundColor: '#f9fafb',
    borderRadius: '24px',
    color: '#6b7280',
    fontSize: '16px',
    border: '2px dashed #e5e7eb',
  },
};

export default ClientReview;