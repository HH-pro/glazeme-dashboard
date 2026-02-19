// src/components/ProtectedDashboard.tsx
import React from 'react';
import { useAuth } from '../context/AuthContext';
import Login from './Login';
import Dashboard from './Dashboard';

const ProtectedDashboard: React.FC = () => {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Login />;
  }

  return <Dashboard />;
};

export default ProtectedDashboard;