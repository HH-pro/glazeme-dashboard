// src/components/Dashboard.tsx
import React, { useState, useEffect } from 'react';
import { db } from '../services/firebase';
import { collection, query, orderBy, onSnapshot, addDoc, where, getDocs } from 'firebase/firestore';
import BuildUpdates from './BuildUpdates';
import ScreenGallery from './ScreenGallery';
import WeeklyProgress from './WeeklyProgress';
import TechnicalLog from './TechnicalLog';
import DeploymentTracker from './DeploymentTracker';
import PasswordModal from './PasswordModal';
import { BuildUpdate, ScreenCapture, GlazeMeSpecs, CodeCommit, AIPromptMetric } from '../types';

const Dashboard: React.FC = () => {
  const [updates, setUpdates] = useState<BuildUpdate[]>([]);
  const [screens, setScreens] = useState<ScreenCapture[]>([]);
  const [commits, setCommits] = useState<CodeCommit[]>([]);
  const [aiMetrics, setAiMetrics] = useState<AIPromptMetric[]>([]);
  const [activeTab, setActiveTab] = useState<'updates' | 'screens' | 'progress' | 'tech' | 'code' | 'ai' | 'deploy'>('updates');
  const [isEditMode, setIsEditMode] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<{ type: string; data?: any } | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [buildStats, setBuildStats] = useState({
    totalCommits: 0,
    totalAdditions: 0,
    totalDeletions: 0,
    aiCalls: 0,
    avgResponseTime: 0,
    screensCompleted: 0
  });

  const glazemeSpecs: GlazeMeSpecs = {
    name: "GlazeMe",
    concept: "Meme-based AI compliment generator for iMessage",
    coreFeature: "AI-generated over-the-top compliments with yellow-to-orange gradient theme",
    colorTheme: {
      primary: "#FFE55C",
      secondary: "#FF8C42",
      gradient: "linear-gradient(135deg, #FFE55C 0%, #FF8C42 100%)"
    },
    platform: "iOS iMessage Extension",
    targetFeatures: [
      "AI compliment generation",
      "Meme-style formatting",
      "Quick keyboard access",
      "Compliment history",
      "Share to messages"
    ],
    technicalStack: {
      frontend: ["SwiftUI", "iMessage Extension", "UIKit"],
      backend: ["Firebase"],
      ai: ["OpenAI GPT-4", "Prompt Engineering", "Response Caching"],
      database: ["Firebase Firestore", "Redis Cache"],
      hosting: ["Apple Store"]
    }
  };

  useEffect(() => {
    // Real-time updates listener (read-only for all users)
    const updatesQuery = query(collection(db, 'buildUpdates'), orderBy('date', 'desc'));
    const unsubscribe = onSnapshot(updatesQuery, (snapshot) => {
      const updatesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date.toDate()
      })) as BuildUpdate[];
      setUpdates(updatesData);
    });

    // Screenshots listener (read-only for all users)
    const screensQuery = query(collection(db, 'screenshots'), orderBy('date', 'desc'));
    const unsubscribeScreens = onSnapshot(screensQuery, (snapshot) => {
      const screensData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date.toDate()
      })) as ScreenCapture[];
      setScreens(screensData);
      setBuildStats(prev => ({ ...prev, screensCompleted: screensData.length }));
    });

    // Commits listener (read-only for all users)
    const commitsQuery = query(collection(db, 'commits'), orderBy('timestamp', 'desc'));
    const unsubscribeCommits = onSnapshot(commitsQuery, (snapshot) => {
      const commitsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp.toDate()
      })) as CodeCommit[];
      setCommits(commitsData);
      
      const totalAdds = commitsData.reduce((acc, c) => acc + c.additions, 0);
      const totalDels = commitsData.reduce((acc, c) => acc + c.deletions, 0);
      setBuildStats(prev => ({ 
        ...prev, 
        totalCommits: commitsData.length,
        totalAdditions: totalAdds,
        totalDeletions: totalDels
      }));
    });

    // AI Metrics listener (read-only for all users)
    const aiQuery = query(collection(db, 'aiMetrics'), orderBy('timestamp', 'desc'));
    const unsubscribeAI = onSnapshot(aiQuery, (snapshot) => {
      const aiData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp.toDate()
      })) as AIPromptMetric[];
      setAiMetrics(aiData);
      
      const avgTime = aiData.reduce((acc, m) => acc + m.responseTime, 0) / aiData.length || 0;
      setBuildStats(prev => ({ 
        ...prev, 
        aiCalls: aiData.length,
        avgResponseTime: Math.round(avgTime * 100) / 100
      }));
    });

    return () => {
      unsubscribe();
      unsubscribeScreens();
      unsubscribeCommits();
      unsubscribeAI();
    };
  }, []);

  const handleEditAction = (actionType: string, actionData?: any) => {
    setPendingAction({ type: actionType, data: actionData });
    setShowPasswordModal(true);
  };

  const handlePasswordSuccess = () => {
    setIsEditMode(true);
    setShowPasswordModal(false);
    
    // Execute pending action if any
    if (pendingAction) {
      switch (pendingAction.type) {
        case 'addUpdate':
          addBuildUpdate(pendingAction.data);
          break;
        case 'addScreen':
          addScreenCapture(pendingAction.data);
          break;
        case 'addCommit':
          addCodeCommit(pendingAction.data);
          break;
        case 'addAIMetric':
          addAIMetric(pendingAction.data);
          break;
        default:
          break;
      }
      setPendingAction(null);
    }
  };

  const addBuildUpdate = async (update: Omit<BuildUpdate, 'id'>) => {
    if (!isEditMode) {
      handleEditAction('addUpdate', update);
      return;
    }
    await addDoc(collection(db, 'buildUpdates'), {
      ...update,
      date: new Date()
    });
  };

  const addScreenCapture = async (screen: Omit<ScreenCapture, 'id'>) => {
    if (!isEditMode) {
      handleEditAction('addScreen', screen);
      return;
    }
    await addDoc(collection(db, 'screenshots'), {
      ...screen,
      date: new Date()
    });
  };

  const addCodeCommit = async (commit: Omit<CodeCommit, 'id'>) => {
    if (!isEditMode) {
      handleEditAction('addCommit', commit);
      return;
    }
    await addDoc(collection(db, 'commits'), {
      ...commit,
      timestamp: new Date()
    });
  };

  const addAIMetric = async (metric: Omit<AIPromptMetric, 'id'>) => {
    if (!isEditMode) {
      handleEditAction('addAIMetric', metric);
      return;
    }
    await addDoc(collection(db, 'aiMetrics'), {
      ...metric,
      timestamp: new Date()
    });
  };

  const toggleEditMode = () => {
    if (!isEditMode) {
      setShowPasswordModal(true);
    } else {
      setIsEditMode(false);
    }
  };

  const tabs = [
    { id: 'updates', label: '📋 Build', icon: '📋', fullLabel: 'Build Updates' },
    { id: 'screens', label: '📱 Screens', icon: '📱', fullLabel: 'Screen Gallery' },
    { id: 'progress', label: '📊 Progress', icon: '📊', fullLabel: 'Progress Tracker' },
    { id: 'tech', label: '⚙️ Tech', icon: '⚙️', fullLabel: 'Technical Log' },
    { id: 'deploy', label: '🚀 Deploy', icon: '🚀', fullLabel: 'Deployment' }
  ];

  return (
    <div style={styles.container}>
      {/* Password Modal */}
      <PasswordModal
        isOpen={showPasswordModal}
        onClose={() => {
          setShowPasswordModal(false);
          setPendingAction(null);
        }}
        onSuccess={handlePasswordSuccess}
      />

      {/* Header with build stats */}
      <div style={styles.header}>
        <div style={{ ...styles.gradientBar, background: glazemeSpecs.colorTheme.gradient }} />
        
        {/* Mobile Header */}
        <div style={styles.mobileHeader}>
          <div style={styles.mobileTitleSection}>
            <h1 style={styles.mobileTitle}>🚀 GlazeMe</h1>
            <p style={styles.mobileSubtitle}>{glazemeSpecs.platform}</p>
          </div>
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            style={styles.mobileMenuButton}
          >
            {isMobileMenuOpen ? '✕' : '☰'}
          </button>
        </div>

        {/* Desktop Header */}
        <div style={styles.desktopHeader}>
          <div>
            <h1 style={styles.title}>🚀 GlazeMe Development Dashboard</h1>
            <p style={styles.subtitle}>
              {glazemeSpecs.concept} • {glazemeSpecs.platform}
            </p>
          </div>
          <div style={styles.buildBadge}>
            <span style={styles.buildVersion}>Build v1.0.0-alpha</span>
            <span style={styles.buildStatus}>🟢 Active</span>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {isMobileMenuOpen && (
          <div style={styles.mobileMenu}>
            <div style={styles.mobileMenuItem}>
              <span style={styles.mobileMenuLabel}>Build Version:</span>
              <span style={styles.mobileMenuValue}>v1.0.0-alpha</span>
            </div>
            <div style={styles.mobileMenuItem}>
              <span style={styles.mobileMenuLabel}>Status:</span>
              <span style={{...styles.mobileMenuValue, color: '#28a745'}}>🟢 Active Development</span>
            </div>
            <button
              onClick={() => {
                toggleEditMode();
                setIsMobileMenuOpen(false);
              }}
              style={{
                ...styles.mobileEditButton,
                backgroundColor: isEditMode ? '#dc3545' : '#28a745'
              }}
            >
              {isEditMode ? '🔒 Exit Edit Mode' : '✏️ Enable Edit'}
            </button>
          </div>
        )}

        {/* Desktop Edit Button */}
        <div style={styles.desktopEditButton}>
          <button
            onClick={toggleEditMode}
            style={{
              ...styles.editButton,
              backgroundColor: isEditMode ? '#dc3545' : '#28a745'
            }}
          >
            {isEditMode ? '🔒 Exit Edit Mode' : '✏️ Enable Edit'}
          </button>
        </div>

        {/* Edit Mode Indicator */}
        {isEditMode && (
          <div style={styles.editModeBanner}>
            <span>✏️ Edit Mode Active - Changes will be saved</span>
          </div>
        )}

        {/* Mobile Stats Grid */}
        <div style={styles.mobileStatsGrid}>
          <div style={styles.mobileStatCard}>
            <span style={styles.mobileStatValue}>{screens.length}</span>
            <span style={styles.mobileStatLabel}>Screens</span>
          </div>
          <div style={styles.mobileStatCard}>
            <span style={styles.mobileStatValue}>{buildStats.totalCommits}</span>
            <span style={styles.mobileStatLabel}>Commits</span>
          </div>
          <div style={styles.mobileStatCard}>
            <span style={styles.mobileStatValue}>{buildStats.aiCalls}</span>
            <span style={styles.mobileStatLabel}>AI Calls</span>
          </div>
          <div style={styles.mobileStatCard}>
            <span style={styles.mobileStatValue}>{buildStats.avgResponseTime}ms</span>
            <span style={styles.mobileStatLabel}>Response</span>
          </div>
        </div>

        {/* Desktop Stats Grid */}
        <div style={styles.desktopStatsGrid}>
          <div style={styles.statCard}>
            <span style={styles.statValue}>{screens.length}</span>
            <span style={styles.statLabel}>Screens Built</span>
          </div>
          <div style={styles.statCard}>
            <span style={styles.statValue}>{buildStats.totalCommits}</span>
            <span style={styles.statLabel}>Total Commits</span>
          </div>
          <div style={styles.statCard}>
            <span style={styles.statValue}>+{buildStats.totalAdditions}/-{buildStats.totalDeletions}</span>
            <span style={styles.statLabel}>Code Changes</span>
          </div>
          <div style={styles.statCard}>
            <span style={styles.statValue}>{buildStats.aiCalls}</span>
            <span style={styles.statLabel}>AI Calls</span>
          </div>
          <div style={styles.statCard}>
            <span style={styles.statValue}>{buildStats.avgResponseTime}ms</span>
            <span style={styles.statLabel}>Avg Response</span>
          </div>
        </div>

        {/* Tech Stack Tags */}
        <div style={styles.specs}>
          <span style={styles.specItem}>🎨 {glazemeSpecs.colorTheme.primary}</span>
          <span style={styles.specItem}>🤖 {glazemeSpecs.technicalStack.ai[0]}</span>
          <span style={styles.specItem}>📱 {glazemeSpecs.technicalStack.frontend[0]}</span>
          <span style={styles.specItem}>⚙️ {glazemeSpecs.technicalStack.backend[0]}</span>
        </div>
      </div>

      {/* Mobile Tab Selector */}
      <div style={styles.mobileTabSelector}>
        <select
          value={activeTab}
          onChange={(e) => setActiveTab(e.target.value as any)}
          style={styles.mobileSelect}
        >
          {tabs.map(tab => (
            <option key={tab.id} value={tab.id}>
              {tab.icon} {tab.fullLabel}
            </option>
          ))}
        </select>
      </div>

      {/* Desktop Navigation Tabs */}
      <div style={styles.desktopTabs}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            style={{
              ...styles.tab,
              ...(activeTab === tab.id ? styles.activeTab : {})
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div style={styles.content}>
        {activeTab === 'updates' && (
          <BuildUpdates 
            updates={updates} 
            onAddUpdate={addBuildUpdate}
            isEditMode={isEditMode}
            onEditAction={() => handleEditAction('addUpdate')}
          />
        )}
        {activeTab === 'screens' && (
          <ScreenGallery 
            screens={screens} 
            isEditMode={isEditMode}
            onAddScreen={() => handleEditAction('addScreen')}
          />
        )}
        {activeTab === 'progress' && (
          <WeeklyProgress 
            isEditMode={isEditMode}
            onEditAction={() => handleEditAction('editProgress')}
          />
        )}
        {activeTab === 'tech' && (
          <TechnicalLog 
            isEditMode={isEditMode}
            onEditAction={() => handleEditAction('editTech')}
          />
        )}
        {activeTab === 'deploy' && (
          <DeploymentTracker 
            isEditMode={isEditMode}
            onEditAction={() => handleEditAction('editDeploy')}
          />
        )}
      </div>

      {/* Live Development Feed */}
      <div style={styles.footer}>
        <div style={styles.feedHeader}>
          <span style={styles.feedTitle}>📡 Live Feed</span>
          <span style={styles.feedStatus}>● Connected</span>
        </div>
        <div style={styles.feedContent}>
          {updates.slice(0, 3).map(update => (
            <div key={update.id} style={styles.feedItem}>
              <span style={styles.feedTime}>
                {new Date(update.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
              <span style={styles.feedText}>
                <strong>{update.title}</strong>
               <span className="feedDescription"> - {update.description}</span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    maxWidth: '1400px',
    margin: '0 auto',
    padding: 'clamp(10px, 3vw, 20px)',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    backgroundColor: '#f5f7fa',
    minHeight: '100vh',
    boxSizing: 'border-box' as const
  },
  header: {
    marginBottom: 'clamp(15px, 4vw, 30px)',
    padding: 'clamp(15px, 4vw, 25px)',
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
  },
  gradientBar: {
    height: '6px',
    width: '100%',
    borderRadius: '3px',
    marginBottom: 'clamp(10px, 3vw, 20px)'
  },
  mobileHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '15px',
    '@media (min-width: 768px)': {
      display: 'none'
    }
  },
  mobileTitleSection: {
    flex: 1
  },
  mobileTitle: {
    fontSize: '20px',
    margin: '0 0 4px 0',
    color: '#1a1a1a',
    fontWeight: '600'
  },
  mobileSubtitle: {
    fontSize: '12px',
    color: '#666',
    margin: 0
  },
  mobileMenuButton: {
    width: '40px',
    height: '40px',
    borderRadius: '8px',
    border: '1px solid #dee2e6',
    backgroundColor: 'white',
    fontSize: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer'
  },
  desktopHeader: {
    display: 'none',
    '@media (min-width: 768px)': {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '20px'
    }
  },
  title: {
    fontSize: '28px',
    margin: '0 0 5px 0',
    color: '#1a1a1a',
    fontWeight: '600'
  },
  subtitle: {
    fontSize: '14px',
    color: '#666',
    margin: 0
  },
  buildBadge: {
    display: 'flex',
    gap: '10px',
    alignItems: 'center'
  },
  buildVersion: {
    padding: '6px 12px',
    backgroundColor: '#e9ecef',
    borderRadius: '20px',
    fontSize: '13px',
    color: '#495057'
  },
  buildStatus: {
    padding: '6px 12px',
    backgroundColor: '#d4edda',
    borderRadius: '20px',
    fontSize: '13px',
    color: '#155724'
  },
  desktopEditButton: {
    display: 'none',
    '@media (min-width: 768px)': {
      display: 'block',
      marginBottom: '20px'
    }
  },
  editButton: {
    padding: '8px 16px',
    border: 'none',
    borderRadius: '20px',
    fontSize: '14px',
    color: 'white',
    cursor: 'pointer',
    transition: 'all 0.2s',
    fontWeight: '500'
  },
  mobileMenu: {
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    padding: '15px',
    marginBottom: '15px',
    border: '1px solid #dee2e6',
    '@media (min-width: 768px)': {
      display: 'none'
    }
  },
  mobileMenuItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 0',
    borderBottom: '1px solid #dee2e6',
    '&:last-child': {
      borderBottom: 'none'
    }
  },
  mobileMenuLabel: {
    fontSize: '14px',
    color: '#666'
  },
  mobileMenuValue: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#333'
  },
  mobileEditButton: {
    width: '100%',
    padding: '12px',
    border: 'none',
    borderRadius: '8px',
    color: 'white',
    fontSize: '16px',
    fontWeight: '500',
    marginTop: '10px',
    cursor: 'pointer'
  },
  editModeBanner: {
    backgroundColor: '#fff3cd',
    color: '#856404',
    padding: 'clamp(8px, 2vw, 10px)',
    borderRadius: '8px',
    marginBottom: 'clamp(10px, 3vw, 20px)',
    textAlign: 'center' as const,
    fontWeight: '500',
    fontSize: 'clamp(12px, 3vw, 14px)'
  },
  mobileStatsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '8px',
    marginBottom: '20px',
    '@media (min-width: 768px)': {
      display: 'none'
    }
  },
  mobileStatCard: {
    padding: '10px 5px',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    textAlign: 'center' as const,
    border: '1px solid #e9ecef'
  },
  mobileStatValue: {
    display: 'block',
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#FF8C42',
    marginBottom: '2px'
  },
  mobileStatLabel: {
    fontSize: '10px',
    color: '#6c757d'
  },
  desktopStatsGrid: {
    display: 'none',
    '@media (min-width: 768px)': {
      display: 'grid',
      gridTemplateColumns: 'repeat(5, 1fr)',
      gap: '15px',
      marginBottom: '20px'
    }
  },
  statCard: {
    padding: '15px',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    textAlign: 'center' as const,
    border: '1px solid #e9ecef'
  },
  statValue: {
    display: 'block',
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#FF8C42',
    marginBottom: '5px'
  },
  statLabel: {
    fontSize: '12px',
    color: '#6c757d',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px'
  },
  specs: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap' as const,
    marginTop: '10px'
  },
  specItem: {
    padding: '4px 8px',
    backgroundColor: '#f8f9fa',
    borderRadius: '15px',
    fontSize: 'clamp(10px, 2.5vw, 12px)',
    color: '#495057',
    border: '1px solid #dee2e6',
    whiteSpace: 'nowrap' as const
  },
  mobileTabSelector: {
    marginBottom: '15px',
    '@media (min-width: 768px)': {
      display: 'none'
    }
  },
  mobileSelect: {
    width: '100%',
    padding: '12px',
    borderRadius: '8px',
    border: '1px solid #dee2e6',
    backgroundColor: 'white',
    fontSize: '16px',
    color: '#333',
    appearance: 'none' as const,
    backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2216%22%20height%3D%2216%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22%23333%22%3E%3Cpath%20d%3D%22M7%2010l5%205%205-5z%22%2F%3E%3C%2Fsvg%3E")',
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 12px center',
    backgroundSize: '16px'
  },
  desktopTabs: {
    display: 'none',
    '@media (min-width: 768px)': {
      display: 'flex',
      gap: '5px',
      marginBottom: '20px',
      flexWrap: 'wrap' as const,
      backgroundColor: 'white',
      padding: '10px',
      borderRadius: '10px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
    }
  },
  tab: {
    padding: '10px 16px',
    border: 'none',
    backgroundColor: 'transparent',
    cursor: 'pointer',
    fontSize: '14px',
    color: '#6c757d',
    borderRadius: '6px',
    transition: 'all 0.2s',
    fontWeight: '500'
  },
  activeTab: {
    color: '#FF8C42',
    backgroundColor: '#fff4e5',
    fontWeight: '600'
  },
  content: {
    minHeight: 'clamp(400px, 60vh, 600px)',
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: 'clamp(15px, 4vw, 25px)',
    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
    marginBottom: '20px'
  },
  footer: {
    backgroundColor: 'white',
    borderRadius: '10px',
    padding: 'clamp(12px, 3vw, 15px)',
    boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
  },
  feedHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px',
    fontSize: 'clamp(13px, 3vw, 14px)',
    fontWeight: '600',
    color: '#333'
  },
  feedTitle: {
    fontSize: 'clamp(13px, 3vw, 14px)'
  },
  feedStatus: {
    color: '#28a745',
    fontSize: 'clamp(11px, 2.5vw, 12px)'
  },
  feedContent: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px'
  },
  feedItem: {
    display: 'flex',
    gap: '10px',
    fontSize: 'clamp(12px, 2.5vw, 13px)',
    padding: '8px',
    backgroundColor: '#f8f9fa',
    borderRadius: '6px',
    flexWrap: 'wrap' as const
  },
  feedTime: {
    color: '#6c757d',
    minWidth: '50px',
    fontSize: 'clamp(11px, 2.5vw, 12px)'
  },
  feedText: {
    color: '#333',
    flex: 1
  },
  feedDescription: {
    '@media (max-width: 480px)': {
      display: 'none'
    }
  }
};

export default Dashboard;