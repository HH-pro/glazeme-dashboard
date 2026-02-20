// src/components/Dashboard.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { db } from '../services/firebase';
import { collection, query, orderBy, onSnapshot, addDoc, limit, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import BuildUpdates from './BuildUpdates';
import ScreenGallery from './ScreenGallery';
import WeeklyProgress from './WeeklyProgress';
import TechnicalLog from './TechnicalLog';
import DeploymentTracker from './DeploymentTracker';
import PasswordModal from './PasswordModal';
import { BuildUpdate, ScreenCapture, GlazeMeSpecs, CodeCommit } from '../types';

// Use simple emoji/icons instead of react-icons to avoid compatibility issues
const Icons = {
  Rocket: () => <span style={{ fontSize: '24px' }}>🚀</span>,
  Mobile: () => <span style={{ fontSize: '24px' }}>📱</span>,
  Code: () => <span style={{ fontSize: '24px' }}>💻</span>,
  Chart: () => <span style={{ fontSize: '24px' }}>📊</span>,
  Cloud: () => <span style={{ fontSize: '24px' }}>☁️</span>,
  Bell: () => <span style={{ fontSize: '20px' }}>🔔</span>,
  Search: () => <span style={{ fontSize: '16px' }}>🔍</span>,
  Filter: () => <span style={{ fontSize: '16px' }}>⚙️</span>,
  Check: () => <span>✓</span>,
  Warning: () => <span style={{ fontSize: '48px' }}>⚠️</span>,
  Redo: () => <span>↻</span>,
  Menu: () => <span>☰</span>,
  Close: () => <span>✕</span>,
  ChevronDown: () => <span>▼</span>
};

// Define types for the component
interface Notification {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

const Dashboard: React.FC = () => {
  const [updates, setUpdates] = useState<BuildUpdate[]>([]);
  const [screens, setScreens] = useState<ScreenCapture[]>([]);
  const [commits, setCommits] = useState<CodeCommit[]>([]);
  const [activeTab, setActiveTab] = useState<'updates' | 'screens' | 'progress' | 'tech' | 'deploy'>('updates');
  const [isEditMode, setIsEditMode] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<{ type: string; data?: any } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

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

  // Fetch data from Firebase
  useEffect(() => {
    setIsLoading(true);
    setError(null);

    // 🔹 Updates listener
    const updatesQuery = query(
      collection(db, 'buildUpdates'),
      orderBy('date', 'desc'),
      limit(50)
    );

    const unsubscribeUpdates = onSnapshot(
      updatesQuery,
      (snapshot) => {
        const updatesData: BuildUpdate[] = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            weekNumber: data.weekNumber ?? 0,
            title: data.title ?? "",
            description: data.description ?? "",
            category: data.category ?? "development",
            status: data.status ?? "planned",
            priority: data.priority ?? "medium",
            timeSpent: data.timeSpent ?? 0,
            date: data.date?.toDate?.() ?? new Date(),
            commitHash: data.commitHash || '',
            branch: data.branch || '',
            completedBy: data.completedBy || '',
            author: data.author || ''
          };
        });
        setUpdates(updatesData);
        setIsLoading(false);
      },
      (error) => {
        console.error("Updates fetch error:", error);
        setError("Failed to load updates");
        setIsLoading(false);
      }
    );

    // 🔹 Screenshots listener - Fixed type casting
    const screensQuery = query(
      collection(db, 'screenshots'),
      orderBy('date', 'desc'),
      limit(50)
    );

    const unsubscribeScreens = onSnapshot(
      screensQuery,
      (snapshot) => {
        const screensData: ScreenCapture[] = snapshot.docs.map((doc) => {
          const data = doc.data();
          // Create a properly typed ScreenCapture object with all required fields
          return {
            id: doc.id,
            screenName: data.screenName || '',
            description: data.description || '',
            imageUrl: data.imageUrl || '',
            date: data.date?.toDate?.() ?? new Date(),
            tags: data.tags || [],
            // Add missing required fields with default values
            cloudinaryId: data.cloudinaryId || '',
            buildVersion: data.buildVersion || '1.0.0',
            componentName: data.componentName || '',
            filePath: data.filePath || ''
          } as ScreenCapture;
        });
        setScreens(screensData);
      },
      (error) => {
        console.error("Screenshots fetch error:", error);
      }
    );

    // 🔹 Commits listener - Fixed type casting
    const commitsQuery = query(
      collection(db, 'commits'),
      orderBy('timestamp', 'desc'),
      limit(100)
    );

    const unsubscribeCommits = onSnapshot(
      commitsQuery,
      (snapshot) => {
        const commitsData: CodeCommit[] = snapshot.docs.map((doc) => {
          const data = doc.data();
          // Create a properly typed CodeCommit object with all required fields
          return {
            id: doc.id,
            message: data.message || '',
            author: data.author || '',
            timestamp: data.timestamp?.toDate?.() ?? new Date(),
            hash: data.hash || '',
            branch: data.branch || '',
            // Add missing required fields with default values
            files: data.files || [],
            additions: data.additions || 0,
            deletions: data.deletions || 0
          } as CodeCommit;
        });
        setCommits(commitsData);
      },
      (error) => {
        console.error("Commits fetch error:", error);
      }
    );

    addNotification('Welcome to GlazeMe Dashboard', 'success');

    // ✅ Proper cleanup
    return () => {
      unsubscribeUpdates();
      unsubscribeScreens();
      unsubscribeCommits();
    };
  }, []);

  const addNotification = useCallback((message: string, type: Notification['type'] = 'info') => {
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
          // Will be handled by the component's own form
          break;
        case 'addScreen':
          addScreenCapture(pendingAction.data);
          break;
        case 'addCommit':
          addCodeCommit(pendingAction.data);
          break;
        default:
          break;
      }
      setPendingAction(null);
    }
  }, [pendingAction, addNotification]);

  // Build Update CRUD Operations
  const handleAddUpdate = useCallback(async (update: Omit<BuildUpdate, 'id'>) => {
    if (!isEditMode) {
      handleEditAction('addUpdate', update);
      return;
    }
    try {
      const updateWithTimestamp = {
        ...update,
        date: new Date(),
        category: update.category || 'development',
        status: update.status || 'planned',
        priority: update.priority || 'medium'
      };
      
      await addDoc(collection(db, 'buildUpdates'), updateWithTimestamp);
      addNotification('Build update added successfully', 'success');
    } catch (error) {
      console.error('Error adding update:', error);
      addNotification('Failed to add build update', 'error');
    }
  }, [isEditMode, handleEditAction, addNotification]);

  const handleEditUpdate = useCallback(async (id: string, updatedUpdate: Omit<BuildUpdate, 'id'>) => {
    if (!isEditMode) {
      handleEditAction('editUpdate', { id, ...updatedUpdate });
      return;
    }
    try {
      const updateRef = doc(db, 'buildUpdates', id);
      const updateWithTimestamp = {
        ...updatedUpdate,
        date: updatedUpdate.date || new Date()
      };
      
      await updateDoc(updateRef, updateWithTimestamp);
      addNotification('Build update updated successfully', 'success');
    } catch (error) {
      console.error('Error updating update:', error);
      addNotification('Failed to update build update', 'error');
    }
  }, [isEditMode, handleEditAction, addNotification]);

  const handleDeleteUpdate = useCallback(async (id: string) => {
    if (!isEditMode) {
      handleEditAction('deleteUpdate', id);
      return;
    }
    
    if (window.confirm('Are you sure you want to delete this update?')) {
      try {
        const updateRef = doc(db, 'buildUpdates', id);
        await deleteDoc(updateRef);
        addNotification('Build update deleted successfully', 'success');
      } catch (error) {
        console.error('Error deleting update:', error);
        addNotification('Failed to delete build update', 'error');
      }
    }
  }, [isEditMode, handleEditAction, addNotification]);

  const addScreenCapture = useCallback(async (screen: Omit<ScreenCapture, 'id'>) => {
    if (!isEditMode) {
      handleEditAction('addScreen', screen);
      return;
    }
    try {
      const screenWithDefaults = {
        ...screen,
        date: new Date(),
        cloudinaryId: screen.cloudinaryId || '',
        buildVersion: screen.buildVersion || '1.0.0',
        componentName: screen.componentName || '',
        filePath: screen.filePath || '',
        tags: screen.tags || []
      };
      
      await addDoc(collection(db, 'screenshots'), screenWithDefaults);
      addNotification('Screen capture added successfully', 'success');
    } catch (error) {
      console.error('Error adding screen capture:', error);
      addNotification('Failed to add screen capture', 'error');
    }
  }, [isEditMode, handleEditAction, addNotification]);

  const addCodeCommit = useCallback(async (commit: Omit<CodeCommit, 'id'>) => {
    if (!isEditMode) {
      handleEditAction('addCommit', commit);
      return;
    }
    try {
      const commitWithDefaults = {
        ...commit,
        timestamp: new Date(),
        files: commit.files || [],
        additions: commit.additions || 0,
        deletions: commit.deletions || 0
      };
      
      await addDoc(collection(db, 'commits'), commitWithDefaults);
      addNotification('Commit added successfully', 'success');
    } catch (error) {
      console.error('Error adding commit:', error);
      addNotification('Failed to add commit', 'error');
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
      (screen.description?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (screen.screenName?.toLowerCase() || '').includes(searchQuery.toLowerCase())
    );
  }, [screens, searchQuery]);

  // Styles object (keeping your existing styles exactly as they were)
  const styles = {
    container: {
      minHeight: '100vh',
      backgroundColor: '#f8f9fa',
      position: 'relative' as const,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      overflowX: 'hidden' as const
    },
    loadingContainer: {
      display: 'flex',
      flexDirection: 'column' as const,
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
      flexDirection: 'column' as const,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      backgroundColor: '#f8f9fa',
      padding: '20px',
      textAlign: 'center' as const
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
        position: 'sticky' as const,
        top: 0,
        zIndex: 1000
      }
    },
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
      position: 'relative' as const,
      fontSize: '20px',
      color: '#666'
    },
    notificationBadge: {
      position: 'absolute' as const,
      top: '-8px',
      right: '-8px',
      backgroundColor: '#dc3545',
      color: 'white',
      fontSize: '12px',
      padding: '2px 6px',
      borderRadius: '10px',
      minWidth: '18px',
      textAlign: 'center' as const
    },
    notificationContainer: {
      position: 'fixed' as const,
      top: '20px',
      right: '20px',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column' as const,
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
      position: 'fixed' as const,
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
    },
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
      flexWrap: 'wrap' as const,
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
      justifyContent: 'center',
      fontSize: '24px'
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
      flexWrap: 'wrap' as const
    },
    searchContainer: {
      position: 'relative' as const
    },
    searchIcon: {
      position: 'absolute' as const,
      left: '12px',
      top: '50%',
      transform: 'translateY(-50%)',
      color: '#999',
      fontSize: '16px'
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
      transition: 'all 0.2s',
      fontSize: '16px'
    },
    buildBadge: {
      display: 'flex',
      gap: '10px',
      alignItems: 'center',
      flexWrap: 'wrap' as const
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
      textAlign: 'center' as const,
      fontWeight: '500',
      fontSize: '14px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px'
    },
    specs: {
      display: 'flex',
      gap: '10px',
      flexWrap: 'wrap' as const,
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
      flexWrap: 'wrap' as const,
      backgroundColor: 'white',
      padding: '10px',
      borderRadius: '12px',
      boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
      position: 'sticky' as const,
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
      position: 'relative' as const
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
      position: 'absolute' as const,
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
      flexDirection: 'column' as const,
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
      flexWrap: 'wrap' as const,
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
        <div style={{ fontSize: '48px', color: '#dc3545' }}>
          <Icons.Warning />
        </div>
        <h2 style={styles.errorTitle}>Oops! Something went wrong</h2>
        <p style={styles.errorMessage}>{error}</p>
        <button 
          style={styles.retryButton}
          onClick={() => window.location.reload()}
        >
          <Icons.Redo /> Retry
        </button>
      </div>
    );
  }

  return (
    <div style={styles.container}>
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
          {isSidebarOpen ? <Icons.Close /> : <Icons.Menu />}
        </button>
        <h1 style={styles.mobileTitle}>GlazeMe</h1>
        <div style={styles.mobileNotifications}>
          <Icons.Bell />
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
                <Icons.Rocket />
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
                <span style={styles.searchIcon}><Icons.Search /></span>
                <input
                  type="text"
                  placeholder="Search updates, screens..."
                  style={styles.searchInput}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <button style={styles.filterButton}>
                <Icons.Filter />
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
              <Icons.Check /> <span>Edit Mode Active - Changes will be saved to Firebase</span>
            </div>
          )}

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
            { id: 'updates', label: 'Updates', icon: <Icons.Rocket /> },
            { id: 'screens', label: 'Screens', icon: <Icons.Mobile /> },
            { id: 'progress', label: 'Progress', icon: <Icons.Chart /> },
            { id: 'tech', label: 'Tech', icon: <Icons.Code /> },
            { id: 'deploy', label: 'Deploy', icon: <Icons.Cloud /> }
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
              onAddUpdate={handleAddUpdate}
              onEditUpdate={handleEditUpdate}
              onDeleteUpdate={handleDeleteUpdate}
              isEditMode={isEditMode}
              onEditAction={() => handleEditAction('addUpdate')}
            />
          )}
          {activeTab === 'screens' && (
            <ScreenGallery 
              screens={filteredScreens} 
              isEditMode={isEditMode}
              onAddScreen={() => handleEditAction('addScreen')}
              // Removed onEditAction as it doesn't exist in ScreenGallery props
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
              <Icons.Bell />
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
            View All Updates <Icons.ChevronDown />
          </button>
        </div>
      </div>

      {/* Global Styles for animations */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes slideIn {
          0% { transform: translateX(100%); opacity: 0; }
          100% { transform: translateX(0); opacity: 1; }
        }
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default Dashboard;