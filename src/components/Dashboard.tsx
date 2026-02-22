import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { db } from '../services/firebase';
import { collection, query, orderBy, onSnapshot, limit } from 'firebase/firestore';
import BuildUpdates from './BuildUpdates';
import ClientReview from './ClientReview';
import ScreenGallery from './ScreenGallery';
import WeeklyProgress from './WeeklyProgress';
import TechnicalLog from './TechnicalLog';
import DeploymentTracker from './DeploymentTracker';
import PasswordModal from './PasswordModal';
import GlazeMeDemo from './GlazeMeDemo';
import { BuildUpdate, ScreenCapture, GlazeMeSpecs, CodeCommit, ClientReview as ClientReviewType } from '../types';

// --- Types ---
interface Notification {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

type TabType = 'updates' | 'reviews' | 'screens' | 'progress' | 'tech' | 'deploy' | 'demo' | 'more';

// --- Icons (Lucide-style, optimized for light theme) ---
const Icons = {
  Rocket: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/></svg>,
  LayoutGrid: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/></svg>,
  Smartphone: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="20" x="5" y="2" rx="2" ry="2"/><path d="M12 18h.01"/></svg>,
  Code: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>,
  BarChart: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" x2="12" y1="20" y2="10"/><line x1="18" x2="18" y1="20" y2="4"/><line x1="6" x2="6" y1="20" y2="16"/></svg>,
  Cloud: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/></svg>,
  Bell: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>,
  Search: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>,
  Filter: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>,
  Check: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  AlertCircle: () => <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>,
  RefreshCw: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/></svg>,
  Menu: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>,
  X: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>,
  ChevronDown: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>,
  Star: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  FileText: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>,
  Lock: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
  Unlock: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></svg>,
  MoreHorizontal: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>,
  TrendingUp: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
  Clock: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  Eye: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="2"/><path d="M22 12c-2.667 4.667-6 7-10 7s-7.333-2.333-10-7c2.667-4.667 6-7 10-7s7.333 2.333 10 7z"/></svg>,
};

// --- Sub-Components ---

const StatCard: React.FC<{ 
  label: string; 
  value: string | number; 
  color?: string; 
  trend?: string;
  trendUp?: boolean;
}> = ({ label, value, color, trend, trendUp }) => (
  <div className="stat-card">
    <div className="stat-header">
      <div className="stat-value" style={{ color: color || 'var(--primary-600)' }}>{value}</div>
      {trend && (
        <span className={`stat-trend ${trendUp ? 'up' : 'down'}`}>
          {trendUp ? <Icons.TrendingUp /> : <Icons.TrendingUp />}
          {trend}
        </span>
      )}
    </div>
    <div className="stat-label">{label}</div>
  </div>
);

const ActivityItem: React.FC<{ 
  icon: React.ReactNode; 
  time: string; 
  text: string; 
  subtext?: string;
  highlight?: boolean;
}> = ({ icon, time, text, subtext, highlight }) => (
  <div className={`activity-item ${highlight ? 'highlight' : ''}`}>
    <div className="activity-icon">{icon}</div>
    <div className="activity-content">
      <div className="activity-text">{text}</div>
      {subtext && <div className="activity-subtext">{subtext}</div>}
      <div className="activity-meta">
        <Icons.Clock />
        <span>{time}</span>
      </div>
    </div>
  </div>
);

const BottomNav: React.FC<{ activeTab: TabType; onTabChange: (tab: TabType) => void }> = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'updates' as TabType, label: 'Updates', icon: <Icons.LayoutGrid /> },
    { id: 'reviews' as TabType, label: 'Reviews', icon: <Icons.Star /> },
    { id: 'screens' as TabType, label: 'Screens', icon: <Icons.Smartphone /> },
    { id: 'demo' as TabType, label: 'Demo', icon: <Icons.Eye /> },
    { id: 'more' as TabType, label: 'More', icon: <Icons.MoreHorizontal /> },
  ];

  return (
    <nav className="bottom-nav">
      {tabs.map(tab => (
        <button
          key={tab.id}
          className={`bottom-nav-item ${activeTab === tab.id ? 'active' : ''}`}
          onClick={() => onTabChange(tab.id)}
          aria-label={tab.label}
        >
          <div className="bottom-nav-icon">{tab.icon}</div>
          <span className="bottom-nav-label">{tab.label}</span>
        </button>
      ))}
    </nav>
  );
};

// --- Main Component ---

