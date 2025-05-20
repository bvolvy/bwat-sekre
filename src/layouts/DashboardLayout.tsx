import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  CreditCard, 
  PiggyBank, 
  FileText, 
  LogOut, 
  ChevronLeft, 
  Menu, 
  Bell,
  Settings
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const navigate = useNavigate();
  const { logout } = useAuth();
  
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };
  
  const handleLogout = () => {
    logout();
  };
  
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside 
        className={`${
          sidebarOpen ? 'translate-x-0 w-64' : '-translate-x-full w-0 md:w-20 md:translate-x-0'
        } fixed inset-y-0 left-0 z-20 flex flex-col bg-primary-900 text-white transition-all duration-300 transform md:relative md:translate-x-0`}
      >
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-4 py-5 bg-primary-800">
          <div className="flex items-center">
            <PiggyBank className="h-8 w-8 text-accent-500" />
            <span className={`ml-2 text-xl font-bold ${!sidebarOpen && 'md:hidden'}`}>
              Bwat Sekrè
            </span>
          </div>
          <button 
            onClick={toggleSidebar} 
            className="p-1 rounded-md hover:bg-primary-700 md:hidden"
          >
            <ChevronLeft size={20} />
          </button>
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
          <NavLink 
            to="/" 
            className={({ isActive }) => 
              `flex items-center px-4 py-2 mt-2 text-sm transition-colors duration-200 rounded-md ${
                isActive 
                  ? 'bg-primary-700 text-white' 
                  : 'text-gray-300 hover:bg-primary-700'
              }`
            }
          >
            <LayoutDashboard size={20} />
            <span className={`ml-4 ${!sidebarOpen && 'md:hidden'}`}>Dashboard</span>
          </NavLink>
          
          <NavLink 
            to="/clients" 
            className={({ isActive }) => 
              `flex items-center px-4 py-2 mt-2 text-sm transition-colors duration-200 rounded-md ${
                isActive 
                  ? 'bg-primary-700 text-white' 
                  : 'text-gray-300 hover:bg-primary-700'
              }`
            }
          >
            <Users size={20} />
            <span className={`ml-4 ${!sidebarOpen && 'md:hidden'}`}>Clients</span>
          </NavLink>
          
          <NavLink 
            to="/transactions" 
            className={({ isActive }) => 
              `flex items-center px-4 py-2 mt-2 text-sm transition-colors duration-200 rounded-md ${
                isActive 
                  ? 'bg-primary-700 text-white' 
                  : 'text-gray-300 hover:bg-primary-700'
              }`
            }
          >
            <CreditCard size={20} />
            <span className={`ml-4 ${!sidebarOpen && 'md:hidden'}`}>Transactions</span>
          </NavLink>
          
          <NavLink 
            to="/loans" 
            className={({ isActive }) => 
              `flex items-center px-4 py-2 mt-2 text-sm transition-colors duration-200 rounded-md ${
                isActive 
                  ? 'bg-primary-700 text-white' 
                  : 'text-gray-300 hover:bg-primary-700'
              }`
            }
          >
            <PiggyBank size={20} />
            <span className={`ml-4 ${!sidebarOpen && 'md:hidden'}`}>Loans</span>
          </NavLink>
          
          <NavLink 
            to="/reports" 
            className={({ isActive }) => 
              `flex items-center px-4 py-2 mt-2 text-sm transition-colors duration-200 rounded-md ${
                isActive 
                  ? 'bg-primary-700 text-white' 
                  : 'text-gray-300 hover:bg-primary-700'
              }`
            }
          >
            <FileText size={20} />
            <span className={`ml-4 ${!sidebarOpen && 'md:hidden'}`}>Reports</span>
          </NavLink>

          <NavLink 
            to="/settings" 
            className={({ isActive }) => 
              `flex items-center px-4 py-2 mt-2 text-sm transition-colors duration-200 rounded-md ${
                isActive 
                  ? 'bg-primary-700 text-white' 
                  : 'text-gray-300 hover:bg-primary-700'
              }`
            }
          >
            <Settings size={20} />
            <span className={`ml-4 ${!sidebarOpen && 'md:hidden'}`}>Paramètres</span>
          </NavLink>
        </nav>
        
        {/* Logout button */}
        <div className="p-4 border-t border-primary-700">
          <button 
            onClick={handleLogout}
            className="flex items-center w-full px-4 py-2 text-sm rounded-md text-gray-300 hover:bg-primary-700 hover:text-white transition-colors duration-200"
          >
            <LogOut size={20} />
            <span className={`ml-4 ${!sidebarOpen && 'md:hidden'}`}>Déconnexion</span>
          </button>
        </div>
      </aside>
      
      {/* Main content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Topbar */}
        <header className="flex items-center justify-between h-16 px-6 bg-white border-b border-gray-200">
          <button 
            onClick={toggleSidebar}
            className="p-1 text-gray-400 rounded-md md:hidden focus:outline-none"
          >
            <Menu size={24} />
          </button>
          
          <div className="flex items-center space-x-4">
            <button className="p-1 text-gray-400 rounded-md hover:text-gray-500 focus:outline-none">
              <Bell size={20} />
            </button>
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white font-semibold">
                BS
              </div>
              <span className="ml-2 text-sm font-medium text-gray-700">Admin</span>
            </div>
          </div>
        </header>
        
        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;