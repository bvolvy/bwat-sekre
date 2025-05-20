import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { ArrowLeft, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import { useClients } from '../../context/ClientContext';
import { useTransactions } from '../../context/TransactionContext';
import { SUPPORTED_CURRENCIES } from '../../types';

const MIN_AMOUNT = 5;

const AddTransaction = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { clients } = useClients();
  const { addTransaction } = useTransactions();
  
  // Get initial values from location state
  const initialClientId = location.state?.clientId || '';
  const initialAccountId = location.state?.accountId || '';
  const initialType = location.state?.isWithdrawal ? 'withdrawal' : 'deposit';
  
  const [formData, setFormData] = useState({
    clientId: initialClientId,
    accountId: initialAccountId,
    type: initialType,
    amount: '',
    description: '',
    currency: 'HTG'
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  useEffect(() => {
    document.title = formData.type === 'deposit' ? 'Nouveau Dépôt | Bwat Sekrè' : 'Nouveau Retrait | Bwat Sekrè';
    
    // Reset accountId when client changes (unless it was provided in initial state)
    if (formData.clientId && !initialAccountId) {
      const client = clients.find(c => c.id === formData.clientId);
      if (client && client.accounts.length > 0) {
        setFormData(prev => ({ ...prev, accountId: client.accounts[0].id }));
      }
    }
    
    return () => {
      document.title = 'Bwat Sekrè';
    };
  }, [formData.type, formData.clientId, clients, initialAccountId]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };
  
  const handleTypeChange = (type: 'deposit' | 'withdrawal') => {
    setFormData(prev => ({ ...prev, type }));
  };
  
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.clientId) {
      newErrors.clientId = 'Veuillez sélectionner un client';
    }
    
    if (!formData.accountId) {
      newErrors.accountId = 'Veuillez sélectionner un compte';
    }
    
    if (!formData.amount || isNaN(Number(formData.amount))) {
      newErrors.amount = 'Veuillez entrer un montant valide';
    } else {
      const amount =Number(formData.amount);
      if (amount < MIN_AMOUNT) {
        newErrors.amount = `Le montant minimum est de ${MIN_AMOUNT} ${formData.currency}`;
      }
    }
    
    if (formData.type === 'withdrawal' && formData.clientId && formData.accountId && !isNaN(Number(formData.amount))) {
      const client = clients.find(c => c.id === formData.clientId);
      const account = client?.accounts.find(a => a.id === formData.accountId);
      if (account && Number(formData.amount) > account.balance) {
        newErrors.amount = 'Solde insuffisant';
      }
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'Veuillez entrer une description';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      addTransaction({
        clientId: formData.clientId,
        accountId: formData.accountId,
        type: formData.type as 'deposit' | 'withdrawal',
        amount: Number(formData.amount),
        description: formData.description,
        currency: formData.currency
      });
      
      navigate('/transactions');
    }
  };
  
  const selectedClient = clients.find(client => client.id === formData.clientId);
  const selectedAccount = selectedClient?.accounts.find(account => account.id === formData.accountId);
  
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
        <Link to="/transactions" className="mr-4 text-gray-500 hover:text-gray-700">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-2xl font-bold text-gray-800">
          {formData.type === 'deposit' ? 'Nouveau Dépôt' : 'Nouveau Retrait'}
        </h1>
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex space-x-4 mb-6">
          <button
            type="button"
            onClick={() => handleTypeChange('deposit')}
            className={`flex-1 py-3 rounded-md flex items-center justify-center ${
              formData.type === 'deposit'
                ? 'bg-success-100 text-success-700 border-2 border-success-300'
                : 'bg-gray-100 text-gray-600 border border-gray-200'
            }`}
          >
            <ArrowUpCircle size={20} className="mr-2" />
            Dépôt
          </button>
          <button
            type="button"
            onClick={() => handleTypeChange('withdrawal')}
            className={`flex-1 py-3 rounded-md flex items-center justify-center ${
              formData.type === 'withdrawal'
                ? 'bg-error-100 text-error-700 border-2 border-error-300'
                : 'bg-gray-100 text-gray-600 border border-gray-200'
            }`}
          >
            <ArrowDownCircle size={20} className="mr-2" />
            Retrait
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
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
            
            {selectedClient && (
              <>
                <div className="form-control">
                  <label htmlFor="accountId" className="form-label">
                    Compte <span className="text-error-500">*</span>
                  </label>
                  <select
                    id="accountId"
                    name="accountId"
                    value={formData.accountId}
                    onChange={handleInputChange}
                    className={`form-input ${errors.accountId ? 'border-error-500' : ''}`}
                    disabled={!!initialAccountId}
                  >
                    <option value="">Sélectionner un compte</option>
                    {selectedClient.accounts.map(account => (
                      <option key={account.id} value={account.id}>
                        {account.accountNumber} - {account.type === 'savings' ? 'Épargne' : 'Courant'} ({formatCurrency(account.balance)})
                      </option>
                    ))}
                  </select>
                  {errors.accountId && (
                    <p className="mt-1 text-sm text-error-500">{errors.accountId}</p>
                  )}
                </div>

                {selectedAccount && (
                  <div className="bg-gray-50 p-4 rounded-md mb-4">
                    <p className="text-sm text-gray-500">Solde du compte</p>
                    <p className="text-lg font-semibold text-gray-800">
                      {formatCurrency(selectedAccount.balance)}
                    </p>
                  </div>
                )}
              </>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-control">
                <label htmlFor="amount" className="form-label">
                  Montant <span className="text-error-500">*</span>
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
            
            <div className="form-control">
              <label htmlFor="description" className="form-label">
                Description <span className="text-error-500">*</span>
              </label>
              <input
                type="text"
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                className={`form-input ${errors.description ? 'border-error-500' : ''}`}
                placeholder={
                  formData.type === 'deposit'
                    ? 'Ex: Dépôt mensuel, Virement, etc.'
                    : 'Ex: Retrait ATM, Paiement facture, etc.'
                }
              />
              {errors.description && (
                <p className="mt-1 text-sm text-error-500">{errors.description}</p>
              )}
            </div>
          </div>
          
          <div className="mt-8 flex justify-end">
            <Link 
              to="/transactions"
              className="btn btn-secondary mr-3"
            >
              Annuler
            </Link>
            <button 
              type="submit"
              className={`btn ${formData.type === 'deposit' ? 'btn-success' : 'btn-danger'}`}
            >
              {formData.type === 'deposit' ? 'Effectuer le dépôt' : 'Effectuer le retrait'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddTransaction;