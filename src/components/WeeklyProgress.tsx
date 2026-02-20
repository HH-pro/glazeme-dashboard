// src/components/WeeklyProgress.tsx
import React, { useState } from 'react';

interface Week {
  number: number;
  focus: string;
  screens: string[];
  tasks: string[];
  completed: boolean;
  progress?: number;
}

interface Props {
  isEditMode?: boolean;
  onEditAction?: () => void;
}

const WeeklyProgress: React.FC<Props> = ({ isEditMode = false, onEditAction }) => {
  const [weeks, setWeeks] = useState<Week[]>([
  
  ]);

  const [editingWeek, setEditingWeek] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Week | null>(null);
  const [showAddWeekForm, setShowAddWeekForm] = useState(false);
  const [selectedScreen, setSelectedScreen] = useState<{week: number, screen: string} | null>(null);
  const [newWeek, setNewWeek] = useState<Partial<Week>>({
    number: 5,
    focus: '',
    screens: [],
    tasks: [],
    completed: false,
    progress: 0
  });

  const handleEditClick = (week: Week) => {
    if (!isEditMode && onEditAction) {
      onEditAction();
      return;
    }
    setEditingWeek(week.number);
    setEditForm({ ...week });
  };

  const handleSaveEdit = () => {
    if (editForm) {
      setWeeks(weeks.map(w => w.number === editForm.number ? editForm : w));
      setEditingWeek(null);
      setEditForm(null);
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
    setShowAddWeekForm(true);
  };

  const handleSaveNewWeek = () => {
    if (newWeek.focus && newWeek.tasks && newWeek.screens) {
      const weekToAdd: Week = {
        number: newWeek.number || weeks.length + 1,
        focus: newWeek.focus,
        screens: typeof newWeek.screens === 'string' 
          ? (newWeek.screens as string).split(',').map(s => s.trim()) 
          : newWeek.screens as string[],
        tasks: typeof newWeek.tasks === 'string' 
          ? (newWeek.tasks as string).split(',').map(t => t.trim()) 
          : newWeek.tasks as string[],
        completed: newWeek.completed || false,
        progress: newWeek.progress || 0
      };
      setWeeks([...weeks, weekToAdd].sort((a, b) => a.number - b.number));
      setShowAddWeekForm(false);
      setNewWeek({
        number: weeks.length + 2,
        focus: '',
        screens: [],
        tasks: [],
        completed: false,
        progress: 0
      });
    }
  };

  const handleTaskToggle = (weekNumber: number, taskIndex: number) => {
    if (!isEditMode && onEditAction) {
      onEditAction();
      return;
    }
    
    setWeeks(weeks.map(week => {
      if (week.number === weekNumber) {
        const completedCount = taskIndex + 1;
        const newProgress = Math.round((completedCount / week.tasks.length) * 100);
        
        return {
          ...week,
          progress: newProgress,
          completed: newProgress === 100
        };
      }
      return week;
    }));
  };

  const handleProgressUpdate = (weekNumber: number, progress: number) => {
    if (!isEditMode && onEditAction) {
      onEditAction();
      return;
    }
    
    setWeeks(weeks.map(week => 
      week.number === weekNumber 
        ? { ...week, progress, completed: progress === 100 }
        : week
    ));
  };

  const overallProgress = Math.round(
    weeks.reduce((acc, week) => acc + (week.progress || 0), 0) / weeks.length
  );

  const completedWeeks = weeks.filter(w => w.completed).length;
  const activeWeek = weeks.find(w => w.progress && w.progress > 0 && w.progress < 100)?.number || 1;
  const totalScreens = weeks.reduce((acc, week) => acc + week.screens.length, 0);
  const completedScreens = Math.round((overallProgress / 100) * totalScreens);

  return (
    <div>
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

      {/* Edit Mode Indicator */}
      {isEditMode && (
        <div style={styles.editModeIndicator}>
          ✏️ Edit Mode Active - You can update progress and tasks
        </div>
      )}

      {/* Screen Progress Overview */}
      <div style={styles.overviewCards}>
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
            onChange={(e) => setNewWeek({...newWeek, number: parseInt(e.target.value)})}
            style={styles.input}
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
              Add Week
            </button>
          </div>
        </div>
      )}
      
      <div style={styles.timeline}>
        {weeks.sort((a, b) => a.number - b.number).map((week) => (
          <div key={week.number} style={styles.weekCard}>
            {editingWeek === week.number && editForm ? (
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
                  <button onClick={handleSaveEdit} style={styles.saveButton}>Save</button>
                </div>
              </div>
            ) : (
              // View Mode
              <>
                <div style={styles.weekHeader}>
                  <div style={styles.weekHeaderLeft}>
                    <span style={styles.weekNumber}>Week {week.number}</span>
                    <span style={styles.weekFocus}>{week.focus}</span>
                  </div>
                  <div style={styles.weekHeaderRight}>
                    {week.progress === 100 && (
                      <span style={styles.completedBadge}>✅ Complete</span>
                    )}
                    {isEditMode && (
                      <button 
                        onClick={() => handleEditClick(week)}
                        style={styles.editWeekButton}
                      >
                        ✏️ Edit
                      </button>
                    )}
                  </div>
                </div>

                {/* Screens Section */}
                <div style={styles.screensSection}>
                  <h4 style={styles.screensTitle}>📱 Screens to Build:</h4>
                  <div style={styles.screensGrid}>
                    {week.screens.map((screen, index) => {
                      const screenCompleted = week.progress && week.progress > (index / week.screens.length) * 100;
                      return (
                        <div 
                          key={index} 
                          style={{
                            ...styles.screenCard,
                            ...(screenCompleted ? styles.screenCompleted : {})
                          }}
                          onClick={() => setSelectedScreen({week: week.number, screen})}
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
                          onClick={() => handleTaskToggle(week.number, index)}
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
                  {isEditMode && (
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={week.progress || 0}
                      onChange={(e) => handleProgressUpdate(week.number, parseInt(e.target.value))}
                      style={styles.progressSlider}
                    />
                  )}
                </div>
              </>
            )}
          </div>
        ))}
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
              <p style={styles.modalWeek}>Week {selectedScreen.week}</p>
              <div style={styles.modalActions}>
                <button style={styles.modalButton}>View Design</button>
                <button style={styles.modalButton}>Mark Complete</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Development Roadmap */}
      <div style={styles.roadmap}>
        <h3 style={styles.roadmapTitle}>🗺️ Screen Development Roadmap</h3>
        <div style={styles.roadmapGrid}>
          {weeks.map(week => (
            <div key={week.number} style={styles.roadmapColumn}>
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

const styles = {
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px'
  },
  sectionTitle: {
    fontSize: '24px',
    margin: '0 0 10px 0',
    color: '#333'
  },
  subtitle: {
    fontSize: '14px',
    color: '#666',
    margin: 0
  },
  addButton: {
    padding: '8px 16px',
    backgroundColor: '#FF8C42',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px'
  },
  editModeIndicator: {
    backgroundColor: '#fff3cd',
    color: '#856404',
    padding: '8px 12px',
    borderRadius: '6px',
    marginBottom: '20px',
    fontSize: '14px',
    fontWeight: '500'
  },
  overviewCards: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '15px',
    marginBottom: '20px'
  },
  overviewCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '15px',
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    border: '1px solid #eee'
  },
  overviewIcon: {
    fontSize: '24px'
  },
  overviewValue: {
    display: 'block',
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#FF8C42'
  },
  overviewLabel: {
    fontSize: '12px',
    color: '#666'
  },
  overallProgress: {
    marginBottom: '30px',
    padding: '15px',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px'
  },
  overallProgressHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '8px'
  },
  overallProgressLabel: {
    fontSize: '14px',
    color: '#666'
  },
  overallProgressValue: {
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#FF8C42'
  },
  progressBarBg: {
    width: '100%',
    height: '8px',
    backgroundColor: '#e9ecef',
    borderRadius: '4px',
    overflow: 'hidden'
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#FF8C42',
    transition: 'width 0.3s ease'
  },
  screenCount: {
    marginTop: '8px',
    textAlign: 'right' as const
  },
  screenCountText: {
    fontSize: '12px',
    color: '#6c757d'
  },
  timeline: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '20px',
    marginBottom: '30px'
  },
  weekCard: {
    padding: '20px',
    backgroundColor: 'white',
    borderRadius: '10px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
    border: '1px solid #eee'
  },
  weekHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '15px'
  },
  weekHeaderLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px'
  },
  weekHeaderRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },
  weekNumber: {
    padding: '6px 12px',
    backgroundColor: '#FF8C42',
    color: 'white',
    borderRadius: '20px',
    fontSize: '14px',
    fontWeight: 'bold'
  },
  weekFocus: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#333'
  },
  completedBadge: {
    fontSize: '13px',
    color: '#28a745',
    fontWeight: '500'
  },
  editWeekButton: {
    padding: '4px 8px',
    backgroundColor: '#f8f9fa',
    border: '1px solid #dee2e6',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px'
  },
  screensSection: {
    marginBottom: '15px'
  },
  screensTitle: {
    fontSize: '15px',
    margin: '0 0 10px 0',
    color: '#555'
  },
  screensGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: '10px'
  },
  screenCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px',
    backgroundColor: '#f8f9fa',
    borderRadius: '6px',
    border: '1px solid #e9ecef',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  screenCompleted: {
    backgroundColor: '#d4edda',
    borderColor: '#c3e6cb'
  },
  screenIcon: {
    fontSize: '16px'
  },
  screenName: {
    fontSize: '13px',
    color: '#495057'
  },
  tasksSection: {
    marginBottom: '15px'
  },
  tasksTitle: {
    fontSize: '15px',
    margin: '0 0 10px 0',
    color: '#555'
  },
  taskList: {
    margin: 0,
    padding: 0,
    listStyle: 'none'
  },
  taskItem: {
    fontSize: '14px',
    marginBottom: '8px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    color: '#666'
  },
  taskCompleted: {
    color: '#999',
    textDecoration: 'line-through'
  },
  taskBullet: {
    fontSize: '14px'
  },
  progressSection: {
    marginTop: '15px',
    padding: '15px',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px'
  },
  progressHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '8px'
  },
  progressLabel: {
    fontSize: '13px',
    color: '#666'
  },
  progressValue: {
    fontSize: '13px',
    fontWeight: 'bold',
    color: '#FF8C42'
  },
  progressSlider: {
    width: '100%',
    marginTop: '10px'
  },
  editForm: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '10px'
  },
  input: {
    padding: '8px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px'
  },
  textarea: {
    padding: '8px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px',
    minHeight: '80px'
  },
  range: {
    width: '100%'
  },
  progressControl: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '5px'
  },
  editButtons: {
    display: 'flex',
    gap: '10px',
    justifyContent: 'flex-end'
  },
  cancelButton: {
    padding: '6px 12px',
    backgroundColor: '#6c757d',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
  },
  saveButton: {
    padding: '6px 12px',
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
  },
  formButtons: {
    display: 'flex',
    gap: '10px',
    justifyContent: 'flex-end',
    marginTop: '10px'
  },
  addWeekForm: {
    backgroundColor: '#f8f9fa',
    padding: '20px',
    borderRadius: '8px',
    marginBottom: '20px',
    border: '2px solid #FF8C42'
  },
  formTitle: {
    margin: '0 0 15px 0',
    fontSize: '18px',
    color: '#333'
  },
  roadmap: {
    marginBottom: '30px'
  },
  roadmapTitle: {
    fontSize: '18px',
    margin: '0 0 15px 0',
    color: '#333'
  },
  roadmapGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '15px'
  },
  roadmapColumn: {
    padding: '15px',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    border: '1px solid #e9ecef'
  },
  roadmapHeader: {
    marginBottom: '10px',
    paddingBottom: '8px',
    borderBottom: '2px solid #FF8C42'
  },
  roadmapWeek: {
    display: 'block',
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#FF8C42',
    marginBottom: '4px'
  },
  roadmapFocus: {
    fontSize: '13px',
    color: '#333'
  },
  roadmapScreens: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '6px'
  },
  roadmapScreen: {
    fontSize: '12px',
    color: '#666',
    display: 'flex',
    alignItems: 'center',
    gap: '6px'
  },
  roadmapBullet: {
    color: '#FF8C42',
    fontSize: '16px'
  },
  statusCard: {
    padding: '20px',
    backgroundColor: '#fff3cd',
    borderRadius: '8px',
    border: '1px solid #ffeeba'
  },
  statusHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '15px'
  },
  statusIcon: {
    fontSize: '20px'
  },
  statusTitle: {
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#856404'
  },
  statusContent: {
    marginBottom: '15px'
  },
  statusText: {
    margin: '5px 0',
    fontSize: '14px',
    color: '#856404'
  },
  statusTags: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap' as const
  },
  statusTag: {
    padding: '4px 8px',
    backgroundColor: '#fff',
    borderRadius: '4px',
    fontSize: '12px',
    color: '#856404',
    border: '1px solid #ffeeba'
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
    zIndex: 1000
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '20px',
    maxWidth: '400px',
    width: '90%',
    position: 'relative' as const
  },
  modalClose: {
    position: 'absolute' as const,
    top: '10px',
    right: '10px',
    width: '30px',
    height: '30px',
    borderRadius: '50%',
    border: 'none',
    backgroundColor: '#ff4444',
    color: 'white',
    fontSize: '20px',
    cursor: 'pointer'
  },
  modalTitle: {
    fontSize: '20px',
    margin: '0 0 20px 0',
    color: '#333'
  },
  modalBody: {
    textAlign: 'center' as const
  },
  modalIcon: {
    fontSize: '48px',
    marginBottom: '15px'
  },
  modalScreenName: {
    fontSize: '18px',
    margin: '0 0 10px 0',
    color: '#333'
  },
  modalWeek: {
    fontSize: '14px',
    color: '#666',
    marginBottom: '20px'
  },
  modalActions: {
    display: 'flex',
    gap: '10px',
    justifyContent: 'center'
  },
  modalButton: {
    padding: '8px 16px',
    backgroundColor: '#FF8C42',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
  }
};

export default WeeklyProgress;