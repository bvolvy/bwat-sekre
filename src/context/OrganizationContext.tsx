import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Organization, User, Language, Theme, CustomTheme } from '../types';
import { toast } from 'react-toastify';
import bcrypt from 'bcryptjs';
import CryptoJS from 'crypto-js';

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
    language?: Language;
    theme?: Theme;
    customTheme?: CustomTheme;
    defaultInterestRate?: number;
  }) => Promise<void>;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  updateOrganization: (id: string, data: Partial<Organization>) => void;
  addUser: (data: Omit<User, 'id' | 'createdAt'>) => void;
  updateUser: (id: string, data: Partial<User>) => void;
  deleteUser: (id: string) => void;
  backupData: () => void;
  restoreData: (file: File, encryptionKey?: string) => Promise<void>;
  updateBackupSettings: (settings: Organization['backupSettings']) => void;
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

  // Handle automatic backups
  useEffect(() => {
    if (currentOrganization?.backupSettings?.automatic) {
      const backupInterval = setInterval(() => {
        const lastBackup = currentOrganization.backupSettings.lastBackup 
          ? new Date(currentOrganization.backupSettings.lastBackup)
          : new Date(0);
        
        const now = new Date();
        const frequency = currentOrganization.backupSettings.frequency;
        let shouldBackup = false;

        switch (frequency) {
          case 'daily':
            shouldBackup = now.getDate() !== lastBackup.getDate();
            break;
          case 'weekly':
            const weekDiff = Math.floor((now.getTime() - lastBackup.getTime()) / (1000 * 60 * 60 * 24 * 7));
            shouldBackup = weekDiff >= 1;
            break;
          case 'monthly':
            shouldBackup = now.getMonth() !== lastBackup.getMonth();
            break;
        }

        if (shouldBackup) {
          backupData();
        }
      }, 1000 * 60 * 60); // Check every hour

      return () => clearInterval(backupInterval);
    }
  }, [currentOrganization?.backupSettings]);

  const registerOrganization = async (data: {
    name: string;
    address: string;
    logo?: string;
    defaultCurrency: string;
    adminEmail: string;
    adminPassword: string;
    adminName: string;
    language?: Language;
    theme?: Theme;
    customTheme?: CustomTheme;
    defaultInterestRate?: number;
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
        language: data.language || 'fr',
        theme: data.theme || 'light',
        defaultInterestRate: data.defaultInterestRate || 8.5,
        alertThresholds: {
          lowBalance: 1000,
          highTransaction: 50000,
          loanDefault: 30
        },
        backupSettings: {
          automatic: false,
          frequency: 'daily',
          encrypted: true
        },
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
      const updatedOrg = { ...currentOrganization, ...data };
      setCurrentOrganization(updatedOrg);
      localStorage.setItem('currentOrganization', JSON.stringify(updatedOrg));
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

  const backupData = () => {
    if (!currentOrganization) return;

    const orgData = {
      organization: currentOrganization,
      users: users.filter(u => u.organizationId === currentOrganization.id),
      clients: JSON.parse(localStorage.getItem(`volvy-bank-clients-${currentOrganization.id}`) || '[]'),
      transactions: JSON.parse(localStorage.getItem(`volvy-bank-transactions-${currentOrganization.id}`) || '[]'),
      loans: JSON.parse(localStorage.getItem(`volvy-bank-loans-${currentOrganization.id}`) || '[]')
    };

    let backupContent = JSON.stringify(orgData, null, 2);

    // Encrypt if enabled
    if (currentOrganization.backupSettings.encrypted) {
      const encryptionKey = `bwat-sekre-${currentOrganization.id}`;
      backupContent = CryptoJS.AES.encrypt(backupContent, encryptionKey).toString();
    }

    // Create and download backup file
    const blob = new Blob([backupContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bwat-backup-${currentOrganization.name}-${new Date().toISOString()}.bwatbackup`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    // Update last backup timestamp
    if (currentOrganization.backupSettings.automatic) {
      updateOrganization(currentOrganization.id, {
        backupSettings: {
          ...currentOrganization.backupSettings,
          lastBackup: new Date().toISOString()
        }
      });
    }

    toast.success('Sauvegarde effectuée avec succès!');
  };

  const restoreData = async (file: File, encryptionKey?: string) => {
    try {
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        try {
          let content = e.target?.result as string;

          // Try to decrypt if encryption key provided
          if (encryptionKey) {
            try {
              const decrypted = CryptoJS.AES.decrypt(content, encryptionKey);
              content = decrypted.toString(CryptoJS.enc.Utf8);
            } catch (err) {
              throw new Error('Clé de déchiffrement invalide');
            }
          }

          const data = JSON.parse(content);

          // Validate backup structure
          if (!data.organization || !data.users || !data.clients || !data.transactions || !data.loans) {
            throw new Error('Structure de sauvegarde invalide');
          }

          // Update organization data
          setOrganizations(prev => 
            prev.map(org => org.id === data.organization.id ? data.organization : org)
          );

          // Update users
          setUsers(prev => {
            const nonOrgUsers = prev.filter(u => u.organizationId !== data.organization.id);
            return [...nonOrgUsers, ...data.users];
          });

          // Update local storage data
          localStorage.setItem(`volvy-bank-clients-${data.organization.id}`, JSON.stringify(data.clients));
          localStorage.setItem(`volvy-bank-transactions-${data.organization.id}`, JSON.stringify(data.transactions));
          localStorage.setItem(`volvy-bank-loans-${data.organization.id}`, JSON.stringify(data.loans));

          if (currentOrganization?.id === data.organization.id) {
            setCurrentOrganization(data.organization);
            localStorage.setItem('currentOrganization', JSON.stringify(data.organization));
          }

          toast.success('Restauration effectuée avec succès!');
          window.location.reload();
        } catch (err: any) {
          toast.error(err.message || 'Erreur lors de la restauration des données');
        }
      };

      reader.readAsText(file);
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors de la lecture du fichier');
    }
  };

  const updateBackupSettings = (settings: Organization['backupSettings']) => {
    if (!currentOrganization) return;

    updateOrganization(currentOrganization.id, {
      backupSettings: settings
    });
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
        deleteUser,
        backupData,
        restoreData,
        updateBackupSettings
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