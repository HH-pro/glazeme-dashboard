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
import { BuildUpdate, ScreenCapture, GlazeMeSpecs, CodeCommit, ClientReview as ClientReviewType } from '../types';

// --- Types ---
interface Notification {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

type TabType = 'updates' | 'reviews' | 'screens' | 'progress' | 'tech' | 'deploy';

// --- Icons (Optimized SVGs with 24x24 touch targets) ---
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
  MoreHorizontal: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
};

// --- Sub-Components ---

const StatCard: React.FC<{ label: string; value: string | number; color?: string; trend?: string }> = ({ label, value, color, trend }) => (
  <div className="stat-card">
    <div className="stat-header">
      <div className="stat-value" style={{ color: color || 'var(--color-primary)' }}>{value}</div>
      {trend && <span className="stat-trend">{trend}</span>}
    </div>
    <div className="stat-label">{label}</div>
  </div>
);

const ActivityItem: React.FC<{ icon: React.ReactNode; time: string; text: string; subtext?: string }> = ({ icon, time, text, subtext }) => (
  <div className="activity-item">
    <div className="activity-icon">{icon}</div>
    <div className="activity-content">
      <div className="activity-text">{text}</div>
      {subtext && <div className="activity-subtext">{subtext}</div>}
      <div className="activity-time">{time}</div>
    </div>
  </div>
);

