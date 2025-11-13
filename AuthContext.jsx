import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
// Importe o seu helper que busca os dados do usuário com a role (se for necessário)
import { getSessionUser } from '../lib/api'; 

// 1. Definição do Contexto
const AuthContext = createContext({
  user: null,
  isAuthenticated: false,
  loading: true,
  logout: () => {},
  updateUserContext: () => {},
});

// 2. Provedor de Autenticação
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  // Estado crucial para controlar o carregamento inicial da sessão
  const [loading, setLoading] = useState(true); 

  useEffect(() => {
    // Otimização: Usamos onAuthStateChange, que dispara IMEDIATAMENTE com o estado atual.
    // Isso elimina a necessidade de uma função checkInitialSession separada.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      
      try {
        // Busca os dados customizados do usuário (incluindo roles/permissões)
        const sessionUser = session ? await getSessionUser() : null; 
        
        setUser(sessionUser);
        setIsAuthenticated(!!sessionUser);
        
      } catch (error) {
        console.error("Erro ao processar sessão:", event, error);
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        // CRUCIAL: Finaliza o estado de carregamento APENAS após a primeira verificação
        // O `if (loading)` previne que o estado seja redefinido durante logins/logouts futuros.
        if (loading) { 
          setLoading(false);
        }
      }
    });

    // Função de limpeza para desinscrever o listener quando o componente for desmontado
    return () => {
      subscription?.unsubscribe();
    };
    
    // Adicionar 'loading' garante que o if(loading) dentro do listener funcione corretamente
  }, [loading]); 

  // Função para atualizar dados do usuário no contexto (útil após atualização de perfil)
  const updateUserContext = (updatedUserData) => {
    setUser(currentUser => (currentUser ? { ...currentUser, ...updatedUserData } : null));
  };

  const value = { 
    user, 
    isAuthenticated, 
    loading, 
    logout: () => supabase.auth.signOut(),
    updateUserContext
  };

  return (
    <AuthContext.Provider value={value}>
      {loading ? (
        // Exibe um loader em tela cheia enquanto a sessão é verificada
        <div className="min-h-screen flex items-center justify-center bg-brand-light">
          <div className="loader">Carregando...</div>
        </div>
      ) : (
        children // Renderiza o restante da aplicação após a verificação
      )}
    </AuthContext.Provider>
  );
};

// 3. Hook para usar o Contexto
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};