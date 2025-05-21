import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Eye, EyeOff, Save, Download, Upload, AlertCircle, User, Trash2 } from 'lucide-react';
import { useClients } from '../../context/ClientContext';
import { useTransactions } from '../../context/TransactionContext';
import { useLoans } from '../../context/LoanContext';
import { useNavigate } from 'react-router-dom';

const AdminSettings = () => {
  const navigate = useNavigate();
  const { updatePassword, updateAdminName, adminName, logout } = useAuth();
  const { clients } = useClients();
  const { transactions } = useTransactions();
  const { loans } = useLoans();
  
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    adminName: adminName,
    confirmSiteName: ''
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [restoreError, setRestoreError] = useState('');
  const [showResetModal, setShowResetModal] = useState(false);

  const SITE_NAME = 'Bwat Sekrè';

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
    setSuccess('');
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
        confirmPassword: '',
        adminName: formData.adminName,
        confirmSiteName: ''
      });
    } else {
      setError('Mot de passe actuel incorrect');
    }
  };

  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.adminName.trim()) {
      updateAdminName(formData.adminName.trim());
      setSuccess('Nom d\'administrateur mis à jour avec succès');
    }
  };

  const handleBackup = () => {
    const backupData = {
      clients,
      transactions,
      loans,
      timestamp: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `bwat-sekre-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const backupData = JSON.parse(event.target?.result as string);
        
        // Validate backup data structure
        if (!backupData.clients || !backupData.transactions || !backupData.loans) {
          throw new Error('Invalid backup file structure');
        }

        // Store the backup data
        localStorage.setItem('volvy-bank-clients', JSON.stringify(backupData.clients));
        localStorage.setItem('volvy-bank-transactions', JSON.stringify(backupData.transactions));
        localStorage.setItem('volvy-bank-loans', JSON.stringify(backupData.loans));

        // Reload the page to apply changes
        window.location.reload();
      } catch (err) {
        setRestoreError('Le fichier de sauvegarde est invalide ou corrompu');
      }
    };
    reader.readAsText(file);
  };

  const handleReset = () => {
    if (formData.confirmSiteName !== SITE_NAME) {
      setError('Le nom du site ne correspond pas');
      return;
    }

    // Clear all data
    localStorage.removeItem('volvy-bank-clients');
    localStorage.removeItem('volvy-bank-transactions');
    localStorage.removeItem('volvy-bank-loans');
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('adminCredentials');

    // Close modal and logout
    setShowResetModal(false);
    logout();
    navigate('/login');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold text-gray-800">Paramètres Administrateur</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Admin Name Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Nom d'administrateur</h2>

          <form onSubmit={handleNameSubmit} className="space-y-4">
            <div className="form-control">
              <label htmlFor="adminName" className="form-label">
                Nom d'administrateur
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="adminName"
                  name="adminName"
                  value={formData.adminName}
                  onChange={handleInputChange}
                  className="form-input pl-10"
                  required
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
                  <User size={20} className="text-gray-400" />
                </div>
              </div>
            </div>

            <button type="submit" className="btn btn-primary w-full flex items-center justify-center">
              <Save size={20} className="mr-2" />
              Enregistrer le nom
            </button>
          </form>
        </div>

        {/* Password Change Section */}
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

        {/* Backup/Restore Section */}
        <div className="bg-white rounded-lg shadow-md p-6 md:col-span-2">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Sauvegarde et Restauration</h2>
          
          <div className="space-y-6">
            {/* Backup */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Sauvegarder les données</h3>
              <p className="text-sm text-gray-500 mb-4">
                Téléchargez une copie de toutes vos données pour les sauvegarder localement.
              </p>
              <button
                onClick={handleBackup}
                className="btn btn-primary w-full flex items-center justify-center"
              >
                <Download size={20} className="mr-2" />
                Télécharger la sauvegarde
              </button>
            </div>

            {/* Restore */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Restaurer les données</h3>
              <p className="text-sm text-gray-500 mb-4">
                Restaurez vos données à partir d'une sauvegarde précédente.
              </p>
              <div className="relative">
                <input
                  type="file"
                  accept=".json"
                  onChange={handleRestore}
                  className="hidden"
                  id="restore-file"
                />
                <label
                  htmlFor="restore-file"
                  className="btn btn-secondary w-full flex items-center justify-center cursor-pointer"
                >
                  <Upload size={20} className="mr-2" />
                  Charger une sauvegarde
                </label>
              </div>
              {restoreError && (
                <div className="mt-3 flex items-start bg-error-50 text-error-700 p-3 rounded-md">
                  <AlertCircle size={20} className="mr-2 flex-shrink-0 mt-0.5" />
                  <p className="text-sm">{restoreError}</p>
                </div>
              )}
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-md p-4">
              <h4 className="text-sm font-medium text-blue-800 mb-2">Important</h4>
              <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
                <li>Sauvegardez régulièrement vos données</li>
                <li>Conservez vos fichiers de sauvegarde en lieu sûr</li>
                <li>La restauration remplacera toutes les données actuelles</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-error-50 rounded-lg shadow-md p-6 md:col-span-2 border-2 border-error-200">
          <h2 className="text-lg font-semibold text-error-800 mb-4 flex items-center">
            <AlertCircle size={24} className="mr-2 text-error-600" />
            Zone Dangereuse
          </h2>
          
          <div className="space-y-4">
            <p className="text-sm text-error-700">
              Cette action supprimera définitivement toutes les données de l'application, y compris les clients, 
              les transactions et les prêts. Cette action est irréversible.
            </p>
            
            <button
              onClick={() => setShowResetModal(true)}
              className="btn bg-error-600 text-white hover:bg-error-700 w-full flex items-center justify-center"
            >
              <Trash2 size={20} className="mr-2" />
              Réinitialiser toutes les données
            </button>
          </div>
        </div>
      </div>

      {/* Reset Confirmation Modal */}
      {showResetModal && (
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
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Réinitialiser toutes les données
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Cette action supprimera définitivement toutes les données. Pour confirmer, 
                        veuillez écrire <span className="font-bold">{SITE_NAME}</span> ci-dessous.
                      </p>
                      <input
                        type="text"
                        name="confirmSiteName"
                        value={formData.confirmSiteName}
                        onChange={handleInputChange}
                        className="mt-4 form-input w-full"
                        placeholder="Entrez le nom du site"
                      />
                      {error && (
                        <p className="mt-2 text-sm text-error-600">{error}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-error-600 text-base font-medium text-white hover:bg-error-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-error-500 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={handleReset}
                >
                  Réinitialiser
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => {
                    setShowResetModal(false);
                    setFormData(prev => ({ ...prev, confirmSiteName: '' }));
                    setError('');
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

export default AdminSettings;