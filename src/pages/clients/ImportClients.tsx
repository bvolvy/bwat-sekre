import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import CSVImport from '../../components/CSVImport';
import { useClients } from '../../context/ClientContext';
import { Client } from '../../types';

const ImportClients = () => {
  const navigate = useNavigate();
  const { addClient } = useClients();

  const template = {
    'firstName': 'Prénom du client',
    'lastName': 'Nom du client',
    'email': 'Adresse email',
    'phoneNumber': 'Numéro de téléphone',
    'address': 'Adresse postale',
    'emergencyContactName': 'Nom du contact d\'urgence',
    'emergencyContactPhone': 'Téléphone du contact d\'urgence',
    'emergencyContactRelationship': 'Relation avec le contact d\'urgence'
  };

  const validateRow = (row: any): boolean => {
    // Basic validation rules
    if (!row.firstName?.trim() || !row.lastName?.trim()) return false;
    if (!row.email?.trim() || !row.email.includes('@')) return false;
    if (!row.phoneNumber?.trim()) return false;
    return true;
  };

  const handleImport = (data: any[]) => {
    data.forEach(row => {
      const clientData = {
        firstName: row.firstName.trim(),
        lastName: row.lastName.trim(),
        email: row.email.trim(),
        phoneNumber: row.phoneNumber.trim(),
        address: row.address?.trim() || '',
        emergencyContact: {
          name: row.emergencyContactName?.trim() || '',
          phoneNumber: row.emergencyContactPhone?.trim() || '',
          relationship: row.emergencyContactRelationship?.trim() || ''
        },
        profileImage: 'https://images.pexels.com/photos/1438081/pexels-photo-1438081.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2'
      };

      addClient(clientData);
    });

    navigate('/clients');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center">
        <Link to="/clients" className="mr-4 text-gray-500 hover:text-gray-700">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-2xl font-bold text-gray-800">Importer des Clients</h1>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <CSVImport
          onImport={handleImport}
          template={template}
          validateRow={validateRow}
        />
      </div>
    </div>
  );
};

export default ImportClients;