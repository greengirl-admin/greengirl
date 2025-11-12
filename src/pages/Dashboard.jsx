import React, { useState, useEffect } from 'react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { fetchMaterials, fetchActivities } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import Card from '../components/common/Card';
import { Package, Droplet, Leaf, Activity } from 'lucide-react';
import StorageGauge from '../components/dashboard/StorageGauge';
import LoadingSpinner from '../components/common/LoadingSpinner';

const COLORS = ['#2563eb', '#84cc16', '#f97316', '#d946ef', '#14b8a6'];

const Dashboard = () => {
    const [materials, setMaterials] = useState([]);
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const { isAuthenticated } = useAuth();

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            const [materialsData, activitiesData] = await Promise.all([
                fetchMaterials(),
                fetchActivities()
            ]);
            setMaterials(materialsData);
            setActivities(activitiesData);
            setLoading(false);
        };
        
        if (isAuthenticated) {
            loadData();
        }
    }, [isAuthenticated]);

    if (loading) {
        return <LoadingSpinner />;
    }

    const totalOil = materials.filter(m => m.type === 'Óleo' && m.usage === 'Recebido').reduce((acc, m) => acc + m.quantity, 0);
    const totalDry = materials.filter(m => m.type === 'Secos' && m.usage === 'Recebido').reduce((acc, m) => acc + m.quantity, 0);
    const totalOrganic = materials.filter(m => m.type === 'Orgânicos' && m.usage === 'Recebido').reduce((acc, m) => acc + m.quantity, 0);

    const materialDistributionData = [
        { name: 'Óleo', value: totalOil },
        { name: 'Secos', value: totalDry },
        { name: 'Orgânicos', value: totalOrganic },
    ].filter(d => d.value > 0);

    const activitiesByMonth = activities.reduce((acc, activity) => {
        const month = new Date(activity.date).toLocaleString('default', { month: 'short', year: '2-digit' });
        acc[month] = (acc[month] || 0) + 1;
        return acc;
    }, {});

    const activityChartData = Object.entries(activitiesByMonth)
        .map(([name, value]) => ({ name, Atividades: value }))
        .reverse();

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-brand-dark">Dashboard</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card icon={<Droplet className="text-brand-green" />} title="Total de Óleo" value={`${totalOil.toFixed(1)} L`} />
                <Card icon={<Package className="text-brand-green" />} title="Total de Secos" value={`${totalDry.toFixed(1)} kg`} />
                <Card icon={<Leaf className="text-brand-green" />} title="Total de Orgânicos" value={`${totalOrganic.toFixed(1)} kg`} />
                <Card icon={<Activity className="text-brand-green" />} title="Total de Atividades" value={activities.length} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white p-4 rounded-lg shadow">
                    <h2 className="text-xl font-semibold mb-4">Atividades por Mês</h2>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={activityChartData}>
                            <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.3} />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="Atividades" fill={COLORS[0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                <div className="bg-white p-4 rounded-lg shadow">
                    <h2 className="text-xl font-semibold mb-4">Distribuição de Materiais</h2>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={materialDistributionData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                                nameKey="name"
                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            >
                                {materialDistributionData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip formatter={(value, name) => [`${value.toFixed(1)} ${name === 'Óleo' ? 'L' : 'kg'}`, name]}/>
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-xl font-semibold mb-4">Capacidade de Armazenamento</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <StorageGauge type="Óleo" unit="L" />
                    <StorageGauge type="Secos" unit="kg" />
                    <StorageGauge type="Orgânicos" unit="kg" />
                </div>
            </div>
        </div>
    );
};

export default Dashboard;