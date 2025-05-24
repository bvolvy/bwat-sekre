import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { Loan, LoanPayment } from '../types';
import { mockLoans, getNewId } from '../data/mockData';
import { toast } from 'react-toastify';
import { format, addMonths } from 'date-fns';
import { useOrganization } from './OrganizationContext';

interface LoanContextProps {
  loans: Loan[];
  loading: boolean;
  error: string | null;
  getLoan: (id: string) => Loan | undefined;
  getClientLoans: (clientId: string) => Loan[];
  addLoan: (loan: Omit<Loan, 'id' | 'payments' | 'remainingBalance' | 'status' | 'organizationId'>) => void;
  updateLoanStatus: (id: string, status: Loan['status']) => void;
  addLoanPayment: (loanId: string, amount: number) => void;
  deleteLoan: (id: string) => void;
}

const LoanContext = createContext<LoanContextProps | undefined>(undefined);

export const LoanProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { currentOrganization } = useOrganization();

  useEffect(() => {
    // Simulate API fetch
    setTimeout(() => {
      try {
        // Load from localStorage if available
        const storedLoans = localStorage.getItem(`volvy-bank-loans-${currentOrganization?.id}`);
        if (storedLoans) {
          setLoans(JSON.parse(storedLoans));
        } else {
          const initialLoans = mockLoans.map(loan => ({
            ...loan,
            organizationId: currentOrganization?.id || ''
          }));
          setLoans(initialLoans);
        }
        setLoading(false);
      } catch (err) {
        setError('Failed to load loans');
        setLoading(false);
      }
    }, 700);
  }, [currentOrganization?.id]);

  // Save to localStorage whenever loans changes
  useEffect(() => {
    if (!loading && loans.length > 0 && currentOrganization?.id) {
      localStorage.setItem(`volvy-bank-loans-${currentOrganization.id}`, JSON.stringify(loans));
    }
  }, [loans, loading, currentOrganization?.id]);

  const getLoan = (id: string) => {
    return loans.find(loan => 
      loan.id === id && loan.organizationId === currentOrganization?.id
    );
  };

  const getClientLoans = (clientId: string) => {
    return loans.filter(loan => 
      loan.clientId === clientId && loan.organizationId === currentOrganization?.id
    );
  };

  const addLoan = (loanData: Omit<Loan, 'id' | 'payments' | 'remainingBalance' | 'status' | 'organizationId'>) => {
    if (!currentOrganization?.id) return;

    const newLoan: Loan = {
      ...loanData,
      id: getNewId('l'),
      organizationId: currentOrganization.id,
      payments: [],
      remainingBalance: loanData.amount,
      status: 'pending'
    };

    setLoans(prevLoans => [...prevLoans, newLoan]);
    toast.success('Demande de prêt soumise avec succès!');
  };

  const updateLoanStatus = (id: string, status: Loan['status']) => {
    setLoans(prevLoans => 
      prevLoans.map(loan => 
        loan.id === id && loan.organizationId === currentOrganization?.id
          ? { ...loan, status }
          : loan
      )
    );
    toast.success(`Statut du prêt mis à jour: ${status}`);
  };

  const addLoanPayment = (loanId: string, amount: number) => {
    const newPayment: LoanPayment = {
      id: getNewId('p'),
      loanId,
      amount,
      date: format(new Date(), 'yyyy-MM-dd'),
      status: 'completed'
    };

    setLoans(prevLoans =>
      prevLoans.map(loan => {
        if (loan.id === loanId && loan.organizationId === currentOrganization?.id) {
          const newRemainingBalance = Math.max(0, loan.remainingBalance - amount);
          const newStatus = newRemainingBalance === 0 ? 'completed' : loan.status;
          
          return {
            ...loan,
            payments: [...loan.payments, newPayment],
            remainingBalance: newRemainingBalance,
            status: newStatus
          };
        }
        return loan;
      })
    );
    
    toast.success('Paiement du prêt effectué avec succès!');
  };

  const deleteLoan = (id: string) => {
    setLoans(prevLoans => 
      prevLoans.filter(loan => 
        !(loan.id === id && loan.organizationId === currentOrganization?.id)
      )
    );
    toast.success('Prêt supprimé avec succès!');
  };

  return (
    <LoanContext.Provider
      value={{
        loans: loans.filter(loan => loan.organizationId === currentOrganization?.id),
        loading,
        error,
        getLoan,
        getClientLoans,
        addLoan,
        updateLoanStatus,
        addLoanPayment,
        deleteLoan
      }}
    >
      {children}
    </LoanContext.Provider>
  );
};

export const useLoans = () => {
  const context = useContext(LoanContext);
  if (context === undefined) {
    throw new Error('useLoans must be used within a LoanProvider');
  }
  return context;
};