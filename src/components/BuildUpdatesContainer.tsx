// src/components/BuildUpdatesContainer.tsx
import React, { useState } from 'react';
import BuildUpdates from './BuildUpdates';
import { useBuildUpdates } from '../hooks/useBuildUpdates';

const BuildUpdatesContainer: React.FC = () => {
  const { 
    updates, 
    loading, 
    error, 
    addUpdate, 
    editUpdate, 
    deleteUpdate,
    refreshUpdates 
  } = useBuildUpdates();
  
  const [isEditMode, setIsEditMode] = useState(false);

  if (loading && updates.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <div style={{ fontSize: '18px', color: '#666' }}>Loading updates...</div>
      </div>
    );
  }

  if (error && updates.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <div style={{ fontSize: '18px', color: '#dc3545' }}>Error: {error}</div>
        <button 
          onClick={refreshUpdates}
          style={{
            marginTop: '20px',
            padding: '10px 20px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer'
          }}
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <>
      <div style={{ marginBottom: '20px', textAlign: 'right' }}>
        <button
          onClick={() => setIsEditMode(!isEditMode)}
          style={{
            padding: '10px 20px',
            backgroundColor: isEditMode ? '#dc3545' : '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          {isEditMode ? 'Exit Edit Mode' : 'Enter Edit Mode'}
        </button>
      </div>
      
      <BuildUpdates
        updates={updates}
        onAddUpdate={addUpdate}
        onEditUpdate={editUpdate}
        onDeleteUpdate={deleteUpdate}
        isEditMode={isEditMode}
        onEditAction={() => setIsEditMode(true)}
      />
    </>
  );
};

export default BuildUpdatesContainer;