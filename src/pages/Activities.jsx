import React, { useState, useEffect, useMemo } from 'react';
import { fetchActivities, deleteActivity, fetchProjects, fetchActivityTypes, fetchUsers } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { PlusCircle, Edit, Trash2, ArrowUpDown, FileDown } from 'lucide-react';
import ActivityModal from '../components/modals/ActivityModal';
import Pagination from '../components/common/Pagination';
import { useSortableData } from '../hooks/useSortableData';
import Papa from 'papaparse';
import LoadingSpinner from '../components/common/LoadingSpinner';

const Activities = () => {
    const [activities, setActivities] = useState([]);
    const [filteredActivities, setFilteredActivities] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedActivity, setSelectedActivity] = useState(null);
    const [loading, setLoading] = useState(true);
    const { user, isAuthenticated } = useAuth();

    const [projects, setProjects] = useState([]);
    const [activityTypes, setActivityTypes] = useState([]);
    const [users, setUsers] = useState([]);

    const [filters, setFilters] = useState({ project: '', type: '', user: '', startDate: '', endDate: '' });
    const memoizedFilters = useMemo(() => filters, [filters]);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const { items: sortedActivities, requestSort, sortConfig } = useSortableData(filteredActivities, { key: 'date', direction: 'descending' });

    const loadData = async () => {
        setLoading(true);
        const [activitiesData, projectsData, typesData, usersData] = await Promise.all([
            fetchActivities(), fetchProjects(), fetchActivityTypes(), fetchUsers()
        ]);
        setActivities(activitiesData);
        setProjects(projectsData);
        setActivityTypes(typesData);
        setUsers(usersData);
        setLoading(false);
    };

    useEffect(() => {
        if (isAuthenticated) {
            loadData();
        }
    }, [isAuthenticated]);
    
    useEffect(() => {
        let data = activities.filter(a => {
            const itemDate = new Date(a.date);
            const startDate = filters.startDate ? new Date(filters.startDate) : null;
            const endDate = filters.endDate ? new Date(filters.endDate) : null;
            if (startDate && itemDate < startDate) return false;
            if (endDate && itemDate > endDate) return false;
            if (filters.project && a.project !== filters.project) return false;
            if (filters.type && a.type !== filters.type) return false;
            if (filters.user && a.user_id !== filters.user) return false;
            return true;
        });
        setFilteredActivities(data);
        setCurrentPage(1);
    }, [memoizedFilters, activities]);

    const handleOpenModal = (activity = null) => { setSelectedActivity(activity); setIsModalOpen(true); };
    const handleCloseModal = () => { setIsModalOpen(false); setSelectedActivity(null); };
    const handleSave = async () => { await loadData(); };
    const handleDelete = async (id) => { if (window.confirm('Tem certeza?')) { await deleteActivity(id); handleSave(); } };
    const handleFilterChange = (e) => { const { name, value } = e.target; setFilters(prev => ({ ...prev, [name]: value })); };

    const handleExportCSV = () => {
        const data = sortedActivities.map(a => ({
            Data: new Date(a.date).toLocaleDateString('pt-BR'),
            Projeto: a.project,
            Tipo: a.type,
            Descrição: a.description,
            'Registrado Por': a.profiles?.name || 'N/A',
            Participantes: a.participants,
        }));
        const csv = Papa.unparse(data);
        const blob = new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'atividades.csv';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const paginatedActivities = sortedActivities.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    if (loading) {
        return <LoadingSpinner />;
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <h1 className="text-3xl font-bold">Gerenciamento de Atividades</h1>
                <div className="flex items-center gap-2">
                    <button onClick={() => handleOpenModal()} className="flex items-center gap-2 bg-brand-green text-white px-4 py-2 rounded-lg shadow hover:bg-brand-green-dark transition-colors">
                        <PlusCircle size={20} /> Nova
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
                        {activityTypes.map(t => <option key={t} value={t}>{t}</option>)}
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
                            <th scope="col" className="px-6 py-3">Descrição</th>
                            <th scope="col" className="px-6 py-3">Registrado por</th>
                            <th scope="col" className="px-6 py-3"><button onClick={() => requestSort('participants')} className="flex items-center gap-1">Participantes <ArrowUpDown size={14} /></button></th>
                            <th scope="col" className="px-6 py-3">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedActivities.map(activity => (
                            <tr key={activity.id} className="bg-white border-b hover:bg-gray-50">
                                <td className="px-6 py-4">{new Date(activity.date).toLocaleDateString()}</td>
                                <td className="px-6 py-4">{activity.project}</td>
                                <td className="px-6 py-4">{activity.type}</td>
                                <td className="px-6 py-4 max-w-xs truncate" title={activity.description}>{activity.description}</td>
                                <td className="px-6 py-4">{activity.profiles?.name || 'Usuário Removido'}</td>
                                <td className="px-6 py-4">{activity.participants}</td>
                                <td className="px-6 py-4 flex gap-2">
                                    {(user.role === 'super-user' || user.id === activity.user_id) && (
                                        <>
                                            <button onClick={() => handleOpenModal(activity)} className="text-blue-600 hover:text-blue-800"><Edit size={18} /></button>
                                            <button onClick={() => handleDelete(activity.id)} className="text-red-600 hover:text-red-800"><Trash2 size={18} /></button>
                                        </>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                 <Pagination currentPage={currentPage} totalItems={sortedActivities.length} itemsPerPage={itemsPerPage} onPageChange={setCurrentPage} />
            </div>
            
            {isModalOpen && <ActivityModal activity={selectedActivity} onClose={handleCloseModal} onSave={handleSave} />}
        </div>
    );
};

export default Activities;