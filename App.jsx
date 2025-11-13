import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import MainLayout from './layouts/MainLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Activities from './pages/Activities';
import Materials from './pages/Materials';
import Reports from './pages/Reports';
import Users from './pages/Users';
import Profile from './pages/Profile';
import NotFound from './pages/NotFound';

// Componente PrivateRoute ajustado para esperar pelo estado 'loading'
const PrivateRoute = ({ children, roles }) => {
  const { user, isAuthenticated, loading } = useAuth(); // <--- Ajuste: Inclui 'loading'

  // 1. ESPERA: Se a autenticação ainda está em andamento, não faça nada.
  // Isso evita o redirecionamento imediato para /login.
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Aguardando autenticação...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (roles && (!user || !user.role || !roles.includes(user.role))) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
};


const AppRoutes = () => {
  const { isAuthenticated, loading } = useAuth(); // Usar loading aqui também pode ser útil, mas PrivateRoute é o mais crítico.

  return (
    <Routes>
      {/* Rota de Login: Redireciona para o Dashboard se o usuário estiver autenticado e o loading for false */}
      <Route 
        path="/login" 
        element={!isAuthenticated && !loading ? <Login /> : (isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />)} 
      /> 
      <Route 
        path="/" 
        element={
          <PrivateRoute>
            <MainLayout />
          </PrivateRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="activities" element={<Activities />} />
        <Route path="materials" element={<Materials />} />
        <Route path="reports" element={<Reports />} />
        <Route path="profile" element={<Profile />} />
        <Route 
          path="users" 
          element={
            <PrivateRoute roles={['super-user']}>
              <Users />
            </PrivateRoute>
          } 
        />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}


function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}

export default App;