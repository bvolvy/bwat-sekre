import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Organization, User } from '../types';
import { toast } from 'react-toastify';
import bcrypt from 'bcryptjs';

interface OrganizationContextProps {
  currentOrganization: Organization | null;
  currentUser: User | null;
  organizations: Organization[];
  users: User[];
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  registerOrganization: (data: {
    name: string;
    address: string;
    logo?: string;
    defaultCurrency: string;
    adminEmail: string;
    adminPassword: string;
    adminName: string;
  }) => Promise<void>;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  updateOrganization: (id: string, data: Partial<Organization>) => void;
  addUser: (data: Omit<User, 'id' | 'createdAt'>) => void;
  updateUser: (id: string, data: Partial<User>) => void;
  deleteUser: (id: string) => void;
}

const OrganizationContext = createContext<OrganizationContextProps | undefined>(undefined);

export const OrganizationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [currentOrganization, setCurrentOrganization] = useState<Organization | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const initializeData = () => {
      try {
        // Load organizations
        const storedOrgs = localStorage.getItem('organizations');
        if (storedOrgs) {
          setOrganizations(JSON.parse(storedOrgs));
        }

        // Load users
        const storedUsers = localStorage.getItem('users');
        if (storedUsers) {
          setUsers(JSON.parse(storedUsers));
        }

        // Check for active session
        const sessionUser = localStorage.getItem('currentUser');
        const sessionOrg = localStorage.getItem('currentOrganization');
        
        if (sessionUser && sessionOrg) {
          setCurrentUser(JSON.parse(sessionUser));
          setCurrentOrganization(JSON.parse(sessionOrg));
          setIsAuthenticated(true);
        }

        setLoading(false);
      } catch (err) {
        setError('Failed to initialize data');
        setLoading(false);
      }
    };

    initializeData();
  }, []);

  // Save data when it changes
  useEffect(() => {
    if (!loading) {
      localStorage.setItem('organizations', JSON.stringify(organizations));
      localStorage.setItem('users', JSON.stringify(users));
    }
  }, [organizations, users, loading]);

  const registerOrganization = async (data: {
    name: string;
    address: string;
    logo?: string;
    defaultCurrency: string;
    adminEmail: string;
    adminPassword: string;
    adminName: string;
  }) => {
    try {
      // Check if organization name is unique
      if (organizations.some(org => org.name === data.name)) {
        throw new Error('Une organisation avec ce nom existe déjà');
      }

      // Check if admin email is unique
      if (users.some(user => user.email === data.adminEmail)) {
        throw new Error('Un utilisateur avec cet email existe déjà');
      }

      // Create organization
      const newOrg: Organization = {
        id: `org_${Date.now()}`,
        name: data.name,
        address: data.address,
        logo: data.logo,
        defaultCurrency: data.defaultCurrency as any,
        createdAt: new Date().toISOString()
      };

      // Hash password
      const hashedPassword = await bcrypt.hash(data.adminPassword, 10);

      // Create admin user
      const newUser: User = {
        id: `user_${Date.now()}`,
        organizationId: newOrg.id,
        email: data.adminEmail,
        password: hashedPassword,
        name: data.adminName,
        role: 'admin',
        createdAt: new Date().toISOString()
      };

      setOrganizations(prev => [...prev, newOrg]);
      setUsers(prev => [...prev, newUser]);

      toast.success('Organisation créée avec succès!');
      navigate('/login');
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors de la création de l\'organisation');
      throw err;
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    const user = users.find(u => u.email === email);
    
    if (!user) {
      return false;
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    
    if (!isValidPassword) {
      return false;
    }

    const org = organizations.find(o => o.id === user.organizationId);
    
    if (!org) {
      return false;
    }

    setCurrentUser(user);
    setCurrentOrganization(org);
    setIsAuthenticated(true);

    localStorage.setItem('currentUser', JSON.stringify(user));
    localStorage.setItem('currentOrganization', JSON.stringify(org));

    return true;
  };

  const logout = () => {
    setCurrentUser(null);
    setCurrentOrganization(null);
    setIsAuthenticated(false);
    localStorage.removeItem('currentUser');
    localStorage.removeItem('currentOrganization');
    navigate('/login');
  };

  const updateOrganization = (id: string, data: Partial<Organization>) => {
    setOrganizations(prev => 
      prev.map(org => 
        org.id === id ? { ...org, ...data } : org
      )
    );

    if (currentOrganization?.id === id) {
      setCurrentOrganization(prev => prev ? { ...prev, ...data } : null);
      localStorage.setItem('currentOrganization', JSON.stringify({ ...currentOrganization, ...data }));
    }

    toast.success('Organisation mise à jour avec succès!');
  };

  const addUser = async (data: Omit<User, 'id' | 'createdAt'>) => {
    // Check if email is unique
    if (users.some(user => user.email === data.email)) {
      toast.error('Un utilisateur avec cet email existe déjà');
      return;
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const newUser: User = {
      ...data,
      id: `user_${Date.now()}`,
      password: hashedPassword,
      createdAt: new Date().toISOString()
    };

    setUsers(prev => [...prev, newUser]);
    toast.success('Utilisateur ajouté avec succès!');
  };

  const updateUser = async (id: string, data: Partial<User>) => {
    if (data.email && users.some(user => user.email === data.email && user.id !== id)) {
      toast.error('Un utilisateur avec cet email existe déjà');
      return;
    }

    let updatedData = { ...data };
    if (data.password) {
      updatedData.password = await bcrypt.hash(data.password, 10);
    }

    setUsers(prev => 
      prev.map(user => 
        user.id === id ? { ...user, ...updatedData } : user
      )
    );

    if (currentUser?.id === id) {
      setCurrentUser(prev => prev ? { ...prev, ...updatedData } : null);
      localStorage.setItem('currentUser', JSON.stringify({ ...currentUser, ...updatedData }));
    }

    toast.success('Utilisateur mis à jour avec succès!');
  };

  const deleteUser = (id: string) => {
    if (users.length === 1) {
      toast.error('Impossible de supprimer le dernier utilisateur');
      return;
    }

    if (currentUser?.id === id) {
      toast.error('Impossible de supprimer votre propre compte');
      return;
    }

    setUsers(prev => prev.filter(user => user.id !== id));
    toast.success('Utilisateur supprimé avec succès!');
  };

  return (
    <OrganizationContext.Provider
      value={{
        currentOrganization,
        currentUser,
        organizations,
        users,
        loading,
        error,
        isAuthenticated,
        registerOrganization,
        login,
        logout,
        updateOrganization,
        addUser,
        updateUser,
        deleteUser
      }}
    >
      {children}
    </OrganizationContext.Provider>
  );
};

export const useOrganization = () => {
  const context = useContext(OrganizationContext);
  if (context === undefined) {
    throw new Error('useOrganization must be used within an OrganizationProvider');
  }
  return context;
};