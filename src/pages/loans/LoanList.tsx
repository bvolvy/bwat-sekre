import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, AlertCircle, PiggyBank, Trash2 } from 'lucide-react';
import { useLoans } from '../../context/LoanContext';
import { useClients } from '../../context/ClientContext';
import { Loan } from '../../types';
import { format } from 'date-fns';

const LoanList = () => {
  const { loans, loading, error, deleteLoan } = useLoans();
  const { clients } = useClients();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [filteredLoans, setFilteredLoans] = useState<Loan[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [loanToDelete, setLoanToDelete] = useState<Loan | null>(null);
  
  useEffect(() => {
    if (!loading) {
      // Apply filters
      let filtered = [...loans];
      
      // Search filter (client name or loan purpose)
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        filtered = filtered.filter(loan => {
          const client = clients.find(c => c.id === loan.clientId);
          const clientName = client ? `${client.firstName} ${client.lastName}`.toLowerCase() : '';
          
          return (
            clientName.includes(searchLower) ||
            loan.purpose.toLowerCase().includes(searchLower)
          );
        });
      }
      
      // Status filter
      if (statusFilter) {
        filtered = filtered.filter(loan => loan.status === statusFilter);
      }
      
      // Sort by date (newest first)
      filtered.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
      
      setFilteredLoans(filtered);
    }
  }, [loans, searchTerm, statusFilter, loading, clients]);
  
  const handleDeleteClick = (loan: Loan) => {
    setLoanToDelete(loan);
    setShowDeleteModal(true);
  };
  
  const confirmDelete = () => {
    if (loanToDelete) {
      deleteLoan(loanToDelete.id);
      setShowDeleteModal(false);
      setLoanToDelete(null);
    }
  };
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'HTG',
      minimumFractionDigits: 2
    }).format(amount);
  };
  
  // Calculate summary statistics
  const totalActiveLoans = filteredLoans.filter(loan => loan.status === 'active').length;
  const totalLoanAmount = filteredLoans.reduce((sum, loan) => sum + loan.amount, 0);
  const totalRemainingBalance = filteredLoans.reduce((sum, loan) => sum + loan.remainingBalance, 0);
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-primary-600">Chargement des prêts...</div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-error-100 text-error-700 p-4 rounded-md flex items-center">
        <AlertCircle className="h-5 w-5 mr-2" />
        <span>{error}</span>
      </div>
    );
  }
  
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Prêts</h1>
        <Link
          to="/loans/add"
          className="mt-4 sm:mt-0 btn btn-primary flex items-center justify-center sm:justify-start"
        >
          <Plus size={20} className="mr-1" />
          Nouveau Prêt
        </Link>
      </div>
      
      {/* Filters and Search */}
      <div className="bg-white p-4 rounded-lg shadow-md">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Search */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Rechercher par client ou objectif..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-full focus:outline-none focus:ring-1 focus:ring-primary-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          {/* Status Filter */}
          <div>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">Tous les statuts</option>
              <option value="pending">En attente</option>
              <option value="active">Actif</option>
              <option value="completed">Terminé</option>
              <option value="defaulted">Défaut</option>
            </select>
          </div>
        </div>
      </div>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500">Prêts Actifs</p>
              <p className="text-2xl font-semibold">{totalActiveLoans}</p>
            </div>
            <PiggyBank className="h-8 w-8 text-primary-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-4">
          <p className="text-sm text-gray-500">Montant Total des Prêts</p>
          <p className="text-2xl font-semibold">{formatCurrency(totalLoanAmount)}</p>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-4">
          <p className="text-sm text-gray-500">Solde Restant Total</p>
          <p className="text-2xl font-semibold">{formatCurrency(totalRemainingBalance)}</p>
        </div>
      </div>
      
      {/* Loans Table */}
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
                  Objectif
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Montant
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Solde Restant
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredLoans.length > 0 ? (
                filteredLoans.map((loan) => {
                  const client = clients.find(c => c.id === loan.clientId);
                  return (
                    <tr key={loan.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {format(new Date(loan.startDate), 'dd/MM/yyyy')}
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
                            <div className="text-xs text-gray-500">
                              {client?.accounts?.[0]?.accountNumber || 'N/A'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {loan.purpose}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {formatCurrency(loan.amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          loan.status === 'active' 
                            ? 'bg-success-100 text-success-800' 
                            : loan.status === 'pending'
                              ? 'bg-warning-100 text-warning-800'
                              : loan.status === 'completed'
                                ? 'bg-primary-100 text-primary-800'
                                : 'bg-error-100 text-error-800'
                        }`}>
                          {loan.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-right">
                        {formatCurrency(loan.remainingBalance)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                        <div className="flex justify-center space-x-2">
                          <Link
                            to={`/loans/${loan.id}`}
                            className="text-primary-600 hover:text-primary-900"
                          >
                            Détails
                          </Link>
                          <button
                            onClick={() => handleDeleteClick(loan)}
                            className="text-error-600 hover:text-error-900"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                    Aucun prêt trouvé
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Delete confirmation modal */}
      {showDeleteModal && loanToDelete && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-error-100 sm:mx-0 sm:h-10 sm:w-10">
                    <AlertCircle className="h-6 w-6 text-error-600" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Supprimer le prêt</h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Êtes-vous sûr de vouloir supprimer ce prêt? Cette action est irréversible.
                      </p>
                      <p className="mt-2 text-sm font-medium text-gray-700">
                        Montant: {formatCurrency(loanToDelete.amount)}
                      </p>
                      <p className="text-sm text-gray-700">
                        Solde restant: {formatCurrency(loanToDelete.remainingBalance)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-error-600 text-base font-medium text-white hover:bg-error-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-error-500 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={confirmDelete}
                >
                  Supprimer
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => setShowDeleteModal(false)}
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoanList;