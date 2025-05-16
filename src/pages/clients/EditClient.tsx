import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useClients } from '../../context/ClientContext';
import { ArrowLeft, Upload, X } from 'lucide-react';

const EditClient = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { updateClient, getClient } = useClients();
  const client = getClient(id);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phoneNumber: '',
    address: '',
    email: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    emergencyContactRelationship: '',
    profileImage: ''
  });

  useEffect(() => {
    if (client) {
      setFormData({
        firstName: client.firstName,
        lastName: client.lastName,
        phoneNumber: client.phoneNumber,
        address: client.address,
        email: client.email,
        emergencyContactName: client.emergencyContact.name,
        emergencyContactPhone: client.emergencyContact.phoneNumber,
        emergencyContactRelationship: client.emergencyContact.relationship,
        profileImage: client.profileImage
      });
    }
  }, [client]);

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, profileImage: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setFormData(prev => ({ ...prev, profileImage: '' }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'Le prénom est requis';
    }
    
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Le nom est requis';
    }
    
    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = 'Le numéro de téléphone est requis';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'L\'email est requis';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'L\'email est invalide';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm() && client) {
      updateClient(client.id, {
        firstName: formData.firstName,
        lastName: formData.lastName,
        phoneNumber: formData.phoneNumber,
        address: formData.address,
        email: formData.email,
        emergencyContact: {
          name: formData.emergencyContactName,
          phoneNumber: formData.emergencyContactPhone,
          relationship: formData.emergencyContactRelationship
        },
        profileImage: formData.profileImage || client.profileImage
      });
      
      navigate(`/clients/${id}`);
    }
  };

  if (!client) {
    return (
      <div className="flex flex-col items-center justify-center mt-16">
        <h2 className="text-xl font-semibold text-gray-800 mb-2">Client Introuvable</h2>
        <Link to="/clients" className="text-primary-600 hover:text-primary-800">
          Retour à la liste des clients
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center">
        <Link to={`/clients/${id}`} className="mr-4 text-gray-500 hover:text-gray-700">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-2xl font-bold text-gray-800">Modifier le Client</h1>
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-6">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Profile Image Upload */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Photo de Profil
              </label>
              <div className="flex items-center">
                {formData.profileImage ? (
                  <div className="relative inline-block">
                    <img 
                      src={formData.profileImage} 
                      alt="Profile Preview" 
                      className="h-24 w-24 rounded-full object-cover"
                    />
                    <button 
                      type="button"
                      onClick={removeImage}
                      className="absolute top-0 right-0 bg-error-500 text-white rounded-full p-1"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <div className="h-24 w-24 border-2 border-dashed border-gray-300 rounded-full flex items-center justify-center">
                    <label className="cursor-pointer text-center p-2">
                      <Upload size={24} className="mx-auto text-gray-400" />
                      <span className="text-xs text-gray-500 mt-1 block">Choisir</span>
                      <input 
                        type="file" 
                        className="hidden" 
                        accept="image/*"
                        onChange={handleImageChange}
                      />
                    </label>
                  </div>
                )}
                <div className="ml-4 text-sm text-gray-500">
                  <p>Cliquez pour télécharger une photo de profil du client.</p>
                  <p>JPG, PNG ou GIF. Max 2MB.</p>
                </div>
              </div>
            </div>
            
            {/* Personal Information */}
            <div className="form-control">
              <label htmlFor="firstName" className="form-label">
                Prénom <span className="text-error-500">*</span>
              </label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                className={`form-input ${errors.firstName ? 'border-error-500' : ''}`}
              />
              {errors.firstName && (
                <p className="mt-1 text-sm text-error-500">{errors.firstName}</p>
              )}
            </div>
            
            <div className="form-control">
              <label htmlFor="lastName" className="form-label">
                Nom <span className="text-error-500">*</span>
              </label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                className={`form-input ${errors.lastName ? 'border-error-500' : ''}`}
              />
              {errors.lastName && (
                <p className="mt-1 text-sm text-error-500">{errors.lastName}</p>
              )}
            </div>
            
            <div className="form-control">
              <label htmlFor="email" className="form-label">
                Email <span className="text-error-500">*</span>
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className={`form-input ${errors.email ? 'border-error-500' : ''}`}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-error-500">{errors.email}</p>
              )}
            </div>
            
            <div className="form-control">
              <label htmlFor="phoneNumber" className="form-label">
                Numéro de Téléphone <span className="text-error-500">*</span>
              </label>
              <input
                type="text"
                id="phoneNumber"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleInputChange}
                className={`form-input ${errors.phoneNumber ? 'border-error-500' : ''}`}
              />
              {errors.phoneNumber && (
                <p className="mt-1 text-sm text-error-500">{errors.phoneNumber}</p>
              )}
            </div>
            
            <div className="form-control md:col-span-2">
              <label htmlFor="address" className="form-label">
                Adresse
              </label>
              <input
                type="text"
                id="address"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                className="form-input"
              />
            </div>
            
            {/* Emergency Contact */}
            <div className="md:col-span-2 mt-4">
              <h3 className="text-lg font-medium text-gray-700 mb-3">Contact d'Urgence</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="form-control">
                  <label htmlFor="emergencyContactName" className="form-label">
                    Nom
                  </label>
                  <input
                    type="text"
                    id="emergencyContactName"
                    name="emergencyContactName"
                    value={formData.emergencyContactName}
                    onChange={handleInputChange}
                    className="form-input"
                  />
                </div>
                
                <div className="form-control">
                  <label htmlFor="emergencyContactPhone" className="form-label">
                    Téléphone
                  </label>
                  <input
                    type="text"
                    id="emergencyContactPhone"
                    name="emergencyContactPhone"
                    value={formData.emergencyContactPhone}
                    onChange={handleInputChange}
                    className="form-input"
                  />
                </div>
                
                <div className="form-control">
                  <label htmlFor="emergencyContactRelationship" className="form-label">
                    Relation
                  </label>
                  <input
                    type="text"
                    id="emergencyContactRelationship"
                    name="emergencyContactRelationship"
                    value={formData.emergencyContactRelationship}
                    onChange={handleInputChange}
                    className="form-input"
                  />
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-8 flex justify-end">
            <Link 
              to={`/clients/${id}`}
              className="btn btn-secondary mr-3"
            >
              Annuler
            </Link>
            <button 
              type="submit"
              className="btn btn-primary"
            >
              Enregistrer les modifications
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditClient;