import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Calendar, 
  DollarSign, 
  Percent, 
  Clock, 
  Target, 
  CheckCircle,
  XCircle,
  AlertCircle,
  Download
} from 'lucide-react';
import { useLoans } from '../../context/LoanContext';
import { useClients } from '../../context/ClientContext';
import { format } from 'date-fns';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

const LoanDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { loans, getLoan, addLoanPayment, updateLoanStatus } = useLoans();
  const { clients } = useClients();
  
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentError, setPaymentError] = useState('');
  
  if (!id) {
    return <div>Loan ID is missing</div>;
  }
  
  const loan = getLoan(id);
  const client = loan ? clients.find(c => c.id === loan.clientId) : null;
  
  if (!loan || !client) {
    return (
      <div className="flex flex-col items-center justify-center mt-16">
        <AlertCircle size={48} className="text-error-500 mb-4" />
        <h2 className="text-xl font-semibold text-gray-800 mb-2">Prêt Introuvable</h2>
        <p className="text-gray-600 mb-4">Le prêt que vous recherchez n'existe pas ou a été supprimé.</p>
        <Link to="/loans" className="btn btn-primary">
          Retour à la liste des prêts
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
  
  const handlePayment = () => {
    const amount = Number(paymentAmount);
    
    if (!amount || isNaN(amount) || amount <= 0) {
      setPaymentError('Veuillez entrer un montant valide');
      return;
    }
    
    if (amount > loan.remainingBalance) {
      setPaymentError('Le montant du paiement ne peut pas dépasser le solde restant');
      return;
    }
    
    addLoanPayment(id, amount);
    setShowPaymentModal(false);
    setPaymentAmount('');
    setPaymentError('');
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
    doc.text('Détails du Prêt', 105, 40, { align: 'center' });
    
    // Add loan details
    doc.setFontSize(12);
    doc.text(`Client: ${client.firstName} ${client.lastName}`, 20, 60);
    doc.text(`ID du Prêt: ${loan.id}`, 20, 70);
    doc.text(`Montant: ${formatCurrency(loan.amount)}`, 20, 80);
    doc.text(`Taux d'Intérêt: ${loan.interestRate}%`, 20, 90);
    doc.text(`Durée: ${loan.term} mois`, 20, 100);
    doc.text(`Objectif: ${loan.purpose}`, 20, 110);
    doc.text(`Statut: ${loan.status}`, 20, 120);
    doc.text(`Solde Restant: ${formatCurrency(loan.remainingBalance)}`, 20, 130);
    
    // Add payments table
    if (loan.payments.length > 0) {
      doc.text('Historique des Paiements', 20, 150);
      
      // @ts-ignore
      doc.autoTable({
        startY: 160,
        head: [['Date', 'Montant', 'Statut']],
        body: loan.payments.map(payment => [
          format(new Date(payment.date), 'dd/MM/yyyy'),
          formatCurrency(payment.amount),
          payment.status
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
    doc.save(`pret-${loan.id}.pdf`);
  };
  
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center">
          <Link to="/loans" className="mr-4 text-gray-500 hover:text-gray-700">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-2xl font-bold text-gray-800">Détails du Prêt</h1>
        </div>
        <div className="flex space-x-3 mt-4 sm:mt-0">
          <button 
            onClick={generatePDF}
            className="btn btn-secondary flex items-center"
          >
            <Download size={18} className="mr-1" />
            Exporter PDF
          </button>
          {loan.status === 'pending' && (
            <>
              <button 
                onClick={() => updateLoanStatus(id, 'active')}
                className="btn btn-success flex items-center"
              >
                <CheckCircle size={18} className="mr-1" />
                Approuver
              </button>
              <button 
                onClick={() => updateLoanStatus(id, 'defaulted')}
                className="btn btn-danger flex items-center"
              >
                <XCircle size={18} className="mr-1" />
                Rejeter
              </button>
            </>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Loan Info */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-md p-6">
            {/* Client Info */}
            <div className="flex items-center mb-6">
              <img 
                src={client.profileImage || 'https://images.pexels.com/photos/1438081/pexels-photo-1438081.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2'} 
                alt={`${client.firstName} ${client.lastName}`}
                className="w-16 h-16 rounded-full object-cover"
              />
              <div className="ml-4">
                <h2 className="text-xl font-semibold">
                  {client.firstName} {client.lastName}
                </h2>
                <p className="text-gray-500">{client.email}</p>
                <p className="text-sm text-gray-500">ID Client: {client.id}</p>
              </div>
            </div>
            
            {/* Loan Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-start">
                  <DollarSign className="h-5 w-5 text-gray-400 mt-1 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">Montant du Prêt</p>
                    <p className="text-lg font-semibold">{formatCurrency(loan.amount)}</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <Percent className="h-5 w-5 text-gray-400 mt-1 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">Taux d'Intérêt</p>
                    <p className="text-lg font-semibold">{loan.interestRate}%</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <Clock className="h-5 w-5 text-gray-400 mt-1 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">Durée</p>
                    <p className="text-lg font-semibold">{loan.term} mois</p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-start">
                  <Calendar className="h-5 w-5 text-gray-400 mt-1 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">Date de Début</p>
                    <p className="text-lg font-semibold">
                      {format(new Date(loan.startDate), 'dd/MM/yyyy')}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <Calendar className="h-5 w-5 text-gray-400 mt-1 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">Date de Fin</p>
                    <p className="text-lg font-semibold">
                      {format(new Date(loan.endDate), 'dd/MM/yyyy')}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <Target className="h-5 w-5 text-gray-400 mt-1 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">Objectif</p>
                    <p className="text-lg font-semibold">{loan.purpose}</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Status and Progress */}
            <div className="mt-8 border-t border-gray-200 pt-6">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <p className="text-sm text-gray-500">Statut du Prêt</p>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
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
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Solde Restant</p>
                  <p className="text-2xl font-bold text-primary-600">
                    {formatCurrency(loan.remainingBalance)}
                  </p>
                </div>
              </div>
              
              {/* Progress Bar */}
              <div className="relative pt-1">
                <div className="flex mb-2 items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold inline-block text-primary-600">
                      Progression du Remboursement
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-semibold inline-block text-primary-600">
                      {Math.round(((loan.amount - loan.remainingBalance) / loan.amount) * 100)}%
                    </span>
                  </div>
                </div>
                <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-primary-100">
                  <div
                    style={{ width: `${((loan.amount - loan.remainingBalance) / loan.amount) * 100}%` }}
                    className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-primary-500"
                  ></div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Payment History */}
          <div className="bg-white rounded-lg shadow-md p-6 mt-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold text-gray-800">Historique des Paiements</h2>
              {loan.status === 'active' && (
                <button
                  onClick={() => setShowPaymentModal(true)}
                  className="btn btn-primary"
                >
                  Nouveau Paiement
                </button>
              )}
            </div>
            
            {loan.payments.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Montant
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Statut
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {loan.payments.map(payment => (
                      <tr key={payment.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {format(new Date(payment.date), 'dd/MM/yyyy')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {formatCurrency(payment.amount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            payment.status === 'completed'
                              ? 'bg-success-100 text-success-800'
                              : 'bg-warning-100 text-warning-800'
                          }`}>
                            {payment.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Calendar size={36} className="mx-auto text-gray-300 mb-2" />
                <p>Aucun paiement effectué</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Payment Schedule */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-6 sticky top-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Échéancier de Paiement</h2>
            
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Paiement Mensuel</p>
                <p className="text-xl font-semibold text-primary-600">
                  {formatCurrency(loan.paymentAmount)}
                </p>
              </div>
              
              <div className="border-t border-gray-200 pt-4">
                <p className="text-sm text-gray-500">Prochain Paiement</p>
                <p className="text-lg font-semibold">
                  {format(new Date(), 'dd/MM/yyyy')}
                </p>
              </div>
              
              <div className="border-t border-gray-200 pt-4">
                <p className="text-sm text-gray-500">Montant Total du Prêt</p>
                <p className="text-lg font-semibold">{formatCurrency(loan.amount)}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-500">Intérêts Totaux</p>
                <p className="text-lg font-semibold">
                  {formatCurrency((loan.paymentAmount * loan.term) - loan.amount)}
                </p>
              </div>
              
              <div>
                <p className="text-sm text-gray-500">Montant Total à Rembourser</p>
                <p className="text-lg font-semibold">
                  {formatCurrency(loan.paymentAmount * loan.term)}
                </p>
              </div>
              
              <div className="border-t border-gray-200 pt-4">
                <p className="text-sm text-gray-500">Solde Restant</p>
                <p className="text-xl font-bold text-primary-800">
                  {formatCurrency(loan.remainingBalance)}
                </p>
              </div>
            </div>
            
            {loan.status === 'active' && (
              <button
                onClick={() => setShowPaymentModal(true)}
                className="w-full btn btn-primary mt-6"
              >
                Effectuer un Paiement
              </button>
            )}
          </div>
        </div>
      </div>
      
      {/* Payment Modal */}
      {showPaymentModal && (
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
                    <DollarSign className="h-6 w-6 text-primary-600" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Effectuer un Paiement
                    </h3>
                    <div className="mt-4">
                      <label htmlFor="paymentAmount" className="block text-sm font-medium text-gray-700">
                        Montant
                      </label>
                      <div className="mt-1 relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <span className="text-gray-500 sm:text-sm">HTG</span>
                        </div>
                        <input
                          type="number"
                          name="paymentAmount"
                          id="paymentAmount"
                          className="focus:ring-primary-500 focus:border-primary-500 block w-full pl-12 pr-12 sm:text-sm border-gray-300 rounded-md"
                          placeholder="0"
                          value={paymentAmount}
                          onChange={(e) => {
                            setPaymentAmount(e.target.value);
                            setPaymentError('');
                          }}
                        />
                      </div>
                      {paymentError && (
                        <p className="mt-2 text-sm text-error-600">{paymentError}</p>
                      )}
                      <p className="mt-2 text-sm text-gray-500">
                        Solde restant: {formatCurrency(loan.remainingBalance)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={handlePayment}
                >
                  Confirmer le Paiement
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => {
                    setShowPaymentModal(false);
                    setPaymentAmount('');
                    setPaymentError('');
                  }}
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

export default LoanDetails;