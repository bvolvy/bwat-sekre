import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { SUPPORTED_CURRENCIES, type Currency } from '../types';

interface AuthContextProps {
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  updatePassword: (currentPassword: string, newPassword: string) => Promise<boolean>;
  defaultCurrency: Currency;
  updateDefaultCurrency: (currency: Currency) => void;
}

interface AdminCredentials {
  email: string;
  password: string;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [defaultCurrency, setDefaultCurrency] = useState<Currency>(() => {
    const stored = localStorage.getItem('defaultCurrency');
    return (stored && SUPPORTED_CURRENCIES.includes(stored as Currency)) ? stored as Currency : 'HTG';
  });
  const navigate = useNavigate();

  useEffect(() => {
    const authStatus = localStorage.getItem('isAuthenticated');
    if (authStatus === 'true') {
      setIsAuthenticated(true);
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
      password: 'Admin@123!'
    };
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    const credentials = getStoredCredentials();
    
    if (email === credentials.email && password === credentials.password) {
      setIsAuthenticated(true);
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

  const updateDefaultCurrency = (currency: Currency) => {
    setDefaultCurrency(currency);
    localStorage.setItem('defaultCurrency', currency);
  };

  return (
    <AuthContext.Provider value={{ 
      isAuthenticated, 
      login, 
      logout, 
      updatePassword,
      defaultCurrency,
      updateDefaultCurrency
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