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

// --- Icons (Lucide-style SVGs for crispness) ---
const Icons = {
  Rocket: () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"></path><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"></path><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"></path><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"></path></svg>,
  LayoutGrid: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="7" x="3" y="3" rx="1"></rect><rect width="7" height="7" x="14" y="3" rx="1"></rect><rect width="7" height="7" x="14" y="14" rx="1"></rect><rect width="7" height="7" x="3" y="14" rx="1"></rect></svg>,
  Smartphone: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="20" x="5" y="2" rx="2" ry="2"></rect><path d="M12 18h.01"></path></svg>,
  Code: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>,
  BarChart: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" x2="12" y1="20" y2="10"></line><line x1="18" x2="18" y1="20" y2="4"></line><line x1="6" x2="6" y1="20" y2="16"></line></svg>,
  Cloud: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"></path></svg>,
  Bell: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"></path><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"></path></svg>,
  Search: () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.3-4.3"></path></svg>,
  Filter: () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>,
  Check: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>,
  AlertCircle: () => <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" x2="12" y1="8" y2="12"></line><line x1="12" x2="12.01" y1="16" y2="16"></line></svg>,
  RefreshCw: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"></path><path d="M21 3v5h-5"></path><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"></path><path d="M8 16H3v5"></path></svg>,
  Menu: () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" x2="20" y1="12" y2="12"></line><line x1="4" x2="20" y1="6" y2="6"></line><line x1="4" x2="20" y1="18" y2="18"></line></svg>,
  X: () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"></path><path d="m6 6 12 12"></path></svg>,
  ChevronDown: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"></path></svg>,
  Star: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>,
  FileText: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>,
  Lock: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>,
  Unlock: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 9.9-1"></path></svg>
};

// --- Sub-Components ---

const StatCard: React.FC<{ label: string; value: string | number; color?: string }> = ({ label, value, color }) => (
  <div className="stat-card">
    <div className="stat-value" style={{ color: color || 'var(--color-primary)' }}>{value}</div>
    <div className="stat-label">{label}</div>
  </div>
);

