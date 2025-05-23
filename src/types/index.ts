import { type } from "os";

export interface Organization {
  id: string;
  name: string;
  address: string;
  logo?: string;
  defaultCurrency: Currency;
  language: Language;
  theme: Theme;
  defaultInterestRate: number;
  alertThresholds: {
    lowBalance: number;
    highTransaction: number;
    loanDefault: number;
  };
  backupSettings: {
    automatic: boolean;
    frequency: 'daily' | 'weekly' | 'monthly';
    encrypted: boolean;
    lastBackup?: string;
  };
  createdAt: string;
}

export interface User {
  id: string;
  organizationId: string;
  email: string;
  password: string;
  name: string;
  role: 'admin' | 'employee';
  createdAt: string;
}

export interface Account {
  id: string;
  accountNumber: string;
  type: 'savings' | 'checking';
  balance: number;
  currency: string;
  createdAt: string;
  organizationId: string;
}

export interface Client {
  id: string;
  organizationId: string;
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
  organizationId: string;
  clientId: string;
  accountId: string;
  type: 'deposit' | 'withdrawal' | 'transfer';
  amount: number;
  description: string;
  date: string;
  status: 'pending' | 'completed' | 'failed';
  currency: string;
  recipientAccountId?: string;
  recipientClientId?: string;
}

export interface Loan {
  id: string;
  organizationId: string;
  clientId: string;
  amount: number;
  interestRate: number;
  term: number;
  startDate: string;
  endDate: string;
  paymentAmount: number;
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
  organizationId: string;
}

export const SUPPORTED_CURRENCIES = ['HTG', 'USD', 'EUR'] as const;
export type Currency = typeof SUPPORTED_CURRENCIES[number];

export const SUPPORTED_LANGUAGES = ['fr', 'en', 'es', 'ht'] as const;
export type Language = typeof SUPPORTED_LANGUAGES[number];

export const LANGUAGE_NAMES: Record<Language, string> = {
  fr: 'Français',
  en: 'English',
  es: 'Español',
  ht: 'Kreyòl Ayisyen'
};

export type Theme = 'light' | 'dark' | 'custom';

export interface CustomTheme {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
}

export const generateAccountNumber = (): string => {
  const prefix = 'BS';
  const randomDigits = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
  return `${prefix}${randomDigits}`;
};