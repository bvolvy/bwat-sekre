import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

interface AuthContextProps {
  isAuthenticated: boolean;
  adminName: string;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  updatePassword: (currentPassword: string, newPassword: string) => Promise<boolean>;
  updateAdminName: (name: string) => void;
}

interface AdminCredentials {
  email: string;
  password: string;
  name: string;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminName, setAdminName] = useState('Admin');
  const navigate = useNavigate();

  useEffect(() => {
    const authStatus = localStorage.getItem('isAuthenticated');
    if (authStatus === 'true') {
      setIsAuthenticated(true);
      // Load admin name from credentials
      const credentials = getStoredCredentials();
      setAdminName(credentials.name);
    }
  }, []);

  const getStoredCredentials = (): AdminCredentials => {
    const storedCredentials = localStorage.getItem('adminCredentials');
    if (storedCredentials) {
      return JSON.parse(storedCredentials);
    }
    // Default credentials
    return {
      email: 'admin@bwatsekre.com',
      password: 'Admin@123!',
      name: 'Admin'
    };
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    const credentials = getStoredCredentials();
    
    if (email === credentials.email && password === credentials.password) {
      setIsAuthenticated(true);
      setAdminName(credentials.name);
      localStorage.setItem('isAuthenticated', 'true');
      return true;
    }
    return false;
  };

  const logout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('isAuthenticated');
    navigate('/login');
  };

  const updatePassword = async (currentPassword: string, newPassword: string): Promise<boolean> => {
    const credentials = getStoredCredentials();
    
    if (currentPassword === credentials.password) {
      const updatedCredentials = {
        ...credentials,
        password: newPassword
      };
      localStorage.setItem('adminCredentials', JSON.stringify(updatedCredentials));
      return true;
    }
    return false;
  };

  const updateAdminName = (name: string) => {
    const credentials = getStoredCredentials();
    const updatedCredentials = {
      ...credentials,
      name
    };
    localStorage.setItem('adminCredentials', JSON.stringify(updatedCredentials));
    setAdminName(name);
  };

  return (
    <AuthContext.Provider value={{ 
      isAuthenticated, 
      adminName,
      login, 
      logout, 
      updatePassword,
      updateAdminName 
    }}>
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