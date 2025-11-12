import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { getSessionUser } from '../lib/api';

const AuthContext = createContext({
  user: null,
  isAuthenticated: false,
  loading: true,
  logout: () => {},
  updateUserContext: () => {},
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkInitialSession = async () => {
      try {
        const sessionUser = await getSessionUser();
        setUser(sessionUser);
        setIsAuthenticated(!!sessionUser);
      } catch (error) {
        console.error("Erro ao verificar sessão inicial:", error);
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    checkInitialSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      const sessionUser = session ? await getSessionUser() : null;
      setUser(sessionUser);
      setIsAuthenticated(!!sessionUser);
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

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
        <div className="min-h-screen flex items-center justify-center bg-brand-light">
          <div className="loader"></div>
        </div>
      ) : children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};