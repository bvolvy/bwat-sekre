import { Client, Transaction, Loan, generateAccountNumber } from '../types';
import { format, addMonths, subDays, subMonths } from 'date-fns';

// Helper function to generate random IDs with at least 6 characters
const generateId = (): string => {
  const randomStr = Math.random().toString(36).substring(2, 8);
  const timestamp = Date.now().toString(36).substring(-4);
  return `${randomStr}${timestamp}`;
};

// Generate mock clients
export const mockClients: Client[] = [
  {
    id: 'client1234567',
    firstName: 'Jean',
    lastName: 'Dupont',
    phoneNumber: '(+509) 4455-6677',
    address: '123 Rue Principale, Port-au-Prince',
    email: 'jean.dupont@example.com',
    emergencyContact: {
      name: 'Marie Dupont',
      phoneNumber: '(+509) 3344-5566',
      relationship: 'Spouse',
    },
    profileImage: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
    createdAt: format(subMonths(new Date(), 5), 'yyyy-MM-dd'),
    accounts: [
      {
        id: generateId(),
        accountNumber: generateAccountNumber(),
        type: 'savings',
        balance: 1500,
        currency: 'HTG',
        createdAt: format(subMonths(new Date(), 5), 'yyyy-MM-dd')
      },
      {
        id: generateId(),
        accountNumber: generateAccountNumber(),
        type: 'checking',
        balance: 1000,
        currency: 'HTG',
        createdAt: format(subMonths(new Date(), 4), 'yyyy-MM-dd')
      }
    ]
  },
  {
    id: 'client2345678',
    firstName: 'Marie',
    lastName: 'Jean',
    phoneNumber: '(+509) 3322-1100',
    address: '456 Avenue Centrale, Cap-Haïtien',
    email: 'marie.jean@example.com',
    emergencyContact: {
      name: 'Pierre Jean',
      phoneNumber: '(+509) 4433-2211',
      relationship: 'Brother',
    },
    profileImage: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
    createdAt: format(subMonths(new Date(), 3), 'yyyy-MM-dd'),
    accounts: [
      {
        id: generateId(),
        accountNumber: generateAccountNumber(),
        type: 'savings',
        balance: 1750,
        currency: 'HTG',
        createdAt: format(subMonths(new Date(), 3), 'yyyy-MM-dd')
      }
    ]
  }
];

// Update mock transactions with account IDs
export const mockTransactions: Transaction[] = [
  {
    id: 't1',
    clientId: 'client1234567',
    accountId: mockClients[0].accounts[0].id,
    type: 'deposit',
    amount: 500,
    description: 'Initial deposit',
    date: format(subDays(new Date(), 60), 'yyyy-MM-dd HH:mm:ss'),
    status: 'completed',
    currency: 'HTG'
  }
];

// Update mock loans
export const mockLoans: Loan[] = [
  {
    id: 'l1',
    clientId: 'client1234567',
    amount: 5000,
    interestRate: 8.5,
    term: 24,
    startDate: format(subMonths(new Date(), 6), 'yyyy-MM-dd'),
    endDate: format(addMonths(subMonths(new Date(), 6), 24), 'yyyy-MM-dd'),
    paymentAmount: 227.50,
    status: 'active',
    purpose: 'Car purchase',
    remainingBalance: 4100,
    currency: 'HTG',
    payments: [
      {
        id: 'p1',
        loanId: 'l1',
        amount: 227.50,
        date: format(subMonths(new Date(), 5), 'yyyy-MM-dd'),
        status: 'completed'
      }
    ]
  }
];

// Function to get new ID
export const getNewId = (prefix: string): string => {
  return `${prefix}${generateId()}`;
};