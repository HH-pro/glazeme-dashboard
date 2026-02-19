// src/components/DeploymentTracker.tsx
import React from 'react';

const DeploymentTracker: React.FC = () => {
  const deployments = [
    {
      id: 1,
      version: 'v0.1.0',
      date: '2024-01-15',
      status: 'live',
      environment: 'development',
      features: ['iMessage Extension Setup', 'Basic UI']
    },
    {
      id: 2,
      version: 'v0.2.0',
      date: '2024-01-22',
      status: 'live',
      environment: 'development',
      features: ['AI Integration', 'Prompt Engineering']
    },
    {
      id: 3,
      version: 'v0.3.0',
      date: '2024-01-29',
      status: 'in-progress',
      environment: 'staging',
      features: ['Error Handling', 'Performance Optimization']
    }
  ];

  return (
    <div>
      <h2 style={styles.sectionTitle}>🚀 Deployment Pipeline</h2>
      
      <div style={styles.environments}>
        <div style={styles.environment}>
          <h3>🟢 Development</h3>
          <p>Latest: v0.3.0</p>
          <p>Status: Active Development</p>
        </div>
        <div style={styles.environment}>
          <h3>🟡 Staging</h3>
          <p>Latest: v0.2.0</p>
          <p>Status: Testing</p>
        </div>
        <div style={styles.environment}>
          <h3>🔵 Production</h3>
          <p>Latest: v0.1.0</p>
          <p>Status: Live</p>
        </div>
      </div>

      <div style={styles.timeline}>
        <h3>Deployment History</h3>
        {deployments.map(deploy => (
          <div key={deploy.id} style={styles.deployCard}>
            <div style={styles.deployHeader}>
              <span style={styles.version}>{deploy.version}</span>
              <span style={{
                ...styles.status,
                backgroundColor: deploy.status === 'live' ? '#d4edda' : '#fff3cd',
                color: deploy.status === 'live' ? '#155724' : '#856404'
              }}>
                {deploy.status}
              </span>
            </div>
            <p style={styles.date}>📅 {deploy.date}</p>
            <div style={styles.features}>
              {deploy.features.map(feature => (
                <span key={feature} style={styles.feature}>✓ {feature}</span>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div style={styles.nextSteps}>
        <h3>📋 Next Deployment (Week 4)</h3>
        <ul style={styles.stepsList}>
          <li>✅ iMessage Extension Foundation</li>
          <li>✅ AI Integration</li>
          <li>✅ Basic Prompt Engineering</li>
          <li>🔄 Error Handling System</li>
          <li>⏳ Performance Optimization</li>
          <li>⏳ TestFlight Distribution</li>
        </ul>
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
  environments: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '15px',
    marginBottom: '30px'
  },
  environment: {
    padding: '20px',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    border: '1px solid #e9ecef'
  },
  timeline: {
    marginBottom: '30px'
  },
  deployCard: {
    padding: '15px',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    marginBottom: '10px',
    border: '1px solid #e9ecef'
  },
  deployHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px'
  },
  version: {
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#333'
  },
  status: {
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '12px',
    textTransform: 'capitalize' as const
  },
  date: {
    fontSize: '13px',
    color: '#666',
    marginBottom: '10px'
  },
  features: {
    display: 'flex',
    flexWrap: 'wrap' as 'wrap',
    gap: '10px'
  },
  feature: {
    fontSize: '12px',
    color: '#28a745',
    padding: '2px 8px',
    backgroundColor: '#f8f9fa',
    borderRadius: '4px'
  },
  nextSteps: {
    padding: '20px',
    backgroundColor: '#fff3cd',
    borderRadius: '8px',
    border: '1px solid #ffeeba'
  },
  stepsList: {
    listStyle: 'none',
    padding: 0,
    margin: 0
  }
};

export default DeploymentTracker;