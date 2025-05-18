import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { Client } from '../types';
import { mockClients, getNewId } from '../data/mockData';
import { toast } from 'react-toastify';

interface ClientContextProps {
  clients: Client[];
  loading: boolean;
  error: string | null;
  getClient: (id: string) => Client | undefined;
  addClient: (client: Omit<Client, 'id' | 'createdAt' | 'totalBalance' | 'accounts'>) => void;
  updateClient: (id: string, client: Partial<Client>) => void;
  deleteClient: (id: string) => void;
  updateClientBalance: (id: string, accountId: string, amount: number, isDeposit: boolean) => void;
}

const ClientContext = createContext<ClientContextProps | undefined>(undefined);

export const ClientProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Simulate API fetch
    setTimeout(() => {
      try {
        // Load from localStorage if available, otherwise use mock data
        const storedClients = localStorage.getItem('volvy-bank-clients');
        if (storedClients) {
          setClients(JSON.parse(storedClients));
        } else {
          // Calculate total balance for each client from their accounts
          const clientsWithTotalBalance = mockClients.map(client => ({
            ...client,
            totalBalance: client.accounts.reduce((sum, account) => sum + account.balance, 0)
          }));
          setClients(clientsWithTotalBalance);
        }
        setLoading(false);
      } catch (err) {
        setError('Failed to load clients');
        setLoading(false);
      }
    }, 500);
  }, []);

  // Save to localStorage whenever clients changes
  useEffect(() => {
    if (!loading && clients.length > 0) {
      localStorage.setItem('volvy-bank-clients', JSON.stringify(clients));
    }
  }, [clients, loading]);

  const getClient = (id: string) => {
    return clients.find(client => client.id === id);
  };

  const addClient = (client: Omit<Client, 'id' | 'createdAt' | 'totalBalance' | 'accounts'>) => {
    const newClient: Client = {
      ...client,
      id: getNewId('c'),
      createdAt: new Date().toISOString().split('T')[0],
      totalBalance: 0,
      accounts: []
    };

    setClients(prevClients => [...prevClients, newClient]);
    toast.success('Client ajouté avec succès!');
  };

  const updateClient = (id: string, clientData: Partial<Client>) => {
    setClients(prevClients => 
      prevClients.map(client => 
        client.id === id ? { ...client, ...clientData } : client
      )
    );
    toast.success('Client mis à jour avec succès!');
  };

  const deleteClient = (id: string) => {
    setClients(prevClients => prevClients.filter(client => client.id !== id));
    toast.success('Client supprimé avec succès!');
  };

  const updateClientBalance = (id: string, accountId: string, amount: number, isDeposit: boolean) => {
    setClients(prevClients => 
      prevClients.map(client => {
        if (client.id === id) {
          // Update specific account balance
          const updatedAccounts = client.accounts.map(account => {
            if (account.id === accountId) {
              return {
                ...account,
                balance: isDeposit ? account.balance + amount : account.balance - amount
              };
            }
            return account;
          });
          
          // Calculate new total balance from all accounts
          const newTotalBalance = updatedAccounts.reduce((sum, account) => sum + account.balance, 0);
          
          return {
            ...client,
            accounts: updatedAccounts,
            totalBalance: newTotalBalance
          };
        }
        return client;
      })
    );
  };

  return (
    <ClientContext.Provider 
      value={{ 
        clients, 
        loading, 
        error, 
        getClient, 
        addClient, 
        updateClient, 
        deleteClient,
        updateClientBalance 
      }}
    >
      {children}
    </ClientContext.Provider>
  );
};

export const useClients = () => {
  const context = useContext(ClientContext);
  if (context === undefined) {
    throw new Error('useClients must be used within a ClientProvider');
  }
  return context;
};