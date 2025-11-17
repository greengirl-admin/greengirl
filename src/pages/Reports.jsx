import React, { useState, useEffect, useRef } from 'react';
import { fetchMaterials, fetchActivities } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import Papa from 'papaparse';
import { FileDown, FileText, Droplet, Package, Leaf, Activity } from 'lucide-react';
import Card from '../components/common/Card';
import StorageGauge from '../components/dashboard/StorageGauge';

const COLORS = ['#2563eb', '#84cc16', '#f97316', '#d946ef', '#14b8a6'];
const filterLabels = { all: 'Todo o Período', week: 'Última Semana', month: 'Este Mês', quarter: 'Este Trimestre', semester: 'Este Semestre', year: 'Este Ano' };

const Reports = () => {
    const [allMaterials, setAllMaterials] = useState([]);
    const [allActivities, setAllActivities] = useState([]);
    const [filteredMaterials, setFilteredMaterials] = useState([]);
    const [filteredActivities, setFilteredActivities] = useState([]);
    const [filterType, setFilterType] = useState('all');
    const reportRef = useRef();
    const { user, isAuthenticated, isSessionLoading } = useAuth();

    useEffect(() => {
        const loadData = async () => {
            const [materialsData, activitiesData] = await Promise.all([fetchMaterials(), fetchActivities()]);
            setAllMaterials(materialsData);
            setAllActivities(activitiesData);
        };
        if (isAuthenticated && user) {
            loadData();
        } else if (!isAuthenticated) {
            setAllMaterials([]);
            setAllActivities([]);
        }
    }, [user, isAuthenticated]);

    useEffect(() => {
        const now = new Date();
        const filterData = (data) => {
            if (filterType === 'all') return data;
            return data.filter(item => {
                const itemDate = new Date(item.date);
                if (filterType === 'week') return itemDate >= new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
                if (filterType === 'month') return itemDate.getMonth() === now.getMonth() && itemDate.getFullYear() === now.getFullYear();
                if (filterType === 'year') return itemDate.getFullYear() === now.getFullYear();
                if (filterType === 'quarter') return itemDate >= new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
                if (filterType === 'semester') return itemDate >= new Date(now.getFullYear(), now.getMonth() < 6 ? 0 : 6, 1);
                return true;
            });
        };
        setFilteredMaterials(filterData(allMaterials));
        setFilteredActivities(filterData(allActivities));
    }, [filterType, allMaterials, allActivities]);

    const handleExportPDF = () => {
        const input = reportRef.current;
        html2canvas(input, { scale: 2, useCORS: true }).then((canvas) => {
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const imgProps= pdf.getImageProperties(imgData);
            const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`relatorio_greengirl_${filterType}.pdf`);
        });
    };

    const handleExportCSV = () => {
        const summaryData = [
            { Categoria: 'Resumo de Impacto', Item: 'Litros de água salvos', Valor: waterSaved },
            { Categoria: 'Resumo de Coleta', Item: 'Total de Óleo (L)', Valor: totalOil.toFixed(2) },
            { Categoria: 'Resumo de Coleta', Item: 'Total de Secos (kg)', Valor: totalDry.toFixed(2) },
            { Categoria: 'Resumo de Coleta', Item: 'Total de Orgânicos (kg)', Valor: totalOrganic.toFixed(2) },
            { Categoria: 'Resumo de Atividades', Item: 'Total de Atividades', Valor: filteredActivities.length },
        ];

        const activitiesData = filteredActivities.map(a => ({ 
            Categoria: 'Detalhe de Atividade',
            Data: new Date(a.date).toLocaleDateString('pt-BR'),
            Projeto: a.project,
            Tipo: a.type,
            Descricao: a.description,
            Participantes: a.participants,
            Registrado_Por: a.profiles.name,
        }));

        const materialsData = filteredMaterials.map(m => ({ 
            Categoria: 'Detalhe de Material',
            Data: new Date(m.date).toLocaleDateString('pt-BR'),
            Projeto: m.project,
            Tipo: m.type,
            Quantidade: m.quantity,
            Unidade: m.unit,
            Uso: m.usage,
            Registrado_Por: m.profiles.name,
        }));

        const csv = Papa.unparse([
            ...summaryData,
            {}, // Linha em branco para separar
            ...activitiesData,
            {}, // Linha em branco para separar
            ...materialsData
        ]);

        const blob = new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `relatorio_completo_${filterType}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const totalOil = filteredMaterials.filter(m => m.type === 'Óleo' && m.usage === 'Recebido').reduce((acc, m) => acc + m.quantity, 0);
    const totalDry = filteredMaterials.filter(m => m.type === 'Secos' && m.usage === 'Recebido').reduce((acc, m) => acc + m.quantity, 0);
    const totalOrganic = filteredMaterials.filter(m => m.type === 'Orgânicos' && m.usage === 'Recebido').reduce((acc, m) => acc + m.quantity, 0);
    const waterSaved = (totalOil * 25000).toLocaleString('pt-BR');

    const materialDistributionData = [
        { name: 'Óleo', value: totalOil }, { name: 'Secos', value: totalDry }, { name: 'Orgânicos', value: totalOrganic },
    ].filter(d => d.value > 0);

    const activitiesByProject = filteredActivities.reduce((acc, a) => ({ ...acc, [a.project]: (acc[a.project] || 0) + 1 }), {});
    const activityChartData = Object.entries(activitiesByProject).map(([name, value]) => ({ name, Atividades: value }));

    const monthlyCollectionData = allMaterials.reduce((acc, m) => {
        const month = new Date(m.date).toLocaleString('pt-BR', { month: 'short', year: '2-digit' });
        if (!acc[month]) acc[month] = { month };
        acc[month][m.type] = (acc[month][m.type] || 0) + m.quantity;
        return acc;
    }, {});
    const comparativeChartData = Object.values(monthlyCollectionData).reverse();

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h1 className="text-3xl font-bold">Relatórios</h1>
                <div className="flex flex-wrap items-center gap-2 md:gap-4">
                    <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="border rounded-lg p-2 bg-white">
                        {Object.entries(filterLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
                    </select>
                    <button onClick={handleExportPDF} className="flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-lg shadow hover:bg-red-600 transition-colors"><FileText size={20} /> PDF</button>
                    <button onClick={handleExportCSV} className="flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-lg shadow hover:bg-green-600 transition-colors"><FileDown size={20} /> CSV</button>
                </div>
            </div>

            <div ref={reportRef} className="bg-white p-6 rounded-lg shadow space-y-8">
                <div className="text-center border-b pb-4 mb-4">
                    <h2 className="text-2xl font-bold text-brand-green-dark">Relatório de Impacto - GreenGirl</h2>
                    <p className="text-gray-600">Período: {filterLabels[filterType]}</p>
                    <p className="text-sm text-gray-500">Gerado em: {new Date().toLocaleString('pt-BR')}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Card icon={<Droplet className="text-brand-green" />} title="Total de Óleo" value={`${totalOil.toFixed(1)} L`} />
                    <Card icon={<Package className="text-brand-green" />} title="Total de Secos" value={`${totalDry.toFixed(1)} kg`} />
                    <Card icon={<Leaf className="text-brand-green" />} title="Total de Orgânicos" value={`${totalOrganic.toFixed(1)} kg`} />
                    <Card icon={<Activity className="text-brand-green" />} title="Total de Atividades" value={filteredActivities.length} />
                </div>

                <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg text-center">
                    <h3 className="text-xl font-semibold text-blue-800">Resumo de Impacto Ambiental</h3>
                    <div className="flex items-center justify-center gap-4 mt-2">
                        <Droplet className="text-blue-500" size={40} />
                        <p className="text-lg">A coleta de <strong>{totalOil.toFixed(2)} L de óleo</strong> evitou a contaminação de aproximadamente <strong>{waterSaved} litros de água</strong>.</p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow">
                    <h2 className="text-xl font-semibold mb-4">Capacidade de Armazenamento</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <StorageGauge type="Óleo" unit="L" isEditable={false} />
                        <StorageGauge type="Secos" unit="kg" isEditable={false} />
                        <StorageGauge type="Orgânicos" unit="kg" isEditable={false} />
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-8">
                    <div>
                        <h3 className="text-xl font-semibold mb-4 text-center">Distribuição de Materiais ({filterLabels[filterType]})</h3>
                        <ResponsiveContainer width="100%" height={300}><PieChart>
                            <Pie data={materialDistributionData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} fill="#8884d8" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                                {materialDistributionData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                            </Pie>
                            <Tooltip formatter={(value, name) => [`${value.toFixed(1)} ${name === 'Óleo' ? 'L' : 'kg'}`, name]}/>
                            <Legend />
                        </PieChart></ResponsiveContainer>
                    </div>
                    <div>
                        <h3 className="text-xl font-semibold mb-4 text-center">Atividades por Projeto ({filterLabels[filterType]})</h3>
                        <ResponsiveContainer width="100%" height={300}><BarChart data={activityChartData} layout="vertical" margin={{ left: 120 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis type="number" />
                            <YAxis type="category" dataKey="name" width={110} interval={0} />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="Atividades" fill={COLORS[0]} />
                        </BarChart></ResponsiveContainer>
                    </div>
                </div>

                <div>
                    <h3 className="text-xl font-semibold mb-4 text-center">Coleta Mensal Comparativa (Todo o Período)</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={comparativeChartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="Óleo" stackId="a" fill={COLORS[0]} name="Óleo (L)" />
                            <Bar dataKey="Secos" stackId="a" fill={COLORS[1]} name="Secos (kg)" />
                            <Bar dataKey="Orgânicos" stackId="a" fill={COLORS[2]} name="Orgânicos (kg)" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

export default Reports;