const BottomNav: React.FC<{ activeTab: TabType; onTabChange: (tab: TabType) => void }> = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'updates' as TabType, label: 'Updates', icon: <Icons.LayoutGrid /> },
    { id: 'reviews' as TabType, label: 'Reviews', icon: <Icons.Star /> },
    { id: 'screens' as TabType, label: 'Screens', icon: <Icons.Smartphone /> },
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
  const [isTablet, setIsTablet] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

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
      setIsTablet(width >= 640 && width < 1024);
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
      case 'updates': return <BuildUpdates initialEditMode={isEditMode} />;
      case 'reviews': return <ClientReview />;
      case 'screens': return <ScreenGallery screens={filteredScreens} isEditMode={isEditMode} />;
      case 'progress': return <WeeklyProgress isEditMode={isEditMode} />;
      case 'tech': return <TechnicalLog isEditMode={isEditMode} />;
      case 'deploy': return <DeploymentTracker isEditMode={isEditMode} />;
      default: return null;
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
      
      {/* Mobile Header - Sticky with safe area support */}
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

      {/* Sidebar - Collapsible on mobile, fixed on desktop */}
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

      {/* Overlay for mobile sidebar */}
      {isSidebarOpen && isMobile && (
        <div className="sidebar-overlay" onClick={() => setIsSidebarOpen(false)} />
      )}

      {/* Main Content */}
      <main className={`main-content ${isSidebarOpen && !isMobile ? 'shifted' : ''} ${isMobile ? 'mobile-main' : ''}`}>
        
        {/* Notifications - Adjusted for mobile safe areas */}
        <div className="notification-container">
          {notifications.map(n => (
            <div key={n.id} className={`notification toast ${n.type}`}>
              {n.message}
            </div>
          ))}
        </div>

        {/* Search & Actions Bar - Responsive */}
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

        {/* Stats Overview - Responsive Grid */}
        {activeTab === 'updates' && (
          <div className="stats-grid">
            <StatCard 
              label="Total Reviews" 
              value={reviewStats.total} 
              trend={isMobile ? undefined : "+12%"} 
            />
            <StatCard 
              label="Pending" 
              value={reviewStats.pending} 
              color="#f59e0b"
              trend={isMobile ? undefined : "4 new"} 
            />
            <StatCard 
              label="Approved" 
              value={reviewStats.approved} 
              color="#10b981"
              trend={isMobile ? undefined : "88%"} 
            />
            {!isMobile && (
              <StatCard 
                label="Avg Rating" 
                value={reviewStats.rating.toFixed(1)} 
                color="#8b5cf6"
                trend="4.5/5"
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

        {/* Activity Feed - Collapsible on mobile */}
        {!isMobile && (
          <div className="activity-feed">
            <h3>Live Activity</h3>
            <div className="feed-list">
              {updates.slice(0, 3).map(u => (
                <ActivityItem 
                  key={u.id} 
                  icon={<Icons.FileText />} 
                  time={new Date(u.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} 
                  text={`Build Update: ${u.title}`}
                  subtext={u.description?.slice(0, 60) + '...'}
                />
              ))}
              {reviews.slice(0, 2).map(r => (
                <ActivityItem 
                  key={r.id} 
                  icon={<Icons.Star />} 
                  time={new Date(r.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} 
                  text={`New Review: ${r.updateTitle || 'General'}`}
                  subtext={`Rating: ${r.rating}/5`}
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
      {/* Global Responsive Styles */}
      <style>{`
        :root {
          --color-primary: #FF8C42;
          --color-secondary: #FFE55C;
          --color-bg: #f8fafc;
          --color-surface: #ffffff;
          --color-text: #0f172a;
          --color-text-muted: #64748b;
          --color-border: #e2e8f0;
          --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
          --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
          --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);
          --radius: 12px;
          --radius-sm: 8px;
          --transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
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
        }

        .dashboard-container {
          display: flex;
          min-height: 100vh;
          background-color: var(--color-bg);
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif;
          color: var(--color-text);
          padding-bottom: constant(safe-area-inset-bottom);
          padding-bottom: env(safe-area-inset-bottom);
        }

        /* Loading & Error States */
        .loading-container, .error-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          width: 100%;
          gap: 1rem;
          padding: 20px;
          text-align: center;
        }
        .spinner {
          width: 40px; height: 40px;
          border: 3px solid #e2e8f0;
          border-top-color: var(--color-primary);
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* Mobile Header - Sticky with safe area */
        .mobile-header {
          display: none;
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          height: 56px;
          padding-top: var(--safe-top);
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          border-bottom: 1px solid var(--color-border);
          align-items: center;
          justify-content: space-between;
          padding-left: max(16px, var(--safe-left));
          padding-right: max(16px, var(--safe-right));
          z-index: 100;
          transition: var(--transition);
        }

        .menu-toggle, .notification-btn {
          width: 44px;
          height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: transparent;
          border: none;
          border-radius: 10px;
          color: var(--color-text);
          cursor: pointer;
          transition: var(--transition);
          touch-action: manipulation;
        }

        .menu-toggle:active, .notification-btn:active {
          background: var(--color-bg);
          transform: scale(0.95);
        }

        .mobile-brand {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .mobile-logo-icon {
          color: var(--color-primary);
          display: flex;
        }

        .mobile-title {
          font-size: 18px;
          font-weight: 700;
          color: var(--color-text);
        }

        .badge {
          position: absolute;
          top: 6px;
          right: 6px;
          background: #ef4444;
          color: white;
          font-size: 10px;
          font-weight: 600;
          min-width: 18px;
          height: 18px;
          border-radius: 9px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0 5px;
          border: 2px solid white;
        }

        /* Sidebar - Responsive */
        .sidebar {
          width: 260px;
          background: var(--color-surface);
          border-right: 1px solid var(--color-border);
          display: flex;
          flex-direction: column;
          position: fixed;
          height: 100vh;
          height: 100dvh;
          z-index: 200;
          transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          overflow-y: auto;
          overflow-x: hidden;
        }

        .sidebar.mobile-sidebar {
          transform: translateX(-100%);
          width: 280px;
          box-shadow: 4px 0 24px rgba(0,0,0,0.15);
        }

        .sidebar.mobile-sidebar.open {
          transform: translateX(0);
        }

        .sidebar-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.5);
          z-index: 150;
          backdrop-filter: blur(4px);
          animation: fadeIn 0.2s ease;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .sidebar-header {
          padding: 20px;
          border-bottom: 1px solid var(--color-border);
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .logo {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .logo-icon {
          background: linear-gradient(135deg, var(--color-secondary), var(--color-primary));
          padding: 10px;
          border-radius: 12px;
          color: white;
          display: flex;
          box-shadow: 0 4px 12px rgba(255, 140, 66, 0.3);
        }

        .logo-text h1 {
          font-size: 20px;
          margin: 0;
          font-weight: 700;
          color: var(--color-text);
        }

        .version {
          font-size: 12px;
          color: var(--color-text-muted);
          margin: 2px 0 0 0;
        }

        .close-sidebar {
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--color-bg);
          border: none;
          border-radius: 10px;
          color: var(--color-text-muted);
          cursor: pointer;
        }

        .nav-menu {
          flex: 1;
          padding: 12px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .nav-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          border-radius: 10px;
          border: none;
          background: transparent;
          color: var(--color-text-muted);
          cursor: pointer;
          font-size: 15px;
          font-weight: 500;
          transition: var(--transition);
          position: relative;
          text-align: left;
          width: 100%;
          min-height: 48px;
        }

        .nav-item:active {
          transform: scale(0.98);
        }

        .nav-item:hover { 
          background: #f1f5f9; 
          color: var(--color-text); 
        }

        .nav-item.active { 
          background: linear-gradient(135deg, #fff7ed, #ffedd5); 
          color: var(--color-primary); 
        }

        .nav-icon {
          display: flex;
          flex-shrink: 0;
        }

        .active-indicator {
          position: absolute;
          left: 0;
          top: 50%;
          transform: translateY(-50%);
          width: 4px;
          height: 24px;
          background: var(--color-primary);
          border-radius: 0 4px 4px 0;
        }

        .sidebar-footer {
          padding: 16px;
          border-top: 1px solid var(--color-border);
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .tech-stack-mini {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }

        .tech-tag {
          font-size: 11px;
          background: #f1f5f9;
          padding: 4px 10px;
          border-radius: 20px;
          color: var(--color-text-muted);
          font-weight: 500;
        }

        .edit-toggle-sidebar {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 10px;
          border-radius: 10px;
          border: 1px solid var(--color-border);
          background: white;
          cursor: pointer;
          font-weight: 500;
          font-size: 14px;
          color: var(--color-text-muted);
          transition: var(--transition);
          width: 100%;
        }

        .edit-toggle-sidebar.active {
          background: #fee2e2;
          color: #dc2626;
          border-color: #fecaca;
        }

        /* Main Content */
        .main-content {
          flex: 1;
          margin-left: 260px;
          padding: 24px 32px;
          max-width: 1440px;
          transition: margin-left 0.3s ease;
          min-height: 100vh;
        }

        .main-content.shifted {
          margin-left: 260px;
        }

        .main-content.mobile-main {
          margin-left: 0;
          padding: 76px 16px 100px;
          padding-top: calc(56px + var(--safe-top) + 16px);
        }

        /* Notifications */
        .notification-container {
          position: fixed;
          top: 24px;
          right: 24px;
          z-index: 9999;
          display: flex;
          flex-direction: column;
          gap: 10px;
          pointer-events: none;
        }

        .toast {
          padding: 14px 20px;
          border-radius: 10px;
          color: white;
          font-weight: 500;
          font-size: 14px;
          box-shadow: var(--shadow-lg);
          animation: slideIn 0.3s ease-out;
          pointer-events: auto;
          max-width: 360px;
          word-wrap: break-word;
        }

        .toast.success { background: #10b981; }
        .toast.error { background: #ef4444; }
        .toast.info { background: #3b82f6; }

        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }

        /* Top Bar */
        .top-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
          gap: 16px;
          flex-wrap: wrap;
        }

        .search-box {
          display: flex;
          align-items: center;
          background: var(--color-surface);
          padding: 10px 16px;
          border-radius: 12px;
          border: 1px solid var(--color-border);
          flex: 1;
          min-width: 200px;
          max-width: 400px;
          color: var(--color-text-muted);
          transition: var(--transition);
          position: relative;
        }

        .search-box:focus-within {
          border-color: var(--color-primary);
          box-shadow: 0 0 0 3px rgba(255, 140, 66, 0.1);
        }

        .search-box input {
          border: none;
          outline: none;
          margin-left: 10px;
          width: 100%;
          background: transparent;
          font-size: 15px;
          color: var(--color-text);
        }

        .search-box input::placeholder {
          color: var(--color-text-muted);
        }

        .clear-search {
          position: absolute;
          right: 12px;
          background: none;
          border: none;
          padding: 4px;
          cursor: pointer;
          color: var(--color-text-muted);
          display: flex;
          border-radius: 50%;
        }

        .actions {
          display: flex;
          gap: 10px;
          align-items: center;
        }

        .icon-btn {
          width: 44px;
          height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: 12px;
          cursor: pointer;
          color: var(--color-text-muted);
          transition: var(--transition);
        }

        .icon-btn:active {
          transform: scale(0.95);
          background: var(--color-bg);
        }

        .edit-toggle {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 18px;
          border-radius: 12px;
          border: 1px solid var(--color-border);
          background: white;
          cursor: pointer;
          font-weight: 500;
          font-size: 14px;
          color: var(--color-text-muted);
          transition: var(--transition);
          height: 44px;
        }

        .edit-toggle.active {
          background: #fee2e2;
          color: #dc2626;
          border-color: #fecaca;
        }

        /* Stats Grid - Responsive */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
          gap: 16px;
          margin-bottom: 24px;
        }

        .stat-card {
          background: var(--color-surface);
          padding: 20px;
          border-radius: var(--radius);
          box-shadow: var(--shadow-sm);
          border: 1px solid var(--color-border);
          transition: var(--transition);
          position: relative;
          overflow: hidden;
        }

        .stat-card:hover { 
          transform: translateY(-2px); 
          box-shadow: var(--shadow-md); 
        }

        .stat-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: var(--color-primary);
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
          margin-bottom: 8px;
        }

        .stat-value { 
          font-size: 28px; 
          font-weight: 700; 
          line-height: 1;
        }

        .stat-trend {
          font-size: 12px;
          font-weight: 600;
          padding: 4px 8px;
          background: #dcfce7;
          color: #166534;
          border-radius: 20px;
        }

        .stat-label { 
          font-size: 13px; 
          color: var(--color-text-muted);
          font-weight: 500;
        }

        /* Content Card */
        .content-card {
          background: var(--color-surface);
          border-radius: var(--radius);
          box-shadow: var(--shadow-sm);
          border: 1px solid var(--color-border);
          overflow: hidden;
          margin-bottom: 24px;
        }

        .edit-banner {
          background: linear-gradient(90deg, #fef3c7, #fde68a);
          color: #92400e;
          padding: 12px 20px;
          font-size: 14px;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 10px;
          border-bottom: 1px solid #fcd34d;
          justify-content: space-between;
        }

        .exit-edit-btn {
          padding: 6px 12px;
          background: white;
          border: 1px solid #d97706;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
          color: #92400e;
          cursor: pointer;
        }

        .content-body {
          padding: 24px;
        }

        /* Activity Feed */
        .activity-feed {
          background: var(--color-surface);
          padding: 24px;
          border-radius: var(--radius);
          box-shadow: var(--shadow-sm);
          border: 1px solid var(--color-border);
        }

        .activity-feed h3 {
          margin: 0 0 16px 0;
          font-size: 14px;
          color: var(--color-text-muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          font-weight: 600;
        }

        .feed-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .activity-item {
          display: flex;
          align-items: flex-start;
          gap: 14px;
          padding: 14px;
          border-radius: 10px;
          transition: var(--transition);
          cursor: pointer;
        }

        .activity-item:hover { 
          background: #f8fafc; 
        }

        .activity-item:active {
          transform: scale(0.99);
        }

        .activity-icon {
          color: var(--color-primary);
          background: linear-gradient(135deg, #fff7ed, #ffedd5);
          padding: 10px;
          border-radius: 10px;
          display: flex;
          flex-shrink: 0;
        }

        .activity-content { 
          flex: 1;
          min-width: 0;
        }

        .activity-text { 
          font-size: 14px; 
          font-weight: 600;
          color: var(--color-text);
          margin-bottom: 2px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .activity-subtext {
          font-size: 13px;
          color: var(--color-text-muted);
          margin-bottom: 4px;
          line-height: 1.4;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .activity-time { 
          font-size: 12px; 
          color: #94a3b8;
          font-weight: 500;
        }

        /* Mobile Bottom Navigation */
        .bottom-nav {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          height: calc(64px + var(--safe-bottom));
          padding-bottom: var(--safe-bottom);
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          border-top: 1px solid var(--color-border);
          display: flex;
          justify-content: space-around;
          align-items: center;
          z-index: 100;
          padding-left: var(--safe-left);
          padding-right: var(--safe-right);
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
          padding: 8px;
          color: var(--color-text-muted);
          cursor: pointer;
          transition: var(--transition);
          position: relative;
          min-height: 48px;
        }

        .bottom-nav-item.active {
          color: var(--color-primary);
        }

        .bottom-nav-item.active::before {
          content: '';
          position: absolute;
          top: 0;
          width: 40px;
          height: 3px;
          background: var(--color-primary);
          border-radius: 0 0 3px 3px;
        }

        .bottom-nav-icon {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .bottom-nav-label {
          font-size: 11px;
          font-weight: 500;
        }

        /* Mobile Menu Overlay */
        .mobile-menu-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.5);
          z-index: 300;
          display: flex;
          align-items: flex-end;
          animation: fadeIn 0.2s ease;
        }

        .mobile-menu {
          background: white;
          width: 100%;
          border-radius: 20px 20px 0 0;
          padding: 20px;
          padding-bottom: calc(20px + var(--safe-bottom));
          animation: slideUp 0.3s ease;
          max-height: 70vh;
          overflow-y: auto;
        }

        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }

        .mobile-menu-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .mobile-menu-header h3 {
          margin: 0;
          font-size: 18px;
          font-weight: 600;
        }

        .mobile-menu-items {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .mobile-menu-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px;
          border-radius: 12px;
          border: none;
          background: transparent;
          font-size: 16px;
          font-weight: 500;
          color: var(--color-text);
          cursor: pointer;
          text-align: left;
          width: 100%;
          transition: var(--transition);
        }

        .mobile-menu-item:active {
          background: var(--color-bg);
        }

        .mobile-menu-item.active {
          color: var(--color-primary);
          background: #fff7ed;
        }

        .mobile-menu-divider {
          height: 1px;
          background: var(--color-border);
          margin: 8px 0;
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
            padding: 20px;
          }
          
          .main-content.shifted {
            margin-left: 0;
          }
        }

        @media (max-width: 639px) {
          .mobile-header {
            display: flex;
          }

          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 12px;
          }

          .stat-card {
            padding: 16px;
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
          }

          .notification-container {
            left: 16px;
            right: 16px;
            top: 80px;
          }

          .toast {
            max-width: 100%;
            width: 100%;
          }

          .content-body {
            padding: 16px;
          }
        }

        @media (min-width: 640px) and (max-width: 1023px) {
          .stats-grid {
            grid-template-columns: repeat(3, 1fr);
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

        /* Dark Mode Support */
        @media (prefers-color-scheme: dark) {
          :root {
            --color-bg: #0f172a;
            --color-surface: #1e293b;
            --color-text: #f1f5f9;
            --color-text-muted: #94a3b8;
            --color-border: #334155;
          }
        }
      `}</style>
    </div>
  );
};

export default Dashboard;