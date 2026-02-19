// src/components/WeeklyProgress.tsx
import React, { useState } from 'react';

interface Week {
  number: number;
  focus: string;
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
    { number: 1, focus: 'UI/UX + Extension Setup', tasks: ['iMessage extension setup', 'Basic UI layout', 'Navigation flow'], completed: false, progress: 33 },
    { number: 2, focus: 'AI Integration', tasks: ['OpenAI API setup', 'Prompt engineering', 'Response handling'], completed: false, progress: 0 },
    { number: 3, focus: 'Prompt Tuning + Error Handling', tasks: ['Refine AI prompts', 'Error states', 'Fallback responses'], completed: false, progress: 0 },
    { number: 4, focus: 'Feature Polish', tasks: ['Favorites system', 'Regenerate option', 'Share functionality'], completed: false, progress: 0 },
    { number: 5, focus: 'Testing + Optimization', tasks: ['Performance testing', 'Bug fixes', 'Memory optimization'], completed: false, progress: 0 },
    { number: 6, focus: 'Deployment Prep', tasks: ['App Store assets', 'Final testing', 'Submission'], completed: false, progress: 0 },
  ]);

  const [editingWeek, setEditingWeek] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Week | null>(null);
  const [showAddWeekForm, setShowAddWeekForm] = useState(false);
  const [newWeek, setNewWeek] = useState<Partial<Week>>({
    number: 7,
    focus: '',
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
    if (newWeek.focus && newWeek.tasks) {
      const weekToAdd: Week = {
        number: newWeek.number || weeks.length + 1,
        focus: newWeek.focus,
        tasks: typeof newWeek.tasks === 'string' 
          ? (newWeek.tasks as string).split(',').map(t => t.trim()) 
          : newWeek.tasks as string[],
        completed: newWeek.completed || false,
        progress: newWeek.progress || 0
      };
      setWeeks([...weeks, weekToAdd]);
      setShowAddWeekForm(false);
      setNewWeek({
        number: weeks.length + 2,
        focus: '',
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
        const newTasks = [...week.tasks];
        // Toggle task completion (you can implement this based on your data structure)
        // For now, we'll just update the progress
        const completedCount = newTasks.filter((_, i) => i <= taskIndex).length;
        const newProgress = Math.round((completedCount / newTasks.length) * 100);
        
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

  return (
    <div>
      <div style={styles.header}>
        <div>
          <h2 style={styles.sectionTitle}>6-Week Development Plan</h2>
          <p style={styles.subtitle}>Building GlazeMe screen by screen, week by week</p>
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

      {/* Overall Progress Bar */}
      <div style={styles.overallProgress}>
        <div style={styles.overallProgressHeader}>
          <span style={styles.overallProgressLabel}>Overall Progress</span>
          <span style={styles.overallProgressValue}>{overallProgress}%</span>
        </div>
        <div style={styles.progressBarContainer}>
          <div style={{...styles.progressBarFill, width: `${overallProgress}%`}} />
        </div>
      </div>

      {/* Add Week Form */}
      {isEditMode && showAddWeekForm && (
        <div style={styles.addWeekForm}>
          <h3 style={styles.formTitle}>Add New Week</h3>
          <input
            type="number"
            placeholder="Week Number"
            value={newWeek.number}
            onChange={(e) => setNewWeek({...newWeek, number: parseInt(e.target.value)})}
            style={styles.input}
          />
          <input
            type="text"
            placeholder="Week Focus (e.g., Feature Polish)"
            value={newWeek.focus}
            onChange={(e) => setNewWeek({...newWeek, focus: e.target.value})}
            style={styles.input}
          />
          <textarea
            placeholder="Tasks (comma-separated)"
            value={Array.isArray(newWeek.tasks) ? newWeek.tasks.join(', ') : ''}
            onChange={(e) => setNewWeek({...newWeek, tasks: e.target.value.split(',').map(t => t.trim())})}
            style={styles.textarea}
          />
          <input
            type="range"
            min="0"
            max="100"
            value={newWeek.progress}
            onChange={(e) => setNewWeek({...newWeek, progress: parseInt(e.target.value)})}
            style={styles.range}
          />
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
                  value={editForm.tasks.join('\n')}
                  onChange={(e) => setEditForm({...editForm, tasks: e.target.value.split('\n').filter(t => t.trim())})}
                  style={styles.textarea}
                  placeholder="Tasks (one per line)"
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
                  {isEditMode && (
                    <button 
                      onClick={() => handleEditClick(week)}
                      style={styles.editWeekButton}
                    >
                      ✏️ Edit
                    </button>
                  )}
                </div>
                
                <ul style={styles.taskList}>
                  {week.tasks.map((task, index) => (
                    <li 
                      key={index} 
                      style={{
                        ...styles.taskItem,
                        ...(week.progress && week.progress > (index / week.tasks.length) * 100 
                          ? styles.taskCompleted 
                          : {})
                      }}
                      onClick={() => handleTaskToggle(week.number, index)}
                    >
                      <span style={styles.taskBullet}>
                        {week.progress && week.progress > (index / week.tasks.length) * 100 ? '✅' : '○'}
                      </span>
                      {task}
                    </li>
                  ))}
                </ul>
                
                <div style={styles.progressSection}>
                  <div style={styles.progressHeader}>
                    <span style={styles.progressLabel}>Week Progress</span>
                    <span style={styles.progressValue}>{week.progress || 0}%</span>
                  </div>
                  <div style={styles.progressBar}>
                    <div style={{
                      ...styles.progressFill,
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

      <div style={styles.note}>
        <p>🎯 Current Focus: Week 1 - Building iMessage extension foundation</p>
        <p>📱 Next Screen: Keyboard extension UI with yellow→orange gradient</p>
        <p>⚡ Development Velocity: {weeks.filter(w => w.completed).length} weeks completed</p>
      </div>
    </div>
  );
};

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
  timeline: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '15px'
  },
  weekCard: {
    padding: '15px',
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    border: '1px solid #eee'
  },
  weekHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px'
  },
  weekHeaderLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px'
  },
  weekNumber: {
    padding: '4px 8px',
    backgroundColor: '#FF8C42',
    color: 'white',
    borderRadius: '4px',
    fontSize: '14px',
    fontWeight: 'bold'
  },
  weekFocus: {
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#333'
  },
  editWeekButton: {
    padding: '4px 8px',
    backgroundColor: '#f8f9fa',
    border: '1px solid #dee2e6',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px'
  },
  taskList: {
    margin: '10px 0',
    paddingLeft: '20px',
    color: '#666'
  },
  taskItem: {
    fontSize: '14px',
    marginBottom: '5px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  taskCompleted: {
    color: '#999',
    textDecoration: 'line-through'
  },
  taskBullet: {
    fontSize: '14px'
  },
  progressSection: {
    marginTop: '10px'
  },
  progressHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '5px'
  },
  progressLabel: {
    fontSize: '12px',
   