const Dashboard: React.FC = () => {
  // State
  const [updates, setUpdates] = useState<BuildUpdate[]>([]);
  const [screens, setScreens] = useState<ScreenCapture[]>([]);
  const [commits, setCommits] = useState<CodeCommit[]>([]);
  const [reviews, setReviews] = useState<ClientReviewType[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('updates');
  const [isEditMode, setIsEditMode] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isMobile, setIsMobile] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [selectedDemoScreen, setSelectedDemoScreen] = useState<number>(0);

  // Specs Data
  const glazemeSpecs: GlazeMeSpecs = {
    name: "GlazeMe",
    concept: "Meme-based AI compliment generator for iMessage",
    coreFeature: "AI-generated over-the-top compliments with yellow-to-orange gradient theme",
    colorTheme: {
      primary: "#FF8C42",
      secondary: "#FFE55C",
      gradient: "linear-gradient(135deg, #FFE55C 0%, #FF8C42 100%)"
    },
    platform: "iOS iMessage Extension",
    targetFeatures: ["AI compliment generation", "Meme-style formatting", "Quick keyboard access"],
    technicalStack: {
      frontend: ["SwiftUI", "iMessage Extension"],
      backend: ["Firebase"],
      ai: ["OpenAI GPT-4"],
      database: ["Firestore"],
      hosting: ["App Store"]
    }
  };

  // Responsive Detection
  useEffect(() => {
    const checkDevice = () => {
      const width = window.innerWidth;
      setIsMobile(width < 640);
    };
    
    checkDevice();
    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  // Firebase Listeners
  useEffect(() => {
    setIsLoading(true);
    const unsubscribes: (() => void)[] = [];

    const setupListener = (col: string, order: string, setter: any, mapper: any) => {
      const q = query(collection(db, col), orderBy(order, 'desc'), limit(50));
      return onSnapshot(q, (snap) => {
        setter(snap.docs.map(mapper));
        setIsLoading(false);
      }, (err) => {
        console.error(err);
        setError("Failed to sync data");
        setIsLoading(false);
      });
    };

    unsubscribes.push(setupListener('buildUpdates', 'date', setUpdates, (doc: any) => ({
      id: doc.id, ...doc.data(), date: doc.data().date?.toDate?.() ?? new Date()
    })));
    
    unsubscribes.push(setupListener('screenshots', 'date', setScreens, (doc: any) => ({
      id: doc.id, ...doc.data(), date: doc.data().date?.toDate?.() ?? new Date()
    })));

    unsubscribes.push(setupListener('commits', 'timestamp', setCommits, (doc: any) => ({
      id: doc.id, ...doc.data(), timestamp: doc.data().timestamp?.toDate?.() ?? new Date()
    })));

    unsubscribes.push(setupListener('clientReviews', 'createdAt', setReviews, (doc: any) => ({
      id: doc.id, ...doc.data(), createdAt: doc.data().createdAt?.toDate?.() ?? new Date()
    })));

    addNotification('Dashboard Connected', 'success');

    return () => unsubscribes.forEach(u => u());
  }, []);

  // Helpers
  const addNotification = useCallback((message: string, type: Notification['type'] = 'info') => {
    const id = Date.now().toString();
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 5000);
  }, []);

  const handlePasswordSuccess = useCallback(() => {
    setIsEditMode(true);
    setShowPasswordModal(false);
    addNotification('Edit mode enabled', 'success');
  }, [addNotification]);

  const toggleEditMode = useCallback(() => {
    if (!isEditMode) setShowPasswordModal(true);
    else {
      setIsEditMode(false);
      addNotification('Edit mode disabled', 'info');
    }
  }, [isEditMode, addNotification]);

  // Stats
  const reviewStats = useMemo(() => {
    const total = reviews.length;
    const pending = reviews.filter(r => r.status === 'pending').length;
    const approved = reviews.filter(r => r.status === 'approved').length;
    const changes = reviews.filter(r => r.status === 'changes-requested').length;
    const rating = reviews.reduce((acc, r) => acc + (r.rating || 0), 0) / (reviews.length || 1);
    return { total, pending, approved, changes, rating };
  }, [reviews]);

  // Filtered Data
  const filteredUpdates = useMemo(() => 
    updates.filter(u => u.title?.toLowerCase().includes(searchQuery.toLowerCase())), 
  [updates, searchQuery]);

  const filteredScreens = useMemo(() => 
    screens.filter(s => s.screenName?.toLowerCase().includes(searchQuery.toLowerCase())), 
  [screens, searchQuery]);

  // Content Renderer
  const renderContent = () => {
    if (showMobileMenu && isMobile) {
      return (
        <div className="mobile-menu-overlay" onClick={() => setShowMobileMenu(false)}>
          <div className="mobile-menu" onClick={e => e.stopPropagation()}>
            <div className="mobile-menu-header">
              <h3>More Options</h3>
              <button className="icon-btn" onClick={() => setShowMobileMenu(false)}><Icons.X /></button>
            </div>
            <div className="mobile-menu-items">
              <button className="mobile-menu-item" onClick={() => { setActiveTab('progress'); setShowMobileMenu(false); }}>
                <Icons.BarChart /> Progress
              </button>
              <button className="mobile-menu-item" onClick={() => { setActiveTab('tech'); setShowMobileMenu(false); }}>
                <Icons.Code /> Tech Log
              </button>
              <button className="mobile-menu-item" onClick={() => { setActiveTab('deploy'); setShowMobileMenu(false); }}>
                <Icons.Cloud /> Deploy
              </button>
              <div className="mobile-menu-divider" />
              <button className={`mobile-menu-item ${isEditMode ? 'active' : ''}`} onClick={() => { toggleEditMode(); setShowMobileMenu(false); }}>
                {isEditMode ? <Icons.Unlock /> : <Icons.Lock />} {isEditMode ? 'Exit Edit Mode' : 'Enter Edit Mode'}
              </button>
            </div>
          </div>
        </div>
      );
    }

    switch (activeTab) {
      case 'updates': 
        return <BuildUpdates initialEditMode={isEditMode} />;
      case 'reviews': 
        return <ClientReview />;
      case 'screens': 
        return <ScreenGallery screens={filteredScreens} isEditMode={isEditMode} />;
      case 'progress': 
        return <WeeklyProgress isEditMode={isEditMode} />;
      case 'tech': 
        return <TechnicalLog isEditMode={isEditMode} />;
      case 'deploy': 
        return <DeploymentTracker isEditMode={isEditMode} />;
      case 'demo':
        return (
          <div className="demo-container">
            <div className="demo-header">
              <h2 className="demo-title">GlazeMe App Preview</h2>
              <p className="demo-description">Interactive demo showing all 10 screens of the GlazeMe iPhone app with titanium finish and Dynamic Island integration.</p>
              <div className="demo-controls">
                <select 
                  value={selectedDemoScreen} 
                  onChange={(e) => setSelectedDemoScreen(Number(e.target.value))}
                  className="demo-select"
                >
                  <option value={0}>All Screens</option>
                  <option value={1}>Splash Screen</option>
                  <option value={2}>Home Dashboard</option>
                  <option value={3}>Add Friend Modal</option>
                  <option value={4}>AI Generator</option>
                  <option value={5}>AI Processing</option>
                  <option value={6}>Result Preview</option>
                  <option value={7}>iOS Share Sheet</option>
                  <option value={8}>Keyboard Setup</option>
                  <option value={9}>Keyboard Active</option>
                  <option value={10}>History & Favorites</option>
                </select>
                <button 
                  className="demo-refresh-btn"
                  onClick={() => setSelectedDemoScreen(0)}
                >
                  Show All Screens
                </button>
              </div>
            </div>
            <div className="demo-content">
              <GlazeMeDemo 
                variant={selectedDemoScreen === 0 ? 'full' : 'screens-only'}
                showHeader={selectedDemoScreen === 0}
                showFeatures={selectedDemoScreen === 0}
                showCTA={selectedDemoScreen === 0}
                selectedScreen={selectedDemoScreen !== 0 ? selectedDemoScreen : undefined}
                embedded={selectedDemoScreen !== 0}
                onScreenSelect={(screenNumber) => setSelectedDemoScreen(screenNumber)}
              />
            </div>
          </div>
        );
      default: 
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Initializing Dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <Icons.AlertCircle />
        <h2>Connection Error</h2>
        <p>{error}</p>
        <button onClick={() => window.location.reload()} className="btn-primary">
          <Icons.RefreshCw /> Retry Connection
        </button>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <PasswordModal isOpen={showPasswordModal} onClose={() => setShowPasswordModal(false)} onSuccess={handlePasswordSuccess} />
      
      {/* Mobile Header */}
      <header className="mobile-header">
        <button 
          className="menu-toggle" 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          aria-label="Toggle menu"
        >
          {isSidebarOpen ? <Icons.X /> : <Icons.Menu />}
        </button>
        <div className="mobile-brand">
          <div className="mobile-logo-icon"><Icons.Rocket /></div>
          <span className="mobile-title">GlazeMe</span>
        </div>
        <button className="notification-btn" aria-label="Notifications">
          <Icons.Bell />
          {notifications.length > 0 && <span className="badge">{notifications.length}</span>}
        </button>
      </header>

      {/* Sidebar */}
      <aside className={`sidebar ${isSidebarOpen ? 'open' : ''} ${isMobile ? 'mobile-sidebar' : ''}`}>
        <div className="sidebar-header">
          <div className="logo">
            <div className="logo-icon"><Icons.Rocket /></div>
            <div className="logo-text">
              <h1>GlazeMe</h1>
              <p className="version">v1.0.0-alpha</p>
            </div>
          </div>
          {isMobile && (
            <button className="close-sidebar" onClick={() => setIsSidebarOpen(false)}>
              <Icons.X />
            </button>
          )}
        </div>

        <nav className="nav-menu">
          {[ 
            { id: 'updates' as TabType, label: 'Updates', icon: <Icons.LayoutGrid /> },
            { id: 'reviews' as TabType, label: 'Reviews', icon: <Icons.Star /> },
            { id: 'screens' as TabType, label: 'Screens', icon: <Icons.Smartphone /> },
            { id: 'demo' as TabType, label: 'App Demo', icon: <Icons.Eye /> },
            { id: 'progress' as TabType, label: 'Progress', icon: <Icons.BarChart /> },
            { id: 'tech' as TabType, label: 'Tech Log', icon: <Icons.Code /> },
            { id: 'deploy' as TabType, label: 'Deploy', icon: <Icons.Cloud /> },
          ].map(tab => (
            <button 
              key={tab.id} 
              className={`nav-item ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => { 
                setActiveTab(tab.id); 
                if (isMobile) setIsSidebarOpen(false);
              }}
            >
              <span className="nav-icon">{tab.icon}</span>
              <span className="nav-label">{tab.label}</span>
              {activeTab === tab.id && <div className="active-indicator" />}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="tech-stack-mini">
            {glazemeSpecs.technicalStack.frontend.slice(0,2).map((t, i) => (
              <span key={i} className="tech-tag">{t}</span>
            ))}
          </div>
          {!isMobile && (
            <button 
              className={`edit-toggle-sidebar ${isEditMode ? 'active' : ''}`}
              onClick={toggleEditMode}
            >
              {isEditMode ? <Icons.Unlock /> : <Icons.Lock />}
              <span>{isEditMode ? 'Exit Edit' : 'Edit Mode'}</span>
            </button>
          )}
        </div>
      </aside>

      {/* Overlay */}
      {isSidebarOpen && isMobile && (
        <div className="sidebar-overlay" onClick={() => setIsSidebarOpen(false)} />
      )}

      {/* Main Content */}
      <main className={`main-content ${isSidebarOpen && !isMobile ? 'shifted' : ''} ${isMobile ? 'mobile-main' : ''}`}>
        
        {/* Notifications */}
        <div className="notification-container">
          {notifications.map(n => (
            <div key={n.id} className={`notification toast ${n.type}`}>
              {n.message}
            </div>
          ))}
        </div>

        {/* Top Bar - Hide when in demo mode on mobile */}
        {!(isMobile && activeTab === 'demo') && (
          <div className="top-bar">
            <div className="search-box">
              <Icons.Search />
              <input 
                type="text" 
                placeholder={isMobile ? "Search..." : "Search updates, reviews..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button className="clear-search" onClick={() => setSearchQuery('')}>
                  <Icons.X />
                </button>
              )}
            </div>

            {!isMobile && (
              <div className="actions">
                <button className="icon-btn filter-btn"><Icons.Filter /></button>
                <button 
                  className={`edit-toggle ${isEditMode ? 'active' : ''}`}
                  onClick={toggleEditMode}
                >
                  {isEditMode ? <Icons.Unlock /> : <Icons.Lock />}
                  <span>{isEditMode ? 'Exit Edit' : 'Edit'}</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Welcome Card - Hide in demo mode */}
        {activeTab !== 'demo' && (
          <div className="welcome-card">
            <div className="welcome-content">
              <h2>Welcome back, Developer</h2>
              <p>Here's what's happening with your GlazeMe project today.</p>
            </div>
            <div className="welcome-stats">
              <div className="welcome-stat">
                <span className="welcome-stat-value">{updates.length}</span>
                <span className="welcome-stat-label">Updates</span>
              </div>
              <div className="welcome-stat">
                <span className="welcome-stat-value">{screens.length}</span>
                <span className="welcome-stat-label">Screens</span>
              </div>
            </div>
          </div>
        )}

        {/* Stats Overview - Only show on updates tab */}
        {activeTab === 'updates' && (
          <div className="stats-grid">
            <StatCard 
              label="Total Reviews" 
              value={reviewStats.total} 
              trend="+12%"
              trendUp={true}
            />
            <StatCard 
              label="Pending" 
              value={reviewStats.pending} 
              color="#d97706"
              trend="4 new"
              trendUp={false}
            />
            <StatCard 
              label="Approved" 
              value={reviewStats.approved} 
              color="#059669"
              trend="88%"
              trendUp={true}
            />
            {!isMobile && (
              <StatCard 
                label="Avg Rating" 
                value={reviewStats.rating.toFixed(1)} 
                color="#7c3aed"
                trend="4.5/5"
                trendUp={true}
              />
            )}
          </div>
        )}

        {/* Content Card */}
        <div className="content-card">
          {isEditMode && (
            <div className="edit-banner">
              <Icons.Unlock /> 
              <span>Edit Mode Active — Be careful!</span>
              {isMobile && (
                <button className="exit-edit-btn" onClick={toggleEditMode}>Exit</button>
              )}
            </div>
          )}
          <div className="content-body">
            {renderContent()}
          </div>
        </div>

        {/* Activity Feed - Hide in demo mode */}
        {!isMobile && activeTab !== 'demo' && (
          <div className="activity-feed">
            <div className="activity-feed-header">
              <h3>Live Activity</h3>
              <button className="view-all-btn">View All <Icons.ChevronDown /></button>
            </div>
            <div className="feed-list">
              {updates.slice(0, 3).map(u => (
                <ActivityItem 
                  key={u.id} 
                  icon={<Icons.FileText />} 
                  time={new Date(u.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} 
                  text={`Build Update: ${u.title}`}
                  subtext={u.description?.slice(0, 60) + '...'}
                  highlight={u.priority === 'high'}
                />
              ))}
              {reviews.slice(0, 2).map(r => (
                <ActivityItem 
                  key={r.id} 
                  icon={<Icons.Star />} 
                  time={new Date(r.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} 
                  text={`New Review: ${r.updateTitle || 'General'}`}
                  subtext={`Rating: ${r.rating ? `${r.rating}/5` : 'No rating'}`}
                  highlight={r.rating ? r.rating >= 4 : false}
                />
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Mobile Bottom Navigation */}
      {isMobile && (
        <BottomNav
          activeTab={activeTab}
          onTabChange={(tab: TabType) => {
            if (tab === 'more') {
              setShowMobileMenu(true);
            } else {
              setActiveTab(tab);
              setShowMobileMenu(false);
            }
          }}
        />
      )}

      {/* Demo Container Styles */}
      <style>{`
        .demo-container {
          width: 100%;
          min-height: 500px;
          display: flex;
          flex-direction: column;
        }

        .demo-header {
          margin-bottom: var(--space-6);
          width: 100%;
        }

        .demo-title {
          font-size: 24px;
          font-weight: 700;
          color: var(--gray-900);
          margin-bottom: var(--space-2);
        }

        .demo-description {
          color: var(--gray-600);
          font-size: 14px;
          margin-bottom: var(--space-4);
        }

        .demo-controls {
          display: flex;
          gap: var(--space-4);
          align-items: center;
          flex-wrap: wrap;
          margin-bottom: var(--space-6);
          background: var(--gray-50);
          padding: var(--space-4);
          border-radius: var(--radius-lg);
          border: 1px solid var(--gray-200);
        }

        .demo-select {
          padding: var(--space-3) var(--space-4);
          border-radius: var(--radius-md);
          border: 1px solid var(--gray-200);
          background: white;
          color: var(--gray-900);
          font-size: 14px;
          font-weight: 500;
          min-width: 200px;
          cursor: pointer;
          transition: var(--transition-fast);
        }

        .demo-select:hover {
          border-color: var(--primary-300);
        }

        .demo-select:focus {
          outline: none;
          border-color: var(--primary-500);
          box-shadow: 0 0 0 3px var(--primary-100);
        }

        .demo-refresh-btn {
          padding: var(--space-3) var(--space-5);
          background: linear-gradient(135deg, var(--primary-500), var(--primary-600));
          border: none;
          border-radius: var(--radius-md);
          color: white;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: var(--transition-fast);
          white-space: nowrap;
        }

        .demo-refresh-btn:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-md);
        }

        .demo-refresh-btn:active {
          transform: translateY(0);
        }

        .demo-content {
          width: 100%;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
        }

        /* Mobile Responsive Demo Styles */
        @media (max-width: 639px) {
          .demo-container {
            min-height: auto;
            padding: 0;
          }

          .demo-header {
            margin-bottom: var(--space-4);
          }

          .demo-title {
            font-size: 20px;
            margin-bottom: var(--space-1);
            padding: 0 var(--space-2);
          }

          .demo-description {
            font-size: 13px;
            margin-bottom: var(--space-3);
            padding: 0 var(--space-2);
          }

          .demo-controls {
            flex-direction: column;
            align-items: stretch;
            gap: var(--space-3);
            padding: var(--space-3);
            margin-bottom: var(--space-4);
            margin-left: var(--space-2);
            margin-right: var(--space-2);
            width: calc(100% - var(--space-4));
          }

          .demo-select {
            width: 100%;
            padding: var(--space-3);
            font-size: 14px;
          }

          .demo-refresh-btn {
            width: 100%;
            padding: var(--space-3);
            font-size: 14px;
          }

          .demo-content {
            padding: 0;
            width: 100%;
          }
        }

        @media (min-width: 640px) and (max-width: 1023px) {
          .demo-title {
            font-size: 22px;
          }

          .demo-description {
            font-size: 14px;
          }

          .demo-controls {
            padding: var(--space-3);
            gap: var(--space-3);
          }

          .demo-select {
            min-width: 180px;
            padding: var(--space-3);
          }

          .demo-refresh-btn {
            padding: var(--space-3) var(--space-4);
          }
        }

        /* Landscape mode on mobile */
        @media (max-height: 480px) and (orientation: landscape) {
          .demo-container {
            min-height: auto;
          }

          .demo-header {
            margin-bottom: var(--space-3);
          }

          .demo-title {
            font-size: 18px;
          }

          .demo-description {
            font-size: 12px;
            margin-bottom: var(--space-2);
          }

          .demo-controls {
            margin-bottom: var(--space-3);
          }
        }
      `}</style>

      {/* Light Theme Styles */}
      <style>{`
        /* ============================================
           LIGHT THEME DESIGN SYSTEM
           Professional, Clean, Accessible
           ============================================ */
        
        :root {
          /* Primary Brand Colors - Warm Orange/Gold */
          --primary-50: #fff7ed;
          --primary-100: #ffedd5;
          --primary-200: #fed7aa;
          --primary-300: #fdba74;
          --primary-400: #fb923c;
          --primary-500: #f97316;
          --primary-600: #ea580c;
          --primary-700: #c2410c;
          
          /* Neutral Scale - Cool Gray for Light Theme */
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
          
          /* Semantic Colors */
          --success-50: #ecfdf5;
          --success-500: #10b981;
          --success-600: #059669;
          --warning-50: #fffbeb;
          --warning-500: #f59e0b;
          --warning-600: #d97706;
          --error-50: #fef2f2;
          --error-500: #ef4444;
          --error-600: #dc2626;
          --info-50: #eff6ff;
          --info-500: #3b82f6;
          --info-600: #2563eb;
          
          /* Shadows - Soft and subtle for light theme */
          --shadow-xs: 0 1px 2px 0 rgb(0 0 0 / 0.05);
          --shadow-sm: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
          --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
          --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
          --shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
          
          /* Spacing */
          --space-1: 0.25rem;
          --space-2: 0.5rem;
          --space-3: 0.75rem;
          --space-4: 1rem;
          --space-5: 1.25rem;
          --space-6: 1.5rem;
          --space-8: 2rem;
          --space-10: 2.5rem;
          --space-12: 3rem;
          
          /* Border Radius */
          --radius-sm: 6px;
          --radius-md: 8px;
          --radius-lg: 12px;
          --radius-xl: 16px;
          --radius-2xl: 24px;
          
          /* Transitions */
          --transition-fast: 150ms cubic-bezier(0.4, 0, 0.2, 1);
          --transition-base: 200ms cubic-bezier(0.4, 0, 0.2, 1);
          --transition-slow: 300ms cubic-bezier(0.4, 0, 0.2, 1);
          
          /* Safe Areas */
          --safe-top: env(safe-area-inset-top);
          --safe-bottom: env(safe-area-inset-bottom);
          --safe-left: env(safe-area-inset-left);
          --safe-right: env(safe-area-inset-right);
        }

        * { 
          box-sizing: border-box; 
          -webkit-tap-highlight-color: transparent;
        }

        html, body {
          margin: 0;
          padding: 0;
          overflow-x: hidden;
          background-color: var(--gray-50);
          color: var(--gray-900);
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
          line-height: 1.5;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }

        .dashboard-container {
          display: flex;
          min-height: 100vh;
          background-color: var(--gray-50);
        }

        /* Loading & Error States */
        .loading-container, .error-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          width: 100%;
          gap: var(--space-4);
          padding: var(--space-6);
          text-align: center;
          background-color: var(--gray-50);
        }

        .spinner {
          width: 40px; 
          height: 40px;
          border: 3px solid var(--gray-200);
          border-top-color: var(--primary-500);
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin { 
          to { transform: rotate(360deg); } 
        }

        /* Mobile Header */
        .mobile-header {
          display: none;
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          height: 56px;
          padding-top: var(--safe-top);
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid var(--gray-200);
          align-items: center;
          justify-content: space-between;
          padding-left: max(var(--space-4), var(--safe-left));
          padding-right: max(var(--space-4), var(--safe-right));
          z-index: 100;
          box-shadow: var(--shadow-sm);
        }

        .menu-toggle, .notification-btn {
          width: 44px;
          height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: transparent;
          border: none;
          border-radius: var(--radius-md);
          color: var(--gray-700);
          cursor: pointer;
          transition: var(--transition-fast);
        }

        .menu-toggle:active, .notification-btn:active {
          background: var(--gray-100);
          transform: scale(0.95);
        }

        .mobile-brand {
          display: flex;
          align-items: center;
          gap: var(--space-2);
        }

        .mobile-logo-icon {
          color: var(--primary-500);
          display: flex;
        }

        .mobile-title {
          font-size: 18px;
          font-weight: 700;
          color: var(--gray-900);
          letter-spacing: -0.025em;
        }

        .badge {
          position: absolute;
          top: 6px;
          right: 6px;
          background: var(--error-500);
          color: white;
          font-size: 11px;
          font-weight: 600;
          min-width: 18px;
          height: 18px;
          border-radius: 9px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0 5px;
          border: 2px solid white;
          box-shadow: var(--shadow-xs);
        }

        /* Sidebar */
        .sidebar {
          width: 264px;
          background: var(--gray-0);
          border-right: 1px solid var(--gray-200);
          display: flex;
          flex-direction: column;
          position: fixed;
          height: 100vh;
          height: 100dvh;
          z-index: 200;
          transition: transform var(--transition-slow);
          overflow-y: auto;
          overflow-x: hidden;
        }

        .sidebar.mobile-sidebar {
          transform: translateX(-100%);
          width: 280px;
          box-shadow: var(--shadow-xl);
        }

        .sidebar.mobile-sidebar.open {
          transform: translateX(0);
        }

        .sidebar-overlay {
          position: fixed;
          inset: 0;
          background: rgba(15, 23, 42, 0.4);
          z-index: 150;
          backdrop-filter: blur(4px);
          animation: fadeIn 0.2s ease;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .sidebar-header {
          padding: var(--space-6);
          border-bottom: 1px solid var(--gray-100);
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .logo {
          display: flex;
          align-items: center;
          gap: var(--space-3);
        }

        .logo-icon {
          background: linear-gradient(135deg, var(--primary-100), var(--primary-300));
          padding: var(--space-3);
          border-radius: var(--radius-lg);
          color: var(--primary-700);
          display: flex;
          box-shadow: var(--shadow-sm);
        }

        .logo-text h1 {
          font-size: 20px;
          margin: 0;
          font-weight: 700;
          color: var(--gray-900);
          letter-spacing: -0.025em;
        }

        .version {
          font-size: 12px;
          color: var(--gray-500);
          margin: 2px 0 0 0;
          font-weight: 500;
        }

        .close-sidebar {
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--gray-100);
          border: none;
          border-radius: var(--radius-md);
          color: var(--gray-500);
          cursor: pointer;
          transition: var(--transition-fast);
        }

        .close-sidebar:hover {
          background: var(--gray-200);
          color: var(--gray-700);
        }

        .nav-menu {
          flex: 1;
          padding: var(--space-3);
          display: flex;
          flex-direction: column;
          gap: var(--space-1);
        }

        .nav-item {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          padding: var(--space-3) var(--space-4);
          border-radius: var(--radius-md);
          border: none;
          background: transparent;
          color: var(--gray-600);
          cursor: pointer;
          font-size: 15px;
          font-weight: 500;
          transition: var(--transition-fast);
          position: relative;
          text-align: left;
          width: 100%;
          min-height: 48px;
        }

        .nav-item:hover { 
          background: var(--gray-50); 
          color: var(--gray-900); 
        }

        .nav-item.active { 
          background: var(--primary-50); 
          color: var(--primary-700); 
        }

        .nav-icon {
          display: flex;
          flex-shrink: 0;
          color: currentColor;
        }

        .active-indicator {
          position: absolute;
          left: 0;
          top: 50%;
          transform: translateY(-50%);
          width: 3px;
          height: 20px;
          background: var(--primary-500);
          border-radius: 0 3px 3px 0;
        }

        .sidebar-footer {
          padding: var(--space-4);
          border-top: 1px solid var(--gray-100);
          display: flex;
          flex-direction: column;
          gap: var(--space-3);
        }

        .tech-stack-mini {
          display: flex;
          flex-wrap: wrap;
          gap: var(--space-2);
        }

        .tech-tag {
          font-size: 11px;
          background: var(--gray-100);
          padding: var(--space-1) var(--space-3);
          border-radius: 20px;
          color: var(--gray-600);
          font-weight: 500;
          border: 1px solid var(--gray-200);
        }

        .edit-toggle-sidebar {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: var(--space-2);
          padding: var(--space-3);
          border-radius: var(--radius-md);
          border: 1px solid var(--gray-200);
          background: var(--gray-0);
          cursor: pointer;
          font-weight: 500;
          font-size: 14px;
          color: var(--gray-600);
          transition: var(--transition-fast);
          width: 100%;
        }

        .edit-toggle-sidebar:hover {
          background: var(--gray-50);
          border-color: var(--gray-300);
        }

        .edit-toggle-sidebar.active {
          background: var(--error-50);
          color: var(--error-600);
          border-color: var(--error-200);
        }

        /* Main Content */
        .main-content {
          flex: 1;
          margin-left: 264px;
          padding: var(--space-8) var(--space-10);
          max-width: 1440px;
          transition: margin-left var(--transition-slow);
          min-height: 100vh;
        }

        .main-content.shifted {
          margin-left: 264px;
        }

        .main-content.mobile-main {
          margin-left: 0;
          padding: 76px var(--space-4) 100px;
          padding-top: calc(56px + var(--safe-top) + var(--space-4));
        }

        /* Notifications */
        .notification-container {
          position: fixed;
          top: var(--space-6);
          right: var(--space-6);
          z-index: 9999;
          display: flex;
          flex-direction: column;
          gap: var(--space-3);
          pointer-events: none;
        }

        .toast {
          padding: var(--space-4) var(--space-5);
          border-radius: var(--radius-lg);
          color: white;
          font-weight: 500;
          font-size: 14px;
          box-shadow: var(--shadow-lg);
          animation: slideIn 0.3s ease-out;
          pointer-events: auto;
          max-width: 400px;
          word-wrap: break-word;
          display: flex;
          align-items: center;
          gap: var(--space-3);
        }

        .toast.success { 
          background: var(--success-600); 
          border: 1px solid var(--success-500);
        }
        .toast.error { 
          background: var(--error-600); 
          border: 1px solid var(--error-500);
        }
        .toast.info { 
          background: var(--info-600); 
          border: 1px solid var(--info-500);
        }

        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }

        /* Top Bar */
        .top-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--space-6);
          gap: var(--space-4);
          flex-wrap: wrap;
        }

        .search-box {
          display: flex;
          align-items: center;
          background: var(--gray-0);
          padding: var(--space-3) var(--space-4);
          border-radius: var(--radius-xl);
          border: 1px solid var(--gray-200);
          flex: 1;
          min-width: 280px;
          max-width: 420px;
          color: var(--gray-400);
          transition: var(--transition-fast);
          position: relative;
          box-shadow: var(--shadow-xs);
        }

        .search-box:focus-within {
          border-color: var(--primary-300);
          box-shadow: 0 0 0 3px var(--primary-100);
          color: var(--primary-500);
        }

        .search-box input {
          border: none;
          outline: none;
          margin-left: var(--space-3);
          width: 100%;
          background: transparent;
          font-size: 15px;
          color: var(--gray-900);
          font-weight: 500;
        }

        .search-box input::placeholder {
          color: var(--gray-400);
          font-weight: 400;
        }

        .clear-search {
          position: absolute;
          right: 12px;
          background: var(--gray-100);
          border: none;
          padding: 4px;
          cursor: pointer;
          color: var(--gray-500);
          display: flex;
          border-radius: 50%;
          transition: var(--transition-fast);
        }

        .clear-search:hover {
          background: var(--gray-200);
          color: var(--gray-700);
        }

        .actions {
          display: flex;
          gap: var(--space-3);
          align-items: center;
        }

        .icon-btn {
          width: 44px;
          height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--gray-0);
          border: 1px solid var(--gray-200);
          border-radius: var(--radius-lg);
          cursor: pointer;
          color: var(--gray-600);
          transition: var(--transition-fast);
          box-shadow: var(--shadow-xs);
        }

        .icon-btn:hover {
          border-color: var(--gray-300);
          color: var(--gray-900);
          background: var(--gray-50);
        }

        .icon-btn:active {
          transform: scale(0.95);
        }

        .edit-toggle {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          padding: var(--space-3) var(--space-5);
          border-radius: var(--radius-xl);
          border: 1px solid var(--gray-200);
          background: var(--gray-0);
          cursor: pointer;
          font-weight: 500;
          font-size: 14px;
          color: var(--gray-600);
          transition: var(--transition-fast);
          height: 44px;
          box-shadow: var(--shadow-xs);
        }

        .edit-toggle:hover {
          border-color: var(--gray-300);
          background: var(--gray-50);
        }

        .edit-toggle.active {
          background: var(--error-50);
          color: var(--error-600);
          border-color: var(--error-200);
        }

        /* Welcome Card */
        .welcome-card {
          background: linear-gradient(135deg, var(--primary-500), var(--primary-600));
          border-radius: var(--radius-xl);
          padding: var(--space-6) var(--space-8);
          margin-bottom: var(--space-6);
          display: flex;
          justify-content: space-between;
          align-items: center;
          color: white;
          box-shadow: var(--shadow-lg);
          position: relative;
          overflow: hidden;
        }

        .welcome-card::before {
          content: '';
          position: absolute;
          top: -50%;
          right: -10%;
          width: 300px;
          height: 300px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 50%;
        }

        .welcome-content h2 {
          margin: 0 0 var(--space-2) 0;
          font-size: 24px;
          font-weight: 700;
          letter-spacing: -0.025em;
        }

        .welcome-content p {
          margin: 0;
          opacity: 0.9;
          font-size: 15px;
        }

        .welcome-stats {
          display: flex;
          gap: var(--space-6);
        }

        .welcome-stat {
          text-align: center;
        }

        .welcome-stat-value {
          display: block;
          font-size: 32px;
          font-weight: 700;
          line-height: 1;
        }

        .welcome-stat-label {
          font-size: 13px;
          opacity: 0.8;
          font-weight: 500;
        }

        /* Stats Grid */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: var(--space-5);
          margin-bottom: var(--space-6);
        }

        .stat-card {
          background: var(--gray-0);
          padding: var(--space-5);
          border-radius: var(--radius-xl);
          box-shadow: var(--shadow-sm);
          border: 1px solid var(--gray-200);
          transition: var(--transition-fast);
          position: relative;
          overflow: hidden;
        }

        .stat-card:hover { 
          transform: translateY(-2px); 
          box-shadow: var(--shadow-md); 
          border-color: var(--gray-300);
        }

        .stat-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: linear-gradient(90deg, var(--primary-400), var(--primary-500));
          opacity: 0;
          transition: opacity 0.2s;
        }

        .stat-card:hover::before {
          opacity: 1;
        }

        .stat-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: var(--space-3);
        }

        .stat-value { 
          font-size: 32px; 
          font-weight: 700; 
          line-height: 1;
          letter-spacing: -0.025em;
        }

        .stat-trend {
          font-size: 12px;
          font-weight: 600;
          padding: var(--space-1) var(--space-3);
          border-radius: 20px;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .stat-trend.up {
          background: var(--success-50);
          color: var(--success-600);
        }

        .stat-trend.down {
          background: var(--warning-50);
          color: var(--warning-600);
        }

        .stat-label { 
          font-size: 14px; 
          color: var(--gray-500);
          font-weight: 500;
        }

        /* Content Card */
        .content-card {
          background: var(--gray-0);
          border-radius: var(--radius-xl);
          box-shadow: var(--shadow-sm);
          border: 1px solid var(--gray-200);
          overflow: hidden;
          margin-bottom: var(--space-6);
        }

        .edit-banner {
          background: linear-gradient(90deg, var(--warning-50), #fef3c7);
          color: var(--warning-700);
          padding: var(--space-4) var(--space-6);
          font-size: 14px;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: var(--space-3);
          border-bottom: 1px solid var(--warning-200);
          justify-content: space-between;
        }

        .exit-edit-btn {
          padding: var(--space-2) var(--space-4);
          background: white;
          border: 1px solid var(--warning-300);
          border-radius: var(--radius-md);
          font-size: 13px;
          font-weight: 600;
          color: var(--warning-700);
          cursor: pointer;
          transition: var(--transition-fast);
        }

        .exit-edit-btn:hover {
          background: var(--warning-50);
        }

        .content-body {
          padding: var(--space-6);
        }

        /* Activity Feed */
        .activity-feed {
          background: var(--gray-0);
          border-radius: var(--radius-xl);
          box-shadow: var(--shadow-sm);
          border: 1px solid var(--gray-200);
          overflow: hidden;
        }

        .activity-feed-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: var(--space-5) var(--space-6);
          border-bottom: 1px solid var(--gray-100);
        }

        .activity-feed-header h3 {
          margin: 0;
          font-size: 16px;
          color: var(--gray-900);
          font-weight: 600;
          letter-spacing: -0.025em;
        }

        .view-all-btn {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          background: none;
          border: none;
          color: var(--primary-600);
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: var(--transition-fast);
        }

        .view-all-btn:hover {
          color: var(--primary-700);
        }

        .feed-list {
          display: flex;
          flex-direction: column;
        }

        .activity-item {
          display: flex;
          align-items: flex-start;
          gap: var(--space-4);
          padding: var(--space-5) var(--space-6);
          transition: var(--transition-fast);
          cursor: pointer;
          border-bottom: 1px solid var(--gray-100);
        }

        .activity-item:last-child {
          border-bottom: none;
        }

        .activity-item:hover { 
          background: var(--gray-50); 
        }

        .activity-item.highlight {
          background: var(--primary-50);
          border-left: 3px solid var(--primary-500);
        }

        .activity-item.highlight:hover {
          background: #fff7ed;
        }

        .activity-icon {
          color: var(--primary-600);
          background: var(--primary-50);
          padding: var(--space-3);
          border-radius: var(--radius-lg);
          display: flex;
          flex-shrink: 0;
        }

        .activity-content { 
          flex: 1;
          min-width: 0;
        }

        .activity-text { 
          font-size: 15px; 
          font-weight: 600;
          color: var(--gray-900);
          margin-bottom: var(--space-1);
          letter-spacing: -0.025em;
        }

        .activity-subtext {
          font-size: 14px;
          color: var(--gray-600);
          margin-bottom: var(--space-2);
          line-height: 1.5;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .activity-meta {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          font-size: 13px;
          color: var(--gray-400);
          font-weight: 500;
        }

        .activity-meta svg {
          width: 14px;
          height: 14px;
        }

        /* Mobile Bottom Navigation */
        .bottom-nav {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          height: calc(64px + var(--safe-bottom));
          padding-bottom: var(--safe-bottom);
          background: rgba(255, 255, 255, 0.98);
          backdrop-filter: blur(20px);
          border-top: 1px solid var(--gray-200);
          display: flex;
          justify-content: space-around;
          align-items: center;
          z-index: 100;
          padding-left: var(--safe-left);
          padding-right: var(--safe-right);
          box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.05);
        }

        .bottom-nav-item {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 4px;
          background: none;
          border: none;
          padding: var(--space-2);
          color: var(--gray-400);
          cursor: pointer;
          transition: var(--transition-fast);
          position: relative;
          min-height: 48px;
        }

        .bottom-nav-item.active {
          color: var(--primary-600);
        }

        .bottom-nav-item.active::before {
          content: '';
          position: absolute;
          top: 0;
          width: 40px;
          height: 3px;
          background: var(--primary-500);
          border-radius: 0 0 3px 3px;
        }

        .bottom-nav-icon {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .bottom-nav-label {
          font-size: 11px;
          font-weight: 600;
        }

        /* Mobile Menu Overlay */
        .mobile-menu-overlay {
          position: fixed;
          inset: 0;
          background: rgba(15, 23, 42, 0.4);
          z-index: 300;
          display: flex;
          align-items: flex-end;
          animation: fadeIn 0.2s ease;
        }

        .mobile-menu {
          background: white;
          width: 100%;
          border-radius: var(--radius-2xl) var(--radius-2xl) 0 0;
          padding: var(--space-6);
          padding-bottom: calc(var(--space-6) + var(--safe-bottom));
          animation: slideUp 0.3s ease;
          max-height: 70vh;
          overflow-y: auto;
          box-shadow: var(--shadow-xl);
        }

        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }

        .mobile-menu-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--space-5);
        }

        .mobile-menu-header h3 {
          margin: 0;
          font-size: 20px;
          font-weight: 700;
          color: var(--gray-900);
        }

        .mobile-menu-items {
          display: flex;
          flex-direction: column;
          gap: var(--space-2);
        }

        .mobile-menu-item {
          display: flex;
          align-items: center;
          gap: var(--space-4);
          padding: var(--space-4);
          border-radius: var(--radius-lg);
          border: none;
          background: transparent;
          font-size: 16px;
          font-weight: 500;
          color: var(--gray-700);
          cursor: pointer;
          text-align: left;
          width: 100%;
          transition: var(--transition-fast);
          min-height: 52px;
        }

        .mobile-menu-item:active {
          background: var(--gray-100);
        }

        .mobile-menu-item.active {
          color: var(--primary-700);
          background: var(--primary-50);
        }

        .mobile-menu-divider {
          height: 1px;
          background: var(--gray-200);
          margin: var(--space-3) 0;
        }

        /* Responsive Breakpoints */
        @media (max-width: 1023px) {
          .sidebar {
            transform: translateX(-100%);
          }
          
          .sidebar.open {
            transform: translateX(0);
          }
          
          .main-content {
            margin-left: 0;
            padding: var(--space-6);
          }
          
          .main-content.shifted {
            margin-left: 0;
          }

          .welcome-card {
            flex-direction: column;
            text-align: center;
            gap: var(--space-5);
          }

          .welcome-stats {
            width: 100%;
            justify-content: center;
          }
        }

        @media (max-width: 639px) {
          .mobile-header {
            display: flex;
          }

          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: var(--space-4);
          }

          .stat-card {
            padding: var(--space-4);
          }

          .stat-value {
            font-size: 24px;
          }

          .search-box {
            max-width: 100%;
            order: 2;
            width: 100%;
          }

          .top-bar {
            flex-direction: column;
            align-items: stretch;
            gap: var(--space-4);
          }

          .notification-container {
            left: var(--space-4);
            right: var(--space-4);
            top: 80px;
          }

          .toast {
            max-width: 100%;
            width: 100%;
          }

          .content-body {
            padding: var(--space-4);
          }

          .welcome-card {
            padding: var(--space-5);
            margin-bottom: var(--space-5);
          }

          .welcome-content h2 {
            font-size: 20px;
          }

          .welcome-stats {
            gap: var(--space-5);
          }
        }

        @media (min-width: 640px) and (max-width: 1023px) {
          .stats-grid {
            grid-template-columns: repeat(3, 1fr);
          }

          .welcome-card {
            padding: var(--space-6);
          }
        }

        @media (min-width: 1024px) {
          .stats-grid {
            grid-template-columns: repeat(4, 1fr);
          }
        }

        /* Touch Optimization */
        @media (hover: none) {
          .nav-item:hover,
          .activity-item:hover,
          .stat-card:hover {
            transform: none;
          }
          
          .nav-item:active,
          .activity-item:active,
          .stat-card:active {
            transform: scale(0.98);
          }
        }

        /* Reduced Motion */
        @media (prefers-reduced-motion: reduce) {
          * {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }

        /* High Contrast Mode Support */
        @media (prefers-contrast: high) {
          .stat-card,
          .activity-feed,
          .content-card,
          .sidebar {
            border-width: 2px;
          }
        }

        /* Print Styles */
        @media print {
          .sidebar,
          .mobile-header,
          .bottom-nav,
          .notification-container {
            display: none !important;
          }
          
          .main-content {
            margin-left: 0 !important;
            padding: 0 !important;
          }
        }
      `}</style>
    </div>
  );
};

export default Dashboard;