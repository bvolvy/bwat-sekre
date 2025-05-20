import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Eye, EyeOff, Save, DollarSign } from 'lucide-react';
import { SUPPORTED_CURRENCIES, type Currency } from '../../types';

const AdminSettings = () => {
  const { updatePassword, defaultCurrency, updateDefaultCurrency } = useAuth();
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
    setSuccess('');
  };

  const handleCurrencyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const currency = e.target.value as Currency;
    updateDefaultCurrency(currency);
    setSuccess('Devise par défaut mise à jour avec succès');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (formData.newPassword !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    if (formData.newPassword.length < 8) {
      setError('Le nouveau mot de passe doit contenir au moins 8 caractères');
      return;
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(formData.newPassword)) {
      setError('Le mot de passe doit contenir au moins une lettre majuscule, une lettre minuscule, un chiffre et un caractère spécial');
      return;
    }

    const success = await updatePassword(formData.currentPassword, formData.newPassword);
    if (success) {
      setSuccess('Mot de passe mis à jour avec succès');
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } else {
      setError('Mot de passe actuel incorrect');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold text-gray-800">Paramètres Administrateur</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Currency Settings */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <DollarSign className="mr-2 h-5 w-5" />
            Devise par Défaut
          </h2>

          <div className="form-control">
            <label htmlFor="currency" className="form-label">
              Sélectionner la devise
            </label>
            <select
              id="currency"
              value={defaultCurrency}
              onChange={handleCurrencyChange}
              className="form-input"
            >
              {SUPPORTED_CURRENCIES.map(currency => (
                <option key={currency} value={currency}>
                  {currency}
                </option>
              ))}
            </select>
            <p className="mt-2 text-sm text-gray-500">
              Cette devise sera utilisée par défaut pour toutes les nouvelles transactions et tous les nouveaux comptes.
            </p>
          </div>
        </div>

        {/* Password Change */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Changer le mot de passe</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="form-control">
              <label htmlFor="currentPassword" className="form-label">
                Mot de passe actuel
              </label>
              <div className="relative">
                <input
                  type={showCurrentPassword ? 'text' : 'password'}
                  id="currentPassword"
                  name="currentPassword"
                  value={formData.currentPassword}
                  onChange={handleInputChange}
                  className="form-input pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showCurrentPassword ? (
                    <EyeOff size={20} className="text-gray-400" />
                  ) : (
                    <Eye size={20} className="text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            <div className="form-control">
              <label htmlFor="newPassword" className="form-label">
                Nouveau mot de passe
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  id="newPassword"
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleInputChange}
                  className="form-input pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showNewPassword ? (
                    <EyeOff size={20} className="text-gray-400" />
                  ) : (
                    <Eye size={20} className="text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            <div className="form-control">
              <label htmlFor="confirmPassword" className="form-label">
                Confirmer le nouveau mot de passe
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                className="form-input"
                required
              />
            </div>

            {error && (
              <div className="bg-error-50 text-error-700 p-3 rounded-md">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-success-50 text-success-700 p-3 rounded-md">
                {success}
              </div>
            )}

            <button type="submit" className="btn btn-primary w-full flex items-center justify-center">
              <Save size={20} className="mr-2" />
              Enregistrer les modifications
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;