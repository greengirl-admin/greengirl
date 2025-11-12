import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Activity, Package, FileText, Users, User } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Atividades', path: '/activities', icon: Activity },
    { name: 'Materiais', path: '/materials', icon: Package },
    { name: 'Relatórios', path: '/reports', icon: FileText },
    { name: 'Usuários', path: '/users', icon: Users, role: 'super-user' },
];

const Sidebar = () => {
    const { user } = useAuth();
    
    return (
        <div className="w-64 bg-brand-green-dark text-white flex flex-col">
            <div className="h-16 flex items-center justify-center text-2xl font-bold">
                GreenGirl
            </div>
            <nav className="flex-1 px-4 py-4 space-y-2">
                {navItems.map(item => (
                    (!item.role || item.role === user.role) && (
                        <NavLink
                            key={item.name}
                            to={item.path}
                            className={({ isActive }) => 
                                `flex items-center px-4 py-2.5 rounded-lg transition-colors duration-200 ${
                                    isActive ? 'bg-brand-green text-white' : 'hover:bg-brand-green'
                                }`
                            }
                        >
                            <item.icon className="mr-3" size={20} />
                            {item.name}
                        </NavLink>
                    )
                ))}
            </nav>
        </div>
    );
};

export default Sidebar;
