// src/components/AdminPanel.tsx
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const AdminPanel: React.FC = () => {
  const { logout } = useAuth();
  const [activeSection, setActiveSection] = useState<'users' | 'settings' | 'logs' | 'backup'>('users');

  return (
    <div>
      <h2 style={styles.sectionTitle}>⚡ Admin Control Panel</h2>
      
      <div style={styles.adminTabs}>
        <button 
          style={{...styles.adminTab, ...(activeSection === 'users' ? styles.activeAdminTab : {})}}
          onClick={() => setActiveSection('users')}
        >
          👥 User Management
        </button>
        <button 
          style={{...styles.adminTab, ...(activeSection === 'settings' ? styles.activeAdminTab : {})}}
          onClick={() => setActiveSection('settings')}
        >
          ⚙️ System Settings
        </button>
        <button 
          style={{...styles.adminTab, ...(activeSection === 'logs' ? styles.activeAdminTab : {})}}
          onClick={() => setActiveSection('logs')}
        >
          📋 Activity Logs
        </button>
        <button 
          style={{...styles.adminTab, ...(activeSection === 'backup' ? styles.activeAdminTab : {})}}
          onClick={() => setActiveSection('backup')}
        >
          💾 Backup & Restore
        </button>
      </div>

      <div style={styles.adminContent}>
        {activeSection === 'users' && (
          <div>
            <h3>User Access Management</h3>
            <p>Current passwords (change in .env):</p>
            <ul>
              <li>👑 Admin: GlazeMe2024!</li>
              <li>👀 Client: viewonly123</li>
            </ul>
            <button style={styles.resetButton}>Reset Admin Password</button>
          </div>
        )}

        {activeSection === 'settings' && (
          <div>
            <h3>Dashboard Settings</h3>
            <label style={styles.settingItem}>
              <input type="checkbox" /> Enable real-time notifications
            </label>
            <label style={styles.settingItem}>
              <input type="checkbox" checked /> Show live development feed
            </label>
            <label style={styles.settingItem}>
              Auto-refresh interval: 
              <select style={styles.select}>
                <option>5 seconds</option>
                <option>10 seconds</option>
                <option>30 seconds</option>
                <option>1 minute</option>
              </select>
            </label>
          </div>
        )}

        {activeSection === 'logs' && (
          <div>
            <h3>Recent Activity</h3>
            <div style={styles.logEntry}>
              <span>2024-01-20 10:23: Admin added build update</span>
            </div>
            <div style={styles.logEntry}>
              <span>2024-01-20 09:15: Client accessed dashboard</span>
            </div>
            <div style={styles.logEntry}>
              <span>2024-01-19 16:42: Screen gallery updated</span>
            </div>
          </div>
        )}

        {activeSection === 'backup' && (
          <div>
            <h3>Backup & Restore</h3>
            <button style={styles.backupButton}>📥 Download Backup</button>
            <button style={styles.restoreButton}>📤 Restore from Backup</button>
            <p style={styles.backupNote}>Last backup: 2024-01-20 00:00</p>
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  sectionTitle: {
    fontSize: '22px',
    margin: '0 0 20px 0',
    color: '#333'
  },
  adminTabs: {
    display: 'flex',
    gap: '10px',
    marginBottom: '20px',
    borderBottom: '2px solid #dee2e6',
    paddingBottom: '10px'
  },
  adminTab: {
    padding: '8px 16px',
    border: 'none',
    backgroundColor: 'transparent',
    cursor: 'pointer',
    fontSize: '14px',
    color: '#6c757d',
    borderRadius: '6px'
  },
  activeAdminTab: {
    color: '#FF8C42',
    backgroundColor: '#fff4e5',
    fontWeight: '500'
  },
  adminContent: {
    padding: '20px',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    minHeight: '300px'
  },
  resetButton: {
    padding: '10px 20px',
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    marginTop: '10px'
  },
  settingItem: {
    display: 'block',
    marginBottom: '15px',
    fontSize: '14px'
  },
  select: {
    marginLeft: '10px',
    padding: '5px',
    borderRadius: '4px',
    border: '1px solid #ddd'
  },
  logEntry: {
    padding: '10px',
    backgroundColor: 'white',
    borderRadius: '4px',
    marginBottom: '5px',
    fontSize: '13px',
    border: '1px solid #e9ecef'
  },
  backupButton: {
    padding: '10px 20px',
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    marginRight: '10px'
  },
  restoreButton: {
    padding: '10px 20px',
    backgroundColor: '#ffc107',
    color: '#333',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer'
  },
  backupNote: {
    marginTop: '15px',
    fontSize: '12px',
    color: '#666'
  }
};

export default AdminPanel;