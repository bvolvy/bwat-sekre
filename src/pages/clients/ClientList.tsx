import React from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Eye, Edit, Trash2, AlertCircle, Upload } from 'lucide-react';

const ClientList: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
        <div className="flex space-x-3 mt-4 sm:mt-0">
          <Link
            to="/clients/import"
            className="btn btn-secondary flex items-center justify-center sm:justify-start"
          >
            <Upload size={20} className="mr-1" />
            Importer
          </Link>
          <Link
            to="/clients/add"
            className="btn btn-primary flex items-center justify-center sm:justify-start"
          >
            <Plus size={20} className="mr-1" />
            Add Client
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder="Search clients..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {/* Table content will be populated with actual client data */}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ClientList;