import React, { useState, useEffect, useMemo } from 'react';
import { fetchMaterials, deleteMaterial, fetchProjects, fetchUsers } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { PlusCircle, Edit, Trash2, ArrowUpDown, FileDown } from 'lucide-react';
import MaterialModal from '../components/modals/MaterialModal';
import Pagination from '../components/common/Pagination';
import { useSortableData } from '../hooks/useSortableData';
import Papa from 'papaparse';
import LoadingSpinner from '../components/common/LoadingSpinner';

const Materials = () => {
    const [materials, setMaterials] = useState([]);
    const [filteredMaterials, setFilteredMaterials] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedMaterial, setSelectedMaterial] = useState(null);
    const [loading, setLoading] = useState(true);
    const { user, isAuthenticated } = useAuth();
    
    const [projects, setProjects] = useState([]);
    const [users, setUsers] = useState([]);
    const [filters, setFilters] = useState({ project: '', type: '', user: '', startDate: '', endDate: '' });
    const memoizedFilters = useMemo(() => filters, [filters]);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const { items: sortedMaterials, requestSort, sortConfig } = useSortableData(filteredMaterials, { key: 'date', direction: 'descending' });

    const loadData = async () => {
        setLoading(true);
        const [materialsData, projectsData, usersData] = await Promise.all([
            fetchMaterials(), fetchProjects(), fetchUsers()
        ]);
        setMaterials(materialsData);
        setProjects(projectsData);
        setUsers(usersData);
        setLoading(false);
    };

    useEffect(() => {
        if (isAuthenticated) {
            loadData();
        }
    }, [isAuthenticated]);

    useEffect(() => {
        let data = materials.filter(m => {
            const itemDate = new Date(m.date);
            const startDate = filters.startDate ? new Date(filters.startDate) : null;
            const endDate = filters.endDate ? new Date(filters.endDate) : null;
            if (startDate && itemDate < startDate) return false;
            if (endDate && itemDate > endDate) return false;
            if (filters.project && m.project !== filters.project) return false;
            if (filters.type && m.type !== filters.type) return false;
            if (filters.user && m.user_id !== filters.user) return false;
            return true;
        });
        setFilteredMaterials(data);
        setCurrentPage(1);
    }, [memoizedFilters, materials]);

    const handleOpenModal = (material = null) => { setSelectedMaterial(material); setIsModalOpen(true); };
    const handleCloseModal = () => { setIsModalOpen(false); setSelectedMaterial(null); };
    const handleSave = async () => { await loadData(); };
    const handleDelete = async (id) => { if (window.confirm('Tem certeza?')) { await deleteMaterial(id); handleSave(); } };
    const handleFilterChange = (e) => { const { name, value } = e.target; setFilters(prev => ({ ...prev, [name]: value })); };

    const handleExportCSV = () => {
        const data = sortedMaterials.map(m => ({
            Data: new Date(m.date).toLocaleDateString('pt-BR'),
            Projeto: m.project,
            Tipo: m.type,
            Quantidade: m.quantity,
            Unidade: m.unit,
            Uso: m.usage,
            'Registrado Por': m.profiles?.name || 'N/A',
        }));
        const csv = Papa.unparse(data);
        const blob = new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'materiais.csv';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const paginatedMaterials = sortedMaterials.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    if (loading) {
        return <LoadingSpinner />;
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <h1 className="text-3xl font-bold">Gerenciamento de Materiais</h1>
                <div className="flex items-center gap-2">
                    <button onClick={() => handleOpenModal()} className="flex items-center gap-2 bg-brand-green text-white px-4 py-2 rounded-lg shadow hover:bg-brand-green-dark transition-colors">
                        <PlusCircle size={20} /> Novo
                    </button>
                    <button onClick={handleExportCSV} className="flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-lg shadow hover:bg-green-600 transition-colors"><FileDown size={20} /> CSV</button>
                </div>
            </div>

            <div className="bg-white p-4 rounded-lg shadow">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <select name="project" value={filters.project} onChange={handleFilterChange} className="border rounded-lg p-2">
                        <option value="">Todos os Projetos</option>
                        {projects.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                    <select name="type" value={filters.type} onChange={handleFilterChange} className="border rounded-lg p-2">
                        <option value="">Todos os Tipos</option>
                        <option value="Óleo">Óleo</option>
                        <option value="Secos">Secos</option>
                        <option value="Orgânicos">Orgânicos</option>
                    </select>
                    <select name="user" value={filters.user} onChange={handleFilterChange} className="border rounded-lg p-2">
                        <option value="">Todos os Usuários</option>
                        {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                    </select>
                    <div className="flex items-center gap-2">
                        <input type="date" name="startDate" value={filters.startDate} onChange={handleFilterChange} className="border rounded-lg p-2 w-full" />
                        <span>até</span>
                        <input type="date" name="endDate" value={filters.endDate} onChange={handleFilterChange} className="border rounded-lg p-2 w-full" />
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-500">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                        <tr>
                            <th scope="col" className="px-6 py-3"><button onClick={() => requestSort('date')} className="flex items-center gap-1">Data <ArrowUpDown size={14} /></button></th>
                            <th scope="col" className="px-6 py-3"><button onClick={() => requestSort('project')} className="flex items-center gap-1">Projeto <ArrowUpDown size={14} /></button></th>
                            <th scope="col" className="px-6 py-3"><button onClick={() => requestSort('type')} className="flex items-center gap-1">Tipo <ArrowUpDown size={14} /></button></th>
                            <th scope="col" className="px-6 py-3"><button onClick={() => requestSort('quantity')} className="flex items-center gap-1">Quantidade <ArrowUpDown size={14} /></button></th>
                            <th scope="col" className="px-6 py-3">Uso</th>
                            <th scope="col" className="px-6 py-3">Registrado por</th>
                            <th scope="col" className="px-6 py-3">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedMaterials.map(material => (
                            <tr key={material.id} className="bg-white border-b hover:bg-gray-50">
                                <td className="px-6 py-4">{new Date(material.date).toLocaleDateString()}</td>
                                <td className="px-6 py-4">{material.project}</td>
                                <td className="px-6 py-4">{material.type}</td>
                                <td className="px-6 py-4">{material.quantity} {material.unit}</td>
                                <td className="px-6 py-4">{material.usage}</td>
                                <td className="px-6 py-4">{material.profiles?.name || 'Usuário Removido'}</td>
                                <td className="px-6 py-4 flex gap-2">
                                    {(user.role === 'super-user' || user.id === material.user_id) && (
                                        <>
                                            <button onClick={() => handleOpenModal(material)} className="text-blue-600 hover:text-blue-800"><Edit size={18} /></button>
                                            <button onClick={() => handleDelete(material.id)} className="text-red-600 hover:text-red-800"><Trash2 size={18} /></button>
                                        </>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <Pagination currentPage={currentPage} totalItems={sortedMaterials.length} itemsPerPage={itemsPerPage} onPageChange={setCurrentPage} />
            </div>
            
            {isModalOpen && <MaterialModal material={selectedMaterial} onClose={handleCloseModal} onSave={handleSave} />}
        </div>
    );
};

export default Materials;