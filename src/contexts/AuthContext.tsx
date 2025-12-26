import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { User, AuthState, LoginCredentials, DEFAULT_CREDENTIALS } from '@/types/auth';

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<{ success: boolean; error?: string; mustChangePassword?: boolean }>;
  logout: () => void;
  updatePassword: (newPassword: string) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock users database
const mockUsers: Record<string, { password: string; user: User }> = {
  'supadmin-001': {
    password: DEFAULT_CREDENTIALS.super_admin.defaultPassword,
    user: {
      id: '1',
      username: 'supadmin-001',
      name: 'Administrador Supremo',
      role: 'super_admin',
      mustChangePassword: true,
      createdAt: new Date(),
    },
  },
  'admin-002': {
    password: DEFAULT_CREDENTIALS.admin.defaultPassword,
    user: {
      id: '2',
      username: 'admin-002',
      name: 'Administrador',
      role: 'admin',
      mustChangePassword: true,
      createdAt: new Date(),
    },
  },
  'financas-003': {
    password: DEFAULT_CREDENTIALS.finance.defaultPassword,
    user: {
      id: '3',
      username: 'financas-003',
      name: 'Gestor Financeiro',
      role: 'finance',
      mustChangePassword: true,
      createdAt: new Date(),
    },
  },
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: false,
  });

  const login = useCallback(async (credentials: LoginCredentials) => {
    setState(prev => ({ ...prev, isLoading: true }));
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const userRecord = mockUsers[credentials.username];
    
    if (!userRecord) {
      setState(prev => ({ ...prev, isLoading: false }));
      return { success: false, error: 'Utilizador não encontrado' };
    }
    
    if (userRecord.password !== credentials.password) {
      setState(prev => ({ ...prev, isLoading: false }));
      return { success: false, error: 'Senha incorreta' };
    }
    
    const user = {
      ...userRecord.user,
      lastLogin: new Date(),
    };
    
    setState({
      user,
      isAuthenticated: true,
      isLoading: false,
    });
    
    return { 
      success: true, 
      mustChangePassword: user.mustChangePassword 
    };
  }, []);

  const logout = useCallback(() => {
    setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });
  }, []);

  const updatePassword = useCallback(async (newPassword: string) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (state.user) {
      setState(prev => ({
        ...prev,
        user: prev.user ? { ...prev.user, mustChangePassword: false } : null,
      }));
      return { success: true };
    }
    
    return { success: false, error: 'Utilizador não autenticado' };
  }, [state.user]);

  return (
    <AuthContext.Provider value={{ ...state, login, logout, updatePassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
