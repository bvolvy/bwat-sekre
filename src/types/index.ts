export interface Client {
  id: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  address: string;
  email: string;
  emergencyContact: {
    name: string;
    phoneNumber: string;
    relationship: string;
  };
  profileImage: string;
  createdAt: string;
  totalBalance: number;
  currency: string;
}

export interface Transaction {
  id: string;
  clientId: string;
  type: 'deposit' | 'withdrawal';
  amount: number;
  description: string;
  date: string;
  status: 'pending' | 'completed' | 'failed';
  currency: string;
}

export interface Loan {
  id: string;
  clientId: string;
  amount: number;
  interestRate: number;
  term: number; // in months
  startDate: string;
  endDate: string;
  paymentAmount: number; // monthly payment amount
  status: 'pending' | 'approved' | 'active' | 'completed' | 'defaulted';
  purpose: string;
  remainingBalance: number;
  payments: LoanPayment[];
  currency: string;
}

export interface LoanPayment {
  id: string;
  loanId: string;
  amount: number;
  date: string;
  status: 'pending' | 'completed';
}

export type ReportType = 'daily' | 'monthly' | 'yearly';
export type ReportCategory = 'clients' | 'transactions' | 'loans';

export interface ReportFilter {
  startDate: string;
  endDate: string;
  type: ReportType;
  category: ReportCategory;
  clientId?: string;
}

export const SUPPORTED_CURRENCIES = ['HTG', 'USD'] as const;
export type Currency = typeof SUPPORTED_CURRENCIES[number];