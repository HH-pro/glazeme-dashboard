// src/components/Login.tsx
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const Login: React.FC = () => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showClientHint, setShowClientHint] = useState(false);
  const { login } = useAuth();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const success = login(password);
    if (!success) {
      setError('Invalid password');
      setPassword('');
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.loginBox}>
        <div style={styles.gradientBar} />
        
        <div style={styles.logoSection}>
          <h1 style={styles.title}>GlazeMe</h1>
          <p style={styles.subtitle}>Development Dashboard</p>
        </div>

        <div style={styles.accessCards}>
          <div style={styles.card}>
            <span style={styles.cardIcon}>👑</span>
            <h3 style={styles.cardTitle}>Admin Access</h3>
            <p style={styles.cardDesc}>Full access to add/edit updates</p>
          </div>
          <div style={styles.card}>
            <span style={styles.cardIcon}>👀</span>
            <h3 style={styles.cardTitle}>Client View</h3>
            <p style={styles.cardDesc}>Read-only access to monitor progress</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.inputGroup}>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter access password"
              style={styles.input}
              autoFocus
            />
            <button 
              type="button" 
              onClick={() => setShowClientHint(!showClientHint)}
              style={styles.hintButton}
            >
              ℹ️
            </button>
          </div>
          
          {error && <p style={styles.error}>{error}</p>}
          
          {showClientHint && (
            <div style={styles.hint}>
              <p><strong>Demo Access:</strong></p>
              <p>👑 Admin: Use "GlazeMe2024!"</p>
              <p>👀 Client: Use "viewonly123"</p>
              <p style={styles.hintNote}>*Change passwords in production</p>
            </div>
          )}

          <button type="submit" style={styles.button}>
            Access Dashboard
          </button>
        </form>

        <div style={styles.footer}>
          <p>🔒 Secure access for GlazeMe development</p>
          <p style={styles.buildInfo}>Build v1.0.0 • Real-time updates</p>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  },
  loginBox: {
    width: '400px',
    padding: '40px',
    backgroundColor: 'white',
    borderRadius: '16px',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
    position: 'relative' as const
  },
  gradientBar: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    height: '6px',
    background: 'linear-gradient(135deg, #FFE55C 0%, #FF8C42 100%)',
    borderTopLeftRadius: '16px',
    borderTopRightRadius: '16px'
  },
  logoSection: {
    textAlign: 'center' as const,
    marginBottom: '30px'
  },
  title: {
    fontSize: '36px',
    margin: '0 0 5px 0',
    color: '#333',
    fontWeight: '700'
  },
  subtitle: {
    fontSize: '14px',
    color: '#666',
    margin: 0
  },
  accessCards: {
    display: 'flex',
    gap: '10px',
    marginBottom: '30px'
  },
  card: {
    flex: 1,
    padding: '15px',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    textAlign: 'center' as const
  },
  cardIcon: {
    fontSize: '24px',
    display: 'block',
    marginBottom: '8px'
  },
  cardTitle: {
    fontSize: '14px',
    margin: '0 0 5px 0',
    color: '#333',
    fontWeight: '600'
  },
  cardDesc: {
    fontSize: '11px',
    color: '#666',
    margin: 0
  },
  form: {
    marginBottom: '20px'
  },
  inputGroup: {
    display: 'flex',
    gap: '10px',
    marginBottom: '10px'
  },
  input: {
    flex: 1,
    padding: '12px 16px',
    border: '2px solid #e9ecef',
    borderRadius: '8px',
    fontSize: '16px',
    outline: 'none',
    transition: 'border-color 0.3s'
  },
  hintButton: {
    width: '44px',
    height: '44px',
    border: '2px solid #e9ecef',
    borderRadius: '8px',
    backgroundColor: 'white',
    cursor: 'pointer',
    fontSize: '18px'
  },
  button: {
    width: '100%',
    padding: '14px',
    backgroundColor: '#FF8C42',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background-color 0.3s'
  },
  error: {
    color: '#dc3545',
    fontSize: '14px',
    margin: '0 0 10px 0',
    textAlign: 'center' as const
  },
  hint: {
    padding: '15px',
    backgroundColor: '#fff3cd',
    borderRadius: '8px',
    marginBottom: '20px',
    fontSize: '13px'
  },
  hintNote: {
    fontSize: '11px',
    color: '#856404',
    marginTop: '5px'
  },
  footer: {
    textAlign: 'center' as const,
    fontSize: '12px',
    color: '#999',
    borderTop: '1px solid #e9ecef',
    paddingTop: '20px'
  },
  buildInfo: {
    fontSize: '11px',
    marginTop: '5px',
    color: '#ccc'
  }
};

export default Login;