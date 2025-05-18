import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { ArrowLeft, Info } from 'lucide-react';
import { useClients } from '../../context/ClientContext';
import { useLoans } from '../../context/LoanContext';
import { addMonths, format } from 'date-fns';
import { SUPPORTED_CURRENCIES } from '../../types';

const MIN_AMOUNT = 50;

const AddLoan = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { clients } = useClients();
  const { addLoan } = useLoans();
  
  // Get clientId from location state if available
  const initialClientId = location.state?.clientId || '';
  
  const [formData, setFormData] = useState({
    clientId: initialClientId,
    amount: '',
    interestRate: '8.5',
    term: '12', // Default to 12 months
    startDate: format(new Date(), 'yyyy-MM-dd'),
    purpose: '',
    currency: 'HTG'
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when field is edited
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };
  
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.clientId) {
      newErrors.clientId = 'Veuillez sélectionner un client';
    }
    
    if (!formData.amount || isNaN(Number(formData.amount)) || Number(formData.amount) < MIN_AMOUNT) {
      newErrors.amount = `Le montant minimum est de ${MIN_AMOUNT} ${formData.currency}`;
    }
    
    if (!formData.interestRate || isNaN(Number(formData.interestRate)) || Number(formData.interestRate) < 0) {
      newErrors.interestRate = 'Veuillez entrer un taux d\'intérêt valide';
    }
    
    if (!formData.term || isNaN(Number(formData.term)) || Number(formData.term) <= 0) {
      newErrors.term = 'Veuillez entrer une durée valide';
    }
    
    if (!formData.startDate) {
      newErrors.startDate = 'Veuillez sélectionner une date de début';
    }
    
    if (!formData.purpose.trim()) {
      newErrors.purpose = 'Veuillez entrer un objectif pour le prêt';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const calculatePaymentAmount = () => {
    const principal = Number(formData.amount);
    const interestRate = Number(formData.interestRate) / 100 / 12; // Monthly interest rate
    const term = Number(formData.term); // Number of months
    
    if (principal && interestRate && term) {
      // Formula for monthly payment: P * r * (1+r)^n / ((1+r)^n - 1)
      const monthlyPayment = principal * interestRate * Math.pow(1 + interestRate, term) / (Math.pow(1 + interestRate, term) - 1);
      return Math.round(monthlyPayment);
    }
    return 0;
  };
  
  const calculateTotalRepayment = () => {
    const monthlyPayment = calculatePaymentAmount();
    const term = Number(formData.term);
    
    if (monthlyPayment && term) {
      return monthlyPayment * term;
    }
    return 0;
  };
  
  const calculateTotalInterest = () => {
    const totalRepayment = calculateTotalRepayment();
    const principal = Number(formData.amount);
    
    if (totalRepayment && principal) {
      return totalRepayment - principal;
    }
    return 0;
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      const startDate = new Date(formData.startDate);
      const endDate = addMonths(startDate, Number(formData.term));
      
      // Add the loan
      addLoan({
        clientId: formData.clientId,
        amount: Number(formData.amount),
        interestRate: Number(formData.interestRate),
        term: Number(formData.term),
        startDate: formData.startDate,
        endDate: format(endDate, 'yyyy-MM-dd'),
        paymentAmount: calculatePaymentAmount(),
        purpose: formData.purpose,
        currency: formData.currency
      });
      
      // Navigate back to loans list
      navigate('/loans');
    }
  };
  
  // Get client for display
  const selectedClient = clients.find(client => client.id === formData.clientId);
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: formData.currency,
      minimumFractionDigits: 2
    }).format(amount);
  };
  
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center">
        <Link to="/loans" className="mr-4 text-gray-500 hover:text-gray-700">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-2xl font-bold text-gray-800">Nouveau Prêt</h1>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-md p-6">
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                {/* Client Selection */}
                <div className="form-control">
                  <label htmlFor="clientId" className="form-label">
                    Client <span className="text-error-500">*</span>
                  </label>
                  <select
                    id="clientId"
                    name="clientId"
                    value={formData.clientId}
                    onChange={handleInputChange}
                    className={`form-input ${errors.clientId ? 'border-error-500' : ''}`}
                    disabled={!!initialClientId}
                  >
                    <option value="">Sélectionner un client</option>
                    {clients.map(client => (
                      <option key={client.id} value={client.id}>
                        {client.firstName} {client.lastName} - {client.id}
                      </option>
                    ))}
                  </select>
                  {errors.clientId && (
                    <p className="mt-1 text-sm text-error-500">{errors.clientId}</p>
                  )}
                </div>
                
                {/* Show client info if selected */}
                {selectedClient && (
                  <div className="bg-gray-50 p-4 rounded-md mb-4">
                    <div className="flex items-center">
                      <img
                        src={selectedClient.profileImage || 'https://images.pexels.com/photos/1438081/pexels-photo-1438081.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2'}
                        alt={`${selectedClient.firstName} ${selectedClient.lastName}`}
                        className="w-10 h-10 rounded-full object-cover mr-3"
                      />
                      <div>
                        <p className="font-medium">{selectedClient.firstName} {selectedClient.lastName}</p>
                        <p className="text-sm text-gray-500">{selectedClient.email}</p>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Loan Amount and Currency */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="form-control">
                    <label htmlFor="amount" className="form-label">
                      Montant du Prêt <span className="text-error-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        id="amount"
                        name="amount"
                        value={formData.amount}
                        onChange={handleInputChange}
                        className={`form-input pl-16 ${errors.amount ? 'border-error-500' : ''}`}
                        placeholder="0"
                        min={MIN_AMOUNT}
                        step="1"
                      />
                      <div className="absolute inset-y-0 left-0 flex items-center px-3 pointer-events-none border-r bg-gray-50 rounded-l-md">
                        <span className="text-gray-500">{formData.currency}</span>
                      </div>
                    </div>
                    {errors.amount && (
                      <p className="mt-1 text-sm text-error-500">{errors.amount}</p>
                    )}
                    <p className="mt-1 text-xs text-gray-500">
                      Montant minimum: {MIN_AMOUNT} {formData.currency}
                    </p>
                  </div>

                  <div className="form-control">
                    <label htmlFor="currency" className="form-label">
                      Devise <span className="text-error-500">*</span>
                    </label>
                    <select
                      id="currency"
                      name="currency"
                      value={formData.currency}
                      onChange={handleInputChange}
                      className="form-input"
                    >
                      {SUPPORTED_CURRENCIES.map(currency => (
                        <option key={currency} value={currency}>
                          {currency}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Interest Rate */}
                  <div className="form-control">
                    <label htmlFor="interestRate" className="form-label">
                      Taux d'Intérêt (%) <span className="text-error-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        id="interestRate"
                        name="interestRate"
                        value={formData.interestRate}
                        onChange={handleInputChange}
                        className={`form-input pr-8 ${errors.interestRate ? 'border-error-500' : ''}`}
                        step="0.1"
                        min="0"
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <span className="text-gray-500">%</span>
                      </div>
                    </div>
                    {errors.interestRate && (
                      <p className="mt-1 text-sm text-error-500">{errors.interestRate}</p>
                    )}
                  </div>
                  
                  {/* Term */}
                  <div className="form-control">
                    <label htmlFor="term" className="form-label">
                      Durée (mois) <span className="text-error-500">*</span>
                    </label>
                    <select
                      id="term"
                      name="term"
                      value={formData.term}
                      onChange={handleInputChange}
                      className={`form-input ${errors.term ? 'border-error-500' : ''}`}
                    >
                      <option value="6">6 mois</option>
                      <option value="12">12 mois</option>
                      <option value="24">24 mois</option>
                      <option value="36">36 mois</option>
                      <option value="48">48 mois</option>
                      <option value="60">60 mois</option>
                    </select>
                    {errors.term && (
                      <p className="mt-1 text-sm text-error-500">{errors.term}</p>
                    )}
                  </div>
                  
                  {/* Start Date */}
                  <div className="form-control">
                    <label htmlFor="startDate" className="form-label">
                      Date de Début <span className="text-error-500">*</span>
                    </label>
                    <input
                      type="date"
                      id="startDate"
                      name="startDate"
                      value={formData.startDate}
                      onChange={handleInputChange}
                      className={`form-input ${errors.startDate ? 'border-error-500' : ''}`}
                    />
                    {errors.startDate && (
                      <p className="mt-1 text-sm text-error-500">{errors.startDate}</p>
                    )}
                  </div>
                </div>
                
                {/* Purpose */}
                <div className="form-control">
                  <label htmlFor="purpose" className="form-label">
                    Objectif du Prêt <span className="text-error-500">*</span>
                  </label>
                  <textarea
                    id="purpose"
                    name="purpose"
                    value={formData.purpose}
                    onChange={handleInputChange}
                    className={`form-input min-h-[80px] ${errors.purpose ? 'border-error-500' : ''}`}
                    placeholder="Ex: Achat de voiture, Rénovation domicile, etc."
                  ></textarea>
                  {errors.purpose && (
                    <p className="mt-1 text-sm text-error-500">{errors.purpose}</p>
                  )}
                </div>
              </div>
              
              <div className="mt-8 flex justify-end">
                <Link 
                  to="/loans"
                  className="btn btn-secondary mr-3"
                >
                  Annuler
                </Link>
                <button 
                  type="submit"
                  className="btn btn-primary"
                >
                  Soumettre la Demande
                </button>
              </div>
            </form>
          </div>
        </div>
        
        {/* Loan Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-6 sticky top-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Résumé du Prêt</h2>
            
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Montant du Prêt</p>
                <p className="text-xl font-semibold">
                  {formData.amount ? formatCurrency(Number(formData.amount)) : '-'}
                </p>
              </div>
              
              <div>
                <p className="text-sm text-gray-500">Taux d'Intérêt</p>
                <p className="font-semibold">{formData.interestRate}%</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-500">Durée</p>
                <p className="font-semibold">{formData.term} mois</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-500">Date de Début</p>
                <p className="font-semibold">
                  {formData.startDate ? format(new Date(formData.startDate), 'dd/MM/yyyy') : '-'}
                </p>
              </div>
              
              <div>
                <p className="text-sm text-gray-500">Date de Fin</p>
                <p className="font-semibold">
                  {formData.startDate && formData.term
                    ? format(addMonths(new Date(formData.startDate), Number(formData.term)), 'dd/MM/yyyy')
                    : '-'
                  }
                </p>
              </div>
              
              <div className="border-t border-gray-200 pt-4">
                <div className="flex justify-between items-center">
                  <p className="text-sm font-medium">Paiement Mensuel</p>
                  <p className="font-semibold text-primary-600">
                    {formatCurrency(calculatePaymentAmount())}
                  </p>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between items-center">
                  <p className="text-sm font-medium">Intérêt Total</p>
                  <p className="font-semibold text-gray-700">
                    {formatCurrency(calculateTotalInterest())}
                  </p>
                </div>
              </div>
              
              <div className="border-t border-gray-200 pt-4">
                <div className="flex justify-between items-center">
                  <p className="text-sm font-medium">Montant Total à Rembourser</p>
                  <p className="font-bold text-lg text-primary-800">
                    {formatCurrency(calculateTotalRepayment())}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="mt-6 bg-blue-50 border border-blue-100 rounded-md p-4 flex">
              <Info className="h-5 w-5 text-blue-500 flex-shrink-0 mr-3 mt-0.5" />
              <div className="text-sm text-blue-700">
                <p className="font-medium mb-1">Remarque:</p>
                <p>Ce résumé est à titre indicatif seulement. Les termes définitifs seront fixés lors de l'approbation du prêt.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddLoan;