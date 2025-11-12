import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { addMaterial, updateMaterial, fetchProjects } from '../../lib/api';
import { X } from 'lucide-react';

const MaterialModal = ({ material, onClose, onSave }) => {
    const { user } = useAuth();
    const [formData, setFormData] = useState({
        project: material?.project || '',
        tipo: material?.type || 'Óleo', // Corrigido para usar 'type' do DB
        quantidade: material?.quantity || 0, // Corrigido para usar 'quantity' do DB
        uso: material?.usage || 'Recebido', // Corrigido para usar 'usage' do DB
    });
    const [projects, setProjects] = useState([]);

    useEffect(() => {
        const loadProjects = async () => {
            const projData = await fetchProjects();
            setProjects(projData);
            if (!material && projData.length > 0) {
                setFormData(prev => ({ ...prev, project: projData[0] }));
            }
        };
        loadProjects();
    }, [material]);

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
            quantity: parseFloat(formData.quantidade),
            usage: formData.uso,
            unit: formData.tipo === 'Óleo' ? 'L' : 'kg',
        };

        let result;
        if (material) {
            result = await updateMaterial(material.id, payload);
        } else {
            result = await addMaterial({ ...payload, user_id: user.id });
        }
        
        if (result) {
            onSave();
            onClose();
        } else {
            alert('Falha ao salvar o material. Verifique os dados e tente novamente.');
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold">{material ? 'Editar' : 'Novo'} Material</h2>
                    <button onClick={onClose}><X size={24} /></button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium">Projeto Associado</label>
                        <select name="project" value={formData.project} onChange={handleChange} required className="w-full border rounded-lg p-2 mt-1">
                            {projects.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Tipo de Material</label>
                        <select name="tipo" value={formData.tipo} onChange={handleChange} required className="w-full border rounded-lg p-2 mt-1">
                            <option value="Óleo">Óleo</option>
                            <option value="Secos">Secos</option>
                            <option value="Orgânicos">Orgânicos</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Quantidade ({formData.tipo === 'Óleo' ? 'L' : 'kg'})</label>
                        <input type="number" step="0.1" name="quantidade" value={formData.quantidade} onChange={handleChange} required min="0" className="w-full border rounded-lg p-2 mt-1" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Tipo de Uso</label>
                        <select name="uso" value={formData.uso} onChange={handleChange} required className="w-full border rounded-lg p-2 mt-1">
                            <option value="Recebido">Recebido</option>
                            <option value="Usado em Oficina">Usado em Oficina</option>
                            <option value="Doado">Doado</option>
                        </select>
                    </div>
                    <div className="flex justify-end gap-4 pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 rounded-lg">Cancelar</button>
                        <button type="submit" className="px-4 py-2 bg-brand-green text-white rounded-lg">{material ? 'Salvar' : 'Adicionar'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default MaterialModal;