import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Send, User } from 'lucide-react';
import { useClients } from '../../context/ClientContext';
import { useTransactions } from '../../context/TransactionContext';
import { SUPPORTED_CURRENCIES } from '../../types';

const MIN_AMOUNT = 5;

const TransferFunds = () => {
  const navigate = useNavigate();
  const { clients } = useClients();
  const { transferFunds } = useTransactions();

  const [formData, setFormData] = useState({
    fromClientId: '',
    fromAccountId: '',
    toClientId: '',
    toAccountId: '',
    amount: '',
    description: '',
    currency: 'HTG'
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    // Reset account selections when clients change
    if (formData.fromClientId) {
      const client = clients.find(c => c.id === formData.fromClientId);
      if (client && client.accounts.length > 0) {
        setFormData(prev => ({ ...prev, fromAccountId: client.accounts[0].id }));
      }
    }
    if (formData.toClientId) {
      const client = clients.find(c => c.id === formData.toClientId);
      if (client && client.accounts.length > 0) {
        setFormData(prev => ({ ...prev, toAccountId: client.accounts[0].id }));
      }
    }
  }, [formData.fromClientId, formData.toClientId, clients]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.fromClientId) {
      newErrors.fromClientId = 'Veuillez sélectionner un expéditeur';
    }

    if (!formData.fromAccountId) {
      newErrors.fromAccountId = 'Veuillez sélectionner un compte source';
    }

    if (!formData.toClientId) {
      newErrors.toClientId = 'Veuillez sélectionner un destinataire';
    }

    if (!formData.toAccountId) {
      newErrors.toAccountId = 'Veuillez sélectionner un compte destinataire';
    }

    if (formData.fromClientId === formData.toClientId && formData.fromAccountId === formData.toAccountId) {
      newErrors.toAccountId = 'Impossible de transférer vers le même compte';
    }

    if (!formData.amount || isNaN(Number(formData.amount))) {
      newErrors.amount = 'Veuillez entrer un montant valide';
    } else {
      const amount = Number(formData.amount);
      if (amount < MIN_AMOUNT) {
        newErrors.amount = `Le montant minimum est de ${MIN_AMOUNT} ${formData.currency}`;
      }

      // Check if sender has sufficient funds
      const fromClient = clients.find(c => c.id === formData.fromClientId);
      const fromAccount = fromClient?.accounts.find(a => a.id === formData.fromAccountId);
      if (fromAccount && amount > fromAccount.balance) {
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
      transferFunds({
        fromClientId: formData.fromClientId,
        fromAccountId: formData.fromAccountId,
        toClientId: formData.toClientId,
        toAccountId: formData.toAccountId,
        amount: Number(formData.amount),
        description: formData.description,
        currency: formData.currency
      });

      navigate('/transactions');
    }
  };

  const fromClient = clients.find(client => client.id === formData.fromClientId);
  const toClient = clients.find(client => client.id === formData.toClientId);
  const fromAccount = fromClient?.accounts.find(account => account.id === formData.fromAccountId);
  const toAccount = toClient?.accounts.find(account => account.id === formData.toAccountId);

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
        <h1 className="text-2xl font-bold text-gray-800">Nouveau Transfert</h1>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* From (Sender) Section */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                <Send size={20} className="mr-2" />
                Expéditeur
              </h2>

              <div className="form-control">
                <label htmlFor="fromClientId" className="form-label">
                  Client Expéditeur <span className="text-error-500">*</span>
                </label>
                <select
                  id="fromClientId"
                  name="fromClientId"
                  value={formData.fromClientId}
                  onChange={handleInputChange}
                  className={`form-input ${errors.fromClientId ? 'border-error-500' : ''}`}
                >
                  <option value="">Sélectionner un client</option>
                  {clients.map(client => (
                    <option key={client.id} value={client.id}>
                      {client.firstName} {client.lastName}
                    </option>
                  ))}
                </select>
                {errors.fromClientId && (
                  <p className="mt-1 text-sm text-error-500">{errors.fromClientId}</p>
                )}
              </div>

              {fromClient && (
                <>
                  <div className="form-control">
                    <label htmlFor="fromAccountId" className="form-label">
                      Compte Source <span className="text-error-500">*</span>
                    </label>
                    <select
                      id="fromAccountId"
                      name="fromAccountId"
                      value={formData.fromAccountId}
                      onChange={handleInputChange}
                      className={`form-input ${errors.fromAccountId ? 'border-error-500' : ''}`}
                    >
                      <option value="">Sélectionner un compte</option>
                      {fromClient.accounts.map(account => (
                        <option key={account.id} value={account.id}>
                          {account.accountNumber} - {account.type === 'savings' ? 'Épargne' : 'Courant'} ({formatCurrency(account.balance)})
                        </option>
                      ))}
                    </select>
                    {errors.fromAccountId && (
                      <p className="mt-1 text-sm text-error-500">{errors.fromAccountId}</p>
                    )}
                  </div>

                  {fromAccount && (
                    <div className="bg-gray-50 p-4 rounded-md">
                      <p className="text-sm text-gray-500">Solde disponible</p>
                      <p className="text-lg font-semibold text-gray-800">
                        {formatCurrency(fromAccount.balance)}
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* To (Recipient) Section */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                <User size={20} className="mr-2" />
                Destinataire
              </h2>

              <div className="form-control">
                <label htmlFor="toClientId" className="form-label">
                  Client Destinataire <span className="text-error-500">*</span>
                </label>
                <select
                  id="toClientId"
                  name="toClientId"
                  value={formData.toClientId}
                  onChange={handleInputChange}
                  className={`form-input ${errors.toClientId ? 'border-error-500' : ''}`}
                >
                  <option value="">Sélectionner un client</option>
                  {clients.map(client => (
                    <option key={client.id} value={client.id}>
                      {client.firstName} {client.lastName}
                    </option>
                  ))}
                </select>
                {errors.toClientId && (
                  <p className="mt-1 text-sm text-error-500">{errors.toClientId}</p>
                )}
              </div>

              {toClient && (
                <>
                  <div className="form-control">
                    <label htmlFor="toAccountId" className="form-label">
                      Compte Destinataire <span className="text-error-500">*</span>
                    </label>
                    <select
                      id="toAccountId"
                      name="toAccountId"
                      value={formData.toAccountId}
                      onChange={handleInputChange}
                      className={`form-input ${errors.toAccountId ? 'border-error-500' : ''}`}
                    >
                      <option value="">Sélectionner un compte</option>
                      {toClient.accounts.map(account => (
                        <option key={account.id} value={account.id}>
                          {account.accountNumber} - {account.type === 'savings' ? 'Épargne' : 'Courant'} ({formatCurrency(account.balance)})
                        </option>
                      ))}
                    </select>
                    {errors.toAccountId && (
                      <p className="mt-1 text-sm text-error-500">{errors.toAccountId}</p>
                    )}
                  </div>

                  {toAccount && (
                    <div className="bg-gray-50 p-4 rounded-md">
                      <p className="text-sm text-gray-500">Solde actuel</p>
                      <p className="text-lg font-semibold text-gray-800">
                        {formatCurrency(toAccount.balance)}
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Transfer Details */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
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

          <div className="mt-4">
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
                placeholder="Ex: Remboursement, Paiement de service, etc."
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
              className="btn btn-primary"
            >
              Effectuer le transfert
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TransferFunds;