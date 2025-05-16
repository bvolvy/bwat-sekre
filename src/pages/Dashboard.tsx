import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PiggyBank, Users, CreditCard, ArrowUpCircle, ArrowDownCircle, TrendingUp } from 'lucide-react';
import { useClients } from '../context/ClientContext';
import { useTransactions } from '../context/TransactionContext';
import { useLoans } from '../context/LoanContext';
import { format, subDays } from 'date-fns';

const Dashboard = () => {
  const { clients, loading: clientsLoading } = useClients();
  const { transactions, loading: transactionsLoading } = useTransactions();
  const { loans, loading: loansLoading } = useLoans();
  
  const [stats, setStats] = useState({
    totalClients: 0,
    totalBalance: 0,
    activeLoans: 0,
    totalLoanAmount: 0,
    recentDeposits: 0,
    recentWithdrawals: 0
  });
  
  useEffect(() => {
    if (!clientsLoading && !transactionsLoading && !loansLoading) {
      const totalClients = clients.length;
      const totalBalance = clients.reduce((sum, client) => sum + client.totalBalance, 0);
      
      const activeLoans = loans.filter(loan => loan.status === 'active').length;
      const totalLoanAmount = loans
        .filter(loan => loan.status === 'active')
        .reduce((sum, loan) => sum + loan.remainingBalance, 0);
      
      const oneWeekAgo = subDays(new Date(), 7);
      const recentTransactions = transactions.filter(
        transaction => new Date(transaction.date) >= oneWeekAgo
      );
      
      const recentDeposits = recentTransactions
        .filter(transaction => transaction.type === 'deposit')
        .reduce((sum, transaction) => sum + transaction.amount, 0);
        
      const recentWithdrawals = recentTransactions
        .filter(transaction => transaction.type === 'withdrawal')
        .reduce((sum, transaction) => sum + transaction.amount, 0);
      
      setStats({
        totalClients,
        totalBalance,
        activeLoans,
        totalLoanAmount,
        recentDeposits,
        recentWithdrawals
      });
    }
  }, [clients, transactions, loans, clientsLoading, transactionsLoading, loansLoading]);
  
  const formatCurrency = (amount: number, currency: 'HTG' | '$' = 'HTG') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency === 'HTG' ? 'HTG' : 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };
  
  // Get recent transactions for dashboard
  const recentTransactions = transactions
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);
    
  // Get recent clients for dashboard
  const recentClients = clients
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);
  
  if (clientsLoading || transactionsLoading || loansLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-primary-600">Chargement...</div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold text-gray-800">Tableau de Bord</h1>
      
      {/* Stats overview cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-primary-500">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Clients</p>
              <p className="text-2xl font-semibold mt-1">{stats.totalClients}</p>
            </div>
            <div className="bg-primary-100 rounded-full p-3">
              <Users className="h-6 w-6 text-primary-600" />
            </div>
          </div>
          <div className="mt-4">
            <Link to="/clients" className="text-sm text-primary-600 hover:text-primary-800">
              Voir tous les clients
            </Link>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-success-500">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-gray-500">Total des Comptes</p>
              <p className="text-2xl font-semibold mt-1">{formatCurrency(stats.totalBalance)}</p>
            </div>
            <div className="bg-success-100 rounded-full p-3">
              <PiggyBank className="h-6 w-6 text-success-600" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-sm text-success-600">
              {clients.length} comptes actifs
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-warning-500">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-gray-500">Prêts Actifs</p>
              <p className="text-2xl font-semibold mt-1">{stats.activeLoans}</p>
            </div>
            <div className="bg-warning-100 rounded-full p-3">
              <TrendingUp className="h-6 w-6 text-warning-600" />
            </div>
          </div>
          <div className="mt-4">
            <Link to="/loans" className="text-sm text-warning-600 hover:text-warning-800">
              Gérer les prêts
            </Link>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-secondary-500">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-gray-500">Transactions Récentes</p>
              <p className="text-2xl font-semibold mt-1">{transactions.length}</p>
            </div>
            <div className="bg-secondary-100 rounded-full p-3">
              <CreditCard className="h-6 w-6 text-secondary-600" />
            </div>
          </div>
          <div className="mt-4">
            <Link to="/transactions" className="text-sm text-secondary-600 hover:text-secondary-800">
              Voir toutes les transactions
            </Link>
          </div>
        </div>
      </div>
      
      {/* Recent activity section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold mb-4">Transactions Récentes</h2>
          <div className="space-y-4">
            {recentTransactions.length > 0 ? (
              recentTransactions.map(transaction => {
                const client = clients.find(c => c.id === transaction.clientId);
                return (
                  <div key={transaction.id} className="flex items-center justify-between border-b border-gray-100 pb-2">
                    <div className="flex items-center">
                      <div className={`rounded-full p-2 mr-3 ${
                        transaction.type === 'deposit' 
                          ? 'bg-success-100 text-success-600' 
                          : 'bg-error-100 text-error-600'
                      }`}>
                        {transaction.type === 'deposit' 
                          ? <ArrowUpCircle size={18} /> 
                          : <ArrowDownCircle size={18} />}
                      </div>
                      <div>
                        <p className="font-medium text-sm">
                          {transaction.type === 'deposit' ? 'Dépôt' : 'Retrait'} - {client?.firstName} {client?.lastName}
                        </p>
                        <p className="text-xs text-gray-500">
                          {format(new Date(transaction.date), 'dd/MM/yyyy HH:mm')}
                        </p>
                      </div>
                    </div>
                    <div className={`font-semibold ${
                      transaction.type === 'deposit' ? 'text-success-600' : 'text-error-600'
                    }`}>
                      {transaction.type === 'deposit' ? '+' : '-'} {formatCurrency(transaction.amount)}
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-gray-500 text-center py-4">Aucune transaction récente</p>
            )}
          </div>
          <div className="mt-4 text-center">
            <Link to="/transactions" className="text-primary-600 hover:text-primary-800 text-sm font-medium">
              Voir plus
            </Link>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold mb-4">Clients Récents</h2>
          <div className="space-y-4">
            {recentClients.length > 0 ? (
              recentClients.map(client => (
                <div key={client.id} className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <div className="flex items-center">
                    <img 
                      src={client.profileImage || 'https://images.pexels.com/photos/1438081/pexels-photo-1438081.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2'} 
                      alt={`${client.firstName} ${client.lastName}`}
                      className="w-10 h-10 rounded-full object-cover mr-3"
                    />
                    <div>
                      <p className="font-medium">{client.firstName} {client.lastName}</p>
                      <p className="text-xs text-gray-500">{client.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-primary-600">{formatCurrency(client.totalBalance)}</div>
                    <div className="text-xs text-gray-500">Depuis {format(new Date(client.createdAt), 'dd/MM/yyyy')}</div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">Aucun client récent</p>
            )}
          </div>
          <div className="mt-4 text-center">
            <Link to="/clients" className="text-primary-600 hover:text-primary-800 text-sm font-medium">
              Tous les clients
            </Link>
          </div>
        </div>
      </div>
      
      {/* Financial summary */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold mb-4">Résumé Financier (7 derniers jours)</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-lg bg-green-50 border border-green-100 p-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-medium text-gray-700">Dépôts</h3>
              <ArrowUpCircle className="h-5 w-5 text-success-500" />
            </div>
            <p className="text-xl font-bold text-success-600 mt-2">
              {formatCurrency(stats.recentDeposits)}
            </p>
          </div>
          
          <div className="rounded-lg bg-red-50 border border-red-100 p-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-medium text-gray-700">Retraits</h3>
              <ArrowDownCircle className="h-5 w-5 text-error-500" />
            </div>
            <p className="text-xl font-bold text-error-600 mt-2">
              {formatCurrency(stats.recentWithdrawals)}
            </p>
          </div>
          
          <div className="rounded-lg bg-blue-50 border border-blue-100 p-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-medium text-gray-700">Prêts En Cours</h3>
              <TrendingUp className="h-5 w-5 text-primary-500" />
            </div>
            <p className="text-xl font-bold text-primary-600 mt-2">
              {formatCurrency(stats.totalLoanAmount)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;