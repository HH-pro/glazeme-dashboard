// src/App.tsx
import React from 'react';
import { AuthProvider } from './context/AuthContext';
import ProtectedDashboard from './components/ProtectedDashboard';

function App() {
  return (
    <AuthProvider>
      <ProtectedDashboard />
    </AuthProvider>
  );
}

export default App;