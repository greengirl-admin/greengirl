import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { addActivity, updateActivity, fetchProjects, fetchActivityTypes } from '../../lib/api';
import { X } from 'lucide-react';

const ActivityModal = ({ activity, onClose, onSave }) => {
    const { user } = useAuth();
    const [formData, setFormData] = useState({
        project: activity?.project || '',
        tipo: activity?.type || '', // Corrigido para usar 'type' do DB
        descricao: activity?.description || '', // Corrigido para usar 'description' do DB
        participantes: activity?.participants || 0, // Corrigido para usar 'participants' do DB
    });
    const [projects, setProjects] = useState([]);
    const [activityTypes, setActivityTypes] = useState([]);

    useEffect(() => {
        const loadDropdowns = async () => {
            const [projData, typesData] = await Promise.all([fetchProjects(), fetchActivityTypes()]);
            setProjects(projData);
            setActivityTypes(typesData);
            if (!activity && projData.length > 0 && typesData.length > 0) {
                setFormData(prev => ({ ...prev, project: projData[0], tipo: typesData[0] }));
            }
        };
        loadDropdowns();
    }, [activity]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Mapeia os nomes do formulário para os nomes das colunas do banco de dados
        const payload = {
            project: formData.project,
            type: formData.tipo,
            description: formData.descricao,
            participants: parseInt(formData.participantes),
        };

        let result;
        if (activity) {
            result = await updateActivity(activity.id, payload);
        } else {
            result = await addActivity({ ...payload, user_id: user.id });
        }
        
        if (result) {
            onSave();
            onClose();
        } else {
            alert('Falha ao salvar a atividade. Verifique os dados e tente novamente.');
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold">{activity ? 'Editar' : 'Nova'} Atividade</h2>
                    <button onClick={onClose}><X size={24} /></button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium">Projeto</label>
                        <select name="project" value={formData.project} onChange={handleChange} required className="w-full border rounded-lg p-2 mt-1">
                            {projects.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Tipo de Atividade</label>
                        <select name="tipo" value={formData.tipo} onChange={handleChange} required className="w-full border rounded-lg p-2 mt-1">
                            {activityTypes.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Descrição</label>
                        <textarea name="descricao" value={formData.descricao} onChange={handleChange} className="w-full border rounded-lg p-2 mt-1" rows="3"></textarea>
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Nº de Participantes</label>
                        <input type="number" name="participantes" value={formData.participantes} onChange={handleChange} required min="0" className="w-full border rounded-lg p-2 mt-1" />
                    </div>
                    <div className="flex justify-end gap-4 pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 rounded-lg">Cancelar</button>
                        <button type="submit" className="px-4 py-2 bg-brand-green text-white rounded-lg">{activity ? 'Salvar' : 'Adicionar'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ActivityModal;