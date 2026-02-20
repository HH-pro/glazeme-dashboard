// src/components/PasswordModal.tsx
import React, { useState, useEffect } from 'react';

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

  // Handle escape key press
  useEffect(() => {
    const handleEscKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscKey);
    return () => window.removeEventListener('keydown', handleEscKey);
  }, [isOpen, onClose]);

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

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div style={styles.overlay} onClick={handleOverlayClick}>
      <div style={styles.modal} role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <div style={styles.header}>
          <h3 id="modal-title" style={styles.title}>🔒 Edit Mode</h3>
          <button 
            onClick={onClose} 
            style={styles.closeButton}
            aria-label="Close modal"
          >
            ×
          </button>
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
              aria-invalid={!!error}
              aria-describedby={error ? "password-error" : undefined}
            />
            {error && <p id="password-error" style={styles.error}>{error}</p>}
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
    zIndex: 1000,
    padding: '16px',
    animation: 'fadeIn 0.2s ease-out',
  },
  modal: {
    backgroundColor: 'white',
    borderRadius: '12px',
    width: '100%',
    maxWidth: '400px',
    maxHeight: '90vh',
    overflow: 'auto',
    boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
    animation: 'slideUp 0.3s ease-out',
    margin: '16px',
    '@media (max-width: 480px)': {
      margin: '12px',
      borderRadius: '10px',
    },
  },
  header: {
    padding: '20px',
    borderBottom: '1px solid #e9ecef',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    '@media (max-width: 480px)': {
      padding: '16px',
    },
  },
  title: {
    margin: 0,
    fontSize: '18px',
    color: '#333',
    '@media (max-width: 480px)': {
      fontSize: '16px',
    },
  },
  closeButton: {
    background: 'none',
    border: 'none',
    fontSize: '24px',
    cursor: 'pointer',
    color: '#666',
    padding: '4px 8px',
    borderRadius: '4px',
    transition: 'background-color 0.2s',
    ':hover': {
      backgroundColor: '#f0f0f0',
    },
    '@media (max-width: 480px)': {
      fontSize: '20px',
      padding: '8px',
    },
  },
  content: {
    padding: '20px',
    '@media (max-width: 480px)': {
      padding: '16px',
    },
  },
  description: {
    margin: '0 0 15px 0',
    color: '#666',
    fontSize: '14px',
    '@media (max-width: 480px)': {
      fontSize: '13px',
      marginBottom: '12px',
    },
  },
  input: {
    width: '100%',
    padding: '12px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '14px',
    outline: 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    ':focus': {
      borderColor: '#28a745',
      boxShadow: '0 0 0 3px rgba(40, 167, 69, 0.1)',
    },
    '@media (max-width: 480px)': {
      padding: '10px',
      fontSize: '16px', // Prevents zoom on mobile
    },
  },
  error: {
    color: '#dc3545',
    fontSize: '13px',
    marginTop: '8px',
    '@media (max-width: 480px)': {
      fontSize: '12px',
    },
  },
  footer: {
    padding: '20px',
    borderTop: '1px solid #e9ecef',
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '10px',
    '@media (max-width: 480px)': {
      padding: '16px',
      flexDirection: 'column-reverse' as const,
      gap: '8px',
    },
  },
  cancelButton: {
    padding: '10px 20px',
    backgroundColor: '#f8f9fa',
    border: '1px solid #dee2e6',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'background-color 0.2s',
    ':hover': {
      backgroundColor: '#e9ecef',
    },
    '@media (max-width: 480px)': {
      padding: '12px',
      width: '100%',
      fontSize: '16px',
    },
  },
  submitButton: {
    padding: '10px 20px',
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'background-color 0.2s',
    ':hover': {
      backgroundColor: '#218838',
    },
    '@media (max-width: 480px)': {
      padding: '12px',
      width: '100%',
      fontSize: '16px',
    },
  },
};

// Add keyframe animations to your global CSS or create a style tag
const globalStyles = `
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

// Add styles to head (optional - you can also add these to your global CSS file)
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style');
  styleElement.textContent = globalStyles;
  document.head.appendChild(styleElement);
}

export default PasswordModal;