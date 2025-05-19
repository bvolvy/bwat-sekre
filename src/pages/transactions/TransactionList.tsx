import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Send, Plus, Search, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import { useTransactions } from '../../context/TransactionContext';
import { useClients } from '../../context/ClientContext';
import { format } from 'date-fns';

const TransactionList = () => {
  const { transactions } = useTransactions();
  const { clients } = useClients();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredTransactions = transactions.filter(transaction => {
    const client = clients.find(c => c.id === transaction.clientId);
    const searchString = `${client?.firstName} ${client?.lastName} ${transaction.description}`.toLowerCase();
    return searchString.includes(searchTerm.toLowerCase());
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'HTG',
      minimumFractionDigits: 2
    }).format(amount);
  };

  // Calculate summary statistics
  const totalDeposits = transactions
    .filter(t => t.type === 'deposit')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalWithdrawals = transactions
    .filter(t => t.type === 'withdrawal')
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Transactions</h1>
        <div className="flex space-x-3 mt-4 sm:mt-0">
          <Link
            to="/transactions/transfer"
            className="btn btn-secondary flex items-center justify-center sm:justify-start"
          >
            <Send size={20} className="mr-1" />
            Nouveau Transfert
          </Link>
          <Link
            to="/transactions/add"
            className="btn btn-primary flex items-center justify-center sm:justify-start"
          >
            <Plus size={20} className="mr-1" />
            Nouvelle Transaction
          </Link>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-success-50 rounded-lg p-6 border border-success-200">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-700">Total Dépôts</p>
              <p className="text-2xl font-semibold text-success-700">
                {formatCurrency(totalDeposits)}
              </p>
            </div>
            <ArrowUpCircle className="h-8 w-8 text-success-500" />
          </div>
        </div>

        <div className="bg-error-50 rounded-lg p-6 border border-error-200">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-700">Total Retraits</p>
              <p className="text-2xl font-semibold text-error-700">
                {formatCurrency(totalWithdrawals)}
              </p>
            </div>
            <ArrowDownCircle className="h-8 w-8 text-error-500" />
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Rechercher par client ou description..."
          className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-full focus:outline-none focus:ring-1 focus:ring-primary-500"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Client
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Montant
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredTransactions.length > 0 ? (
                filteredTransactions.map((transaction) => {
                  const client = clients.find(c => c.id === transaction.clientId);
                  return (
                    <tr key={transaction.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {format(new Date(transaction.date), 'dd/MM/yyyy HH:mm')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-8 w-8 flex-shrink-0">
                            <img
                              className="h-8 w-8 rounded-full object-cover"
                              src={client?.profileImage || 'https://images.pexels.com/photos/1438081/pexels-photo-1438081.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2'}
                              alt={client ? `${client.firstName} ${client.lastName}` : 'Unknown'}
                            />
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">
                              {client ? `${client.firstName} ${client.lastName}` : 'Client Inconnu'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          transaction.type === 'deposit' 
                            ? 'bg-success-100 text-success-800' 
                            : transaction.type === 'withdrawal'
                              ? 'bg-error-100 text-error-800'
                              : 'bg-secondary-100 text-secondary-800'
                        }`}>
                          {transaction.type === 'deposit' 
                            ? 'Dépôt' 
                            : transaction.type === 'withdrawal'
                              ? 'Retrait'
                              : 'Transfert'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {transaction.description}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium text-right ${
                        transaction.type === 'deposit' ? 'text-success-600' : 'text-error-600'
                      }`}>
                        {transaction.type === 'deposit' ? '+' : '-'} {formatCurrency(transaction.amount)}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                    Aucune transaction trouvée
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TransactionList;