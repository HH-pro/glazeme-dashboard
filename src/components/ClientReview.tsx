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

// --- Types ---

type ReviewStatus = 'pending' | 'in-review' | 'resolved';
type FeedbackType = 'bug' | 'feature' | 'design' | 'general' | 'idea';

// New Types for Requirements Form
type RequirementSection = 'core' | 'monetization' | 'design' | 'technical' | 'privacy' | 'timeline' | 'bonus';

interface RequirementSpec {
  id: string;
  category: string;
  label: string;
  type: 'select' | 'text' | 'multiselect' | 'boolean';
  options?: string[];
  value: string | string[] | boolean;
  required?: boolean;
}

interface ClientReviewData {
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
  // New Field for Requirements
  requirements?: Record<RequirementSection, RequirementSpec[]>;
}

interface ReviewPoint {
  id: string;
  text: string;
  type: 'praise' | 'issue' | 'suggestion' | 'question';
  isResolved: boolean;
}

interface BuildUpdate {
  id: string;
  weekNumber: number;
  title: string;
}

interface Props {
  isAdmin?: boolean;
}

// --- Icons ---
const Icons = {
  Plus: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>,
  X: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>,
  Check: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  Trash: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>,
  Edit: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  Bug: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="8" height="14" x="8" y="6" rx="4"/><path d="m18 8 2 2"/><path d="m22 8-2 2"/><path d="m18 16 2-2"/><path d="m22 16-2-2"/><path d="M8 10h.01"/><path d="M8 14h.01"/></svg>,
  Lightbulb: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></svg>,
  Palette: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="13.5" cy="6.5" r=".5"/><circle cx="17.5" cy="10.5" r=".5"/><circle cx="8.5" cy="7.5" r=".5"/><circle cx="6.5" cy="12.5" r=".5"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/></svg>,
  MessageCircle: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></svg>,
  Clock: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  CheckCircle: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>,
  Inbox: () => <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg>,
  ThumbsUp: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg>,
  AlertCircle: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>,
  HelpCircle: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" x2="12.01" y1="17" y2="17"/></svg>,
  MoreVertical: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg>,
  ChevronDown: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>,
  FileText: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
};

