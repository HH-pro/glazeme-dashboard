// src/components/Dashboard.tsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../services/firebase';
import { collection, query, orderBy, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import BuildUpdates from './BuildUpdates';
import ScreenGallery from './ScreenGallery';
import WeeklyProgress from './WeeklyProgress';
import TechnicalLog from './TechnicalLog';
import CodeMetrics from './CodeMetrics';
import AIDashboard from './AIDashboard';
import DeploymentTracker from './DeploymentTracker';
import AdminPanel from './AdminPanel';
import { BuildUpdate, ScreenCapture, GlazeMeSpecs, CodeCommit, AIPromptMetric } from '../types';

const Dashboard: React.FC = () => {
  const { isAdmin, logout } = useAuth();
  const [updates, setUpdates] = useState<BuildUpdate[]>([]);
  const [screens, setScreens] = useState<ScreenCapture[]>([]);
  const [commits, setCommits] = useState<CodeCommit[]>([]);
  const [aiMetrics, setAiMetrics] = useState<AIPromptMetric[]>([]);
  const [activeTab, setActiveTab] = useState<'updates' | 'screens' | 'progress' | 'tech' | 'code' | 'ai' | 'deploy' | 'admin'>('updates');
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
      backend: ["Node.js", "Express", "Firebase Functions"],
      ai: ["OpenAI GPT-4", "Prompt Engineering", "Response Caching"],
      database: ["Firebase Firestore", "Redis Cache"],
      hosting: ["Firebase Hosting", "Vercel", "AWS Lambda"]
    }
  };

  useEffect(() => {
    // Real-time updates listener (read-only for both admin and client)
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
      setBuildStats(prev => ({ ...prev, screensCompleted: screensData.length }));
    });

    // Commits listener
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

    // AI Metrics listener
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

  const addBuildUpdate = async (update: Omit<BuildUpdate, 'id'>) => {
    if (!isAdmin) return; // Only admin can add
    await addDoc(collection(db, 'buildUpdates'), {
      ...update,
      date: new Date()
    });
  };

  const updateBuildUpdate = async (id: string, update: Partial<BuildUpdate>) => {
    if (!isAdmin) return;
    await updateDoc(doc(db, 'buildUpdates', id), update);
  };

  const deleteBuildUpdate = async (id: string) => {
    if (!isAdmin) return;
    await deleteDoc(doc(db, 'buildUpdates', id));
  };

  return (
    <div style={styles.container}>
      {/* Header with user role indicator */}
      <div style={styles.header}>
        <div style={{ ...styles.gradientBar, background: glazemeSpecs.colorTheme.gradient }} />
        <div style={styles.headerContent}>
          <div>
            <h1 style={styles.title}>🚀 GlazeMe Development Dashboard</h1>
            <p style={styles.subtitle}>
              {glazemeSpecs.concept} • {glazemeSpecs.platform}
            </p>
          </div>
          <div style={styles.userSection}>
            <span style={{
              ...styles.roleBadge,
              backgroundColor: isAdmin ? '#d4edda' : '#cce5ff',
              color: isAdmin ? '#155724' : '#004085'
            }}>
              {isAdmin ? '👑 Admin Access' : '👀 Client View'}
            </span>
            <button onClick={logout} style={styles.logoutButton}>
              Logout
            </button>
          </div>
        </div>

        {/* Build Stats Cards - visible to both */}
        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <span style={styles.statValue}>{buildStats.totalCommits}</span>
            <span style={styles.statLabel}>Total Commits</span>
          </div>
          <div style={styles.statCard}>
            <span style={styles.statValue}>+{buildStats.totalAdditions}</span>
            <span style={styles.statLabel}>Lines Added</span>
          </div>
          <div style={styles.statCard}>
            <span style={styles.statValue}>{buildStats.aiCalls}</span>
            <span style={styles.statLabel}>AI Calls</span>
          </div>
          <div style={styles.statCard}>
            <span style={styles.statValue}>{buildStats.avgResponseTime}ms</span>
            <span style={styles.statLabel}>Avg AI Response</span>
          </div>
          <div style={styles.statCard}>
            <span style={styles.statValue}>{buildStats.screensCompleted}</span>
            <span style={styles.statLabel}>Screens Built</span>
          </div>
        </div>

        {/* Tech Stack Tags */}
        <div style={styles.specs}>
          <span style={styles.specItem}>🎨 {glazemeSpecs.colorTheme.primary} → {glazemeSpecs.colorTheme.secondary}</span>
          <span style={styles.specItem}>🤖 {glazemeSpecs.technicalStack.ai[0]}</span>
          <span style={styles.specItem}>📱 {glazemeSpecs.technicalStack.frontend[0]}</span>
          <span style={styles.specItem}>⚙️ {glazemeSpecs.technicalStack.backend[0]}</span>
          <span style={styles.specItem}>💾 {glazemeSpecs.technicalStack.database[0]}</span>
        </div>
      </div>

      {/* Navigation Tabs - Admin sees all, Client sees limited */}
      <div style={styles.tabs}>
        {[
          { id: 'updates', label: '📋 Build Updates', icon: '📋', public: true },
          { id: 'screens', label: '📱 Screen Gallery', icon: '📱', public: true },
          { id: 'progress', label: '📊 Progress Tracker', icon: '📊', public: true },
          { id: 'tech', label: '⚙️ Technical Log', icon: '⚙️', public: true },
          { id: 'code', label: '💻 Code Metrics', icon: '💻', public: true },
          { id: 'ai', label: '🤖 AI Dashboard', icon: '🤖', public: true },
          { id: 'deploy', label: '🚀 Deployment', icon: '🚀', public: true },
          ...(isAdmin ? [{ id: 'admin', label: '⚡ Admin Panel', icon: '⚡', public: false }] : [])
        ].filter(tab => tab.public || isAdmin).map(tab => (
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

      {/* Content Area with role-based rendering */}
      <div style={styles.content}>
        {activeTab === 'updates' && (
          <BuildUpdates 
            updates={updates} 
            onAddUpdate={addBuildUpdate}
            onUpdateUpdate={updateBuildUpdate}
            onDeleteUpdate={deleteBuildUpdate}
            isAdmin={isAdmin}
          />
        )}
        {activeTab === 'screens' && (
          <ScreenGallery screens={screens} isAdmin={isAdmin} />
        )}
        {activeTab === 'progress' && (
          <WeeklyProgress isAdmin={isAdmin} />
        )}
        {activeTab === 'tech' && (
          <TechnicalLog isAdmin={isAdmin} />
        )}
        {activeTab === 'code' && (
          <CodeMetrics commits={commits} isAdmin={isAdmin} />
        )}
        {activeTab === 'ai' && (
          <AIDashboard metrics={aiMetrics} isAdmin={isAdmin} />
        )}
        {activeTab === 'deploy' && (
          <DeploymentTracker isAdmin={isAdmin} />
        )}
        {activeTab === 'admin' && isAdmin && (
          <AdminPanel />
        )}
      </div>

      {/* Live Development Feed - visible to both */}
      <div style={styles.footer}>
        <div style={styles.feedHeader}>
          <span>📡 Live Development Feed</span>
          <span style={styles.feedStatus}>● Connected</span>
        </div>
        <div style={styles.feedContent}>
          {updates.slice(0, 3).map(update => (
            <div key={update.id} style={styles.feedItem}>
              <span style={styles.feedTime}>
                {new Date(update.date).toLocaleTimeString()}
              </span>
              <span style={styles.feedText}>
                <strong>{update.title}</strong> - {update.description}
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
    padding: '20px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    backgroundColor: '#f5f7fa'
  },
  header: {
    marginBottom: '30px',
    padding: '25px',
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
  },
  headerContent: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px'
  },
  gradientBar: {
    height: '6px',
    width: '100%',
    borderRadius: '3px',
    marginBottom: '20px'
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
  userSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px'
  },
  roleBadge: {
    padding: '6px 12px',
    borderRadius: '20px',
    fontSize: '13px',
    fontWeight: '500'
  },
  logoutButton: {
    padding: '6px 12px',
    backgroundColor: '#f8f9fa',
    border: '1px solid #dee2e6',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '13px',
    color: '#495057'
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
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '15px',
    marginBottom: '20px'
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
    gap: '10px',
    flexWrap: 'wrap' as 'wrap',
    marginTop: '15px'
  },
  specItem: {
    padding: '4px 10px',
    backgroundColor: '#f8f9fa',
    borderRadius: '15px',
    fontSize: '12px',
    color: '#495057',
    border: '1px solid #dee2e6'
  },
  tabs: {
    display: 'flex',
    gap: '5px',
    marginBottom: '20px',
    flexWrap: 'wrap' as 'wrap',
    backgroundColor: 'white',
    padding: '10px',
    borderRadius: '10px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
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
    minHeight: '600px',
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '25px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
    marginBottom: '20px'
  },
  footer: {
    backgroundColor: 'white',
    borderRadius: '10px',
    padding: '15px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
  },
  feedHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px',
    fontSize: '14px',
    fontWeight: '600',
    color: '#333'
  },
  feedStatus: {
    color: '#28a745',
    fontSize: '12px'
  },
  feedContent: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px'
  },
  feedItem: {
    display: 'flex',
    gap: '15px',
    fontSize: '13px',
    padding: '8px',
    backgroundColor: '#f8f9fa',
    borderRadius: '6px'
  },
  feedTime: {
    color: '#6c757d',
    minWidth: '60px'
  },
  feedText: {
    color: '#333'
  }
};

export default Dashboard;