const ActivityItem: React.FC<{ icon: React.ReactNode; time: string; text: string }> = ({ icon, time, text }) => (
  <div className="activity-item">
    <div className="activity-icon">{icon}</div>
    <div className="activity-content">
      <div className="activity-text">{text}</div>
      <div className="activity-time">{time}</div>
    </div>
  </div>
);

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
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

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

  // Effects
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

  // Memoized Stats
  const reviewStats = useMemo(() => {
    const total = reviews.length;
    const pending = reviews.filter(r => r.status === 'pending').length;
    const approved = reviews.filter(r => r.status === 'approved').length;
    const changes = reviews.filter(r => r.status === 'changes-requested').length;
    const rating = reviews.reduce((acc, r) => acc + (r.rating || 0), 0) / (reviews.length || 1);
    return { total, pending, approved, changes, rating };
  }, [reviews]);

  const filteredUpdates = useMemo(() => 
    updates.filter(u => u.title?.toLowerCase().includes(searchQuery.toLowerCase())), 
  [updates, searchQuery]);

  const filteredScreens = useMemo(() => 
    screens.filter(s => s.screenName?.toLowerCase().includes(searchQuery.toLowerCase())), 
  [screens, searchQuery]);

  // Render Content based on Tab
  const renderContent = () => {
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
      
      {/* Mobile Header */}
      <header className="mobile-header">
        <button className="icon-btn" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
          {isSidebarOpen ? <Icons.X /> : <Icons.Menu />}
        </button>
        <span className="mobile-title">GlazeMe</span>
        <div className="notification-badge-container">
          <Icons.Bell />
          {notifications.length > 0 && <span className="badge">{notifications.length}</span>}
        </div>
      </header>

      {/* Sidebar Navigation */}
      <aside className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="logo">
            <div className="logo-icon"><Icons.Rocket /></div>
            <h1>GlazeMe</h1>
          </div>
          <p className="version">v1.0.0-alpha</p>
        </div>

        <nav className="nav-menu">
          {[ 
            { id: 'updates', label: 'Updates', icon: <Icons.LayoutGrid /> },
            { id: 'reviews', label: 'Reviews', icon: <Icons.Star /> },
            { id: 'screens', label: 'Screens', icon: <Icons.Smartphone /> },
            { id: 'progress', label: 'Progress', icon: <Icons.BarChart /> },
            { id: 'tech', label: 'Tech Log', icon: <Icons.Code /> },
            { id: 'deploy', label: 'Deploy', icon: <Icons.Cloud /> },
          ].map(tab => (
            <button 
              key={tab.id} 
              className={`nav-item ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => { setActiveTab(tab.id as TabType); setIsSidebarOpen(false); }}
            >
              {tab.icon}
              <span>{tab.label}</span>
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
        </div>
      </aside>

      {/* Main Content */}
      <main className={`main-content ${isSidebarOpen ? 'shifted' : ''}`}>
        
        {/* Notifications */}
        <div className="notification-container">
          {notifications.map(n => (
            <div key={n.id} className={`notification toast ${n.type}`}>
              {n.message}
            </div>
          ))}
        </div>

        {/* Top Bar */}
        <div className="top-bar">
          <div className="search-box">
            <Icons.Search />
            <input 
              type="text" 
              placeholder="Search updates, reviews..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="actions">
            <button className="icon-btn"><Icons.Filter /></button>
            <button 
              className={`edit-toggle ${isEditMode ? 'active' : ''}`}
              onClick={toggleEditMode}
            >
              {isEditMode ? <><Icons.Unlock /> Exit Edit</> : <><Icons.Lock /> Edit Mode</>}
            </button>
          </div>
        </div>

        {/* Stats Overview (Only show on Updates tab for context) */}
        {activeTab === 'updates' && (
          <div className="stats-grid">
            <StatCard label="Total Reviews" value={reviewStats.total} />
            <StatCard label="Pending" value={reviewStats.pending} color="#f59e0b" />
            <StatCard label="Approved" value={reviewStats.approved} color="#10b981" />
            <StatCard label="Avg Rating" value={reviewStats.rating.toFixed(1)} color="#8b5cf6" />
          </div>
        )}

        {/* Dynamic Content Area */}
        <div className="content-card">
          {isEditMode && (
            <div className="edit-banner">
              <Icons.Unlock /> <span>Edit Mode Active — Be careful!</span>
            </div>
          )}
          {renderContent()}
        </div>

        {/* Live Activity Feed */}
        <div className="activity-feed">
          <h3>Live Activity</h3>
          <div className="feed-list">
            {updates.slice(0, 3).map(u => (
              <ActivityItem 
                key={u.id} 
                icon={<Icons.FileText />} 
                time={new Date(u.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} 
                text={`Build Update: ${u.title}`} 
              />
            ))}
            {reviews.slice(0, 2).map(r => (
              <ActivityItem 
                key={r.id} 
                icon={<Icons.Star />} 
                time={new Date(r.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} 
                text={`New Review: ${r.updateTitle || 'General'}`} 
              />
            ))}
          </div>
        </div>

      </main>

      {/* Global Styles */}
      <style>{`
        :root {
          --color-primary: #FF8C42;
          --color-secondary: #FFE55C;
          --color-bg: #f3f4f6;
          --color-surface: #ffffff;
          --color-text: #1f2937;
          --color-text-muted: #6b7280;
          --color-border: #e5e7eb;
          --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
          --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          --radius: 12px;
          --transition: all 0.2s ease;
        }

        * { box-sizing: border-box; }

        .dashboard-container {
          display: flex;
          min-height: 100vh;
          background-color: var(--color-bg);
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          color: var(--color-text);
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
        }
        .spinner {
          width: 40px; height: 40px;
          border: 4px solid #e5e7eb;
          border-top-color: var(--color-primary);
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* Sidebar */
        .sidebar {
          width: 260px;
          background: var(--color-surface);
          border-right: 1px solid var(--color-border);
          display: flex;
          flex-direction: column;
          position: fixed;
          height: 100vh;
          z-index: 50;
          transition: transform 0.3s ease;
        }
        .sidebar-header {
          padding: 24px;
          border-bottom: 1px solid var(--color-border);
        }
        .logo {
          display: flex;
          align-items: center;
          gap: 12px;
          color: var(--color-primary);
        }
        .logo h1 { font-size: 1.5rem; margin: 0; }
        .logo-icon {
          background: linear-gradient(135deg, var(--color-secondary), var(--color-primary));
          padding: 8px;
          border-radius: 10px;
          color: white;
          display: flex;
        }
        .version {
          font-size: 0.75rem;
          color: var(--color-text-muted);
          margin-top: 4px;
          margin-left: 44px;
        }
        
        .nav-menu {
          flex: 1;
          padding: 16px 12px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .nav-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          border-radius: 8px;
          border: none;
          background: transparent;
          color: var(--color-text-muted);
          cursor: pointer;
          font-size: 0.95rem;
          font-weight: 500;
          transition: var(--transition);
          position: relative;
        }
        .nav-item:hover { background-color: #f9fafb; color: var(--color-text); }
        .nav-item.active { 
          background-color: #fff7ed; 
          color: var(--color-primary); 
        }
        .active-indicator {
          position: absolute;
          left: 0;
          top: 50%;
          transform: translateY(-50%);
          width: 4px;
          height: 20px;
          background: var(--color-primary);
          border-radius: 0 4px 4px 0;
        }

        .sidebar-footer {
          padding: 16px;
          border-top: 1px solid var(--color-border);
        }
        .tech-stack-mini {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }
        .tech-tag {
          font-size: 0.7rem;
          background: #f3f4f6;
          padding: 4px 8px;
          border-radius: 12px;
          color: var(--color-text-muted);
        }

        /* Main Content */
        .main-content {
          flex: 1;
          margin-left: 260px;
          padding: 32px;
          max-width: 1400px;
          transition: margin-left 0.3s ease;
        }

        /* Mobile Header */
        .mobile-header {
          display: none;
          position: fixed;
          top: 0; left: 0; right: 0;
          height: 60px;
          background: var(--color-surface);
          border-bottom: 1px solid var(--color-border);
          align-items: center;
          justify-content: space-between;
          padding: 0 16px;
          z-index: 100;
        }
        .mobile-title { font-weight: 700; color: var(--color-primary); }
        .notification-badge-container { position: relative; }
        .badge {
          position: absolute;
          top: -5px; right: -5px;
          background: #ef4444;
          color: white;
          font-size: 10px;
          width: 16px; height: 16px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        /* Top Bar */
        .top-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
          gap: 16px;
        }
        .search-box {
          display: flex;
          align-items: center;
          background: var(--color-surface);
          padding: 10px 16px;
          border-radius: 24px;
          border: 1px solid var(--color-border);
          width: 100%;
          max-width: 400px;
          color: var(--color-text-muted);
        }
        .search-box input {
          border: none;
          outline: none;
          margin-left: 8px;
          width: 100%;
          background: transparent;
          font-size: 0.95rem;
        }
        .actions {
          display: flex;
          gap: 12px;
        }
        .icon-btn {
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: 50%;
          width: 40px; height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: var(--color-text-muted);
          transition: var(--transition);
        }
        .icon-btn:hover { border-color: var(--color-primary); color: var(--color-primary); }

        .edit-toggle {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          border-radius: 20px;
          border: 1px solid var(--color-border);
          background: white;
          cursor: pointer;
          font-weight: 500;
          font-size: 0.9rem;
          color: var(--color-text-muted);
          transition: var(--transition);
        }
        .edit-toggle.active {
          background: #fee2e2;
          color: #ef4444;
          border-color: #fecaca;
        }

        /* Stats Grid */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 20px;
          margin-bottom: 24px;
        }
        .stat-card {
          background: var(--color-surface);
          padding: 20px;
          border-radius: var(--radius);
          box-shadow: var(--shadow-sm);
          border: 1px solid var(--color-border);
          transition: transform 0.2s;
        }
        .stat-card:hover { transform: translateY(-2px); box-shadow: var(--shadow-md); }
        .stat-value { font-size: 1.75rem; font-weight: 700; margin-bottom: 4px; }
        .stat-label { font-size: 0.875rem; color: var(--color-text-muted); }

        /* Content Card */
        .content-card {
          background: var(--color-surface);
          border-radius: var(--radius);
          box-shadow: var(--shadow-sm);
          border: 1px solid var(--color-border);
          min-height: 500px;
          overflow: hidden;
          position: relative;
        }
        .edit-banner {
          background: #fffbeb;
          color: #92400e;
          padding: 12px 24px;
          font-size: 0.9rem;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 8px;
          border-bottom: 1px solid #fcd34d;
        }

        /* Activity Feed */
        .activity-feed {
          margin-top: 24px;
          background: var(--color-surface);
          padding: 24px;
          border-radius: var(--radius);
          box-shadow: var(--shadow-sm);
          border: 1px solid var(--color-border);
        }
        .activity-feed h3 {
          margin: 0 0 16px 0;
          font-size: 1rem;
          color: var(--color-text-muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .feed-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .activity-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          border-radius: 8px;
          transition: background 0.2s;
        }
        .activity-item:hover { background: #f9fafb; }
        .activity-icon {
          color: var(--color-primary);
          background: #fff7ed;
          padding: 8px;
          border-radius: 8px;
          display: flex;
        }
        .activity-content { flex: 1; }
        .activity-text { font-size: 0.95rem; font-weight: 500; }
        .activity-time { font-size: 0.8rem; color: var(--color-text-muted); }

        /* Notifications */
        .notification-container {
          position: fixed;
          top: 24px;
          right: 24px;
          z-index: 9999;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .toast {
          padding: 12px 24px;
          border-radius: 8px;
          color: white;
          font-weight: 500;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
          animation: slideIn 0.3s ease-out;
          min-width: 300px;
        }
        .toast.success { background: #10b981; }
        .toast.error { background: #ef4444; }
        .toast.info { background: #3b82f6; }
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }

        /* Responsive */
        @media (max-width: 768px) {
          .mobile-header { display: flex; }
          .sidebar {
            transform: translateX(-100%);
            box-shadow: 4px 0 24px rgba(0,0,0,0.1);
          }
          .sidebar.open { transform: translateX(0); }
          .main-content {
            margin-left: 0;
            padding: 80px 16px 16px;
          }
          .main-content.shifted { transform: translateX(260px); }
          .top-bar { flex-direction: column; align-items: stretch; }
          .search-box { max-width: 100%; }
          .stats-grid { grid-template-columns: repeat(2, 1fr); }
          .notification-container {
            left: 16px; right: 16px; top: 80px;
          }
          .toast { width: 100%; }
        }
      `}</style>
    </div>
  );
};

export default Dashboard;