// --- Initial Requirements Data ---
const initialRequirements: Record<RequirementSection, RequirementSpec[]> = {
  core: [
    { id: 'daily_gen', category: 'AI Generation', label: 'Daily Generations', type: 'select', options: ['5', '10', 'Unlimited', 'Cooldown-based'], value: '', required: true },
    { id: 'cooldown', category: 'AI Generation', label: 'Generation Cooldown', type: 'select', options: ['None', '30 sec', '1 min'], value: '' },
    { id: 'text_len', category: 'AI Generation', label: 'Max Text Length', type: 'select', options: ['100', '280', '500'], value: '' },
    { id: 'ai_model', category: 'AI Generation', label: 'AI Model Preference', type: 'select', options: ['GPT-4o mini', 'Claude 3 Haiku', 'Mix'], value: '' },
    { id: 'free_styles', category: 'Styles', label: 'Free Styles Count', type: 'select', options: ['3 basic', '6', 'All 10+'], value: '' },
    { id: 'intensity', category: 'Styles', label: 'Intensity Levels', type: 'select', options: ['3', '4', '5'], value: '' },
    { id: 'glow_chat', category: 'Features', label: 'Glow Chat Daily Limit', type: 'select', options: ['3', '5', 'Unlimited'], value: '' },
    { id: 'custom_prompts', category: 'Features', label: 'Custom User Prompts', type: 'boolean', value: false },
    { id: 'kbd_gen', category: 'Keyboard', label: 'Keyboard AI Generation', type: 'boolean', value: false },
    { id: 'kbd_recents', category: 'Keyboard', label: 'Recent Glazes in Keyboard', type: 'select', options: ['5', '10', '20'], value: '' },
    { id: 'kbd_favs', category: 'Keyboard', label: 'Favorites in Keyboard', type: 'boolean', value: false },
  ],
  monetization: [
    { id: 'ads', category: 'Ads', label: 'Ad Type', type: 'select', options: ['None', 'Rewarded only', 'Banner', 'Native'], value: '' },
    { id: 'tip_jar', category: 'Revenue', label: 'Tip Jar / "Buy Coffee"', type: 'boolean', value: false },
    { id: 'watermark', category: 'Branding', label: 'Share Watermark', type: 'select', options: ['None', 'via GlazeMe', 'Custom'], value: '' },
    { id: 'pro_launch', category: 'Pro Version', label: 'Target Pro Launch', type: 'select', options: ['3mo', '6mo', '1yr', 'Undecided'], value: '' },
    { id: 'pro_price', category: 'Pro Version', label: 'Pro Price Point', type: 'select', options: ['$2.99/mo', '$4.99/mo', '$29.99/yr', '$49.99 lifetime'], value: '' },
  ],
  design: [
    { id: 'app_name', category: 'Branding', label: 'App Name Final', type: 'text', value: 'GlazeMe' },
    { id: 'colors', category: 'Visual', label: 'Exact Colors', type: 'text', value: 'Yellow #FFE66D → Orange #FF8C42' },
    { id: 'dark_mode', category: 'Visual', label: 'Dark Mode Support', type: 'select', options: ['Yes', 'No', 'Future'], value: '' },
    { id: 'icon_style', category: 'Visual', label: 'App Icon Style', type: 'select', options: ['Text', 'Mascot', 'Abstract'], value: '' },
    { id: 'lottie', category: 'Animations', label: 'Lottie Animations', type: 'select', options: ['Heavy', 'Medium', 'Minimal', 'None'], value: '' },
    { id: 'haptics', category: 'UX', label: 'Haptic Feedback', type: 'select', options: ['Full', 'Basic', 'None'], value: '' },
  ],
  technical: [
    { id: 'ios_min', category: 'Platform', label: 'Minimum iOS Version', type: 'select', options: ['15', '16', '17', '18'], value: '' },
    { id: 'ipad', category: 'Platform', label: 'iPad Support', type: 'select', options: ['Yes', 'No', 'Future'], value: '' },
    { id: 'offline', category: 'Performance', label: 'Offline Mode', type: 'select', options: ['Yes', 'No'], value: '' },
    { id: 'app_size', category: 'Performance', label: 'App Size Target', type: 'select', options: ['<50MB', '<100MB', 'No limit'], value: '' },
    { id: 'icloud', category: 'Data', label: 'iCloud Sync', type: 'select', options: ['Auto', 'Optional', 'None'], value: '' },
  ],
  privacy: [
    { id: 'analytics', category: 'Data', label: 'Analytics Provider', type: 'select', options: ['Firebase', 'Mixpanel', 'None'], value: '' },
    { id: 'crash_report', category: 'Data', label: 'Crash Reporting', type: 'select', options: ['Firebase Crashlytics', 'Sentry', 'None'], value: '' },
    { id: 'age_rating', category: 'Compliance', label: 'Age Rating', type: 'select', options: ['4+', '9+', '12+', '17+'], value: '' },
  ],
  timeline: [
    { id: 'mvp_date', category: 'Dev', label: 'MVP Deadline', type: 'text', value: '' },
    { id: 'beta', category: 'Dev', label: 'Beta Testing', type: 'select', options: ['TestFlight', 'None'], value: '' },
    { id: 'maintenance', category: 'Post-Launch', label: 'Maintenance Period', type: 'select', options: ['3mo', '6mo', '1yr included'], value: '' },
  ],
  bonus: [
    { id: 'widgets', category: 'iOS Features', label: 'Widgets (iOS 14+)', type: 'boolean', value: false },
    { id: 'siri', category: 'iOS Features', label: 'Siri Shortcuts', type: 'boolean', value: false },
    { id: 'watch', category: 'iOS Features', label: 'Apple Watch App', type: 'boolean', value: false },
    { id: 'dynamic_island', category: 'iOS Features', label: 'Dynamic Island Support', type: 'boolean', value: false },
  ]
};

