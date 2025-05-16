import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { ArrowLeft, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import { useClients } from '../../context/ClientContext';
import { useTransactions } from '../../context/TransactionContext';

const AddTransaction = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { clients } = useClients();
  const { addTransaction } = useTransactions();
  
  // Get clientId from location state if available
  const initialClientId = location.state?.clientId || '';
  const initialType = location.state?.isWithdrawal ? 'withdrawal' : 'deposit';
  
  const [formData, setFormData] = useState({
    clientId: initialClientId,
    type: initialType,
    amount: '',
    description: ''
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Update page title based on transaction type
  useEffect(() => {
    document.title = formData.type === 'deposit' ? 'Nouveau Dépôt | Volvy Bank' : 'Nouveau Retrait | Volvy Bank';
    
    return () => {
      document.title = 'Volvy Bank';
    };
  }, [formData.type]);
  
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
  
  const handleTypeChange = (type: 'deposit' | 'withdrawal') => {
    setFormData(prev => ({ ...prev, type }));
  };
  
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.clientId) {
      newErrors.clientId = 'Veuillez sélectionner un client';
    }
    
    if (!formData.amount || isNaN(Number(formData.amount)) || Number(formData.amount) <= 0) {
      newErrors.amount = 'Veuillez entrer un montant valide';
    }
    
    // For withdrawals, check if client has enough balance
    if (formData.type === 'withdrawal' && formData.clientId && !isNaN(Number(formData.amount))) {
      const client = clients.find(c => c.id === formData.clientId);
      if (client && Number(formData.amount) > client.totalBalance) {
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
      // Add the transaction
      addTransaction({
        clientId: formData.clientId,
        type: formData.type as 'deposit' | 'withdrawal',
        amount: Number(formData.amount),
        description: formData.description
      });
      
      // Navigate back to transactions list
      navigate('/transactions');
    }
  };
  
  // Get client for display
  const selectedClient = clients.find(client => client.id === formData.clientId);
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'HTG',
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
            
            {/* Show client balance if selected */}
            {selectedClient && (
              <div className="bg-gray-50 p-4 rounded-md mb-4">
                <p className="text-sm text-gray-500">Solde actuel</p>
                <p className="text-lg font-semibold text-gray-800">
                  {formatCurrency(selectedClient.totalBalance)}
                </p>
              </div>
            )}
            
            {/* Amount */}
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
                  min="0"
                  step="100"
                />
                <div className="absolute inset-y-0 left-0 flex items-center px-3 pointer-events-none border-r bg-gray-50 rounded-l-md">
                  <span className="text-gray-500">XOF</span>
                </div>
              </div>
              {errors.amount && (
                <p className="mt-1 text-sm text-error-500">{errors.amount}</p>
              )}
            </div>
            
            {/* Description */}
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