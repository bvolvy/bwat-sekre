import { type } from "os";

export interface Account {
  id: string;
  accountNumber: string;
  type: 'savings' | 'checking';
  balance: number;
  currency: string;
  createdAt: string;
}

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
  accounts: Account[];
}

export interface Transaction {
  id: string;
  clientId: string;
  accountId: string;
  type: 'deposit' | 'withdrawal' | 'transfer';
  amount: number;
  description: string;
  date: string;
  status: 'pending' | 'completed' | 'failed';
  currency: string;
  recipientAccountId?: string; // For transfers
  recipientClientId?: string; // For transfers
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

export const SUPPORTED_CURRENCIES = [
  'HTG',
  'USD',
  'EUR',
  'CAD',
  'GBP',
  'CHF',
  'JPY',
  'AUD',
  'NZD',
  'CNY'
] as const;

export type Currency = typeof SUPPORTED_CURRENCIES[number];

// Helper function to generate account numbers
export const generateAccountNumber = (): string => {
  const prefix = 'BS'; // Bwat Sekrè prefix
  const randomDigits = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
  return `${prefix}${randomDigits}`;
};