const sectionTitles: Record<RequirementSection, string> = {
  core: '🎯 Core Features (Free Tier)',
  monetization: '💰 Monetization & Ads',
  design: '🎨 Design & Branding',
  technical: '📱 Technical Specs',
  privacy: '🔐 Privacy & Legal',
  timeline: '⏰ Timeline & Deliverables',
  bonus: '🌟 Bonus Features'
};

// --- Main Component ---

const ClientReview: React.FC<Props> = ({ isAdmin = false }) => {
  // Existing State
  const [reviews, setReviews] = useState<ClientReviewData[]>([]);
  const [updates, setUpdates] = useState<BuildUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingReview, setEditingReview] = useState<ClientReviewData | null>(null);
  const [filterStatus, setFilterStatus] = useState<ReviewStatus | 'all'>('all');
  const [filterType, setFilterType] = useState<FeedbackType | 'all'>('all');
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  
  // Form State
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

  // Requirements Form State
  const [requirements, setRequirements] = useState<Record<RequirementSection, RequirementSpec[]>>(JSON.parse(JSON.stringify(initialRequirements)));
  const [expandedSections, setExpandedSections] = useState<Record<RequirementSection, boolean>>({
    core: true, // Start with first one open
    monetization: false,
    design: false,
    technical: false,
    privacy: false,
    timeline: false,
    bonus: false
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

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (activeMenu && !(e.target as Element).closest('.review-actions')) {
        setActiveMenu(null);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [activeMenu]);

  // --- Data Fetching ---

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
      })) as ClientReviewData[];
      setReviews(fetchedReviews);
    } catch (err) {
      console.error('Error fetching reviews:', err);
    } finally {
      setLoading(false);
    }
  };

  // --- Handlers ---

  const handleRequirementChange = (section: RequirementSection, id: string, value: any) => {
    setRequirements(prev => ({
      ...prev,
      [section]: prev[section].map(item => 
        item.id === id ? { ...item, value } : item
      )
    }));
  };

  const toggleSection = (section: RequirementSection) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const calculateProgress = () => {
    let total = 0;
    let filled = 0;
    Object.values(requirements).forEach(section => {
      section.forEach(item => {
        total++;
        if (item.type === 'boolean' ? true : item.value !== '' && item.value !== false) {
          filled++;
        }
      });
    });
    return Math.round((filled / total) * 100);
  };

  const handleAddPoint = () => {
    if (!currentPoint.text.trim()) return;
    const point: ReviewPoint = {
      id: Date.now().toString(),
      text: currentPoint.text.trim(),
      type: currentPoint.type,
      isResolved: false
    };
    setNewReview(prev => ({ ...prev, points: [...prev.points, point] }));
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
        createdAt: Timestamp.now(),
        requirements: requirements // Save the requirements checklist
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
      const reviewRef = doc(db, 'clientReviews', editingReview.id);
      await updateDoc(reviewRef, {
        feedback: newReview.feedback.trim(),
        points: newReview.points,
        type: newReview.type,
        updatedAt: Timestamp.now(),
        requirements: requirements // Update requirements too
      });
      resetForm();
      fetchReviews();
    } catch (err) {
      console.error('Error updating review:', err);
    } finally {
      setLoading(false);
    }
  };

  const startEditing = (review: ClientReviewData) => {
    setEditingReview(review);
    setNewReview({
      updateId: review.updateId,
      feedback: review.feedback,
      type: review.type,
      points: review.points || []
    });
    // Load existing requirements if available
    if (review.requirements) {
      setRequirements(review.requirements);
    } else {
      setRequirements(JSON.parse(JSON.stringify(initialRequirements)));
    }
    setShowForm(true);
    setActiveMenu(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (reviewId: string) => {
    if (!window.confirm('Are you sure?')) return;
    try {
      setLoading(true);
      await deleteDoc(doc(db, 'clientReviews', reviewId));
      setActiveMenu(null);
      fetchReviews();
    } catch (err) {
      console.error('Error deleting review:', err);
    } finally {
      setLoading(false);
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
    setNewReview({ updateId: '', feedback: '', type: 'general', points: [] });
    setCurrentPoint({ text: '', type: 'suggestion' });
    setRequirements(JSON.parse(JSON.stringify(initialRequirements)));
    setShowForm(false);
    setEditingReview(null);
  };

  const toggleMenu = (reviewId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveMenu(activeMenu === reviewId ? null : reviewId);
  };

  // --- Render Helpers ---

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
    resolvedPoints: reviews.reduce((acc, r) => acc + (r.points?.filter(p => p.isResolved).length || 0), 0)
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
          <h3>{editingReview ? '✏️ Edit Feedback' : '📝 New Feedback'}</h3>
          
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

          {/* --- REQUIREMENTS CHECKLIST SECTION --- */}
          <div className="requirements-section">
            <div className="requirements-header">
              <div>
                <label style={{marginBottom: '4px', display: 'block'}}>📋 Project Requirements Checklist</label>
                <p className="points-hint">Help us define the scope by filling out the details below.</p>
              </div>
              <div className="progress-badge">
                {calculateProgress()}% Complete
              </div>
            </div>

            <div className="progress-bar-container">
              <div 
                className="progress-bar-fill" 
                style={{ width: `${calculateProgress()}%` }}
              ></div>
            </div>

            <div className="requirements-accordion">
              {(Object.keys(requirements) as RequirementSection[]).map((sectionKey) => (
                <div key={sectionKey} className="req-section">
                  <button 
                    type="button"
                    className="req-section-header"
                    onClick={() => toggleSection(sectionKey)}
                  >
                    <span>{sectionTitles[sectionKey]}</span>
                    <span className={`chevron ${expandedSections[sectionKey] ? 'open' : ''}`}>
                      <Icons.ChevronDown />
                    </span>
                  </button>
                  
                  {expandedSections[sectionKey] && (
                    <div className="req-section-content">
                      {requirements[sectionKey].map((field) => (
                        <div key={field.id} className="req-field">
                          <label className="req-label">
                            {field.label}
                            {field.required && <span className="required-star">*</span>}
                          </label>
                          
                          {field.type === 'select' && (
                            <select
                              value={field.value as string}
                              onChange={(e) => handleRequirementChange(sectionKey, field.id, e.target.value)}
                              className="req-input"
                            >
                              <option value="">Select...</option>
                              {field.options?.map(opt => (
                                <option key={opt} value={opt}>{opt}</option>
                              ))}
                            </select>
                          )}

                          {field.type === 'text' && (
                            <input
                              type="text"
                              value={field.value as string}
                              onChange={(e) => handleRequirementChange(sectionKey, field.id, e.target.value)}
                              className="req-input"
                              placeholder="Type answer here..."
                            />
                          )}

                          {field.type === 'boolean' && (
                            <div className="boolean-toggle">
                              <button
                                type="button"
                                className={`toggle-btn ${field.value === true ? 'active-yes' : ''}`}
                                onClick={() => handleRequirementChange(sectionKey, field.id, true)}
                              >
                                Yes
                              </button>
                              <button
                                type="button"
                                className={`toggle-btn ${field.value === false ? 'active-no' : ''}`}
                                onClick={() => handleRequirementChange(sectionKey, field.id, false)}
                              >
                                No
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
          {/* --- END REQUIREMENTS SECTION --- */}

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
              {loading ? 'Saving...' : (editingReview ? '💾 Save Changes' : '📤 Submit Feedback')}
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
                  <div className="review-header-row">
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
                    
                    {/* Action Menu */}
                    <div className="review-actions">
                      <button 
                        className="menu-toggle"
                        onClick={(e) => toggleMenu(review.id, e)}
                      >
                        <Icons.MoreVertical />
                      </button>
                      
                      {activeMenu === review.id && (
                        <div className="action-menu">
                          <button 
                            onClick={() => startEditing(review)}
                            className="menu-item edit"
                          >
                            <Icons.Edit /> Edit Feedback
                          </button>
                          {review.status !== 'resolved' && (
                            <button 
                              onClick={() => {
                                handleStatusChange(review.id, 'resolved');
                                setActiveMenu(null);
                              }}
                              className="menu-item resolve"
                            >
                              <Icons.CheckCircle /> Mark Resolved
                            </button>
                          )}
                          <button 
                            onClick={() => handleDelete(review.id)}
                            className="menu-item delete"
                          >
                            <Icons.Trash /> Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <h4 className="review-title">{review.updateTitle}</h4>
                  <p className="review-text">{review.feedback}</p>
                  
                  {/* Display Requirements Summary if exists */}
                  {review.requirements && (
                    <div className="requirements-summary">
                      <h5><Icons.FileText /> Requirements Confirmed</h5>
                      <div className="req-tags">
                        {Object.values(review.requirements).flat().filter(r => r.value !== '' && r.value !== false).slice(0, 5).map(r => (
                          <span key={r.id} className="req-tag">{r.label}: {typeof r.value === 'boolean' ? (r.value ? 'Yes' : 'No') : r.value}</span>
                        ))}
                        {Object.values(review.requirements).flat().filter(r => r.value !== '' && r.value !== false).length > 5 && (
                          <span className="req-tag more">+{Object.values(review.requirements).flat().filter(r => r.value !== '' && r.value !== false).length - 5} more</span>
                        )}
                      </div>
                    </div>
                  )}

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
                      {review.updatedAt && <span className="edited-tag"> (edited)</span>}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <style>{`
        /* --- Existing Styles (Preserved) --- */
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
          position: relative;
        }

        .review-item:hover {
          border-color: var(--gray-300);
          box-shadow: 0 4px 12px rgba(0,0,0,0.05);
        }

        .review-item.resolved {
          opacity: 0.8;
          background: var(--gray-50);
        }

        .review-header-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 12px;
        }

        .review-meta-row {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          flex: 1;
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

        /* Action Menu */
        .review-actions {
          position: relative;
        }

        .menu-toggle {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--gray-100);
          border: none;
          border-radius: 8px;
          color: var(--gray-600);
          cursor: pointer;
          transition: all 0.2s;
        }

        .menu-toggle:hover {
          background: var(--gray-200);
          color: var(--gray-900);
        }

        .action-menu {
          position: absolute;
          top: 100%;
          right: 0;
          margin-top: 8px;
          background: white;
          border: 1px solid var(--gray-200);
          border-radius: 12px;
          box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1);
          z-index: 100;
          min-width: 180px;
          overflow: hidden;
        }

        .menu-item {
          display: flex;
          align-items: center;
          gap: 10px;
          width: 100%;
          padding: 12px 16px;
          border: none;
          background: none;
          font-size: 14px;
          font-weight: 500;
          color: var(--gray-700);
          cursor: pointer;
          transition: all 0.2s;
          text-align: left;
        }

        .menu-item:hover {
          background: var(--gray-50);
        }

        .menu-item.edit { color: #2563eb; }
        .menu-item.edit:hover { background: #eff6ff; }
        .menu-item.resolve { color: #059669; }
        .menu-item.resolve:hover { background: #ecfdf5; }
        .menu-item.delete { color: #ef4444; }
        .menu-item.delete:hover { background: #fef2f2; }

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

        .edited-tag {
          color: var(--gray-400);
          font-style: italic;
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

        /* --- NEW REQUIREMENTS FORM STYLES --- */
        .requirements-section {
          background: white;
          border: 1px solid var(--gray-200);
          border-radius: 16px;
          padding: 24px;
          margin-bottom: 24px;
        }

        .requirements-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 16px;
        }

        .progress-badge {
          background: var(--primary);
          color: white;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 13px;
          font-weight: 700;
        }

        .progress-bar-container {
          width: 100%;
          height: 6px;
          background: var(--gray-200);
          border-radius: 3px;
          margin-bottom: 24px;
          overflow: hidden;
        }

        .progress-bar-fill {
          height: 100%;
          background: var(--primary);
          border-radius: 3px;
          transition: width 0.3s ease;
        }

        .requirements-accordion {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .req-section {
          border: 1px solid var(--gray-200);
          border-radius: 12px;
          overflow: hidden;
        }

        .req-section-header {
          width: 100%;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px;
          background: var(--gray-50);
          border: none;
          font-size: 15px;
          font-weight: 600;
          color: var(--gray-900);
          cursor: pointer;
          text-align: left;
        }

        .req-section-header:hover {
          background: var(--gray-100);
        }

        .chevron {
          transition: transform 0.2s;
          color: var(--gray-400);
        }

        .chevron.open {
          transform: rotate(180deg);
        }

        .req-section-content {
          padding: 20px;
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 20px;
          background: white;
        }

        .req-field {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .req-label {
          font-size: 13px;
          font-weight: 600;
          color: var(--gray-700);
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .required-star {
          color: #ef4444;
        }

        .req-input {
          padding: 10px 12px;
          border: 1px solid var(--gray-200);
          border-radius: 8px;
          font-size: 14px;
          outline: none;
          transition: all 0.2s;
          width: 100%;
        }

        .req-input:focus {
          border-color: var(--primary);
          box-shadow: 0 0 0 3px var(--primary-light);
        }

        .boolean-toggle {
          display: flex;
          gap: 8px;
        }

        .toggle-btn {
          flex: 1;
          padding: 10px;
          border: 1px solid var(--gray-200);
          background: white;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          color: var(--gray-600);
          cursor: pointer;
          transition: all 0.2s;
        }

        .toggle-btn:hover {
          background: var(--gray-50);
        }

        .toggle-btn.active-yes {
          background: #ecfdf5;
          border-color: #059669;
          color: #059669;
          font-weight: 600;
        }

        .toggle-btn.active-no {
          background: #fef2f2;
          border-color: #ef4444;
          color: #ef4444;
          font-weight: 600;
        }

        /* Requirements Summary in Review Card */
        .requirements-summary {
          background: #f0f9ff;
          border: 1px solid #bae6fd;
          border-radius: 10px;
          padding: 12px 16px;
          margin-bottom: 16px;
        }

        .requirements-summary h5 {
          margin: 0 0 8px;
          font-size: 13px;
          color: #0369a1;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .req-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }

        .req-tag {
          background: white;
          border: 1px solid #7dd3fc;
          color: #0c4a6e;
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 500;
        }

        .req-tag.more {
          background: #e0f2fe;
          border-color: transparent;
        }

        @media (max-width: 640px) {
          .client-reviews { padding: 16px; }
          .reviews-header { flex-direction: column; align-items: stretch; }
          .btn-primary { width: 100%; justify-content: center; }
          .type-buttons { display: grid; grid-template-columns: repeat(2, 1fr); }
          .point-input-row { flex-wrap: wrap; }
          .point-input-row input { width: 100%; order: -1; }
          .form-actions { flex-direction: column; }
          .form-actions button { width: 100%; }
          .points-grid { grid-template-columns: 1fr; }
          .review-header-row { flex-wrap: wrap; }
          .action-menu { right: -10px; left: auto; min-width: 160px; }
          
          .req-section-content {
            grid-template-columns: 1fr;
          }
          
          .requirements-header {
            flex-direction: column;
            gap: 12px;
          }
        }
      `}</style>
    </div>
  );
};

export default ClientReview;