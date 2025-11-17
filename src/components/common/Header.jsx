import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronDown, User, LogOut, UserCircle } from 'lucide-react';

const Header = () => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  if (!user) return null;

  return (
    <header className="flex items-center justify-end h-16 bg-white shadow-md px-4 md:px-6">
      <div className="relative">
        <button onClick={() => setDropdownOpen(!dropdownOpen)} className="flex items-center space-x-2">
          <UserCircle size={32} className="text-gray-500" />
          <span className="font-medium text-brand-dark truncate max-w-[150px]">{user.name}</span>
          <ChevronDown size={20} className="text-brand-dark" />
        </button>
        {dropdownOpen && (
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-20 overflow-hidden">
            <Link to="/profile" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" onClick={() => setDropdownOpen(false)}>
              <User size={16} className="mr-2" />
              Meu Perfil
            </Link>
            <button onClick={handleLogout} className="w-full text-left flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
              <LogOut size={16} className="mr-2" />
              Sair
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;