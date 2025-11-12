import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-brand-light text-center p-4">
            <h1 className="text-9xl font-bold text-brand-green">404</h1>
            <h2 className="text-3xl font-semibold mt-4 text-brand-dark">Página não encontrada</h2>
            <p className="text-gray-600 mt-2">A página que você está procurando não existe ou foi movida.</p>
            <Link to="/dashboard" className="mt-6 bg-brand-green text-white px-6 py-3 rounded-lg shadow-md hover:bg-brand-green-dark transition-transform transform hover:-translate-y-1">
                Voltar para o Dashboard
            </Link>
        </div>
    );
};

export default NotFound;
