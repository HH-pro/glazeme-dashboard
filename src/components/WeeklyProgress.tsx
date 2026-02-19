// src/components/WeeklyProgress.tsx
import React from 'react';

const WeeklyProgress: React.FC = () => {
  const weeks = [
    { number: 1, focus: 'UI/UX + Extension Setup', tasks: ['iMessage extension setup', 'Basic UI layout', 'Navigation flow'], completed: false },
    { number: 2, focus: 'AI Integration', tasks: ['OpenAI API setup', 'Prompt engineering', 'Response handling'], completed: false },
    { number: 3, focus: 'Prompt Tuning + Error Handling', tasks: ['Refine AI prompts', 'Error states', 'Fallback responses'], completed: false },
    { number: 4, focus: 'Feature Polish', tasks: ['Favorites system', 'Regenerate option', 'Share functionality'], completed: false },
    { number: 5, focus: 'Testing + Optimization', tasks: ['Performance testing', 'Bug fixes', 'Memory optimization'], completed: false },
    { number: 6, focus: 'Deployment Prep', tasks: ['App Store assets', 'Final testing', 'Submission'], completed: false },
  ];

  return (
    <div>
      <h2 style={styles.sectionTitle}>6-Week Development Plan</h2>
      <p style={styles.subtitle}>Building GlazeMe screen by screen, week by week</p>
      
      <div style={styles.timeline}>
        {weeks.map((week) => (
          <div key={week.number} style={styles.weekCard}>
            <div style={styles.weekHeader}>
              <span style={styles.weekNumber}>Week {week.number}</span>
              <span style={styles.weekFocus}>{week.focus}</span>
            </div>
            <ul style={styles.taskList}>
              {week.tasks.map((task, index) => (
                <li key={index} style={styles.taskItem}>• {task}</li>
              ))}
            </ul>
            <div style={styles.progressBar}>
              <div style={{
                ...styles.progressFill,
                width: week.completed ? '100%' : '33%',
                background: week.completed ? '#28a745' : '#FF8C42'
              }} />
            </div>
          </div>
        ))}
      </div>

      <div style={styles.note}>
        <p>🎯 Current Focus: Week 1 - Building iMessage extension foundation</p>
        <p>📱 Next Screen: Keyboard extension UI with yellow→orange gradient</p>
      </div>
    </div>
  );
};

const styles = {
  sectionTitle: {
    fontSize: '24px',
    margin: '0 0 10px 0',
    color: '#333'
  },
  subtitle: {
    fontSize: '14px',
    color: '#666',
    marginBottom: '20px'
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
    alignItems: 'center',
    gap: '15px',
    marginBottom: '10px'
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
  taskList: {
    margin: '10px 0',
    paddingLeft: '20px',
    color: '#666'
  },
  taskItem: {
    fontSize: '14px',
    marginBottom: '5px'
  },
  progressBar: {
    height: '8px',
    backgroundColor: '#e9ecef',
    borderRadius: '4px',
    overflow: 'hidden',
    marginTop: '10px'
  },
  progressFill: {
    height: '100%',
    transition: 'width 0.3s ease'
  },
  note: {
    marginTop: '20px',
    padding: '15px',
    backgroundColor: '#fff3cd',
    borderRadius: '8px',
    border: '1px solid #ffeeba'
  }
};

export default WeeklyProgress;