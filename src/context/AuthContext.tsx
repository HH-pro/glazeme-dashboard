// src/context/AuthContext.tsx
import React, { createContext, useState, useContext, useEffect } from 'react';

interface AuthContextType {
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (password: string) => boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// In production, move this to environment variables
const ADMIN_PASSWORD = "GlazeMe2024!"; // Change this to your secure password
const CLIENT_PASSWORD = "viewonly123"; // Client view-only password

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Check for existing session
    const session = localStorage.getItem('glazeme_session');
    if (session) {
      const { authenticated, admin } = JSON.parse(session);
      setIsAuthenticated(authenticated);
      setIsAdmin(admin);
    }
  }, []);

  const login = (password: string): boolean => {
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      setIsAdmin(true);
      localStorage.setItem('glazeme_session', JSON.stringify({ authenticated: true, admin: true }));
      return true;
    } else if (password === CLIENT_PASSWORD) {
      setIsAuthenticated(true);
      setIsAdmin(false);
      localStorage.setItem('glazeme_session', JSON.stringify({ authenticated: true, admin: false }));
      return true;
    }
    return false;
  };

  const logout = () => {
    setIsAuthenticated(false);
    setIsAdmin(false);
    localStorage.removeItem('glazeme_session');
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, isAdmin, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};