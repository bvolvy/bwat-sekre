import React, { useState } from 'react';
import { useClients } from '../../context/ClientContext';
import { useTransactions } from '../../context/TransactionContext';
import { useLoans } from '../../context/LoanContext';
import { 
  FileText, 
  Calendar, 
  Users, 
  CreditCard, 
  PiggyBank, 
  Download, 
  ArrowUpCircle, 
  ArrowDownCircle 
} from 'lucide-react';
import { format, subDays, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

import { ReportType, ReportCategory } from '../../types';

const Reports = () => {
  const { clients } = useClients();
  const { transactions } = useTransactions();
  const { loans } = useLoans();
  
  const [reportSettings, setReportSettings] = useState({
    type: 'daily' as ReportType,
    category: 'transactions' as ReportCategory,
    startDate: format(subDays(new Date(), 7), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
    clientId: ''
  });
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setReportSettings(prev => ({ ...prev, [name]: value }));
  };
  
  const handleDateRangeChange = (range: 'daily' | 'monthly' | 'yearly') => {
    const today = new Date();
    let startDate = '';
    
    if (range === 'daily') {
      startDate = format(subDays(today, 7), 'yyyy-MM-dd');
    } else if (range === 'monthly') {
      startDate = format(startOfMonth(today), 'yyyy-MM-dd');
    } else if (range === 'yearly') {
      startDate = format(startOfYear(today), 'yyyy-MM-dd');
    }
    
    setReportSettings(prev => ({
      ...prev,
      type: range,
      startDate,
      endDate: format(today, 'yyyy-MM-dd')
    }));
  };
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'HTG',
      minimumFractionDigits: 2
    }).format(amount);
  };
  
  // Filter data based on report settings
  const getFilteredData = () => {
    const startDate = new Date(reportSettings.startDate);
    const endDate = new Date(reportSettings.endDate);
    endDate.setHours(23, 59, 59); // Set to end of day
    
    // Filter by client if specified
    const clientFilter = (item: { clientId: string }) => {
      if (reportSettings.clientId) {
        return item.clientId === reportSettings.clientId;
      }
      return true;
    };
    
    // Filter by date range
    const dateFilter = (dateString: string) => {
      const date = new Date(dateString);
      return date >= startDate && date <= endDate;
    };
    
    // Process data based on category
    if (reportSettings.category === 'transactions') {
      return transactions
        .filter(clientFilter)
        .filter(t => dateFilter(t.date))
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    } else if (reportSettings.category === 'clients') {
      // For clients, we'll show transactions for each client in the date range
      if (reportSettings.clientId) {
        return clients.filter(c => c.id === reportSettings.clientId);
      }
      return clients;
    } else if (reportSettings.category === 'loans') {
      return loans
        .filter(clientFilter)
        .filter(l => dateFilter(l.startDate))
        .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
    }
    
    return [];
  };
  
  const filteredData = getFilteredData();
  
  // Calculate summary statistics
  const calculateSummary = () => {
    if (reportSettings.category === 'transactions') {
      const depositsTotal = filteredData
        .filter((t: any) => t.type === 'deposit')
        .reduce((sum: number, t: any) => sum + t.amount, 0);
        
      const withdrawalsTotal = filteredData
        .filter((t: any) => t.type === 'withdrawal')
        .reduce((sum: number, t: any) => sum + t.amount, 0);
        
      const totalTransactions = filteredData.length;
      
      return {
        depositsTotal,
        withdrawalsTotal,
        totalTransactions
      };
    } else if (reportSettings.category === 'clients') {
      const totalClients = filteredData.length;
      const totalBalance = (filteredData as any[]).reduce((sum, client) => sum + client.totalBalance, 0);
      
      return {
        totalClients,
        totalBalance
      };
    } else if (reportSettings.category === 'loans') {
      const totalActiveLoans = (filteredData as any[]).filter(loan => loan.status === 'active').length;
      const totalLoanAmount = (filteredData as any[]).reduce((sum, loan) => sum + loan.amount, 0);
      const totalRemainingBalance = (filteredData as any[]).reduce((sum, loan) => sum + loan.remainingBalance, 0);
      
      return {
        totalActiveLoans,
        totalLoanAmount,
        totalRemainingBalance
      };
    }
    
    return {};
  };
  
  const summary = calculateSummary();
  
  // Generate PDF report
  const generatePDF = () => {
    const doc = new jsPDF();
    const title = `Rapport ${
      reportSettings.type === 'daily' ? 'Quotidien' : 
      reportSettings.type === 'monthly' ? 'Mensuel' : 'Annuel'
    } - ${
      reportSettings.category === 'transactions' ? 'Transactions' :
      reportSettings.category === 'clients' ? 'Clients' : 'Prêts'
    }`;
    
    // Add title
    doc.setFontSize(20);
    doc.text(title, 105, 20, { align: 'center' });
    
    // Add period
    doc.setFontSize(12);
    doc.text(`Période: ${format(new Date(reportSettings.startDate), 'dd/MM/yyyy')} - ${format(new Date(reportSettings.endDate), 'dd/MM/yyyy')}`, 105, 30, { align: 'center' });
    
    // Add generated date
    doc.setFontSize(10);
    doc.text(`Généré le: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 105, 38, { align: 'center' });
    
    // Add summary based on category
    doc.setFontSize(14);
    doc.text('Résumé', 20, 50);
    
    if (reportSettings.category === 'transactions') {
      doc.setFontSize(12);
      doc.text(`Nombre total de transactions: ${summary.totalTransactions}`, 20, 60);
      doc.text(`Total des dépôts: ${formatCurrency(summary.depositsTotal)}`, 20, 70);
      doc.text(`Total des retraits: ${formatCurrency(summary.withdrawalsTotal)}`, 20, 80);
      doc.text(`Bilan net: ${formatCurrency(summary.depositsTotal - summary.withdrawalsTotal)}`, 20, 90);
      
      // Add transactions table
      if (filteredData.length > 0) {
        doc.text('Détails des Transactions', 20, 110);
        
        // @ts-ignore
        doc.autoTable({
          startY: 120,
          head: [['Date', 'Client', 'Type', 'Montant', 'Description']],
          body: (filteredData as any[]).map(t => {
            const client = clients.find(c => c.id === t.clientId);
            return [
              format(new Date(t.date), 'dd/MM/yyyy HH:mm'),
              client ? `${client.firstName} ${client.lastName}` : t.clientId,
              t.type === 'deposit' ? 'Dépôt' : 'Retrait',
              formatCurrency(t.amount),
              t.description
            ];
          }),
        });
      }
      
    } else if (reportSettings.category === 'clients') {
      doc.setFontSize(12);
      doc.text(`Nombre total de clients: ${summary.totalClients}`, 20, 60);
      doc.text(`Solde total des comptes: ${formatCurrency(summary.totalBalance)}`, 20, 70);
      
      // Add clients table
      if (filteredData.length > 0) {
        doc.text('Liste des Clients', 20, 90);
        
        // @ts-ignore
        doc.autoTable({
          startY: 100,
          head: [['ID', 'Nom', 'Email', 'Téléphone', 'Solde']],
          body: (filteredData as any[]).map(client => [
            client.id,
            `${client.firstName} ${client.lastName}`,
            client.email,
            client.phoneNumber,
            formatCurrency(client.totalBalance)
          ]),
        });
      }
      
    } else if (reportSettings.category === 'loans') {
      doc.setFontSize(12);
      doc.text(`Nombre total de prêts actifs: ${summary.totalActiveLoans}`, 20, 60);
      doc.text(`Montant total des prêts: ${formatCurrency(summary.totalLoanAmount)}`, 20, 70);
      doc.text(`Solde restant total: ${formatCurrency(summary.totalRemainingBalance)}`, 20, 80);
      
      // Add loans table
      if (filteredData.length > 0) {
        doc.text('Liste des Prêts', 20, 100);
        
        // @ts-ignore
        doc.autoTable({
          startY: 110,
          head: [['Date', 'Client', 'Montant', 'Statut', 'Solde Restant']],
          body: (filteredData as any[]).map(loan => {
            const client = clients.find(c => c.id === loan.clientId);
            return [
              format(new Date(loan.startDate), 'dd/MM/yyyy'),
              client ? `${client.firstName} ${client.lastName}` : loan.clientId,
              formatCurrency(loan.amount),
              loan.status,
              formatCurrency(loan.remainingBalance)
            ];
          }),
        });
      }
    }
    
    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(10);
      doc.text(
        `Page ${i} sur ${pageCount} - Volvy Bank`,
        105,
        doc.internal.pageSize.height - 10,
        { align: 'center' }
      );
    }
    
    // Save the PDF
    const fileName = `volvy-bank-rapport-${reportSettings.category}-${format(new Date(), 'yyyyMMdd_HHmmss')}.pdf`;
    doc.save(fileName);
  };
  
  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold text-gray-800">Rapports</h1>
      
      {/* Report Configuration */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Paramètres du Rapport</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Report Type */}
          <div className="form-control">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type de Rapport
            </label>
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={() => handleDateRangeChange('daily')}
                className={`flex-1 py-2 rounded-md flex items-center justify-center ${
                  reportSettings.type === 'daily'
                    ? 'bg-primary-100 text-primary-700 border border-primary-300'
                    : 'bg-gray-100 text-gray-600 border border-gray-200'
                }`}
              >
                <Calendar size={18} className="mr-1" />
                <span className="text-xs sm:text-sm">Quotidien</span>
              </button>
              <button
                type="button"
                onClick={() => handleDateRangeChange('monthly')}
                className={`flex-1 py-2 rounded-md flex items-center justify-center ${
                  reportSettings.type === 'monthly'
                    ? 'bg-primary-100 text-primary-700 border border-primary-300'
                    : 'bg-gray-100 text-gray-600 border border-gray-200'
                }`}
              >
                <Calendar size={18} className="mr-1" />
                <span className="text-xs sm:text-sm">Mensuel</span>
              </button>
              <button
                type="button"
                onClick={() => handleDateRangeChange('yearly')}
                className={`flex-1 py-2 rounded-md flex items-center justify-center ${
                  reportSettings.type === 'yearly'
                    ? 'bg-primary-100 text-primary-700 border border-primary-300'
                    : 'bg-gray-100 text-gray-600 border border-gray-200'
                }`}
              >
                <Calendar size={18} className="mr-1" />
                <span className="text-xs sm:text-sm">Annuel</span>
              </button>
            </div>
          </div>
          
          {/* Report Category */}
          <div className="form-control">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Catégorie
            </label>
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={() => setReportSettings(prev => ({ ...prev, category: 'transactions' }))}
                className={`flex-1 py-2 rounded-md flex items-center justify-center ${
                  reportSettings.category === 'transactions'
                    ? 'bg-primary-100 text-primary-700 border border-primary-300'
                    : 'bg-gray-100 text-gray-600 border border-gray-200'
                }`}
              >
                <CreditCard size={18} className="mr-1" />
                <span className="text-xs sm:text-sm">Transactions</span>
              </button>
              <button
                type="button"
                onClick={() => setReportSettings(prev => ({ ...prev, category: 'clients' }))}
                className={`flex-1 py-2 rounded-md flex items-center justify-center ${
                  reportSettings.category === 'clients'
                    ? 'bg-primary-100 text-primary-700 border border-primary-300'
                    : 'bg-gray-100 text-gray-600 border border-gray-200'
                }`}
              >
                <Users size={18} className="mr-1" />
                <span className="text-xs sm:text-sm">Clients</span>
              </button>
              <button
                type="button"
                onClick={() => setReportSettings(prev => ({ ...prev, category: 'loans' }))}
                className={`flex-1 py-2 rounded-md flex items-center justify-center ${
                  reportSettings.category === 'loans'
                    ? 'bg-primary-100 text-primary-700 border border-primary-300'
                    : 'bg-gray-100 text-gray-600 border border-gray-200'
                }`}
              >
                <PiggyBank size={18} className="mr-1" />
                <span className="text-xs sm:text-sm">Prêts</span>
              </button>
            </div>
          </div>
          
          {/* Client Filter */}
          <div className="form-control">
            <label htmlFor="clientId" className="block text-sm font-medium text-gray-700 mb-1">
              Client (Optionnel)
            </label>
            <select
              id="clientId"
              name="clientId"
              value={reportSettings.clientId}
              onChange={handleInputChange}
              className="form-input"
            >
              <option value="">Tous les clients</option>
              {clients.map(client => (
                <option key={client.id} value={client.id}>
                  {client.firstName} {client.lastName}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          {/* Date Range */}
          <div className="form-control">
            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
              Date de début
            </label>
            <input
              type="date"
              id="startDate"
              name="startDate"
              value={reportSettings.startDate}
              onChange={handleInputChange}
              className="form-input"
            />
          </div>
          
          <div className="form-control">
            <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
              Date de fin
            </label>
            <input
              type="date"
              id="endDate"
              name="endDate"
              value={reportSettings.endDate}
              onChange={handleInputChange}
              className="form-input"
            />
          </div>
        </div>
        
        <div className="mt-6 flex justify-end">
          <button
            onClick={generatePDF}
            className="btn btn-primary flex items-center"
          >
            <FileText size={18} className="mr-2" />
            Générer le rapport PDF
          </button>
        </div>
      </div>
      
      {/* Report Preview */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold text-gray-800">Aperçu du Rapport</h2>
          <button
            onClick={generatePDF}
            className="btn btn-secondary btn-sm flex items-center"
          >
            <Download size={16} className="mr-1" />
            Exporter PDF
          </button>
        </div>
        
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {reportSettings.category === 'transactions' && (
            <>
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <p className="text-sm text-gray-500">Nombre de Transactions</p>
                <p className="text-2xl font-semibold text-gray-800">{summary.totalTransactions}</p>
              </div>
              
              <div className="bg-success-50 rounded-lg p-4 border border-success-200">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-gray-700">Total Dépôts</p>
                    <p className="text-2xl font-semibold text-success-700">
                      {formatCurrency(summary.depositsTotal)}
                    </p>
                  </div>
                  <ArrowUpCircle className="h-8 w-8 text-success-500" />
                </div>
              </div>
              
              <div className="bg-error-50 rounded-lg p-4 border border-error-200">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-gray-700">Total Retraits</p>
                    <p className="text-2xl font-semibold text-error-700">
                      {formatCurrency(summary.withdrawalsTotal)}
                    </p>
                  </div>
                  <ArrowDownCircle className="h-8 w-8 text-error-500" />
                </div>
              </div>
            </>
          )}
          
          {reportSettings.category === 'clients' && (
            <>
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <p className="text-sm text-gray-500">Nombre de Clients</p>
                <p className="text-2xl font-semibold text-gray-800">{summary.totalClients}</p>
              </div>
              
              <div className="bg-primary-50 rounded-lg p-4 border border-primary-200 col-span-2">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-gray-700">Total des Soldes</p>
                    <p className="text-2xl font-semibold text-primary-700">
                      {formatCurrency(summary.totalBalance)}
                    </p>
                  </div>
                  <Users className="h-8 w-8 text-primary-500" />
                </div>
              </div>
            </>
          )}
          
          {reportSettings.category === 'loans' && (
            <>
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <p className="text-sm text-gray-500">Prêts Actifs</p>
                <p className="text-2xl font-semibold text-gray-800">{summary.totalActiveLoans}</p>
              </div>
              
              <div className="bg-warning-50 rounded-lg p-4 border border-warning-200">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-gray-700">Montant Total</p>
                    <p className="text-2xl font-semibold text-warning-700">
                      {formatCurrency(summary.totalLoanAmount)}
                    </p>
                  </div>
                  <PiggyBank className="h-8 w-8 text-warning-500" />
                </div>
              </div>
              
              <div className="bg-secondary-50 rounded-lg p-4 border border-secondary-200">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-gray-700">Solde Restant</p>
                    <p className="text-2xl font-semibold text-secondary-700">
                      {formatCurrency(summary.totalRemainingBalance)}
                    </p>
                  </div>
                  <PiggyBank className="h-8 w-8 text-secondary-500" />
                </div>
              </div>
            </>
          )}
        </div>
        
        {/* Report Data Table */}
        <div className="overflow-x-auto">
          {reportSettings.category === 'transactions' && (
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Client
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Montant
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredData.length > 0 ? (
                  (filteredData as any[]).map((transaction) => {
                    const client = clients.find(c => c.id === transaction.clientId);
                    return (
                      <tr key={transaction.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                          {format(new Date(transaction.date), 'dd/MM/yyyy HH:mm')}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
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
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            transaction.type === 'deposit' 
                              ? 'bg-success-100 text-success-800' 
                              : 'bg-error-100 text-error-800'
                          }`}>
                            {transaction.type === 'deposit' ? 'Dépôt' : 'Retrait'}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                          {transaction.description}
                        </td>
                        <td className={`px-4 py-3 whitespace-nowrap text-sm font-medium text-right ${
                          transaction.type === 'deposit' ? 'text-success-600' : 'text-error-600'
                        }`}>
                          {transaction.type === 'deposit' ? '+' : '-'} {formatCurrency(transaction.amount)}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={5} className="px-4 py-4 text-center text-gray-500">
                      Aucune transaction trouvée pour cette période
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
          
          {reportSettings.category === 'clients' && (
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Client
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Téléphone
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date d'inscription
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Solde
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredData.length > 0 ? (
                  (filteredData as any[]).map((client) => (
                    <tr key={client.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 flex-shrink-0">
                            <img
                              className="h-10 w-10 rounded-full object-cover"
                              src={client.profileImage || 'https://images.pexels.com/photos/1438081/pexels-photo-1438081.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2'}
                              alt={`${client.firstName} ${client.lastName}`}
                            />
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">
                              {client.firstName} {client.lastName}
                            </div>
                            <div className="text-xs text-gray-500">
                              ID: {client.id}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        {client.email}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        {client.phoneNumber}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        {format(new Date(client.createdAt), 'dd/MM/yyyy')}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-right">
                        {formatCurrency(client.totalBalance)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-4 py-4 text-center text-gray-500">
                      Aucun client trouvé
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          
          )}
          
          {reportSettings.category === 'loans' && (
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Client
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Objectif
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Montant
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Solde Restant
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredData.length > 0 ? (
                  (filteredData as any[]).map((loan) => {
                    const client = clients.find(c => c.id === loan.clientId);
                    return (
                      <tr key={loan.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                          {format(new Date(loan.startDate), 'dd/MM/yyyy')}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
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
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                          {loan.purpose}
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
                          {formatCurrency(loan.amount)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-right">
                          {formatCurrency(loan.remainingBalance)}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="px-4 py-4 text-center text-gray-500">
                      Aucun prêt trouvé pour cette période
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default Reports;