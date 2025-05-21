import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Layouts
import DashboardLayout from './layouts/DashboardLayout';

// Pages
import Dashboard from './pages/Dashboard';
import ClientList from './pages/clients/ClientList';
import ClientDetails from './pages/clients/ClientDetails';
import AddClient from './pages/clients/AddClient';
import EditClient from './pages/clients/EditClient';
import ImportClients from './pages/clients/ImportClients';
import TransactionList from './pages/transactions/TransactionList';
import AddTransaction from './pages/transactions/AddTransaction';
import TransferFunds from './pages/transactions/TransferFunds';
import LoanList from './pages/loans/LoanList';
import AddLoan from './pages/loans/AddLoan';
import LoanDetails from './pages/loans/LoanDetails';
import Reports from './pages/reports/Reports';
import Login from './pages/auth/Login';
import AdminSettings from './pages/auth/AdminSettings';

// Context
import { ClientProvider } from './context/ClientContext';
import { TransactionProvider } from './context/TransactionContext';
import { LoanProvider } from './context/LoanContext';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';

function App() {
  return (
    <Router>
      <AuthProvider>
        <ClientProvider>
          <TransactionProvider>
            <LoanProvider>
              <ToastContainer position="top-right" autoClose={3000} />
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route
                  path="/"
                  element={
                    <PrivateRoute>
                      <DashboardLayout />
                    </PrivateRoute>
                  }
                >
                  <Route index element={<Dashboard />} />
                  <Route path="clients">
                    <Route index element={<ClientList />} />
                    <Route path="add" element={<AddClient />} />
                    <Route path="import" element={<ImportClients />} />
                    <Route path=":id" element={<ClientDetails />} />
                    <Route path=":id/edit" element={<EditClient />} />
                  </Route>
                  <Route path="transactions">
                    <Route index element={<TransactionList />} />
                    <Route path="add" element={<AddTransaction />} />
                    <Route path="transfer" element={<TransferFunds />} />
                  </Route>
                  <Route path="loans">
                    <Route index element={<LoanList />} />
                    <Route path="add" element={<AddLoan />} />
                    <Route path=":id" element={<LoanDetails />} />
                  </Route>
                  <Route path="reports" element={<Reports />} />
                  <Route path="settings" element={<AdminSettings />} />
                </Route>
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </LoanProvider>
          </TransactionProvider>
        </ClientProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;