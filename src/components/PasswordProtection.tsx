// src/components/PasswordProtection.tsx
import React, { useState } from 'react';

interface PasswordProtectionProps {
  onSuccess: () => void;
  onCancel: () => void;
}

const PasswordProtection: React.FC<PasswordProtectionProps> = ({ onSuccess, onCancel }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Replace with your actual password check
    if (password === 'your-secure-password') { // ⚠️ In production, use environment variables and proper auth
      onSuccess();
    } else {
      setError('Invalid password');
    }
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <h3 style={styles.title}>🔒 Authentication Required</h3>
        <p style={styles.subtitle}>Enter password to add or edit updates</p>
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
            style={styles.input}
            autoFocus
          />
          {error && <p style={styles.error}>{error}</p>}
          <div style={styles.buttonGroup}>
            <button type="button" onClick={onCancel} style={styles.cancelButton}>
              Cancel
            </button>
            <button type="submit" style={styles.submitButton}>
              Authenticate
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const styles = {
  overlay: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999
  },
  modal: {
    backgroundColor: 'white',
    padding: '30px',
    borderRadius: '12px',
    width: '400px',
    maxWidth: '90%',
    boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
  },
  title: {
    margin: '0 0 10px 0',
    color: '#333'
  },
  subtitle: {
    margin: '0 0 20px 0',
    color: '#666',
    fontSize: '14px'
  },
  input: {
    width: '100%',
    padding: '12px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '16px',
    marginBottom: '15px',
    boxSizing: 'border-box' as const
  },
  error: {
    color: '#dc3545',
    fontSize: '14px',
    margin: '0 0 15px 0'
  },
  buttonGroup: {
    display: 'flex',
    gap: '10px',
    justifyContent: 'flex-end'
  },
  cancelButton: {
    padding: '10px 20px',
    backgroundColor: '#f8f9fa',
    border: '1px solid #ddd',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px'
  },
  submitButton: {
    padding: '10px 20px',
    backgroundColor: '#FF8C42',
    border: 'none',
    borderRadius: '6px',
    color: 'white',
    cursor: 'pointer',
    fontSize: '14px'
  }
};

export default PasswordProtection;