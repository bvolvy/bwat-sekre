import React from 'react';
import { Link } from 'react-router-dom';
import { Send, Plus } from 'lucide-react';

const TransactionList = () => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
      <h1 className="text-2xl font-bold text-gray-800">Transactions</h1>
      <div className="flex space-x-3 mt-4 sm:mt-0">
        <Link
          to="/transactions/transfer"
          className="btn btn-secondary flex items-center justify-center sm:justify-start"
        >
          <Send size={20} className="mr-1" />
          Nouveau Transfert
        </Link>
        <Link
          to="/transactions/add"
          className="btn btn-primary flex items-center justify-center sm:justify-start"
        >
          <Plus size={20} className="mr-1" />
          Nouvelle Transaction
        </Link>
      </div>
    </div>
  );
};

export default TransactionList;