import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
// Certifique-se de que useAuth exporta 'loading'
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

const PrivateRoute = ({ children, roles }) => {
  // 1. INCLUSÃO CRÍTICA: Pega o estado de carregamento
  const { user, isAuthenticated, loading } = useAuth(); 

  // 2. VERIFICAÇÃO DE CARREGAMENTO: Se estiver carregando, espere.
  // Isso previne o redirecionamento imediato para /login.
  if (loading) {
    // Usa o loader simples, pois o AuthProvider já deve estar mostrando um loader em tela cheia.
    return <div className="min-h-screen flex items-center justify-center">Aguardando autenticação...</div>;
  }

  // 3. VERIFICAÇÃO DE AUTENTICAÇÃO: Redireciona se não estiver autenticado (só após o loading)
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // 4. VERIFICAÇÃO DE PERMISSÃO (ROLES):
  if (roles && (!user || !user.role || !roles.includes(user.role))) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
};


const AppRoutes = () => {
  // Pega o estado de loading também
  const { isAuthenticated, loading } = useAuth(); 

  return (
    <Routes>
      <Route 
        path="/login" 
        element={
          // Se estiver carregando, retorne nulo (o AuthProvider está mostrando o loader).
          loading 
            ? null 
            // Se não estiver autenticado, mostre o Login.
            : !isAuthenticated 
              ? <Login /> 
              // Caso contrário, redirecione.
              : <Navigate to="/dashboard" replace />
        } 
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