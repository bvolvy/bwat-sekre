import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { PiggyBank, Upload, Eye, EyeOff, Building2, MapPin, DollarSign, Globe2, Palette } from 'lucide-react';
import { useOrganization } from '../../context/OrganizationContext';
import { SUPPORTED_CURRENCIES, SUPPORTED_LANGUAGES, LANGUAGE_NAMES } from '../../types';

const Register = () => {
  const navigate = useNavigate();
  const { registerOrganization } = useOrganization();
  
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    logo: '',
    defaultCurrency: 'HTG',
    language: 'fr',
    theme: 'light',
    defaultInterestRate: '8.5',
    adminEmail: '',
    adminPassword: '',
    confirmPassword: '',
    adminName: ''
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  
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
  
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, logo: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };
  
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Le nom de l\'organisation est requis';
    }
    
    if (!formData.address.trim()) {
      newErrors.address = 'L\'adresse est requise';
    }
    
    if (!formData.adminEmail.trim()) {
      newErrors.adminEmail = 'L\'email est requis';
    } else if (!/\S+@\S+\.\S+/.test(formData.adminEmail)) {
      newErrors.adminEmail = 'L\'email est invalide';
    }
    
    if (!formData.adminName.trim()) {
      newErrors.adminName = 'Le nom de l\'administrateur est requis';
    }
    
    if (!formData.adminPassword) {
      newErrors.adminPassword = 'Le mot de passe est requis';
    } else if (formData.adminPassword.length < 8) {
      newErrors.adminPassword = 'Le mot de passe doit contenir au moins 8 caractères';
    }
    
    if (formData.adminPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Les mots de passe ne correspondent pas';
    }

    if (!formData.defaultInterestRate || isNaN(Number(formData.defaultInterestRate)) || Number(formData.defaultInterestRate) < 0) {
      newErrors.defaultInterestRate = 'Le taux d\'intérêt par défaut doit être un nombre positif';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      setIsLoading(true);
      try {
        await registerOrganization({
          name: formData.name,
          address: formData.address,
          logo: formData.logo,
          defaultCurrency: formData.defaultCurrency,
          language: formData.language as any,
          theme: formData.theme as any,
          defaultInterestRate: Number(formData.defaultInterestRate),
          adminEmail: formData.adminEmail,
          adminPassword: formData.adminPassword,
          adminName: formData.adminName
        });
        navigate('/login');
      } catch (error: any) {
        setErrors(prev => ({
          ...prev,
          submit: error.message || 'Une erreur est survenue lors de l\'inscription'
        }));
      } finally {
        setIsLoading(false);
      }
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="h-16 w-16 bg-primary-600 rounded-full flex items-center justify-center">
            <PiggyBank className="h-10 w-10 text-white" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Créer votre Organisation
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Ou{' '}
          <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500">
            connectez-vous à votre compte
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Organization Logo */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Logo de l'Organisation
              </label>
              <div className="mt-1 flex items-center">
                {formData.logo ? (
                  <div className="relative inline-block">
                    <img 
                      src={formData.logo} 
                      alt="Organization Logo" 
                      className="h-12 w-12 rounded-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, logo: '' }))}
                      className="absolute -top-2 -right-2 bg-error-100 text-error-600 rounded-full p-0.5"
                    >
                      <span className="sr-only">Remove logo</span>
                      ×
                    </button>
                  </div>
                ) : (
                  <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center">
                    <label className="cursor-pointer">
                      <Upload className="h-6 w-6 text-gray-400" />
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handleLogoChange}
                      />
                    </label>
                  </div>
                )}
                <span className="ml-5 text-sm text-gray-500">
                  Upload a logo (optional)
                </span>
              </div>
            </div>

            {/* Organization Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Nom de l'Organisation <span className="text-error-500">*</span>
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Building2 className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className={`block w-full pl-10 sm:text-sm rounded-md ${
                    errors.name
                      ? 'border-error-300 focus:ring-error-500 focus:border-error-500'
                      : 'border-gray-300 focus:ring-primary-500 focus:border-primary-500'
                  }`}
                />
              </div>
              {errors.name && (
                <p className="mt-2 text-sm text-error-600">{errors.name}</p>
              )}
            </div>

            {/* Organization Address */}
            <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                Adresse <span className="text-error-500">*</span>
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MapPin className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  className={`block w-full pl-10 sm:text-sm rounded-md ${
                    errors.address
                      ? 'border-error-300 focus:ring-error-500 focus:border-error-500'
                      : 'border-gray-300 focus:ring-primary-500 focus:border-primary-500'
                  }`}
                />
              </div>
              {errors.address && (
                <p className="mt-2 text-sm text-error-600">{errors.address}</p>
              )}
            </div>

            {/* Organization Settings */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Default Currency */}
                <div>
                  <label htmlFor="defaultCurrency" className="block text-sm font-medium text-gray-700">
                    Devise par Défaut <span className="text-error-500">*</span>
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <DollarSign className="h-5 w-5 text-gray-400" />
                    </div>
                    <select
                      id="defaultCurrency"
                      
                      name="defaultCurrency"
                      value={formData.defaultCurrency}
                      onChange={handleInputChange}
                      className="block w-full pl-10 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
                    >
                      {SUPPORTED_CURRENCIES.map(currency => (
                        <option key={currency} value={currency}>
                          {currency}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Language */}
                <div>
                  <label htmlFor="language" className="block text-sm font-medium text-gray-700">
                    Langue <span className="text-error-500">*</span>
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Globe2 className="h-5 w-5 text-gray-400" />
                    </div>
                    <select
                      id="language"
                      name="language"
                      value={formData.language}
                      onChange={handleInputChange}
                      className="block w-full pl-10 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
                    >
                      {SUPPORTED_LANGUAGES.map(lang => (
                        <option key={lang} value={lang}>
                          {LANGUAGE_NAMES[lang]}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Theme */}
                <div>
                  <label htmlFor="theme" className="block text-sm font-medium text-gray-700">
                    Thème <span className="text-error-500">*</span>
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Palette className="h-5 w-5 text-gray-400" />
                    </div>
                    <select
                      id="theme"
                      name="theme"
                      value={formData.theme}
                      onChange={handleInputChange}
                      className="block w-full pl-10 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
                    >
                      <option value="light">Clair</option>
                      <option value="dark">Sombre</option>
                      <option value="custom">Personnalisé</option>
                    </select>
                  </div>
                </div>

                {/* Default Interest Rate */}
                <div>
                  <label htmlFor="defaultInterestRate" className="block text-sm font-medium text-gray-700">
                    Taux d'Intérêt par Défaut (%) <span className="text-error-500">*</span>
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <input
                      type="number"
                      id="defaultInterestRate"
                      name="defaultInterestRate"
                      value={formData.defaultInterestRate}
                      onChange={handleInputChange}
                      step="0.1"
                      min="0"
                      className={`block w-full pr-8 sm:text-sm rounded-md ${
                        errors.defaultInterestRate
                          ? 'border-error-300 focus:ring-error-500 focus:border-error-500'
                          : 'border-gray-300 focus:ring-primary-500 focus:border-primary-500'
                      }`}
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <span className="text-gray-500">%</span>
                    </div>
                  </div>
                  {errors.defaultInterestRate && (
                    <p className="mt-2 text-sm text-error-600">{errors.defaultInterestRate}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Admin Information */}
            <div className="space-y-6">
              <div className="bg-gray-50 px-4 py-5 sm:rounded-lg">
                <h3 className="text-lg font-medium text-gray-900">
                  Information de l'Administrateur
                </h3>
                
                {/* Admin Name */}
                <div className="mt-6">
                  <label htmlFor="adminName" className="block text-sm font-medium text-gray-700">
                    Nom Complet <span className="text-error-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="adminName"
                    name="adminName"
                    value={formData.adminName}
                    onChange={handleInputChange}
                    className={`mt-1 block w-full border sm:text-sm rounded-md ${
                      errors.adminName
                        ? 'border-error-300 focus:ring-error-500 focus:border-error-500'
                        : 'border-gray-300 focus:ring-primary-500 focus:border-primary-500'
                    }`}
                  />
                  {errors.adminName && (
                    <p className="mt-2 text-sm text-error-600">{errors.adminName}</p>
                  )}
                </div>

                {/* Admin Email */}
                <div className="mt-6">
                  <label htmlFor="adminEmail" className="block text-sm font-medium text-gray-700">
                    Email <span className="text-error-500">*</span>
                  </label>
                  <input
                    type="email"
                    id="adminEmail"
                    name="adminEmail"
                    value={formData.adminEmail}
                    onChange={handleInputChange}
                    className={`mt-1 block w-full border sm:text-sm rounded-md ${
                      errors.adminEmail
                        ? 'border-error-300 focus:ring-error-500 focus:border-error-500'
                        : 'border-gray-300 focus:ring-primary-500 focus:border-primary-500'
                    }`}
                  />
                  {errors.adminEmail && (
                    <p className="mt-2 text-sm text-error-600">{errors.adminEmail}</p>
                  )}
                </div>

                {/* Admin Password */}
                <div className="mt-6">
                  <label htmlFor="adminPassword" className="block text-sm font-medium text-gray-700">
                    Mot de Passe <span className="text-error-500">*</span>
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="adminPassword"
                      name="adminPassword"
                      value={formData.adminPassword}
                      onChange={handleInputChange}
                      className={`block w-full pr-10 sm:text-sm rounded-md ${
                        errors.adminPassword
                          ? 'border-error-300 focus:ring-error-500 focus:border-error-500'
                          : 'border-gray-300 focus:ring-primary-500 focus:border-primary-500'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5 text-gray-400" />
                      ) : (
                        <Eye className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                  </div>
                  {errors.adminPassword && (
                    <p className="mt-2 text-sm text-error-600">{errors.adminPassword}</p>
                  )}
                </div>

                {/* Confirm Password */}
                <div className="mt-6">
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                    Confirmer le Mot de Passe <span className="text-error-500">*</span>
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      id="confirmPassword"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      className={`block w-full pr-10 sm:text-sm rounded-md ${
                        errors.confirmPassword
                          ? 'border-error-300 focus:ring-error-500 focus:border-error-500'
                          : 'border-gray-300 focus:ring-primary-500 focus:border-primary-500'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-5 w-5 text-gray-400" />
                      ) : (
                        <Eye className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="mt-2 text-sm text-error-600">{errors.confirmPassword}</p>
                  )}
                </div>
              </div>
            </div>

            {errors.submit && (
              <div className="rounded-md bg-error-50 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <AlertCircle className="h-5 w-5 text-error-400" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-error-800">{errors.submit}</p>
                  </div>
                </div>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Création en cours...
                  </div>
                ) : (
                  'Créer l\'Organisation'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;