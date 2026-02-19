// src/components/Dashboard.tsx
import React, { useState, useEffect } from 'react';
import { db } from '../services/firebase';
import { collection, query, orderBy, onSnapshot, addDoc } from 'firebase/firestore';
import BuildUpdates from './BuildUpdates';
import ScreenGallery from './ScreenGallery';
import WeeklyProgress from './WeeklyProgress';
import TechnicalLog from './TechnicalLog';
import { BuildUpdate, ScreenCapture, GlazeMeSpecs } from '../types';

const Dashboard: React.FC = () => {
  const [updates, setUpdates] = useState<BuildUpdate[]>([]);
  const [screens, setScreens] = useState<ScreenCapture[]>([]);
  const [activeTab, setActiveTab] = useState<'updates' | 'screens' | 'progress' | 'tech'>('updates');

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
    ]
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

  const addBuildUpdate = async (update: Omit<BuildUpdate, 'id'>) => {
    await addDoc(collection(db, 'buildUpdates'), {
      ...update,
      date: new Date()
    });
  };

  return (
    <div style={styles.container}>
      {/* Header with GlazeMe branding */}
      <div style={styles.header}>
        <div style={{ ...styles.gradientBar, background: glazemeSpecs.colorTheme.gradient }} />
        <h1 style={styles.title}>GlazeMe Build Dashboard</h1>
        <p style={styles.subtitle}>
          {glazemeSpecs.concept} • {glazemeSpecs.platform}
        </p>
        <div style={styles.specs}>
          <span style={styles.specItem}>🎨 {glazemeSpecs.colorTheme.primary} → {glazemeSpecs.colorTheme.secondary}</span>
          <span style={styles.specItem}>🤖 AI-Powered Compliments</span>
          <span style={styles.specItem}>💬 iMessage Extension</span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div style={styles.tabs}>
        {['updates', 'screens', 'progress', 'tech'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            style={{
              ...styles.tab,
              ...(activeTab === tab ? styles.activeTab : {})
            }}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div style={styles.content}>
        {activeTab === 'updates' && (
          <BuildUpdates updates={updates} onAddUpdate={addBuildUpdate} />
        )}
        {activeTab === 'screens' && (
          <ScreenGallery screens={screens} />
        )}
        {activeTab === 'progress' && (
          <WeeklyProgress />
        )}
        {activeTab === 'tech' && (
          <TechnicalLog />
        )}
      </div>
    </div>
  );
};

// Fixed styles with proper TypeScript typing
const styles = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '20px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  },
  header: {
    marginBottom: '30px',
    padding: '20px',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  },
  gradientBar: {
    height: '8px',
    width: '100%',
    borderRadius: '4px',
    marginBottom: '20px'
  },
  title: {
    fontSize: '32px',
    margin: '0 0 10px 0',
    color: '#333'
  },
  subtitle: {
    fontSize: '16px',
    color: '#666',
    marginBottom: '15px'
  },
  specs: {
    display: 'flex',
    gap: '20px',
    flexWrap: 'wrap' as 'wrap', // Fixed: explicitly type as 'wrap'
  },
  specItem: {
    padding: '5px 10px',
    backgroundColor: '#e9ecef',
    borderRadius: '4px',
    fontSize: '14px',
    color: '#495057'
  },
  tabs: {
    display: 'flex',
    gap: '10px',
    marginBottom: '20px',
    borderBottom: '2px solid #dee2e6',
    paddingBottom: '10px'
  },
  tab: {
    padding: '8px 16px',
    border: 'none',
    backgroundColor: 'transparent',
    cursor: 'pointer',
    fontSize: '16px',
    color: '#6c757d',
    transition: 'all 0.3s'
  },
  activeTab: {
    color: '#FF8C42',
    borderBottom: '2px solid #FF8C42',
    fontWeight: 'bold' as 'bold', // Fixed: explicitly type as 'bold'
  },
  content: {
    minHeight: '500px'
  }
};

export default Dashboard;