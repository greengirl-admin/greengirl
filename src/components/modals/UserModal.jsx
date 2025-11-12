import React, { useState } from 'react';
import { X } from 'lucide-react';

const UserModal = ({ onClose, onSave }) => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'user',
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold">Novo Usuário</h2>
                    <button onClick={onClose}><X size={24} /></button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium">Nome</label>
                        <input type="text" name="name" value={formData.name} onChange={handleChange} required className="w-full border rounded-lg p-2 mt-1" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Email</label>
                        <input type="email" name="email" value={formData.email} onChange={handleChange} required className="w-full border rounded-lg p-2 mt-1" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Senha</label>
                        <input type="password" name="password" value={formData.password} onChange={handleChange} required className="w-full border rounded-lg p-2 mt-1" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Papel</label>
                        <select name="role" value={formData.role} onChange={handleChange} required className="w-full border rounded-lg p-2 mt-1">
                            <option value="user">Usuário</option>
                            <option value="super-user">Super Usuário</option>
                        </select>
                    </div>
                    <div className="flex justify-end gap-4 pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 rounded-lg">Cancelar</button>
                        <button type="submit" className="px-4 py-2 bg-brand-green text-white rounded-lg">Adicionar Usuário</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default UserModal;
