import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  User, 
  Phone, 
  Mail, 
  Home, 
  CreditCard, 
  PiggyBank, 
  ArrowUpCircle, 
  ArrowDownCircle,
  Download,
  Edit,
  Trash2,
  AlertCircle,
  Plus
} from 'lucide-react';
import { useClients } from '../../context/ClientContext';
import { useTransactions } from '../../context/TransactionContext';
import { useLoans } from '../../context/LoanContext';
import { format } from 'date-fns';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { generateAccountNumber } from '../../types';

const ClientDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { clients, getClient, deleteClient, updateClient } = useClients();
  const { transactions, getClientTransactions } = useTransactions();
  const { getClientLoans } = useLoans();
  
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAddAccountModal, setShowAddAccountModal] = useState(false);
  const [newAccountType, setNewAccountType] = useState<'savings' | 'checking'>('savings');
  
  if (!id) {
    return <div>Client ID is missing</div>;
  }
  
  const client = getClient(id);
  const clientTransactions = getClientTransactions(id);
  const clientLoans = getClientLoans(id);
  
  if (!client) {
    return (
      <div className="flex flex-col items-center justify-center mt-16">
        <AlertCircle size={48} className="text-error-500 mb-4" />
        <h2 className="text-xl font-semibold text-gray-800 mb-2">Client Introuvable</h2>
        <p className="text-gray-600 mb-4">Le client que vous recherchez n'existe pas ou a été supprimé.</p>
        <Link to="/clients" className="btn btn-primary">
          Retour à la liste des clients
        </Link>
      </div>
    );
  }
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'HTG',
      minimumFractionDigits: 2
    }).format(amount);
  };
  
  const handleDelete = () => {
    setShowDeleteModal(true);
  };
  
  const confirmDelete = () => {
    deleteClient(id);
    navigate('/clients');
  };

  const handleAddAccount = () => {
    const newAccount = {
      id: `acc_${Date.now()}`,
      accountNumber: generateAccountNumber(),
      type: newAccountType,
      balance: 0,
      currency: 'HTG',
      createdAt: new Date().toISOString()
    };

    const updatedAccounts = [...client.accounts, newAccount];
    updateClient(id, { accounts: updatedAccounts });
    setShowAddAccountModal(false);
  };
  
  const generatePDF = () => {
    const doc = new jsPDF();
    
    // Add header
    doc.setFontSize(20);
    doc.setTextColor(10, 36, 99);
    doc.text('Bwat Sekrè', 105, 20, { align: 'center' });
    
    // Add horizontal line under header
    doc.setDrawColor(10, 36, 99);
    doc.setLineWidth(0.5);
    doc.line(20, 25, 190, 25);
    
    // Add title
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text('Détails du Client', 105, 40, { align: 'center' });
    
    // Add client details
    doc.setFontSize(12);
    doc.text(`Nom: ${client.firstName} ${client.lastName}`, 20, 60);
    doc.text(`ID: ${client.id}`, 20, 70);
    doc.text(`Email: ${client.email}`, 20, 80);
    doc.text(`Téléphone: ${client.phoneNumber}`, 20, 90);
    doc.text(`Adresse: ${client.address}`, 20, 100);
    doc.text(`Solde: ${formatCurrency(client.totalBalance)}`, 20, 110);
    
    // Add transactions
    if (clientTransactions.length > 0) {
      doc.text('Transactions récentes', 20, 130);
      
      // @ts-ignore
      doc.autoTable({
        startY: 140,
        head: [['Date', 'Type', 'Montant', 'Description']],
        body: clientTransactions.map(t => [
          format(new Date(t.date), 'dd/MM/yyyy'),
          t.type === 'deposit' ? 'Dépôt' : 'Retrait',
          formatCurrency(t.amount),
          t.description
        ]),
        didDrawPage: function(data) {
          // Header
          doc.setFontSize(20);
          doc.setTextColor(10, 36, 99);
          doc.text('Bwat Sekrè', 105, 20, { align: 'center' });
          doc.setDrawColor(10, 36, 99);
          doc.setLineWidth(0.5);
          doc.line(20, 25, 190, 25);
          
          // Footer
          const pageHeight = doc.internal.pageSize.height;
          doc.setDrawColor(10, 36, 99);
          doc.line(20, pageHeight - 25, 190, pageHeight - 25);
          doc.setFontSize(10);
          doc.setTextColor(0, 0, 0);
          doc.text(
            `Page ${data.pageNumber} sur ${doc.getNumberOfPages()}`,
            105,
            pageHeight - 30,
            { align: 'center' }
          );
          doc.text(
            '© Bwat Sekrè',
            105,
            pageHeight - 15,
            { align: 'center' }
          );
        }
      });
    }
    
    // Add loans
    if (clientLoans.length > 0) {
      // @ts-ignore
      const finalY = doc.lastAutoTable?.finalY || 150;
      doc.text('Prêts', 20, finalY + 10);
      
      // @ts-ignore
      doc.autoTable({
        startY: finalY + 20,
        head: [['Date', 'Montant', 'Statut', 'Solde Restant']],
        body: clientLoans.map(loan => [
          format(new Date(loan.startDate), 'dd/MM/yyyy'),
          formatCurrency(loan.amount),
          loan.status,
          formatCurrency(loan.remainingBalance)
        ]),
        didDrawPage: function(data) {
          // Header
          doc.setFontSize(20);
          doc.setTextColor(10, 36, 99);
          doc.text('Bwat Sekrè', 105, 20, { align: 'center' });
          doc.setDrawColor(10, 36, 99);
          doc.setLineWidth(0.5);
          doc.line(20, 25, 190, 25);
          
          // Footer
          const pageHeight = doc.internal.pageSize.height;
          doc.setDrawColor(10, 36, 99);
          doc.line(20, pageHeight - 25, 190, pageHeight - 25);
          doc.setFontSize(10);
          doc.setTextColor(0, 0, 0);
          doc.text(
            `Page ${data.pageNumber} sur ${doc.getNumberOfPages()}`,
            105,
            pageHeight - 30,
            { align: 'center' }
          );
          doc.text(
            '© Bwat Sekrè',
            105,
            pageHeight - 15,
            { align: 'center' }
          );
        }
      });
    }
    
    // Save the PDF
    doc.save(`client-${client.id}.pdf`);
  };
  
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center">
          <Link to="/clients" className="mr-4 text-gray-500 hover:text-gray-700">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-2xl font-bold text-gray-800">Détails du Client</h1>
        </div>
        <div className="flex space-x-3 mt-4 sm:mt-0">
          <button 
            onClick={generatePDF}
            className="btn btn-secondary flex items-center"
          >
            <Download size={18} className="mr-1" />
            Exporter PDF
          </button>
          <Link 
            to={`/clients/${id}/edit`}
            className="btn btn-primary flex items-center"
          >
            <Edit size={18} className="mr-1" />
            Modifier
          </Link>
          <button 
            onClick={handleDelete}
            className="btn btn-danger flex items-center"
          >
            <Trash2 size={18} className="mr-1" />
            Supprimer
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Client Info Card */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="bg-primary-600 p-6 text-center">
              <img 
                src={client.profileImage || 'https://images.pexels.com/photos/1438081/pexels-photo-1438081.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2'} 
                alt={`${client.firstName} ${client.lastName}`}
                className="w-24 h-24 mx-auto rounded-full object-cover border-4 border-white"
              />
              <h2 className="mt-4 text-xl font-semibold text-white">
                {client.firstName} {client.lastName}
              </h2>
              <p className="text-primary-200">ID: {client.id}</p>
              <div className="mt-4 bg-primary-700 py-2 px-4 rounded-md">
                <p className="text-sm text-primary-200">Solde Total</p>
                <p className="text-2xl font-bold text-white">
                  {formatCurrency(client.totalBalance)}
                </p>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="flex items-center">
                <User size={20} className="text-gray-400 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">Client depuis</p>
                  <p className="text-gray-700">{format(new Date(client.createdAt), 'dd MMMM yyyy')}</p>
                </div>
              </div>
              
              <div className="flex items-center">
                <Mail size={20} className="text-gray-400 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="text-gray-700">{client.email}</p>
                </div>
              </div>
              
              <div className="flex items-center">
                <Phone size={20} className="text-gray-400 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">Téléphone</p>
                  <p className="text-gray-700">{client.phoneNumber}</p>
                </div>
              </div>
              
              <div className="flex items-center">
                <Home size={20} className="text-gray-400 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">Adresse</p>
                  <p className="text-gray-700">{client.address}</p>
                </div>
              </div>
              
              <div className="border-t border-gray-200 pt-4">
                <h3 className="text-gray-700 font-medium mb-2">Contact d'Urgence</h3>
                {client.emergencyContact.name ? (
                  <>
                    <p className="text-gray-700">{client.emergencyContact.name}</p>
                    <p className="text-gray-500 text-sm">{client.emergencyContact.phoneNumber}</p>
                    <p className="text-gray-500 text-sm">Relation: {client.emergencyContact.relationship}</p>
                  </>
                ) : (
                  <p className="text-gray-500 italic">Aucun contact d'urgence</p>
                )}
              </div>

              {/* Accounts Section */}
              <div className="border-t border-gray-200 pt-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-gray-700 font-medium">Comptes</h3>
                  <button
                    onClick={() => setShowAddAccountModal(true)}
                    className="text-primary-600 hover:text-primary-800 flex items-center text-sm"
                  >
                    <Plus size={16} className="mr-1" />
                    Ajouter
                  </button>
                </div>
                <div className="space-y-3">
                  {client.accounts.map(account => (
                    <div key={account.id} className="bg-gray-50 p-3 rounded-md">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-sm font-medium text-gray-700">
                            {account.type === 'savings' ? 'Épargne' : 'Courant'}
                          </p>
                          <p className="text-xs text-gray-500">{account.accountNumber}</p>
                        </div>
                        <p className="text-sm font-semibold">{formatCurrency(account.balance)}</p>
                      </div>
                      <div className="mt-2 flex space-x-2">
                        <Link 
                          to="/transactions/add" 
                          state={{ clientId: id, accountId: account.id }}
                          className="text-success-600 hover:text-success-800 text-xs flex items-center"
                        >
                          <ArrowUpCircle size={14} className="mr-1" />
                          Dépôt
                        </Link>
                        <Link 
                          to="/transactions/add" 
                          state={{ clientId: id, accountId: account.id, isWithdrawal: true }}
                          className="text-error-600 hover:text-error-800 text-xs flex items-center"
                        >
                          <ArrowDownCircle size={14} className="mr-1" />
                          Retrait
                        </Link>
                      </div>
                    </div>
                  ))}
                  {client.accounts.length === 0 && (
                    <p className="text-gray-500 text-sm italic">Aucun compte</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Transactions and Loans */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recent Transactions */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-800">Transactions Récentes</h2>
              <Link to="/transactions" className="text-primary-600 hover:text-primary-800 text-sm">
                Voir tout
              </Link>
            </div>
            
            {clientTransactions.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Description
                      </th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Montant
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {clientTransactions.slice(0, 5).map(transaction => (
                      <tr key={transaction.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                          {format(new Date(transaction.date), 'dd/MM/yyyy HH:mm')}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            transaction.type === 'deposit' 
                              ? 'bg-success-100 text-success-800' 
                              : 'bg-error-100 text-error-800'
                          }`}>
                            {transaction.type === 'deposit' ? 'Dépôt' : 'Retrait'}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                          {transaction.description}
                        </td>
                        <td className={`px-4 py-3 whitespace-nowrap text-sm font-medium text-right ${
                          transaction.type === 'deposit' ? 'text-success-600' : 'text-error-600'
                        }`}>
                          {transaction.type === 'deposit' ? '+' : '-'} {formatCurrency(transaction.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <CreditCard size={36} className="mx-auto text-gray-300 mb-2" />
                <p>Aucune transaction pour ce client</p>
              </div>
            )}
          </div>
          
          {/* Loans */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-800">Prêts</h2>
              <Link 
                to="/loans/add" 
                state={{ clientId: id }}
                className="text-primary-600 hover:text-primary-800 text-sm"
              >
                Nouveau prêt
              </Link>
            </div>
            
            {clientLoans.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Montant
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Statut
                      </th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Solde Restant
                      </th>
                      <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {clientLoans.map(loan => (
                      <tr key={loan.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                          {format(new Date(loan.startDate), 'dd/MM/yyyy')}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-700">
                          {formatCurrency(loan.amount)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
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
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-right">
                          {formatCurrency(loan.remainingBalance)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-center">
                          <Link 
                            to={`/loans/${loan.id}`}
                            className="text-primary-600 hover:text-primary-800"
                          >
                            Détails
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <PiggyBank size={36} className="mx-auto text-gray-300 mb-2" />
                <p>Aucun prêt pour ce client</p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Delete confirmation modal */}
      {showDeleteModal && (
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
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Supprimer le client</h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Êtes-vous sûr de vouloir supprimer ce client? Cette action est irréversible et supprimera toutes les données associées à ce client.
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

      {/* Add Account Modal */}
      {showAddAccountModal && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-primary-100 sm:mx-0 sm:h-10 sm:w-10">
                    <CreditCard className="h-6 w-6 text-primary-600" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Ajouter un compte</h3>
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700">Type de compte</label>
                      <select
                        value={newAccountType}
                        onChange={(e) => setNewAccountType(e.target.value as 'savings' | 'checking')}
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
                      >
                        <option value="savings">Compte d'épargne</option>
                        <option value="checking">Compte courant</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={handleAddAccount}
                >
                  Ajouter
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => setShowAddAccountModal(false)}
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

export default ClientDetails;