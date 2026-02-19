// src/components/AdminPanel.tsx
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const AdminPanel: React.FC = () => {
  const { logout } = useAuth();
  const [activeSection, setActiveSection] = useState<'users' | 'settings' | 'logs' | 'backup'>('users');
  const [notifications, setNotifications] = useState(false);
  const [liveFeed, setLiveFeed] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState('30 seconds');

  return (
    <div>
      <h2 style={styles.sectionTitle}>⚡ Admin Control Panel</h2>
      
      <div style={styles.adminTabs}>
        <button 
          style={{
            ...styles.adminTab,
            ...(activeSection === 'users' ? styles.activeAdminTab : {})
          }}
          onClick={() => setActiveSection('users')}
        >
          👥 User Management
        </button>
        <button 
          style={{
            ...styles.adminTab,
            ...(activeSection === 'settings' ? styles.activeAdminTab : {})
          }}
          onClick={() => setActiveSection('settings')}
        >
          ⚙️ System Settings
        </button>
        <button 
          style={{
            ...styles.adminTab,
            ...(activeSection === 'logs' ? styles.activeAdminTab : {})
          }}
          onClick={() => setActiveSection('logs')}
        >
          📋 Activity Logs
        </button>
        <button 
          style={{
            ...styles.adminTab,
            ...(activeSection === 'backup' ? styles.activeAdminTab : {})
          }}
          onClick={() => setActiveSection('backup')}
        >
          💾 Backup & Restore
        </button>
      </div>

      <div style={styles.adminContent}>
        {activeSection === 'users' && (
          <div>
            <h3 style={styles.sectionHeading}>User Access Management</h3>
            <p style={styles.paragraph}>Current passwords (change in .env):</p>
            <ul style={styles.list}>
              <li style={styles.listItem}>👑 Admin: GlazeMe2024!</li>
              <li style={styles.listItem}>👀 Client: viewonly123</li>
            </ul>
            <button 
              style={styles.resetButton}
              onClick={() => alert('Password reset feature coming soon!')}
            >
              Reset Admin Password
            </button>
          </div>
        )}

        {activeSection === 'settings' && (
          <div>
            <h3 style={styles.sectionHeading}>Dashboard Settings</h3>
            <div style={styles.settingItem}>
              <label style={styles.checkboxLabel}>
                <input 
                  type="checkbox" 
                  checked={notifications}
                  onChange={(e) => setNotifications(e.target.checked)}
                  style={styles.checkbox}
                />
                Enable real-time notifications
              </label>
            </div>
            <div style={styles.settingItem}>
              <label style={styles.checkboxLabel}>
                <input 
                  type="checkbox" 
                  checked={liveFeed}
                  onChange={(e) => setLiveFeed(e.target.checked)}
                  style={styles.checkbox}
                />
                Show live development feed
              </label>
            </div>
            <div style={styles.settingItem}>
              <label style={styles.selectLabel}>
                Auto-refresh interval:
                <select 
                  style={styles.select}
                  value={refreshInterval}
                  onChange={(e) => setRefreshInterval(e.target.value)}
                >
                  <option value="5 seconds">5 seconds</option>
                  <option value="10 seconds">10 seconds</option>
                  <option value="30 seconds">30 seconds</option>
                  <option value="1 minute">1 minute</option>
                </select>
              </label>
            </div>
          </div>
        )}

        {activeSection === 'logs' && (
          <div>
            <h3 style={styles.sectionHeading}>Recent Activity</h3>
            <div style={styles.logEntry}>
              <span style={styles.logText}>2024-01-20 10:23: Admin added build update</span>
            </div>
            <div style={styles.logEntry}>
              <span style={styles.logText}>2024-01-20 09:15: Client accessed dashboard</span>
            </div>
            <div style={styles.logEntry}>
              <span style={styles.logText}>2024-01-19 16:42: Screen gallery updated</span>
            </div>
            <div style={styles.logEntry}>
              <span style={styles.logText}>2024-01-19 14:30: AI integration completed</span>
            </div>
          </div>
        )}

        {activeSection === 'backup' && (
          <div>
            <h3 style={styles.sectionHeading}>Backup & Restore</h3>
            <div style={styles.buttonGroup}>
              <button 
                style={styles.backupButton}
                onClick={() => alert('Downloading backup...')}
              >
                📥 Download Backup
              </button>
              <button 
                style={styles.restoreButton}
                onClick={() => alert('Restore feature coming soon!')}
              >
                📤 Restore from Backup
              </button>
            </div>
            <p style={styles.backupNote}>Last backup: 2024-01-20 00:00</p>
          </div>
        )}
      </div>

      <div style={styles.footer}>
        <button 
          style={styles.logoutButton}
          onClick={logout}
        >
          🔒 Logout from Admin
        </button>
      </div>
    </div>
  );
};

// Styles object with proper TypeScript typing
const styles = {
  sectionTitle: {
    fontSize: '24px',
    margin: '0 0 20px 0',
    color: '#333',
    fontWeight: '600' as const
  },
  sectionHeading: {
    fontSize: '18px',
    margin: '0 0 15px 0',
    color: '#444',
    fontWeight: '500' as const
  },
  paragraph: {
    fontSize: '14px',
    color: '#666',
    margin: '0 0 10px 0'
  },
  list: {
    margin: '10px 0 20px 0',
    paddingLeft: '20px'
  },
  listItem: {
    fontSize: '14px',
    color: '#333',
    marginBottom: '5px'
  },
  adminTabs: {
    display: 'flex',
    gap: '10px',
    marginBottom: '20px',
    borderBottom: '2px solid #dee2e6',
    paddingBottom: '10px',
    flexWrap: 'wrap' as const
  },
  adminTab: {
    padding: '8px 16px',
    border: 'none',
    backgroundColor: 'transparent',
    cursor: 'pointer',
    fontSize: '14px',
    color: '#6c757d',
    borderRadius: '6px',
    transition: 'all 0.2s'
  },
  activeAdminTab: {
    color: '#FF8C42',
    backgroundColor: '#fff4e5',
    fontWeight: '500' as const
  },
  adminContent: {
    padding: '20px',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    minHeight: '300px',
    marginBottom: '20px'
  },
  settingItem: {
    marginBottom: '15px',
    fontSize: '14px'
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    color: '#333'
  },
  checkbox: {
    width: '16px',
    height: '16px',
    cursor: 'pointer'
  },
  selectLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontSize: '14px',
    color: '#333'
  },
  select: {
    padding: '8px',
    borderRadius: '4px',
    border: '1px solid #ddd',
    fontSize: '14px',
    backgroundColor: 'white',
    minWidth: '120px'
  },
  resetButton: {
    padding: '10px 20px',
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500' as const,
    transition: 'background-color 0.2s'
  },
  logEntry: {
    padding: '12px',
    backgroundColor: 'white',
    borderRadius: '6px',
    marginBottom: '8px',
    border: '1px solid #e9ecef'
  },
  logText: {
    fontSize: '13px',
    color: '#495057'
  },
  buttonGroup: {
    display: 'flex',
    gap: '10px',
    marginBottom: '15px'
  },
  backupButton: {
    padding: '10px 20px',
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500' as const,
    transition: 'background-color 0.2s'
  },
  restoreButton: {
    padding: '10px 20px',
    backgroundColor: '#ffc107',
    color: '#333',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500' as const,
    transition: 'background-color 0.2s'
  },
  backupNote: {
    marginTop: '15px',
    fontSize: '13px',
    color: '#6c757d',
    fontStyle: 'italic' as const
  },
  footer: {
    marginTop: '20px',
    paddingTop: '20px',
    borderTop: '1px solid #dee2e6',
    textAlign: 'right' as const
  },
  logoutButton: {
    padding: '10px 24px',
    backgroundColor: '#6c757d',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500' as const,
    transition: 'background-color 0.2s'
  }
};

export default AdminPanel;