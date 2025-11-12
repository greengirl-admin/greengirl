import React, { useState, useEffect } from 'react';
import { fetchMaterials, fetchStorageConfig, updateStorageConfig } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { Edit, Save } from 'lucide-react';
import toast from 'react-hot-toast';

const StorageGauge = ({ type, unit, isEditable = true }) => {
    const [currentAmount, setCurrentAmount] = useState(0);
    const [maxCapacity, setMaxCapacity] = useState(100);
    const [isEditing, setIsEditing] = useState(false);
    const [newCapacity, setNewCapacity] = useState(maxCapacity);
    const { user, isAuthenticated, isSessionLoading } = useAuth();

    const loadData = async () => {
        const [materials, config] = await Promise.all([
            fetchMaterials(),
            fetchStorageConfig()
        ]);
        
        const received = materials
            .filter(m => m.type === type && m.usage === 'Recebido')
            .reduce((acc, m) => acc + m.quantity, 0);
        
        const used = materials
            .filter(m => m.type === type && m.usage !== 'Recebido')
            .reduce((acc, m) => acc + m.quantity, 0);

        setCurrentAmount(received - used);
        
        const capacity = config[type] || (type === 'Óleo' ? 1000 : type === 'Secos' ? 500 : 200);
        setMaxCapacity(capacity);
        setNewCapacity(capacity);
    };

    useEffect(() => {
        if (isAuthenticated && !isSessionLoading) {
            loadData();
        }
    }, [type, isAuthenticated, isSessionLoading]);

    const percentage = maxCapacity > 0 ? Math.min((currentAmount / maxCapacity) * 100, 100) : 0;
    
    let colorClass = 'bg-brand-green';
    if (percentage > 75) colorClass = 'bg-yellow-500';
    if (percentage > 90) colorClass = 'bg-red-500';

    const handleSaveCapacity = async () => {
        const updatedConfig = await updateStorageConfig({ [type]: parseFloat(newCapacity) });
        if (updatedConfig) {
            setMaxCapacity(updatedConfig[type]);
            setIsEditing(false);
            toast.success(`Capacidade de ${type} atualizada com sucesso!`);
            await loadData(); // Recarrega os dados para garantir consistência
        } else {
            toast.error(`Falha ao atualizar a capacidade de ${type}.`);
        }
    };

    return (
        <div className="p-4 border rounded-lg">
            <div className="flex justify-between items-center mb-2">
                <h3 className="font-semibold">{type}</h3>
                {isEditable && user.role === 'super-user' && (
                    isEditing ? (
                        <button onClick={handleSaveCapacity} className="text-green-600"><Save size={18}/></button>
                    ) : (
                        <button onClick={() => setIsEditing(true)} className="text-gray-500"><Edit size={18}/></button>
                    )
                )}
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4">
                <div className={`h-4 rounded-full ${colorClass}`} style={{ width: `${percentage}%` }}></div>
            </div>
            <div className="text-sm mt-2 text-center">
                <span>{currentAmount.toFixed(1)} {unit} / </span>
                {isEditing ? (
                    <input 
                        type="number"
                        value={newCapacity}
                        onChange={(e) => setNewCapacity(e.target.value)}
                        className="w-20 border-b text-center"
                    />
                ) : (
                    <span>{maxCapacity} {unit}</span>
                )}
                <span className="font-bold ml-2">({percentage.toFixed(1)}%)</span>
            </div>
        </div>
    );
};

export default StorageGauge;