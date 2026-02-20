// src/components/PasswordModal.tsx
import React, { useState, useEffect, useRef } from 'react';

interface PasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const PasswordModal: React.FC<PasswordModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // In production, this should be stored securely (environment variables, secure backend)
  const CORRECT_PASSWORD = 'glazeme2024';

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));

    if (password === CORRECT_PASSWORD) {
      setPassword('');
      onSuccess();
    } else {
      setError('Incorrect password. Please try again.');
    }
    setIsLoading(false);
  };

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      style={styles.overlay} 
      onClick={handleOverlayClick}
      role="presentation"
    >
      <div 
        style={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div style={styles.header}>
          <h3 style={styles.title} id="modal-title">
            <span style={styles.titleIcon}>🔒</span>
            Edit Mode
          </h3>
          <button 
            onClick={onClose} 
            style={styles.closeButton}
            aria-label="Close modal"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
        
        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.content}>
            <p style={styles.description}>
              This area is password protected. Please enter the password to enable edit mode.
            </p>
            
            <div style={styles.inputGroup}>
              <input
                ref={inputRef}
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError('');
                }}
                placeholder="Enter password"
                style={{
                  ...styles.input,
                  ...(error ? styles.inputError : {})
                }}
                disabled={isLoading}
                aria-invalid={!!error}
                aria-describedby={error ? "password-error" : undefined}
              />
              {error && (
                <p style={styles.error} id="password-error">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={styles.errorIcon}>
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="8" x2="12" y2="12"/>
                    <line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  {error}
                </p>
              )}
            </div>
          </div>
          
          <div style={styles.footer}>
            <button 
              type="button" 
              onClick={onClose} 
              style={styles.cancelButton}
              disabled={isLoading}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              style={styles.submitButton}
              disabled={isLoading || !password}
            >
              {isLoading ? (
                <>
                  <span style={styles.spinner} />
                  Verifying...
                </>
              ) : (
                'Unlock Edit Mode'
              )}
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
    backdropFilter: 'blur(4px)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    padding: '16px',
    animation: 'fadeIn 0.2s ease-out'
  },
  modal: {
    backgroundColor: 'white',
    borderRadius: '16px',
    width: '100%',
    maxWidth: '440px',
    boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
    animation: 'slideUp 0.3s ease-out',
    overflow: 'hidden'
  },
  header: {
    padding: '20px 24px',
    borderBottom: '1px solid #e9ecef',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  title: {
    margin: 0,
    fontSize: 'clamp(18px, 4vw, 20px)',
    fontWeight: 600,
    color: '#1a1a1a',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  titleIcon: {
    fontSize: '24px'
  },
  closeButton: {
    background: 'none',
    border: 'none',
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    cursor: 'pointer',
    color: '#666',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s',
    ':hover': {
      backgroundColor: '#f0f0f0',
      color: '#333'
    }
  },
  form: {
    display: 'flex',
    flexDirection: 'column' as const
  },
  content: {
    padding: '24px'
  },
  description: {
    margin: '0 0 20px 0',
    color: '#666',
    fontSize: 'clamp(14px, 3.5vw, 15px)',
    lineHeight: 1.5
  },
  inputGroup: {
    width: '100%'
  },
  input: {
    width: '100%',
    padding: '12px 16px',
    border: '2px solid #e0e0e0',
    borderRadius: '12px',
    fontSize: 'clamp(14px, 3.5vw, 15px)',
    outline: 'none',
    transition: 'all 0.2s',
    backgroundColor: '#f8f9fa',
    ':focus': {
      borderColor: '#28a745',
      backgroundColor: 'white',
      boxShadow: '0 0 0 4px rgba(40, 167, 69, 0.1)'
    },
    ':disabled': {
      opacity: 0.6,
      cursor: 'not-allowed'
    }
  },
  inputError: {
    borderColor: '#dc3545',
    ':focus': {
      borderColor: '#dc3545',
      boxShadow: '0 0 0 4px rgba(220, 53, 69, 0.1)'
    }
  },
  error: {
    color: '#dc3545',
    fontSize: '14px',
    marginTop: '8px',
    display: 'flex',
    alignItems: 'center',
    gap: '6px'
  },
  errorIcon: {
    flexShrink: 0
  },
  footer: {
    padding: '20px 24px',
    borderTop: '1px solid #e9ecef',
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    backgroundColor: '#f8f9fa'
  },
  cancelButton: {
    padding: '10px 20px',
    backgroundColor: 'white',
    border: '1px solid #dee2e6',
    borderRadius: '10px',
    cursor: 'pointer',
    fontSize: 'clamp(14px, 3.5vw, 15px)',
    fontWeight: 500,
    color: '#666',
    transition: 'all 0.2s',
    ':hover': {
      backgroundColor: '#f0f0f0',
      borderColor: '#c0c0c0'
    },
    ':disabled': {
      opacity: 0.5,
      cursor: 'not-allowed'
    }
  },
  submitButton: {
    padding: '10px 24px',
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    fontSize: 'clamp(14px, 3.5vw, 15px)',
    fontWeight: 500,
    transition: 'all 0.2s',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    ':hover': {
      backgroundColor: '#218838',
      transform: 'translateY(-1px)',
      boxShadow: '0 4px 12px rgba(40, 167, 69, 0.2)'
    },
    ':disabled': {
      opacity: 0.6,
      cursor: 'not-allowed',
      transform: 'none',
      boxShadow: 'none'
    }
  },
  spinner: {
    display: 'inline-block',
    width: '16px',
    height: '16px',
    border: '2px solid rgba(255,255,255,0.3)',
    borderRadius: '50%',
    borderTopColor: 'white',
    animation: 'spin 0.8s linear infinite'
  }
};

// Add global styles for animations
const styleSheet = document.createElement("style");
styleSheet.textContent = `
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

  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;
document.head.appendChild(styleSheet);

export default PasswordModal;