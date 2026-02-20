// src/components/Dashboard.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { db } from '../services/firebase';
import { collection, query, orderBy, onSnapshot, addDoc, limit } from 'firebase/firestore';
import BuildUpdates from './BuildUpdates';
import ScreenGallery from './ScreenGallery';
import WeeklyProgress from './WeeklyProgress';
import TechnicalLog from './TechnicalLog';
import DeploymentTracker from './DeploymentTracker';
import PasswordModal from './PasswordModal';
import { BuildUpdate, ScreenCapture, GlazeMeSpecs, CodeCommit, AIPromptMetric } from '../types';

// Import icons correctly for React
import { 
  FaRocket, 
  FaMobile, 
  FaCode, 
  FaBrain, 
  FaChartLine,
  FaCloud, 
  FaShield, 
  FaBell, 
  FaSearch,
  FaFilter, 
  FaClock,
  FaCheckCircle, 
  FaExclamationTriangle,
  FaRedo, 
  FaBars, 
  FaTimes,
  FaChevronDown
} from 'react-icons/fa';

import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  Area, AreaChart, ComposedChart
} from 'recharts';

const Dashboard: React.FC = () => {
  const [updates, setUpdates] = useState<BuildUpdate[]>([]);
  const [screens, setScreens] = useState<ScreenCapture[]>([]);
  const [commits, setCommits] = useState<CodeCommit[]>([]);
  const [aiMetrics, setAiMetrics] = useState<AIPromptMetric[]>([]);
  const [activeTab, setActiveTab] = useState<'updates' | 'screens' | 'progress' | 'tech' | 'code' | 'ai' | 'deploy'>('updates');
  const [isEditMode, setIsEditMode] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<{ type: string; data?: any } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState<Array<{ id: string; message: string; type: string }>>([]);
  const [buildStats, setBuildStats] = useState({
    totalCommits: 0,
    totalAdditions: 0,
    totalDeletions: 0,
    aiCalls: 0,
    avgResponseTime: 0,
    screensCompleted: 0,
    activeBuilds: 3,
    testCoverage: 78,
    performanceScore: 92,
    securityScore: 85
  });

  const [chartData, setChartData] = useState({
    commitsOverTime: [] as Array<{ date: string; commits: number }>,
    aiPerformance: [] as Array<{ time: string; responseTime: number; success: number }>,
    screenProgress: [] as Array<{ name: string; value: number }>
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
    const setupListeners = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Real-time updates listener
        const updatesQuery = query(collection(db, 'buildUpdates'), orderBy('date', 'desc'), limit(50));
        const unsubscribeUpdates = onSnapshot(updatesQuery, 
          (snapshot) => {
            const updatesData = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data(),
              date: doc.data().date.toDate()
            })) as BuildUpdate[];
            setUpdates(updatesData);
          },
          () => {
            setError('Failed to load updates');
          }
        );

        // Screenshots listener
        const screensQuery = query(collection(db, 'screenshots'), orderBy('date', 'desc'), limit(50));
        const unsubscribeScreens = onSnapshot(screensQuery,
          (snapshot) => {
            const screensData = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data(),
              date: doc.data().date.toDate()
            })) as ScreenCapture[];
            setScreens(screensData);
            setBuildStats(prev => ({ ...prev, screensCompleted: screensData.length }));
            
            // Update screen progress chart
            const progressData = [
              { name: 'Completed', value: screensData.length },
              { name: 'In Progress', value: Math.floor(screensData.length * 0.3) },
              { name: 'Planned', value: Math.max(0, 20 - screensData.length) }
            ];
            setChartData(prev => ({ ...prev, screenProgress: progressData }));
          },
          () => {
            // Error handled silently
          }
        );

        // Commits listener
        const commitsQuery = query(collection(db, 'commits'), orderBy('timestamp', 'desc'), limit(100));
        const unsubscribeCommits = onSnapshot(commitsQuery,
          (snapshot) => {
            const commitsData = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data(),
              timestamp: doc.data().timestamp.toDate()
            })) as CodeCommit[];
            setCommits(commitsData);
            
            const totalAdds = commitsData.reduce((acc, c) => acc + (c.additions || 0), 0);
            const totalDels = commitsData.reduce((acc, c) => acc + (c.deletions || 0), 0);
            setBuildStats(prev => ({ 
              ...prev, 
              totalCommits: commitsData.length,
              totalAdditions: totalAdds,
              totalDeletions: totalDels
            }));

            // Update commits over time chart
            const last7Days = Array.from({ length: 7 }, (_, i) => {
              const date = new Date();
              date.setDate(date.getDate() - i);
              return date.toISOString().split('T')[0];
            }).reverse();

            const commitsByDay = last7Days.map(date => ({
              date,
              commits: commitsData.filter(c => 
                c.timestamp.toISOString().split('T')[0] === date
              ).length
            }));

            setChartData(prev => ({ ...prev, commitsOverTime: commitsByDay }));
          },
          () => {
            // Error handled silently
          }
        );

        // AI Metrics listener
        const aiQuery = query(collection(db, 'aiMetrics'), orderBy('timestamp', 'desc'), limit(100));
        const unsubscribeAI = onSnapshot(aiQuery,
          (snapshot) => {
            const aiData = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data(),
              timestamp: doc.data().timestamp.toDate()
            })) as AIPromptMetric[];
            setAiMetrics(aiData);
            
            const avgTime = aiData.reduce((acc, m) => acc + (m.responseTime || 0), 0) / aiData.length || 0;
            setBuildStats(prev => ({ 
              ...prev, 
              aiCalls: aiData.length,
              avgResponseTime: Math.round(avgTime * 100) / 100
            }));

            // Update AI performance chart
            const last10Calls = aiData.slice(0, 10).reverse().map((m, i) => ({
              time: `${i + 1}`,
              responseTime: m.responseTime || 0,
              success: m.success ? 1 : 0
            }));

            setChartData(prev => ({ ...prev, aiPerformance: last10Calls }));
          },
          () => {
            // Error handled silently
          }
        );

        setIsLoading(false);

        // Add welcome notification
        addNotification('Welcome to GlazeMe Dashboard', 'success');

        return () => {
          unsubscribeUpdates();
          unsubscribeScreens();
          unsubscribeCommits();
          unsubscribeAI();
        };
      } catch {
        setError('Failed to initialize dashboard');
        setIsLoading(false);
      }
    };

    setupListeners();
  }, []);

  const addNotification = useCallback((message: string, type: string = 'info') => {
    const id = Date.now().toString();
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  }, []);

  const handleEditAction = useCallback((actionType: string, actionData?: any) => {
    setPendingAction({ type: actionType, data: actionData });
    setShowPasswordModal(true);
  }, []);

  const handlePasswordSuccess = useCallback(() => {
    setIsEditMode(true);
    setShowPasswordModal(false);
    addNotification('Edit mode enabled', 'success');
    
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
  }, [pendingAction, addNotification]);

  const addBuildUpdate = useCallback(async (update: Omit<BuildUpdate, 'id'>) => {
    if (!isEditMode) {
      handleEditAction('addUpdate', update);
      return;
    }
    try {
      await addDoc(collection(db, 'buildUpdates'), {
        ...update,
        date: new Date()
      });
      addNotification('Build update added successfully', 'success');
    } catch {
      addNotification('Failed to add build update', 'error');
    }
  }, [isEditMode, handleEditAction, addNotification]);

  const addScreenCapture = useCallback(async (screen: Omit<ScreenCapture, 'id'>) => {
    if (!isEditMode) {
      handleEditAction('addScreen', screen);
      return;
    }
    try {
      await addDoc(collection(db, 'screenshots'), {
        ...screen,
        date: new Date()
      });
      addNotification('Screen capture added successfully', 'success');
    } catch {
      addNotification('Failed to add screen capture', 'error');
    }
  }, [isEditMode, handleEditAction, addNotification]);

  const addCodeCommit = useCallback(async (commit: Omit<CodeCommit, 'id'>) => {
    if (!isEditMode) {
      handleEditAction('addCommit', commit);
      return;
    }
    try {
      await addDoc(collection(db, 'commits'), {
        ...commit,
        timestamp: new Date()
      });
      addNotification('Commit added successfully', 'success');
    } catch {
      addNotification('Failed to add commit', 'error');
    }
  }, [isEditMode, handleEditAction, addNotification]);

  const addAIMetric = useCallback(async (metric: Omit<AIPromptMetric, 'id'>) => {
    if (!isEditMode) {
      handleEditAction('addAIMetric', metric);
      return;
    }
    try {
      await addDoc(collection(db, 'aiMetrics'), {
        ...metric,
        timestamp: new Date()
      });
      addNotification('AI metric added successfully', 'success');
    } catch {
      addNotification('Failed to add AI metric', 'error');
    }
  }, [isEditMode, handleEditAction, addNotification]);

  const toggleEditMode = useCallback(() => {
    if (!isEditMode) {
      setShowPasswordModal(true);
    } else {
      setIsEditMode(false);
      addNotification('Edit mode disabled', 'info');
    }
  }, [isEditMode, addNotification]);

  const filteredUpdates = useMemo(() => {
    return updates.filter(update => 
      (update.title?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (update.description?.toLowerCase() || '').includes(searchQuery.toLowerCase())
    );
  }, [updates, searchQuery]);

  const filteredScreens = useMemo(() => {
    return screens.filter(screen =>
      (screen.title?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (screen.description?.toLowerCase() || '').includes(searchQuery.toLowerCase())
    );
  }, [screens, searchQuery]);

  if (isLoading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loadingSpinner} />
        <p style={styles.loadingText}>Loading dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.errorContainer}>
        <FaExclamationTriangle size={48} color="#dc3545" />
        <h2 style={styles.errorTitle}>Oops! Something went wrong</h2>
        <p style={styles.errorMessage}>{error}</p>
        <button 
          style={styles.retryButton}
          onClick={() => window.location.reload()}
        >
          <FaRedo /> Retry
        </button>
      </div>
    );
  }

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

      {/* Mobile Header */}
      <div style={styles.mobileHeader}>
        <button 
          style={styles.menuButton}
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        >
          {isSidebarOpen ? <FaTimes /> : <FaBars />}
        </button>
        <h1 style={styles.mobileTitle}>GlazeMe</h1>
        <div style={styles.mobileNotifications}>
          <FaBell />
          {notifications.length > 0 && (
            <span style={styles.notificationBadge}>{notifications.length}</span>
          )}
        </div>
      </div>

      {/* Notifications */}
      <div style={styles.notificationContainer}>
        {notifications.map(notification => (
          <div 
            key={notification.id}
            style={{
              ...styles.notification,
              ...(notification.type === 'success' ? styles.notificationSuccess : {}),
              ...(notification.type === 'error' ? styles.notificationError : {}),
              ...(notification.type === 'info' ? styles.notificationInfo : {})
            }}
          >
            {notification.message}
          </div>
        ))}
      </div>

      {/* Sidebar Overlay */}
      {isSidebarOpen && (
        <div style={styles.sidebarOverlay} onClick={() => setIsSidebarOpen(false)} />
      )}

      {/* Main Content */}
      <div style={{
        ...styles.mainContent,
        ...(isSidebarOpen ? styles.mainContentShifted : {})
      }}>
        {/* Header */}
        <div style={styles.header}>
          <div style={{ ...styles.gradientBar, background: glazemeSpecs.colorTheme.gradient }} />
          
          <div style={styles.headerTop}>
            <div style={styles.headerLeft}>
              <div style={styles.iconWrapper}>
                <FaRocket size={24} color="#FF8C42" />
              </div>
              <div>
                <h1 style={styles.title}>GlazeMe Development Dashboard</h1>
                <p style={styles.subtitle}>
                  {glazemeSpecs.concept} • {glazemeSpecs.platform}
                </p>
              </div>
            </div>
            
            <div style={styles.headerActions}>
              <div style={styles.searchContainer}>
                <FaSearch style={styles.searchIcon} />
                <input
                  type="text"
                  placeholder="Search updates, screens..."
                  style={styles.searchInput}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <button style={styles.filterButton}>
                <FaFilter />
              </button>
              
              <div style={styles.buildBadge}>
                <span style={styles.buildVersion}>v1.0.0-alpha</span>
                <span style={styles.buildStatus}>🟢 Active</span>
                <button
                  onClick={toggleEditMode}
                  style={{
                    ...styles.editButton,
                    backgroundColor: isEditMode ? '#dc3545' : '#28a745'
                  }}
                >
                  {isEditMode ? '🔒 Exit Edit' : '✏️ Edit'}
                </button>
              </div>
            </div>
          </div>

          {/* Edit Mode Banner */}
          {isEditMode && (
            <div style={styles.editModeBanner}>
              <FaCheckCircle />
              <span>Edit Mode Active - Changes will be saved</span>
            </div>
          )}

          {/* Stats Grid */}
          <div style={styles.statsGrid}>
            <div style={styles.statCard}>
              <FaCode style={styles.statIcon} color="#FF8C42" />
              <span style={styles.statValue}>{buildStats.totalCommits}</span>
              <span style={styles.statLabel}>Commits</span>
              <small style={styles.statTrend}>+12%</small>
            </div>
            <div style={styles.statCard}>
              <FaBrain style={styles.statIcon} color="#28a745" />
              <span style={styles.statValue}>{buildStats.aiCalls}</span>
              <span style={styles.statLabel}>AI Calls</span>
              <small style={styles.statTrend}>+8%</small>
            </div>
            <div style={styles.statCard}>
              <FaMobile style={styles.statIcon} color="#007bff" />
              <span style={styles.statValue}>{buildStats.screensCompleted}</span>
              <span style={styles.statLabel}>Screens</span>
              <small style={styles.statTrend}>+3</small>
            </div>
            <div style={styles.statCard}>
              <FaChartLine style={styles.statIcon} color="#ffc107" />
              <span style={styles.statValue}>{buildStats.performanceScore}%</span>
              <span style={styles.statLabel}>Performance</span>
              <small style={styles.statTrend}>+5%</small>
            </div>
            <div style={styles.statCard}>
              <FaCloud style={styles.statIcon} color="#17a2b8" />
              <span style={styles.statValue}>{buildStats.securityScore}%</span>
              <span style={styles.statLabel}>Security</span>
              <small style={styles.statTrend}>+2%</small>
            </div>
            <div style={styles.statCard}>
              <FaClock style={styles.statIcon} color="#6c757d" />
              <span style={styles.statValue}>{buildStats.avgResponseTime}ms</span>
              <span style={styles.statLabel}>Response</span>
              <small style={styles.statTrend}>-15ms</small>
            </div>
          </div>

          {/* Charts Grid */}
          <div style={styles.chartsGrid}>
            <div style={styles.chartCard}>
              <h3 style={styles.chartTitle}>Commits Over Time</h3>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={chartData.commitsOverTime}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Area type="monotone" dataKey="commits" stroke="#FF8C42" fill="#FFE55C" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div style={styles.chartCard}>
              <h3 style={styles.chartTitle}>AI Performance</h3>
              <ResponsiveContainer width="100%" height={200}>
                <ComposedChart data={chartData.aiPerformance}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="right" dataKey="success" fill="#28a745" />
                  <Line yAxisId="left" type="monotone" dataKey="responseTime" stroke="#FF8C42" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            <div style={styles.chartCard}>
              <h3 style={styles.chartTitle}>Screen Progress</h3>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={chartData.screenProgress}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    fill="#8884d8"
                    paddingAngle={5}
                    dataKey="value"
                    label
                  >
                    {chartData.screenProgress.map((_entry, index) => (
                      <Cell key={`cell-${index}`} fill={['#FF8C42', '#FFE55C', '#FFB347'][index % 3]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Tech Stack */}
          <div style={styles.specs}>
            <span style={styles.specItem}>🎨 {glazemeSpecs.colorTheme.primary} → {glazemeSpecs.colorTheme.secondary}</span>
            {glazemeSpecs.technicalStack.ai.map((tech, i) => (
              <span key={i} style={styles.specItem}>🤖 {tech}</span>
            ))}
            {glazemeSpecs.technicalStack.frontend.map((tech, i) => (
              <span key={i} style={styles.specItem}>📱 {tech}</span>
            ))}
            {glazemeSpecs.technicalStack.backend.map((tech, i) => (
              <span key={i} style={styles.specItem}>⚙️ {tech}</span>
            ))}
          </div>
        </div>

        {/* Navigation Tabs */}
        <div style={styles.tabs}>
          {[
            { id: 'updates', label: 'Updates', icon: <FaRocket /> },
            { id: 'screens', label: 'Screens', icon: <FaMobile /> },
            { id: 'progress', label: 'Progress', icon: <FaChartLine /> },
            { id: 'tech', label: 'Tech', icon: <FaCode /> },
            { id: 'deploy', label: 'Deploy', icon: <FaCloud /> }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                ...styles.tab,
                ...(activeTab === tab.id ? styles.activeTab : {})
              }}
            >
              <span style={styles.tabIcon}>{tab.icon}</span>
              <span style={styles.tabLabel}>{tab.label}</span>
              {activeTab === tab.id && <span style={styles.tabIndicator} />}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div style={styles.content}>
          {activeTab === 'updates' && (
            <BuildUpdates 
              updates={filteredUpdates} 
              onAddUpdate={addBuildUpdate}
              isEditMode={isEditMode}
              onEditAction={() => handleEditAction('addUpdate')}
            />
          )}
          {activeTab === 'screens' && (
            <ScreenGallery 
              screens={filteredScreens} 
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

        {/* Live Feed */}
        <div style={styles.footer}>
          <div style={styles.feedHeader}>
            <div style={styles.feedHeaderLeft}>
              <FaBell />
              <span style={styles.feedTitle}>Live Development Feed</span>
            </div>
            <div style={styles.feedStatus}>
              <span style={styles.statusDot} />
              <span>Connected</span>
            </div>
          </div>
          <div style={styles.feedContent}>
            {updates.slice(0, 5).map(update => (
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
          <button style={styles.feedViewAll}>
            View All Updates <FaChevronDown />
          </button>
        </div>
      </div>
    </div>
  );
};

// Styles object with proper typing
const styles: { [key: string]: React.CSSProperties } = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f8f9fa',
    position: 'relative',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    overflowX: 'hidden'
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    backgroundColor: '#f8f9fa'
  },
  loadingSpinner: {
    width: '50px',
    height: '50px',
    border: '3px solid #f3f3f3',
    borderTop: '3px solid #FF8C42',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  },
  loadingText: {
    marginTop: '20px',
    color: '#6c757d',
    fontSize: '16px'
  },
  errorContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    backgroundColor: '#f8f9fa',
    padding: '20px',
    textAlign: 'center'
  },
  errorTitle: {
    marginTop: '20px',
    color: '#343a40',
    fontSize: '24px'
  },
  errorMessage: {
    marginTop: '10px',
    color: '#6c757d',
    fontSize: '16px'
  },
  retryButton: {
    marginTop: '20px',
    padding: '10px 20px',
    backgroundColor: '#FF8C42',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    transition: 'all 0.2s'
  },
  mobileHeader: {
    display: 'none',
    '@media (max-width: 768px)': {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '15px 20px',
      backgroundColor: 'white',
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
      position: 'sticky',
      top: 0,
      zIndex: 1000
    }
  } as React.CSSProperties,
  menuButton: {
    background: 'none',
    border: 'none',
    fontSize: '24px',
    cursor: 'pointer',
    color: '#333',
    padding: '5px'
  },
  mobileTitle: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#FF8C42',
    margin: 0
  },
  mobileNotifications: {
    position: 'relative',
    fontSize: '20px',
    color: '#666'
  },
  notificationBadge: {
    position: 'absolute',
    top: '-8px',
    right: '-8px',
    backgroundColor: '#dc3545',
    color: 'white',
    fontSize: '12px',
    padding: '2px 6px',
    borderRadius: '10px',
    minWidth: '18px',
    textAlign: 'center'
  },
  notificationContainer: {
    position: 'fixed',
    top: '20px',
    right: '20px',
    zIndex: 9999,
    display: 'flex',
    flexDirection: 'column',
    gap: '10px'
  },
  notification: {
    padding: '12px 20px',
    borderRadius: '8px',
    color: 'white',
    fontSize: '14px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    animation: 'slideIn 0.3s ease',
    maxWidth: '300px'
  },
  notificationSuccess: {
    backgroundColor: '#28a745'
  },
  notificationError: {
    backgroundColor: '#dc3545'
  },
  notificationInfo: {
    backgroundColor: '#17a2b8'
  },
  sidebarOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 1001
  },
  mainContent: {
    maxWidth: '1600px',
    margin: '0 auto',
    padding: '20px',
    transition: 'all 0.3s ease'
  },
  mainContentShifted: {
    '@media (max-width: 768px)': {
      transform: 'translateX(250px)',
      overflow: 'hidden'
    }
  } as React.CSSProperties,
  header: {
    marginBottom: '30px',
    padding: '25px',
    backgroundColor: 'white',
    borderRadius: '16px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
  },
  gradientBar: {
    height: '6px',
    width: '100%',
    borderRadius: '3px',
    marginBottom: '20px'
  },
  headerTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    flexWrap: 'wrap',
    gap: '15px'
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px'
  },
  iconWrapper: {
    width: '48px',
    height: '48px',
    backgroundColor: '#fff4e5',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  title: {
    fontSize: 'clamp(20px, 3vw, 28px)',
    margin: '0 0 5px 0',
    color: '#1a1a1a',
    fontWeight: '600'
  },
  subtitle: {
    fontSize: '14px',
    color: '#666',
    margin: 0
  },
  headerActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    flexWrap: 'wrap'
  },
  searchContainer: {
    position: 'relative'
  },
  searchIcon: {
    position: 'absolute',
    left: '12px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: '#999',
    fontSize: '14px'
  },
  searchInput: {
    padding: '10px 15px 10px 40px',
    border: '1px solid #e0e0e0',
    borderRadius: '30px',
    fontSize: '14px',
    width: '250px',
    transition: 'all 0.2s',
    outline: 'none'
  },
  filterButton: {
    padding: '10px 15px',
    border: '1px solid #e0e0e0',
    backgroundColor: 'white',
    borderRadius: '30px',
    cursor: 'pointer',
    color: '#666',
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    transition: 'all 0.2s'
  },
  buildBadge: {
    display: 'flex',
    gap: '10px',
    alignItems: 'center',
    flexWrap: 'wrap'
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
  editButton: {
    padding: '6px 12px',
    border: 'none',
    borderRadius: '20px',
    fontSize: '13px',
    color: 'white',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  editModeBanner: {
    backgroundColor: '#fff3cd',
    color: '#856404',
    padding: '12px',
    borderRadius: '8px',
    marginBottom: '20px',
    textAlign: 'center',
    fontWeight: '500',
    fontSize: '14px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px'
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
    gap: '15px',
    marginBottom: '25px'
  },
  statCard: {
    padding: '20px 15px',
    backgroundColor: '#f8f9fa',
    borderRadius: '12px',
    textAlign: 'center',
    border: '1px solid #e9ecef',
    transition: 'all 0.2s',
    cursor: 'pointer',
    position: 'relative'
  },
  statIcon: {
    fontSize: '24px',
    marginBottom: '10px'
  },
  statValue: {
    display: 'block',
    fontSize: 'clamp(20px, 4vw, 28px)',
    fontWeight: 'bold',
    color: '#FF8C42',
    marginBottom: '5px'
  },
  statLabel: {
    fontSize: '12px',
    color: '#6c757d',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  statTrend: {
    position: 'absolute',
    top: '8px',
    right: '8px',
    fontSize: '11px',
    padding: '2px 6px',
    backgroundColor: '#d4edda',
    color: '#155724',
    borderRadius: '10px'
  },
  chartsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '20px',
    marginBottom: '25px'
  },
  chartCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: '12px',
    padding: '15px',
    border: '1px solid #e9ecef'
  },
  chartTitle: {
    fontSize: '14px',
    margin: '0 0 15px 0',
    color: '#495057'
  },
  specs: {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap',
    marginTop: '15px'
  },
  specItem: {
    padding: '6px 12px',
    backgroundColor: '#f8f9fa',
    borderRadius: '20px',
    fontSize: '12px',
    color: '#495057',
    border: '1px solid #dee2e6',
    transition: 'all 0.2s'
  },
  tabs: {
    display: 'flex',
    gap: '5px',
    marginBottom: '25px',
    flexWrap: 'wrap',
    backgroundColor: 'white',
    padding: '10px',
    borderRadius: '12px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
    position: 'sticky',
    top: '10px',
    zIndex: 100
  },
  tab: {
    padding: '12px 20px',
    border: 'none',
    backgroundColor: 'transparent',
    cursor: 'pointer',
    fontSize: '14px',
    color: '#6c757d',
    borderRadius: '8px',
    transition: 'all 0.2s',
    fontWeight: '500',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    position: 'relative'
  },
  activeTab: {
    color: '#FF8C42',
    backgroundColor: '#fff4e5',
    fontWeight: '600'
  },
  tabIcon: {
    fontSize: '16px',
    display: 'flex',
    alignItems: 'center'
  },
  tabLabel: {
    whiteSpace: 'nowrap' as const
  },
  tabIndicator: {
    position: 'absolute',
    bottom: '-5px',
    left: '50%',
    transform: 'translateX(-50%)',
    width: '20px',
    height: '2px',
    backgroundColor: '#FF8C42',
    borderRadius: '2px'
  },
  content: {
    minHeight: '600px',
    backgroundColor: 'white',
    borderRadius: '16px',
    padding: '25px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
    marginBottom: '25px'
  },
  footer: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
  },
  feedHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '15px',
    fontSize: '14px',
    fontWeight: '600',
    color: '#333'
  },
  feedHeaderLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  feedTitle: {
    fontSize: '16px'
  },
  feedStatus: {
    color: '#28a745',
    fontSize: '13px',
    display: 'flex',
    alignItems: 'center',
    gap: '5px'
  },
  statusDot: {
    width: '8px',
    height: '8px',
    backgroundColor: '#28a745',
    borderRadius: '50%',
    animation: 'pulse 2s infinite'
  },
  feedContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    marginBottom: '15px'
  },
  feedItem: {
    display: 'flex',
    gap: '15px',
    fontSize: '13px',
    padding: '10px',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    alignItems: 'center',
    flexWrap: 'wrap',
    transition: 'all 0.2s'
  },
  feedTime: {
    color: '#6c757d',
    minWidth: '70px',
    fontSize: '12px'
  },
  feedText: {
    color: '#333',
    flex: 1
  },
  feedBadge: {
    padding: '3px 8px',
    borderRadius: '12px',
    fontSize: '11px',
    fontWeight: '600',
    textTransform: 'uppercase'
  },
  badgeFeature: {
    backgroundColor: '#cce5ff',
    color: '#004085'
  },
  badgeBugfix: {
    backgroundColor: '#f8d7da',
    color: '#721c24'
  },
  badgeDeployment: {
    backgroundColor: '#d4edda',
    color: '#155724'
  },
  feedViewAll: {
    width: '100%',
    padding: '10px',
    backgroundColor: '#f8f9fa',
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
    color: '#666',
    fontSize: '13px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '5px',
    transition: 'all 0.2s'
  }
};

export default Dashboard;