import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { updateUserProfile, updateUserAuth } from '../lib/api';
import { Save, UserCircle } from 'lucide-react';

const Profile = () => {
    const { user, updateUserContext } = useAuth();
    const [name, setName] = useState(user.name);
    const [email, setEmail] = useState(user.email);
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');
        setLoading(true);

        if (password && password !== confirmPassword) {
            setError('As senhas não coincidem.');
            setLoading(false);
            return;
        }

        let hasError = false;

        if (name !== user.name) {
            const { error: profileError } = await updateUserProfile(user.id, { name });
            if (profileError) {
                setError(`Falha ao atualizar o nome: ${profileError.message}`);
                hasError = true;
            } else {
                updateUserContext({ name: name });
            }
        }

        if (email !== user.email || password) {
            const { error: authError } = await updateUserAuth({ email, password });
            if (authError) {
                setError(`Falha ao atualizar email/senha: ${authError.message}`);
                hasError = true;
            } else {
                 updateUserContext({ email: email });
            }
        }
        
        setLoading(false);
        if (!hasError) {
            setMessage('Perfil atualizado com sucesso!');
            setPassword('');
            setConfirmPassword('');
        }
    };

    return (
        <div className="max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold mb-6">Meu Perfil</h1>
            <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow space-y-6">
                <div className="flex items-center gap-4">
                    <UserCircle size={80} className="text-gray-300" />
                    <div>
                        <h2 className="text-2xl font-bold">{user.name}</h2>
                        <p className="text-gray-500">{user.role === 'super-user' ? 'Super Usuário' : 'Usuário'}</p>
                    </div>
                </div>
                
                <div>
                    <label className="block text-sm font-medium text-gray-700">Nome</label>
                    <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-green focus:border-brand-green" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-green focus:border-brand-green" />
                </div>

                <hr />

                <h3 className="text-lg font-medium">Alterar Senha</h3>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Nova Senha</label>
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Deixe em branco para não alterar" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-green focus:border-brand-green" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Confirmar Nova Senha</label>
                    <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-green focus:border-brand-green" />
                </div>

                {message && <p className="text-green-600">{message}</p>}
                {error && <p className="text-red-600">{error}</p>}

                <div className="text-right">
                    <button type="submit" disabled={loading} className="inline-flex items-center gap-2 bg-brand-green text-white px-4 py-2 rounded-lg shadow hover:bg-brand-green-dark transition-colors disabled:bg-gray-400">
                        <Save size={20} />
                        {loading ? 'Salvando...' : 'Salvar Alterações'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default Profile;