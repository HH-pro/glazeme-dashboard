// src/components/Dashboard.tsx
import React, { useState, useEffect } from 'react';
import { db } from '../services/firebase';
import { collection, query, orderBy, onSnapshot, addDoc } from 'firebase/firestore';
import BuildUpdates from './BuildUpdates';
import ScreenGallery from './ScreenGallery';
import WeeklyProgress from './WeeklyProgress';
import TechnicalLog from './TechnicalLog';
import DeploymentTracker from './DeploymentTracker';
import PasswordModal from './PasswordModal';
import { BuildUpdate, ScreenCapture, GlazeMeSpecs } from '../types';

const Dashboard: React.FC = () => {
  const [updates, setUpdates] = useState<BuildUpdate[]>([]);
  const [screens, setScreens] = useState<ScreenCapture[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'screens' | 'updates' | 'progress'>('overview');
  const [isEditMode, setIsEditMode] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const glazemeSpecs: GlazeMeSpecs = {
    name: "GlazeMe",
    concept: "Meme-based AI compliment generator for iMessage",
    coreFeature: "AI-generated compliments with yellow-to-orange gradient",
    colorTheme: {
      primary: "#FFE55C",
      secondary: "#FF8C42",
      gradient: "linear-gradient(135deg, #FFE55C 0%, #FF8C42 100%)"
    },
    platform: "iMessage App",
    targetFeatures: [
      "AI compliment generation",
      "Meme-style formatting",
      "Quick keyboard access",
      "Compliment history",
      "Share to messages"
    ],
    technicalStack: {
      frontend: ["SwiftUI"],
      backend: ["Firebase"],
      ai: ["OpenAI GPT-4"],
      database: ["Firestore"],
      hosting: ["Apple Store"]
    }
  };

  useEffect(() => {
    // Real-time updates listener
    const updatesQuery = query(collection(db, 'buildUpdates'), orderBy('date', 'desc'));
    const unsubscribe = onSnapshot(updatesQuery, (snapshot) => {
      const updatesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date.toDate()
      })) as BuildUpdate[];
      setUpdates(updatesData);
    });

    // Screenshots listener
    const screensQuery = query(collection(db, 'screenshots'), orderBy('date', 'desc'));
    const unsubscribeScreens = onSnapshot(screensQuery, (snapshot) => {
      const screensData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date.toDate()
      })) as ScreenCapture[];
      setScreens(screensData);
    });

    return () => {
      unsubscribe();
      unsubscribeScreens();
    };
  }, []);

  const handlePasswordSuccess = () => {
    setIsEditMode(true);
    setShowPasswordModal(false);
  };

  const toggleEditMode = () => {
    if (!isEditMode) {
      setShowPasswordModal(true);
    } else {
      setIsEditMode(false);
    }
  };

  // Calculate stats
  const totalScreens = screens.length;
  const recentUpdates = updates.slice(0, 5);
  const lastUpdate = updates[0]?.date ? new Date(updates[0].date).toLocaleDateString() : 'No updates';
  const progressPercentage = Math.min(Math.round((totalScreens / 15) * 100), 100); // Assuming 15 screens target

  return (
    <div style={styles.container}>
      {/* Password Modal */}
      <PasswordModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        onSuccess={handlePasswordSuccess}
      />

      {/* Simple Header with App Name */}
      <div style={styles.header}>
        <div style={{ ...styles.gradientBar, background: glazemeSpecs.colorTheme.gradient }} />
        
        <div style={styles.headerTop}>
          <div style={styles.appInfo}>
            <h1 style={styles.appName}>✨ GlazeMe</h1>
            <span style={styles.appBadge}>iMessage App • In Development</span>
          </div>
          
          {/* Mobile Menu Button */}
          <button 
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            style={styles.mobileMenuButton}
          >
            {showMobileMenu ? '✕' : '☰'}
          </button>

          {/* Desktop Edit Button */}
          <button
            onClick={toggleEditMode}
            style={{
              ...styles.editButton,
              backgroundColor: isEditMode ? '#dc3545' : '#FF8C42',
              display: 'none'
            }}
            className="desktop-edit-button"
          >
            {isEditMode ? 'Exit Edit Mode' : 'Enable Edit Mode'}
          </button>
        </div>

        {/* Mobile Menu */}
        {showMobileMenu && (
          <div style={styles.mobileMenu}>
            <button
              onClick={() => {
                toggleEditMode();
                setShowMobileMenu(false);
              }}
              style={{
                ...styles.mobileEditButton,
                backgroundColor: isEditMode ? '#dc3545' : '#FF8C42'
              }}
            >
              {isEditMode ? '🔒 Exit Edit Mode' : '✏️ Enable Edit Mode'}
            </button>
          </div>
        )}

        {/* Edit Mode Indicator */}
        {isEditMode && (
          <div style={styles.editModeBanner}>
            <span>✏️ Edit Mode Active - You can now make changes</span>
          </div>
        )}

        {/* Simple Stats Cards */}
        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <span style={styles.statIcon}>📱</span>
            <div style={styles.statInfo}>
              <span style={styles.statValue}>{totalScreens}</span>
              <span style={styles.statLabel}>Screens Built</span>
            </div>
          </div>
          
          <div style={styles.statCard}>
            <span style={styles.statIcon}>🔄</span>
            <div style={styles.statInfo}>
              <span style={styles.statValue}>{updates.length}</span>
              <span style={styles.statLabel}>Updates</span>
            </div>
          </div>
          
          <div style={styles.statCard}>
            <span style={styles.statIcon}>📊</span>
            <div style={styles.statInfo}>
              <span style={styles.statValue}>{progressPercentage}%</span>
              <span style={styles.statLabel}>Progress</span>
            </div>
          </div>
          
          <div style={styles.statCard}>
            <span style={styles.statIcon}>⚡</span>
            <div style={styles.statInfo}>
              <span style={styles.statValue}>{lastUpdate}</span>
              <span style={styles.statLabel}>Last Update</span>
            </div>
          </div>
        </div>
      </div>

      {/* Simple Navigation */}
      <div style={styles.navigation}>
        <button
          onClick={() => setActiveTab('overview')}
          style={{
            ...styles.navButton,
            ...(activeTab === 'overview' ? styles.navButtonActive : {})
          }}
        >
          📋 Overview
        </button>
        <button
          onClick={() => setActiveTab('screens')}
          style={{
            ...styles.navButton,
            ...(activeTab === 'screens' ? styles.navButtonActive : {})
          }}
        >
          📱 Screens
        </button>
        <button
          onClick={() => setActiveTab('updates')}
          style={{
            ...styles.navButton,
            ...(activeTab === 'updates' ? styles.navButtonActive : {})
          }}
        >
          📝 Updates
        </button>
        <button
          onClick={() => setActiveTab('progress')}
          style={{
            ...styles.navButton,
            ...(activeTab === 'progress' ? styles.navButtonActive : {})
          }}
        >
          📊 Progress
        </button>
      </div>

      {/* Content Area */}
      <div style={styles.content}>
        {activeTab === 'overview' && (
          <div>
            {/* Project Overview Section */}
            <div style={styles.section}>
              <h2 style={styles.sectionTitle}>🎯 Project Overview</h2>
              <p style={styles.projectDescription}>{glazemeSpecs.concept}</p>
              
              <div style={styles.featuresList}>
                <h3 style={styles.featuresTitle}>Key Features:</h3>
                {glazemeSpecs.targetFeatures.map((feature, index) => (
                  <div key={index} style={styles.featureItem}>
                    <span style={styles.featureBullet}>•</span>
                    <span style={styles.featureText}>{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Updates Preview */}
            <div style={styles.section}>
              <div style={styles.sectionHeader}>
                <h2 style={styles.sectionTitle}>📝 Recent Updates</h2>
                <button 
                  onClick={() => setActiveTab('updates')}
                  style={styles.viewAllButton}
                >
                  View All →
                </button>
              </div>
              
              {recentUpdates.length > 0 ? (
                recentUpdates.map(update => (
                  <div key={update.id} style={styles.updateItem}>
                    <span style={styles.updateDate}>
                      {new Date(update.date).toLocaleDateString()}
                    </span>
                    <div style={styles.updateContent}>
                      <strong style={styles.updateTitle}>{update.title}</strong>
                      <p style={styles.updateDescription}>{update.description}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p style={styles.emptyText}>No updates yet</p>
              )}
            </div>

            {/* Quick Stats */}
            <div style={styles.section}>
              <h2 style={styles.sectionTitle}>⚡ Quick Stats</h2>
              <div style={styles.quickStats}>
                <div style={styles.quickStat}>
                  <span style={styles.quickStatValue}>{screens.filter(s => s.tags?.includes('completed')).length}</span>
                  <span style={styles.quickStatLabel}>Completed Screens</span>
                </div>
                <div style={styles.quickStat}>
                  <span style={styles.quickStatValue}>{screens.length}</span>
                  <span style={styles.quickStatLabel}>Total Screens</span>
                </div>
                <div style={styles.quickStat}>
                  <span style={styles.quickStatValue}>{updates.length}</span>
                  <span style={styles.quickStatLabel}>Total Updates</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'screens' && (
          <ScreenGallery 
            screens={screens} 
            isEditMode={isEditMode}
          />
        )}

        {activeTab === 'updates' && (
          <BuildUpdates 
            updates={updates} 
            onAddUpdate={async (update) => {
              if (isEditMode) {
                await addDoc(collection(db, 'buildUpdates'), {
                  ...update,
                  date: new Date()
                });
              }
            }}
            isEditMode={isEditMode}
          />
        )}

        {activeTab === 'progress' && (
          <WeeklyProgress 
            isEditMode={isEditMode}
          />
        )}
      </div>

      {/* Simple Footer */}
      <div style={styles.footer}>
        <span style={styles.footerText}>✨ GlazeMe Development Dashboard</span>
        <span style={styles.footerStatus}>● Live Updates</span>
      </div>

      {/* Add media query for desktop edit button */}
      <style>{`
        @media (min-width: 768px) {
          .desktop-edit-button {
            display: block !important;
          }
        }
      `}</style>
    </div>
  );
};

const styles = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '16px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    backgroundColor: '#f8f9fa',
    minHeight: '100vh',
    boxSizing: 'border-box' as const
  },
  header: {
    backgroundColor: 'white',
    borderRadius: '16px',
    padding: '20px',
    marginBottom: '20px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
  },
  gradientBar: {
    height: '4px',
    width: '100%',
    borderRadius: '2px',
    marginBottom: '16px'
  },
  headerTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px'
  },
  appInfo: {
    flex: 1
  },
  appName: {
    fontSize: '24px',
    margin: '0 0 4px 0',
    color: '#1a1a1a',
    fontWeight: '600'
  },
  appBadge: {
    fontSize: '13px',
    color: '#666',
    backgroundColor: '#f0f0f0',
    padding: '4px 10px',
    borderRadius: '20px',
    display: 'inline-block'
  },
  mobileMenuButton: {
    width: '40px',
    height: '40px',
    borderRadius: '8px',
    border: '1px solid #e0e0e0',
    backgroundColor: 'white',
    fontSize: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    '@media (min-width: 768px)': {
      display: 'none'
    }
  },
  mobileMenu: {
    backgroundColor: '#f8f9fa',
    borderRadius: '12px',
    padding: '16px',
    marginBottom: '16px',
    border: '1px solid #e0e0e0'
  },
  mobileEditButton: {
    width: '100%',
    padding: '14px',
    border: 'none',
    borderRadius: '10px',
    color: 'white',
    fontSize: '16px',
    fontWeight: '500',
    cursor: 'pointer'
  },
  editButton: {
    padding: '10px 20px',
    border: 'none',
    borderRadius: '30px',
    color: 'white',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s',
    whiteSpace: 'nowrap' as const
  },
  editModeBanner: {
    backgroundColor: '#fff3cd',
    color: '#856404',
    padding: '12px',
    borderRadius: '10px',
    marginBottom: '16px',
    textAlign: 'center' as const,
    fontSize: '14px',
    fontWeight: '500'
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '12px',
    '@media (min-width: 768px)': {
      gridTemplateColumns: 'repeat(4, 1fr)'
    }
  },
  statCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: '12px',
    padding: '16px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    border: '1px solid #e0e0e0'
  },
  statIcon: {
    fontSize: '24px',
    width: '40px',
    height: '40px',
    backgroundColor: 'white',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  statInfo: {
    display: 'flex',
    flexDirection: 'column' as const
  },
  statValue: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#FF8C42',
    lineHeight: 1.2
  },
  statLabel: {
    fontSize: '12px',
    color: '#666'
  },
  navigation: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '8px',
    marginBottom: '20px',
    backgroundColor: 'white',
    padding: '8px',
    borderRadius: '14px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
  },
  navButton: {
    padding: '12px 4px',
    border: 'none',
    backgroundColor: 'transparent',
    borderRadius: '10px',
    fontSize: '13px',
    fontWeight: '500',
    color: '#666',
    cursor: 'pointer',
    transition: 'all 0.2s',
    whiteSpace: 'nowrap' as const,
    '@media (min-width: 768px)': {
      fontSize: '14px',
      padding: '12px'
    }
  },
  navButtonActive: {
    backgroundColor: '#FF8C42',
    color: 'white'
  },
  content: {
    backgroundColor: 'white',
    borderRadius: '16px',
    padding: '20px',
    marginBottom: '20px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
    minHeight: '400px'
  },
  section: {
    marginBottom: '32px',
    '&:last-child': {
      marginBottom: 0
    }
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px'
  },
  sectionTitle: {
    fontSize: '18px',
    margin: '0 0 16px 0',
    color: '#333',
    fontWeight: '600'
  },
  viewAllButton: {
    padding: '6px 12px',
    border: '1px solid #FF8C42',
    backgroundColor: 'transparent',
    color: '#FF8C42',
    borderRadius: '20px',
    fontSize: '12px',
    cursor: 'pointer'
  },
  projectDescription: {
    fontSize: '15px',
    color: '#666',
    lineHeight: 1.5,
    marginBottom: '20px'
  },
  featuresList: {
    backgroundColor: '#f8f9fa',
    borderRadius: '12px',
    padding: '16px'
  },
  featuresTitle: {
    fontSize: '15px',
    margin: '0 0 12px 0',
    color: '#333',
    fontWeight: '500'
  },
  featureItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '8px',
    '&:last-child': {
      marginBottom: 0
    }
  },
  featureBullet: {
    color: '#FF8C42',
    fontSize: '16px'
  },
  featureText: {
    fontSize: '14px',
    color: '#555'
  },
  updateItem: {
    display: 'flex',
    gap: '12px',
    padding: '12px 0',
    borderBottom: '1px solid #eee',
    '&:last-child': {
      borderBottom: 'none'
    }
  },
  updateDate: {
    minWidth: '70px',
    fontSize: '12px',
    color: '#999'
  },
  updateContent: {
    flex: 1
  },
  updateTitle: {
    fontSize: '14px',
    color: '#333',
    display: 'block',
    marginBottom: '2px'
  },
  updateDescription: {
    fontSize: '13px',
    color: '#666',
    margin: '4px 0 0 0',
    lineHeight: 1.4
  },
  emptyText: {
    textAlign: 'center' as const,
    color: '#999',
    fontSize: '14px',
    padding: '20px'
  },
  quickStats: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '12px'
  },
  quickStat: {
    textAlign: 'center' as const,
    padding: '16px',
    backgroundColor: '#f8f9fa',
    borderRadius: '12px'
  },
  quickStatValue: {
    display: 'block',
    fontSize: '24px',
    fontWeight: '600',
    color: '#FF8C42',
    marginBottom: '4px'
  },
  quickStatLabel: {
    fontSize: '12px',
    color: '#666'
  },
  footer: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '16px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
  },
  footerText: {
    fontSize: '13px',
    color: '#666'
  },
  footerStatus: {
    fontSize: '12px',
    color: '#28a745',
    display: 'flex',
    alignItems: 'center',
    gap: '4px'
  }
};

export default Dashboard;