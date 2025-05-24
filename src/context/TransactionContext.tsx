import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { Transaction } from '../types';
import { mockTransactions, getNewId } from '../data/mockData';
import { toast } from 'react-toastify';
import { useClients } from './ClientContext';
import { format } from 'date-fns';
import { useOrganization } from './OrganizationContext';

interface TransactionContextProps {
  transactions: Transaction[];
  loading: boolean;
  error: string | null;
  getTransaction: (id: string) => Transaction | undefined;
  getClientTransactions: (clientId: string) => Transaction[];
  addTransaction: (transaction: Omit<Transaction, 'id' | 'date' | 'status' | 'organizationId' | 'currency'>) => void;
  deleteTransaction: (id: string) => void;
  transferFunds: (params: {
    fromClientId: string;
    fromAccountId: string;
    toClientId: string;
    toAccountId: string;
    amount: number;
    description: string;
  }) => void;
}

const TransactionContext = createContext<TransactionContextProps | undefined>(undefined);

export const TransactionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { updateClientBalance } = useClients();
  const { currentOrganization } = useOrganization();

  useEffect(() => {
    // Simulate API fetch
    setTimeout(() => {
      try {
        // Load from localStorage if available
        const storedTransactions = localStorage.getItem(`volvy-bank-transactions-${currentOrganization?.id}`);
        if (storedTransactions) {
          setTransactions(JSON.parse(storedTransactions));
        } else {
          const initialTransactions = mockTransactions.map(transaction => ({
            ...transaction,
            organizationId: currentOrganization?.id || '',
            currency: currentOrganization?.defaultCurrency || 'HTG'
          }));
          setTransactions(initialTransactions);
        }
        setLoading(false);
      } catch (err) {
        setError('Failed to load transactions');
        setLoading(false);
      }
    }, 600);
  }, [currentOrganization?.id]);

  // Save to localStorage whenever transactions changes
  useEffect(() => {
    if (!loading && transactions.length > 0 && currentOrganization?.id) {
      localStorage.setItem(`volvy-bank-transactions-${currentOrganization.id}`, JSON.stringify(transactions));
    }
  }, [transactions, loading, currentOrganization?.id]);

  const getTransaction = (id: string) => {
    return transactions.find(transaction => 
      transaction.id === id && transaction.organizationId === currentOrganization?.id
    );
  };

  const getClientTransactions = (clientId: string) => {
    return transactions.filter(transaction => 
      transaction.clientId === clientId && transaction.organizationId === currentOrganization?.id
    );
  };

  const addTransaction = (transaction: Omit<Transaction, 'id' | 'date' | 'status' | 'organizationId' | 'currency'>) => {
    if (!currentOrganization?.id) return;

    const newTransaction: Transaction = {
      ...transaction,
      id: getNewId('t'),
      organizationId: currentOrganization.id,
      date: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
      status: 'completed',
      currency: currentOrganization.defaultCurrency
    };

    setTransactions(prevTransactions => [...prevTransactions, newTransaction]);
    
    // Update client balance for the specific account
    updateClientBalance(
      newTransaction.clientId,
      newTransaction.accountId,
      newTransaction.amount,
      newTransaction.type === 'deposit'
    );
    
    toast.success(`${newTransaction.type === 'deposit' ? 'Dépôt' : 'Retrait'} effectué avec succès!`);
  };

  const transferFunds = (params: {
    fromClientId: string;
    fromAccountId: string;
    toClientId: string;
    toAccountId: string;
    amount: number;
    description: string;
  }) => {
    if (!currentOrganization?.id) return;

    const { fromClientId, fromAccountId, toClientId, toAccountId, amount, description } = params;

    // Create withdrawal transaction for sender
    const withdrawalTransaction: Transaction = {
      id: getNewId('t'),
      organizationId: currentOrganization.id,
      clientId: fromClientId,
      accountId: fromAccountId,
      type: 'transfer',
      amount,
      description: `Transfert vers ${description}`,
      date: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
      status: 'completed',
      currency: currentOrganization.defaultCurrency,
      recipientAccountId: toAccountId,
      recipientClientId: toClientId
    };

    // Create deposit transaction for recipient
    const depositTransaction: Transaction = {
      id: getNewId('t'),
      organizationId: currentOrganization.id,
      clientId: toClientId,
      accountId: toAccountId,
      type: 'transfer',
      amount,
      description: `Transfert reçu de ${description}`,
      date: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
      status: 'completed',
      currency: currentOrganization.defaultCurrency,
      recipientAccountId: fromAccountId,
      recipientClientId: fromClientId
    };

    setTransactions(prevTransactions => [...prevTransactions, withdrawalTransaction, depositTransaction]);

    // Update balances
    updateClientBalance(fromClientId, fromAccountId, amount, false); // Deduct from sender
    updateClientBalance(toClientId, toAccountId, amount, true); // Add to recipient

    toast.success('Transfert effectué avec succès!');
  };

  const deleteTransaction = (id: string) => {
    const transaction = transactions.find(t => 
      t.id === id && t.organizationId === currentOrganization?.id
    );
    
    if (transaction) {
      // Reverse the effect on client balance before deletion
      updateClientBalance(
        transaction.clientId,
        transaction.accountId,
        transaction.amount,
        transaction.type !== 'deposit' // If it was a deposit, we need to subtract, and vice versa
      );
      
      setTransactions(prevTransactions => 
        prevTransactions.filter(t => !(t.id === id && t.organizationId === currentOrganization?.id))
      );
      
      toast.success('Transaction supprimée avec succès!');
    }
  };

  return (
    <TransactionContext.Provider
      value={{
        transactions: transactions.filter(t => t.organizationId === currentOrganization?.id),
        loading,
        error,
        getTransaction,
        getClientTransactions,
        addTransaction,
        deleteTransaction,
        transferFunds
      }}
    >
      {children}
    </TransactionContext.Provider>
  );
};

export const useTransactions = () => {
  const context = useContext(TransactionContext);
  if (context === undefined) {
    throw new Error('useTransactions must be used within a TransactionProvider');
  }
  return context;
};