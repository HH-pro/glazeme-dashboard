// src/components/WeeklyProgress.tsx
import React, { useState, useEffect } from 'react';
import { db } from '../services/firebase';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  orderBy
} from 'firebase/firestore';

interface Week {
  id?: string;
  number: number;
  focus: string;
  screens: string[];
  tasks: string[];
  completed: boolean;
  progress?: number;
  createdAt?: Date;
}

interface Props {
  isEditMode?: boolean;
  onEditAction?: () => void;
  projectId?: string; // Optional: if you want to group by project
}

const WeeklyProgress: React.FC<Props> = ({ 
  isEditMode = false, 
  onEditAction,
  projectId = 'default' 
}) => {
  const [weeks, setWeeks] = useState<Week[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingWeek, setEditingWeek] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Week | null>(null);
  const [showAddWeekForm, setShowAddWeekForm] = useState(false);
  const [selectedScreen, setSelectedScreen] = useState<{weekId: string, weekNumber: number, screen: string} | null>(null);
  const [newWeek, setNewWeek] = useState<Partial<Week>>({
    number: 1,
    focus: '',
    screens: [],
    tasks: [],
    completed: false,
    progress: 0
  });
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  // Firebase collection reference
  const weeksCollection = collection(db, `projects/${projectId}/weeks`);

  // Fetch data from Firebase
  useEffect(() => {
    setLoading(true);
    const weeksQuery = query(weeksCollection, orderBy('number', 'asc'));
    
    const unsubscribe = onSnapshot(weeksQuery, 
      (snapshot) => {
        const weeksData: Week[] = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Week[];
        
        setWeeks(weeksData);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Error fetching weeks:', err);
        setError('Failed to load data from Firebase');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [projectId]);

  // Resize listener
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleEditClick = (week: Week) => {
    if (!isEditMode && onEditAction) {
      onEditAction();
      return;
    }
    setEditingWeek(week.id || null);
    setEditForm({ ...week });
  };

  const handleDeleteClick = async (weekId: string, weekNumber: number) => {
    if (!isEditMode && onEditAction) {
      onEditAction();
      return;
    }

    if (window.confirm(`Are you sure you want to delete Week ${weekNumber}?`)) {
      try {
        const weekDoc = doc(db, `projects/${projectId}/weeks`, weekId);
        await deleteDoc(weekDoc);
        console.log('Week deleted successfully');
      } catch (err) {
        console.error('Error deleting week:', err);
        setError('Failed to delete week');
      }
    }
  };

  const handleSaveEdit = async () => {
    if (editForm && editForm.id) {
      try {
        const weekDoc = doc(db, `projects/${projectId}/weeks`, editForm.id);
        await updateDoc(weekDoc, {
          focus: editForm.focus,
          screens: editForm.screens,
          tasks: editForm.tasks,
          progress: editForm.progress,
          completed: editForm.progress === 100
        });
        
        setEditingWeek(null);
        setEditForm(null);
        console.log('Week updated successfully');
      } catch (err) {
        console.error('Error updating week:', err);
        setError('Failed to update week');
      }
    }
  };

  const handleCancelEdit = () => {
    setEditingWeek(null);
    setEditForm(null);
  };

  const handleAddWeek = () => {
    if (!isEditMode && onEditAction) {
      onEditAction();
      return;
    }
    
    // Find the next available week number
    const maxNumber = weeks.length > 0 
      ? Math.max(...weeks.map(w => w.number)) 
      : 0;
    
    setNewWeek({
      number: maxNumber + 1,
      focus: '',
      screens: [],
      tasks: [],
      completed: false,
      progress: 0
    });
    setShowAddWeekForm(true);
  };

  const handleSaveNewWeek = async () => {
    if (newWeek.focus && newWeek.tasks && newWeek.screens) {
      // Check for duplicate week number
      const weekExists = weeks.some(w => w.number === newWeek.number);
      if (weekExists) {
        setError(`Week ${newWeek.number} already exists. Please choose a different number.`);
        return;
      }

      try {
        const weekToAdd: Omit<Week, 'id'> = {
          number: newWeek.number || weeks.length + 1,
          focus: newWeek.focus,
          screens: typeof newWeek.screens === 'string' 
            ? (newWeek.screens as string).split(',').map(s => s.trim()).filter(s => s) 
            : newWeek.screens as string[],
          tasks: typeof newWeek.tasks === 'string' 
            ? (newWeek.tasks as string).split(',').map(t => t.trim()).filter(t => t) 
            : newWeek.tasks as string[],
          completed: newWeek.completed || false,
          progress: newWeek.progress || 0,
          createdAt: new Date()
        };

        await addDoc(weeksCollection, weekToAdd);
        
        setShowAddWeekForm(false);
        setNewWeek({
          number: weeks.length + 2,
          focus: '',
          screens: [],
          tasks: [],
          completed: false,
          progress: 0
        });
        setError(null);
        console.log('Week added successfully');
      } catch (err) {
        console.error('Error adding week:', err);
        setError('Failed to add week to Firebase');
      }
    } else {
      setError('Please fill in all required fields');
    }
  };

  const handleTaskToggle = async (weekId: string, weekNumber: number, taskIndex: number) => {
    if (!isEditMode && onEditAction) {
      onEditAction();
      return;
    }
    
    try {
      const week = weeks.find(w => w.id === weekId);
      if (!week) return;

      const completedCount = taskIndex + 1;
      const newProgress = Math.round((completedCount / week.tasks.length) * 100);
      
      const weekDoc = doc(db, `projects/${projectId}/weeks`, weekId);
      await updateDoc(weekDoc, {
        progress: newProgress,
        completed: newProgress === 100
      });
    } catch (err) {
      console.error('Error updating task:', err);
      setError('Failed to update task progress');
    }
  };

  const handleProgressUpdate = async (weekId: string, progress: number) => {
    if (!isEditMode && onEditAction) {
      onEditAction();
      return;
    }
    
    try {
      const weekDoc = doc(db, `projects/${projectId}/weeks`, weekId);
      await updateDoc(weekDoc, {
        progress,
        completed: progress === 100
      });
    } catch (err) {
      console.error('Error updating progress:', err);
      setError('Failed to update progress');
    }
  };

  // Calculate statistics
  const overallProgress = weeks.length > 0
    ? Math.round(weeks.reduce((acc, week) => acc + (week.progress || 0), 0) / weeks.length)
    : 0;

  const completedWeeks = weeks.filter(w => w.completed).length;
  const activeWeek = weeks.find(w => w.progress && w.progress > 0 && w.progress < 100)?.number || 
                    (weeks.length > 0 ? weeks[0].number : 1);
  const totalScreens = weeks.reduce((acc, week) => acc + week.screens.length, 0);
  const completedScreens = Math.round((overallProgress / 100) * totalScreens) || 0;

  // Mobile-specific styles
  const mobileStyles = {
    overviewCards: {
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: '10px',
    },
    weekHeader: {
      flexDirection: 'column' as const,
      alignItems: 'flex-start',
      gap: '10px',
    },
    weekHeaderLeft: {
      flexWrap: 'wrap' as const,
    },
    weekHeaderRight: {
      width: '100%',
      justifyContent: 'flex-end',
    },
    screensGrid: {
      gridTemplateColumns: '1fr',
    },
    roadmapGrid: {
      gridTemplateColumns: '1fr',
    },
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingContainer}>
          <div style={styles.loadingSpinner}></div>
          <p style={styles.loadingText}>Loading development plan...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h2 style={styles.sectionTitle}>📱 4-Week Screen Development Plan</h2>
          <p style={styles.subtitle}>Building GlazeMe screen by screen</p>
        </div>
        {isEditMode && (
          <button onClick={handleAddWeek} style={styles.addButton}>
            + Add Week
          </button>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div style={styles.errorMessage}>
          <span>❌ {error}</span>
          <button onClick={() => setError(null)} style={styles.errorClose}>×</button>
        </div>
      )}

      {/* Edit Mode Indicator */}
      {isEditMode && (
        <div style={styles.editModeIndicator}>
          ✏️ Edit Mode Active - Changes are saved to Firebase automatically
        </div>
      )}

      {/* Screen Progress Overview */}
      <div style={{
        ...styles.overviewCards,
        ...(isMobile ? mobileStyles.overviewCards : {})
      }}>
        <div style={styles.overviewCard}>
          <span style={styles.overviewIcon}>📱</span>
          <div>
            <span style={styles.overviewValue}>{totalScreens}</span>
            <span style={styles.overviewLabel}>Total Screens</span>
          </div>
        </div>
        <div style={styles.overviewCard}>
          <span style={styles.overviewIcon}>✅</span>
          <div>
            <span style={styles.overviewValue}>{completedScreens}</span>
            <span style={styles.overviewLabel}>Completed</span>
          </div>
        </div>
        <div style={styles.overviewCard}>
          <span style={styles.overviewIcon}>🎯</span>
          <div>
            <span style={styles.overviewValue}>{totalScreens - completedScreens}</span>
            <span style={styles.overviewLabel}>Remaining</span>
          </div>
        </div>
        <div style={styles.overviewCard}>
          <span style={styles.overviewIcon}>⚡</span>
          <div>
            <span style={styles.overviewValue}>Week {activeWeek}</span>
            <span style={styles.overviewLabel}>Current Focus</span>
          </div>
        </div>
      </div>

      {/* Overall Progress Bar */}
      <div style={styles.overallProgress}>
        <div style={styles.overallProgressHeader}>
          <span style={styles.overallProgressLabel}>Overall Screen Development Progress</span>
          <span style={styles.overallProgressValue}>{overallProgress}%</span>
        </div>
        <div style={styles.progressBarBg}>
          <div style={{...styles.progressBarFill, width: `${overallProgress}%`}} />
        </div>
        <div style={styles.screenCount}>
          <span style={styles.screenCountText}>
            {completedScreens} of {totalScreens} screens complete
          </span>
        </div>
      </div>

      {/* Add Week Form */}
      {isEditMode && showAddWeekForm && (
        <div style={styles.addWeekForm}>
          <h3 style={styles.formTitle}>➕ Add New Development Week</h3>
          <input
            type="number"
            placeholder="Week Number"
            value={newWeek.number}
            onChange={(e) => setNewWeek({...newWeek, number: parseInt(e.target.value) || 1})}
            style={styles.input}
            min="1"
          />
          <input
            type="text"
            placeholder="Week Focus (e.g., Feature Development)"
            value={newWeek.focus}
            onChange={(e) => setNewWeek({...newWeek, focus: e.target.value})}
            style={styles.input}
          />
          <textarea
            placeholder="Screens to build (comma-separated)"
            value={Array.isArray(newWeek.screens) ? newWeek.screens.join(', ') : ''}
            onChange={(e) => setNewWeek({...newWeek, screens: e.target.value.split(',').map(s => s.trim())})}
            style={styles.textarea}
            rows={2}
          />
          <textarea
            placeholder="Development Tasks (comma-separated)"
            value={Array.isArray(newWeek.tasks) ? newWeek.tasks.join(', ') : ''}
            onChange={(e) => setNewWeek({...newWeek, tasks: e.target.value.split(',').map(t => t.trim())})}
            style={styles.textarea}
            rows={3}
          />
          <div style={styles.progressControl}>
            <span>Initial Progress: {newWeek.progress}%</span>
            <input
              type="range"
              min="0"
              max="100"
              value={newWeek.progress}
              onChange={(e) => setNewWeek({...newWeek, progress: parseInt(e.target.value)})}
              style={styles.range}
            />
          </div>
          <div style={styles.formButtons}>
            <button onClick={() => setShowAddWeekForm(false)} style={styles.cancelButton}>
              Cancel
            </button>
            <button onClick={handleSaveNewWeek} style={styles.saveButton}>
              Add Week to Firebase
            </button>
          </div>
        </div>
      )}
      
      {/* Weeks Timeline */}
      <div style={styles.timeline}>
        {weeks.length === 0 ? (
          <div style={styles.emptyState}>
            <p style={styles.emptyStateText}>No development weeks added yet.</p>
            {isEditMode && (
              <button onClick={handleAddWeek} style={styles.emptyStateButton}>
                Add Your First Week
              </button>
            )}
          </div>
        ) : (
          weeks.map((week) => (
            <div key={week.id} style={styles.weekCard}>
              {editingWeek === week.id && editForm ? (
                // Edit Mode
                <div style={styles.editForm}>
                  <input
                    type="text"
                    value={editForm.focus}
                    onChange={(e) => setEditForm({...editForm, focus: e.target.value})}
                    style={styles.input}
                    placeholder="Week Focus"
                  />
                  <textarea
                    value={editForm.screens.join('\n')}
                    onChange={(e) => setEditForm({...editForm, screens: e.target.value.split('\n').filter(s => s.trim())})}
                    style={styles.textarea}
                    placeholder="Screens (one per line)"
                    rows={3}
                  />
                  <textarea
                    value={editForm.tasks.join('\n')}
                    onChange={(e) => setEditForm({...editForm, tasks: e.target.value.split('\n').filter(t => t.trim())})}
                    style={styles.textarea}
                    placeholder="Tasks (one per line)"
                    rows={4}
                  />
                  <div style={styles.progressControl}>
                    <span>Progress: {editForm.progress}%</span>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={editForm.progress}
                      onChange={(e) => setEditForm({...editForm, progress: parseInt(e.target.value)})}
                      style={styles.range}
                    />
                  </div>
                  <div style={styles.editButtons}>
                    <button onClick={handleCancelEdit} style={styles.cancelButton}>Cancel</button>
                    <button onClick={handleSaveEdit} style={styles.saveButton}>Save to Firebase</button>
                  </div>
                </div>
              ) : (
                // View Mode
                <>
                  <div style={{
                    ...styles.weekHeader,
                    ...(isMobile ? mobileStyles.weekHeader : {})
                  }}>
                    <div style={{
                      ...styles.weekHeaderLeft,
                      ...(isMobile ? mobileStyles.weekHeaderLeft : {})
                    }}>
                      <span style={styles.weekNumber}>Week {week.number}</span>
                      <span style={styles.weekFocus}>{week.focus}</span>
                    </div>
                    <div style={{
                      ...styles.weekHeaderRight,
                      ...(isMobile ? mobileStyles.weekHeaderRight : {})
                    }}>
                      {week.progress === 100 && (
                        <span style={styles.completedBadge}>✅ Complete</span>
                      )}
                      {isEditMode && week.id && (
                        <>
                          <button 
                            onClick={() => handleEditClick(week)}
                            style={styles.editWeekButton}
                            title="Edit Week"
                          >
                            ✏️
                          </button>
                          <button 
                            onClick={() => handleDeleteClick(week.id!, week.number)}
                            style={styles.deleteWeekButton}
                            title="Delete Week"
                          >
                            🗑️
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Screens Section */}
                  <div style={styles.screensSection}>
                    <h4 style={styles.screensTitle}>📱 Screens to Build:</h4>
                    <div style={{
                      ...styles.screensGrid,
                      ...(isMobile ? mobileStyles.screensGrid : {})
                    }}>
                      {week.screens.map((screen, index) => {
                        const screenCompleted = week.progress && week.progress > (index / week.screens.length) * 100;
                        return (
                          <div 
                            key={index} 
                            style={{
                              ...styles.screenCard,
                              ...(screenCompleted ? styles.screenCompleted : {})
                            }}
                            onClick={() => week.id && setSelectedScreen({
                              weekId: week.id,
                              weekNumber: week.number,
                              screen
                            })}
                          >
                            <span style={styles.screenIcon}>
                              {screenCompleted ? '✅' : '📱'}
                            </span>
                            <span style={styles.screenName}>{screen}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  
                  {/* Tasks List */}
                  <div style={styles.tasksSection}>
                    <h4 style={styles.tasksTitle}>⚙️ Development Tasks:</h4>
                    <ul style={styles.taskList}>
                      {week.tasks.map((task, index) => {
                        const isCompleted = week.progress && week.progress > (index / week.tasks.length) * 100;
                        return (
                          <li 
                            key={index} 
                            style={{
                              ...styles.taskItem,
                              ...(isCompleted ? styles.taskCompleted : {})
                            }}
                            onClick={() => week.id && handleTaskToggle(week.id, week.number, index)}
                          >
                            <span style={styles.taskBullet}>
                              {isCompleted ? '✅' : '○'}
                            </span>
                            {task}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                  
                  {/* Progress Bar */}
                  <div style={styles.progressSection}>
                    <div style={styles.progressHeader}>
                      <span style={styles.progressLabel}>Week Progress</span>
                      <span style={styles.progressValue}>{week.progress || 0}%</span>
                    </div>
                    <div style={styles.progressBarBg}>
                      <div style={{
                        ...styles.progressBarFill,
                        width: `${week.progress || 0}%`,
                        background: week.completed ? '#28a745' : '#FF8C42'
                      }} />
                    </div>
                    {isEditMode && week.id && (
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={week.progress || 0}
                        onChange={(e) => handleProgressUpdate(week.id!, parseInt(e.target.value))}
                        style={styles.progressSlider}
                      />
                    )}
                  </div>
                </>
              )}
            </div>
          ))
        )}
      </div>

      {/* Screen Preview Modal */}
      {selectedScreen && (
        <div style={styles.modal} onClick={() => setSelectedScreen(null)}>
          <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
            <button style={styles.modalClose} onClick={() => setSelectedScreen(null)}>×</button>
            <h3 style={styles.modalTitle}>Screen Details</h3>
            <div style={styles.modalBody}>
              <div style={styles.modalIcon}>📱</div>
              <h4 style={styles.modalScreenName}>{selectedScreen.screen}</h4>
              <p style={styles.modalWeek}>Week {selectedScreen.weekNumber}</p>
              <div style={styles.modalActions}>
                <button 
                  style={{
                    ...styles.modalButton,
                    ...(isMobile ? { flex: '1' } : {})
                  }}
                >
                  View Design
                </button>
                <button 
                  style={{
                    ...styles.modalButton,
                    ...(isMobile ? { flex: '1' } : {})
                  }}
                  onClick={() => {
                    // Find the week and mark this screen as complete
                    const week = weeks.find(w => w.id === selectedScreen.weekId);
                    if (week && week.id) {
                      const screenIndex = week.screens.findIndex(s => s === selectedScreen.screen);
                      const newProgress = Math.round(((screenIndex + 1) / week.screens.length) * 100);
                      handleProgressUpdate(week.id, newProgress);
                    }
                    setSelectedScreen(null);
                  }}
                >
                  Mark Complete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Development Roadmap */}
      {weeks.length > 0 && (
        <div style={styles.roadmap}>
          <h3 style={styles.roadmapTitle}>🗺️ Screen Development Roadmap</h3>
          <div style={{
            ...styles.roadmapGrid,
            ...(isMobile ? mobileStyles.roadmapGrid : {})
          }}>
            {weeks.map(week => (
              <div key={week.id} style={styles.roadmapColumn}>
                <div style={styles.roadmapHeader}>
                  <span style={styles.roadmapWeek}>Week {week.number}</span>
                  <span style={styles.roadmapFocus}>{week.focus}</span>
                </div>
                <div style={styles.roadmapScreens}>
                  {week.screens.map((screen, index) => (
                    <div key={index} style={styles.roadmapScreen}>
                      <span style={styles.roadmapBullet}>•</span>
                      {screen}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '20px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '400px',
  },
  loadingSpinner: {
    width: '50px',
    height: '50px',
    border: '5px solid #f3f3f3',
    borderTop: '5px solid #FF8C42',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    marginBottom: '20px',
  },
  loadingText: {
    fontSize: '16px',
    color: '#666',
  },
  errorMessage: {
    backgroundColor: '#f8d7da',
    color: '#721c24',
    padding: '12px 16px',
    borderRadius: '8px',
    marginBottom: '20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '14px',
  },
  errorClose: {
    background: 'none',
    border: 'none',
    color: '#721c24',
    fontSize: '20px',
    cursor: 'pointer',
    padding: '0 5px',
  },
  emptyState: {
    textAlign: 'center' as const,
    padding: '40px',
    backgroundColor: '#f8f9fa',
    borderRadius: '12px',
  },
  emptyStateText: {
    fontSize: '16px',
    color: '#666',
    marginBottom: '20px',
  },
  emptyStateButton: {
    padding: '12px 24px',
    backgroundColor: '#FF8C42',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '16px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    flexWrap: 'wrap' as const,
    gap: '15px',
  },
  sectionTitle: {
    fontSize: 'clamp(20px, 5vw, 24px)',
    margin: '0 0 10px 0',
    color: '#333',
    lineHeight: '1.3',
  },
  subtitle: {
    fontSize: 'clamp(12px, 4vw, 14px)',
    color: '#666',
    margin: 0,
  },
  addButton: {
    padding: '10px 20px',
    backgroundColor: '#FF8C42',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: 'clamp(14px, 4vw, 16px)',
    fontWeight: '500',
    '@media (max-width: 768px)': {
      width: '100%',
    },
  },
  editModeIndicator: {
    backgroundColor: '#fff3cd',
    color: '#856404',
    padding: '12px 16px',
    borderRadius: '8px',
    marginBottom: '20px',
    fontSize: 'clamp(13px, 4vw, 14px)',
    fontWeight: '500',
    textAlign: 'center' as const,
  },
  overviewCards: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '15px',
    marginBottom: '20px',
  },
  overviewCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '15px',
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    border: '1px solid #eee',
    '@media (max-width: 768px)': {
      padding: '12px',
      gap: '8px',
    },
  },
  overviewIcon: {
    fontSize: 'clamp(20px, 5vw, 24px)',
  },
  overviewValue: {
    display: 'block',
    fontSize: 'clamp(18px, 5vw, 20px)',
    fontWeight: 'bold',
    color: '#FF8C42',
    lineHeight: '1.2',
  },
  overviewLabel: {
    fontSize: 'clamp(11px, 3vw, 12px)',
    color: '#666',
  },
  overallProgress: {
    marginBottom: '30px',
    padding: '20px',
    backgroundColor: '#f8f9fa',
    borderRadius: '12px',
  },
  overallProgressHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '10px',
    flexWrap: 'wrap' as const,
    gap: '10px',
  },
  overallProgressLabel: {
    fontSize: 'clamp(13px, 4vw, 14px)',
    color: '#666',
  },
  overallProgressValue: {
    fontSize: 'clamp(13px, 4vw, 14px)',
    fontWeight: 'bold',
    color: '#FF8C42',
  },
  progressBarBg: {
    width: '100%',
    height: '10px',
    backgroundColor: '#e9ecef',
    borderRadius: '5px',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#FF8C42',
    transition: 'width 0.3s ease',
  },
  screenCount: {
    marginTop: '10px',
    textAlign: 'right' as const,
  },
  screenCountText: {
    fontSize: 'clamp(11px, 3vw, 12px)',
    color: '#6c757d',
  },
  timeline: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '20px',
    marginBottom: '30px',
  },
  weekCard: {
    padding: '20px',
    backgroundColor: 'white',
    borderRadius: '16px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
    border: '1px solid #eee',
    '@media (max-width: 768px)': {
      padding: '16px',
    },
  },
  weekHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '15px',
  },
  weekHeaderLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  weekHeaderRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  weekNumber: {
    padding: '6px 12px',
    backgroundColor: '#FF8C42',
    color: 'white',
    borderRadius: '20px',
    fontSize: 'clamp(12px, 4vw, 14px)',
    fontWeight: 'bold',
    whiteSpace: 'nowrap' as const,
  },
  weekFocus: {
    fontSize: 'clamp(16px, 5vw, 18px)',
    fontWeight: 'bold',
    color: '#333',
  },
  completedBadge: {
    fontSize: 'clamp(12px, 4vw, 13px)',
    color: '#28a745',
    fontWeight: '500',
  },
  editWeekButton: {
    padding: '8px 12px',
    backgroundColor: '#f8f9fa',
    border: '1px solid #dee2e6',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    transition: 'all 0.2s',
    ':hover': {
      backgroundColor: '#e9ecef',
    },
  },
  deleteWeekButton: {
    padding: '8px 12px',
    backgroundColor: '#fff',
    border: '1px solid #dc3545',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    color: '#dc3545',
    transition: 'all 0.2s',
    ':hover': {
      backgroundColor: '#dc3545',
      color: 'white',
    },
  },
  screensSection: {
    marginBottom: '20px',
  },
  screensTitle: {
    fontSize: 'clamp(14px, 4vw, 15px)',
    margin: '0 0 12px 0',
    color: '#555',
  },
  screensGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: '10px',
  },
  screenCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '12px',
    backgroundColor: '#f8f9fa',
    borderRadius: '10px',
    border: '1px solid #e9ecef',
    cursor: 'pointer',
    transition: 'all 0.2s',
    ':active': {
      transform: 'scale(0.98)',
    },
  },
  screenCompleted: {
    backgroundColor: '#d4edda',
    borderColor: '#c3e6cb',
  },
  screenIcon: {
    fontSize: '18px',
  },
  screenName: {
    fontSize: 'clamp(12px, 4vw, 13px)',
    color: '#495057',
    wordBreak: 'break-word' as const,
  },
  tasksSection: {
    marginBottom: '20px',
  },
  tasksTitle: {
    fontSize: 'clamp(14px, 4vw, 15px)',
    margin: '0 0 12px 0',
    color: '#555',
  },
  taskList: {
    margin: 0,
    padding: 0,
    listStyle: 'none',
  },
  taskItem: {
    fontSize: 'clamp(13px, 4vw, 14px)',
    marginBottom: '10px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'flex-start',
    gap: '10px',
    color: '#666',
    padding: '4px 0',
  },
  taskCompleted: {
    color: '#999',
    textDecoration: 'line-through',
  },
  taskBullet: {
    fontSize: '16px',
    flexShrink: 0,
  },
  progressSection: {
    marginTop: '20px',
    padding: '16px',
    backgroundColor: '#f8f9fa',
    borderRadius: '12px',
  },
  progressHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '10px',
  },
  progressLabel: {
    fontSize: 'clamp(12px, 4vw, 13px)',
    color: '#666',
  },
  progressValue: {
    fontSize: 'clamp(12px, 4vw, 13px)',
    fontWeight: 'bold',
    color: '#FF8C42',
  },
  progressSlider: {
    width: '100%',
    marginTop: '12px',
    height: '6px',
    WebkitAppearance: 'none' as const,
    background: '#e9ecef',
    borderRadius: '3px',
    outline: 'none',
    '::-webkit-slider-thumb': {
      WebkitAppearance: 'none' as const,
      width: '20px',
      height: '20px',
      background: '#FF8C42',
      borderRadius: '50%',
      cursor: 'pointer',
      border: 'none',
    },
  },
  editForm: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '15px',
  },
  input: {
    padding: '12px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    fontSize: 'clamp(14px, 4vw, 16px)',
    width: '100%',
    boxSizing: 'border-box' as const,
  },
  textarea: {
    padding: '12px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    fontSize: 'clamp(14px, 4vw, 16px)',
    width: '100%',
    boxSizing: 'border-box' as const,
    minHeight: '100px',
    resize: 'vertical' as const,
  },
  range: {
    width: '100%',
    margin: '10px 0',
    height: '6px',
    background: '#e9ecef',
    borderRadius: '3px',
  },
  progressControl: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
  },
  editButtons: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'flex-end',
    flexWrap: 'wrap' as const,
  },
  cancelButton: {
    padding: '10px 20px',
    backgroundColor: '#6c757d',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: 'clamp(14px, 4vw, 16px)',
  },
  saveButton: {
    padding: '10px 20px',
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: 'clamp(14px, 4vw, 16px)',
  },
  formButtons: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'flex-end',
    marginTop: '10px',
    flexWrap: 'wrap' as const,
  },
  addWeekForm: {
    backgroundColor: '#f8f9fa',
    padding: '20px',
    borderRadius: '16px',
    marginBottom: '20px',
    border: '2px solid #FF8C42',
  },
  formTitle: {
    margin: '0 0 15px 0',
    fontSize: 'clamp(16px, 5vw, 18px)',
    color: '#333',
  },
  roadmap: {
    marginBottom: '30px',
  },
  roadmapTitle: {
    fontSize: 'clamp(16px, 5vw, 18px)',
    margin: '0 0 15px 0',
    color: '#333',
  },
  roadmapGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '15px',
  },
  roadmapColumn: {
    padding: '16px',
    backgroundColor: '#f8f9fa',
    borderRadius: '12px',
    border: '1px solid #e9ecef',
  },
  roadmapHeader: {
    marginBottom: '12px',
    paddingBottom: '10px',
    borderBottom: '2px solid #FF8C42',
  },
  roadmapWeek: {
    display: 'block',
    fontSize: 'clamp(13px, 4vw, 14px)',
    fontWeight: 'bold',
    color: '#FF8C42',
    marginBottom: '4px',
  },
  roadmapFocus: {
    fontSize: 'clamp(12px, 4vw, 13px)',
    color: '#333',
  },
  roadmapScreens: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
  },
  roadmapScreen: {
    fontSize: 'clamp(11px, 3vw, 12px)',
    color: '#666',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    wordBreak: 'break-word' as const,
  },
  roadmapBullet: {
    color: '#FF8C42',
    fontSize: '16px',
    flexShrink: 0,
  },
  modal: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '20px',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: '20px',
    padding: '24px',
    maxWidth: '400px',
    width: '100%',
    position: 'relative' as const,
    maxHeight: '90vh',
    overflow: 'auto',
  },
  modalClose: {
    position: 'absolute' as const,
    top: '15px',
    right: '15px',
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    border: 'none',
    backgroundColor: '#ff4444',
    color: 'white',
    fontSize: '24px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 'clamp(18px, 5vw, 20px)',
    margin: '0 0 20px 0',
    color: '#333',
    paddingRight: '30px',
  },
  modalBody: {
    textAlign: 'center' as const,
  },
  modalIcon: {
    fontSize: '48px',
    marginBottom: '20px',
  },
  modalScreenName: {
    fontSize: 'clamp(16px, 5vw, 18px)',
    margin: '0 0 10px 0',
    color: '#333',
    wordBreak: 'break-word' as const,
  },
  modalWeek: {
    fontSize: 'clamp(13px, 4vw, 14px)',
    color: '#666',
    marginBottom: '20px',
  },
  modalActions: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'center',
    flexWrap: 'wrap' as const,
  },
  modalButton: {
    padding: '12px 24px',
    backgroundColor: '#FF8C42',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: 'clamp(14px, 4vw, 16px)',
  },
};

// Add keyframe animation for spinner
const style = document.createElement('style');
style.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
document.head.appendChild(style);

export default WeeklyProgress;