import React, { useState, useEffect } from 'react';
import { fetchUsers, addUser, updateUserRole, deleteUser } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { PlusCircle, Shield, ShieldCheck, Trash2 } from 'lucide-react';
import UserModal from '../components/modals/UserModal';
import ConfirmModal from '../components/modals/ConfirmModal';
import toast from 'react-hot-toast';

const Users = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isUserModalOpen, setIsUserModalOpen] = useState(false);
    const [confirmModalState, setConfirmModalState] = useState({ isOpen: false, user: null, action: null, message: '' });
    const { user: currentUser, isAuthenticated, isSessionLoading } = useAuth();

    const loadUsers = async () => {
        setLoading(true);
        const usersData = await fetchUsers();
        setUsers(usersData);
        setLoading(false);
    };

    useEffect(() => {
        if (isAuthenticated) {
            loadUsers();
        }
    }, [isAuthenticated]);

    const handleSaveUser = async (userData) => {
        const { error } = await addUser(userData);
        if (error) {
            toast.error(`Erro ao adicionar usuário: ${error.message}`);
        } else {
            toast.success('Usuário adicionado! Um email de confirmação foi enviado.');
            loadUsers();
        }
    };
    
    const handleToggleRole = (user) => {
        if (user.id === currentUser.id) {
            toast.error("Você não pode alterar seu próprio papel.");
            return;
        }
        const newRole = user.role === 'super-user' ? 'user' : 'super-user';
        setConfirmModalState({
            isOpen: true,
            user: user,
            action: 'toggleRole',
            message: `Tem certeza que deseja alterar o papel de ${user.name} para ${newRole}?`
        });
    };
    
    const handleDeleteUser = (userToDelete) => {
        if (userToDelete.id === currentUser.id) {
            toast.error("Você não pode remover sua própria conta.");
            return;
        }
        setConfirmModalState({
            isOpen: true,
            user: userToDelete,
            action: 'delete',
            message: `Tem certeza que deseja remover o usuário ${userToDelete.name}? Esta ação é irreversível.`
        });
    };

    const handleConfirm = async () => {
        const { user, action } = confirmModalState;
        if (action === 'toggleRole') {
            const newRole = user.role === 'super-user' ? 'user' : 'super-user';
            await updateUserRole(user.id, newRole);
            toast.success(`Papel de ${user.name} alterado com sucesso.`);
            loadUsers();
        } else if (action === 'delete') {
            const { success, error } = await deleteUser(user.id);
            if (success) {
                toast.success(`Usuário ${user.name} removido com sucesso.`);
                loadUsers();
            } else {
                toast.error(`Falha ao remover usuário: ${error.message}`);
            }
        }
        handleCancelConfirm();
    };

    const handleCancelConfirm = () => {
        setConfirmModalState({ isOpen: false, user: null, action: null, message: '' });
    };

    if (loading) return null;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 px-4">
                <h1 className="text-2xl sm:text-3xl font-bold">Gerenciamento de Usuários</h1>
                <button onClick={() => setIsUserModalOpen(true)} className="flex items-center gap-2 bg-brand-green text-white px-3 py-2 rounded-lg shadow hover:bg-brand-green-dark transition-colors text-sm sm:text-base w-full sm:w-auto justify-center">
                    <PlusCircle size={18} />
                    Novo Usuário
                </button>
            </div>

            <div className="bg-white rounded-lg shadow overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-500">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                        <tr>
                            <th scope="col" className="px-6 py-3">Nome</th>
                            <th scope="col" className="px-6 py-3">Email</th>
                            <th scope="col" className="px-6 py-3">Papel</th>
                            <th scope="col" className="px-6 py-3">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(user => (
                            <tr key={user.id} className="bg-white border-b hover:bg-gray-50">
                                <td className="px-6 py-4">{user.name}</td>
                                <td className="px-6 py-4">{user.email}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${user.role === 'super-user' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                        {user.role === 'super-user' ? 'Super Usuário' : 'Usuário'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 flex items-center gap-4">
                                    <button onClick={() => handleToggleRole(user)} className="flex items-center gap-1 text-gray-600 hover:text-brand-green-dark" title="Alterar Papel">
                                        {user.role === 'super-user' ? <ShieldCheck size={18} /> : <Shield size={18} />}
                                    </button>
                                    {user.id !== currentUser.id && (
                                        <button onClick={() => handleDeleteUser(user)} className="flex items-center gap-1 text-red-600 hover:text-red-800" title="Remover Usuário">
                                            <Trash2 size={18} />
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            
            {isUserModalOpen && <UserModal onClose={() => setIsUserModalOpen(false)} onSave={handleSaveUser} />}
            {confirmModalState.isOpen && (
                <ConfirmModal
                    title="Confirmar Ação"
                    message={confirmModalState.message}
                    onConfirm={handleConfirm}
                    onCancel={handleCancelConfirm}
                    confirmText="Sim, continuar"
                    cancelText="Cancelar"
                />
            )}
        </div>
    );
};

export default Users;