// src/components/PasswordModal.tsx
import React, { useState } from 'react';

interface PasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const PasswordModal: React.FC<PasswordModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // In production, this should be stored securely (environment variables, secure backend)
  const CORRECT_PASSWORD = 'glazeme2024'; // You can change this

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === CORRECT_PASSWORD) {
      setError('');
      setPassword('');
      onSuccess();
    } else {
      setError('Incorrect password');
    }
  };

  if (!isOpen) return null;

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.header}>
          <h3 style={styles.title}>🔒 Edit Mode</h3>
          <button onClick={onClose} style={styles.closeButton}>×</button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div style={styles.content}>
            <p style={styles.description}>
              Enter password to enable edit mode
            </p>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              style={styles.input}
              autoFocus
            />
            {error && <p style={styles.error}>{error}</p>}
          </div>
          
          <div style={styles.footer}>
            <button type="button" onClick={onClose} style={styles.cancelButton}>
              Cancel
            </button>
            <button type="submit" style={styles.submitButton}>
              Unlock Edit Mode
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000
  },
  modal: {
    backgroundColor: 'white',
    borderRadius: '12px',
    width: '400px',
    maxWidth: '90%',
    boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
  },
  header: {
    padding: '20px',
    borderBottom: '1px solid #e9ecef',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  title: {
    margin: 0,
    fontSize: '18px',
    color: '#333'
  },
  closeButton: {
    background: 'none',
    border: 'none',
    fontSize: '24px',
    cursor: 'pointer',
    color: '#666'
  },
  content: {
    padding: '20px'
  },
  description: {
    margin: '0 0 15px 0',
    color: '#666',
    fontSize: '14px'
  },
  input: {
    width: '100%',
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '14px',
    outline: 'none',
    transition: 'border-color 0.2s'
  },
  error: {
    color: '#dc3545',
    fontSize: '13px',
    marginTop: '10px'
  },
  footer: {
    padding: '20px',
    borderTop: '1px solid #e9ecef',
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '10px'
  },
  cancelButton: {
    padding: '8px 16px',
    backgroundColor: '#f8f9fa',
    border: '1px solid #dee2e6',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px'
  },
  submitButton: {
    padding: '8px 16px',
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px'
  }
};

export default PasswordModal;