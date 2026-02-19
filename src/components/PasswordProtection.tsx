// src/components/PasswordProtection.tsx
import React, { useState } from 'react';

interface PasswordProtectionProps {
  onAuthenticated: () => void;
}

const PasswordProtection: React.FC<PasswordProtectionProps> = ({ onAuthenticated }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // You can change this password to whatever you want
  const DASHBOARD_PASSWORD = 'glazeme2024';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === DASHBOARD_PASSWORD) {
      onAuthenticated();
      setError('');
    } else {
      setError('Incorrect password');
      setPassword('');
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.gradientBar} />
        
        <div style={styles.iconContainer}>
          <span style={styles.lockIcon}>🔒</span>
        </div>

        <h1 style={styles.title}>GlazeMe Dashboard</h1>
        <p style={styles.subtitle}>Protected Development Environment</p>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Password</label>
            <div style={styles.passwordContainer}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter dashboard password"
                style={styles.input}
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={styles.toggleButton}
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
          </div>

          {error && <p style={styles.error}>{error}</p>}

          <button type="submit" style={styles.button}>
            Access Dashboard
          </button>

          <p style={styles.hint}>
            Hint: Ask the developer for the password
          </p>
        </form>

        <div style={styles.features}>
          <div style={styles.feature}>
            <span>🚀</span>
            <span>Build Updates</span>
          </div>
          <div style={styles.feature}>
            <span>📊</span>
            <span>Analytics</span>
          </div>
          <div style={styles.feature}>
            <span>🤖</span>
            <span>AI Metrics</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: '#f5f7fa',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  },
  card: {
    width: '100%',
    maxWidth: '400px',
    padding: '40px',
    backgroundColor: 'white',
    borderRadius: '16px',
    boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
    position: 'relative' as const,
    overflow: 'hidden'
  },
  gradientBar: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    height: '6px',
    background: 'linear-gradient(135deg, #FFE55C 0%, #FF8C42 100%)'
  },
  iconContainer: {
    textAlign: 'center' as const,
    marginBottom: '20px'
  },
  lockIcon: {
    fontSize: '48px'
  },
  title: {
    fontSize: '28px',
    fontWeight: '600',
    color: '#333',
    textAlign: 'center' as const,
    margin: '0 0 8px 0'
  },
  subtitle: {
    fontSize: '14px',
    color: '#666',
    textAlign: 'center' as const,
    marginBottom: '30px'
  },
  form: {
    marginBottom: '30px'
  },
  inputGroup: {
    marginBottom: '20px'
  },
  label: {
    display: 'block',
    marginBottom: '8px',
    fontSize: '14px',
    fontWeight: '500',
    color: '#333'
  },
  passwordContainer: {
    position: 'relative' as const,
    display: 'flex',
    alignItems: 'center'
  },
  input: {
    width: '100%',
    padding: '12px',
    paddingRight: '45px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    fontSize: '16px',
    outline: 'none',
    transition: 'border-color 0.2s',
    boxSizing: 'border-box' as const
  },
  toggleButton: {
    position: 'absolute' as const,
    right: '12px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '18px',
    padding: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
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
    transition: 'background-color 0.2s',
    marginBottom: '15px'
  },
  error: {
    color: '#dc3545',
    fontSize: '14px',
    marginTop: '-10px',
    marginBottom: '15px',
    textAlign: 'center' as const
  },
  hint: {
    fontSize: '12px',
    color: '#999',
    textAlign: 'center' as const,
    margin: 0
  },
  features: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '10px',
    borderTop: '1px solid #eee',
    paddingTop: '20px'
  },
  feature: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: '5px',
    fontSize: '12px',
    color: '#666'
  }
};

export default PasswordProtection;