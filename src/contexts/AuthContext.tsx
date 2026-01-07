import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { User, AuthState, LoginCredentials, UserRole, DEFAULT_CREDENTIALS } from '@/types/auth';
import { supabase } from '@/integrations/supabase/client';
import { Session, User as SupabaseUser } from '@supabase/supabase-js';

interface AuthContextType extends AuthState {
  login: (
    credentials: LoginCredentials,
  ) => Promise<{ success: boolean; error?: string; mustChangePassword?: boolean; userRole?: UserRole }>;
  logout: () => void;
  updatePassword: (newPassword: string) => Promise<{ success: boolean; error?: string }>;
  session: Session | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });
  const [session, setSession] = useState<Session | null>(null);

  // Transform Supabase user to app user
  const transformUser = useCallback(async (supabaseUser: SupabaseUser): Promise<User | null> => {
    try {
      // Get profile data
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', supabaseUser.id)
        .maybeSingle();

      // Get user role
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', supabaseUser.id)
        .maybeSingle();

      // Get teacher info if professor
      let teacherId: string | undefined;
      if (roleData?.role === 'professor') {
        const { data: teacher } = await supabase
          .from('teachers')
          .select('id')
          .eq('user_id', supabaseUser.id)
          .maybeSingle();
        teacherId = teacher?.id;
      }

      const role = roleData?.role as UserRole || 'professor';

      return {
        id: supabaseUser.id,
        username: profile?.username || supabaseUser.email?.split('@')[0] || '',
        name: profile?.full_name || supabaseUser.email || '',
        role,
        email: supabaseUser.email,
        phone: profile?.phone || undefined,
        avatar: profile?.avatar_url || undefined,
        mustChangePassword: profile?.must_change_password ?? true,
        lastLogin: new Date(),
        createdAt: new Date(supabaseUser.created_at),
        biNumber: profile?.bi_number || undefined,
        teacherId,
      };
    } catch (error) {
      console.error('Error transforming user:', error);
      return null;
    }
  }, []);

  // Initialize auth state
  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        
        if (session?.user) {
          // Defer the async user transformation
          setTimeout(() => {
            transformUser(session.user).then(user => {
              if (user) {
                setState({
                  user,
                  isAuthenticated: true,
                  isLoading: false,
                });
              } else {
                setState({
                  user: null,
                  isAuthenticated: false,
                  isLoading: false,
                });
              }
            });
          }, 0);
        } else {
          setState({
            user: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      
      if (session?.user) {
        transformUser(session.user).then(user => {
          if (user) {
            setState({
              user,
              isAuthenticated: true,
              isLoading: false,
            });
          } else {
            setState({
              user: null,
              isAuthenticated: false,
              isLoading: false,
            });
          }
        });
      } else {
        setState(prev => ({ ...prev, isLoading: false }));
      }
    });

    return () => subscription.unsubscribe();
  }, [transformUser]);

  const login = useCallback(async (credentials: LoginCredentials) => {
    setState(prev => ({ ...prev, isLoading: true }));
    
    try {
      // Normalizar inputs (remover espaços acidentais)
      const username = credentials.username.trim();
      const password = credentials.password.trim();

      // Encontrar o email a partir do username
      let email = '';
      
      // Credenciais padrão (super admin / admin / finanças)
      if (username === DEFAULT_CREDENTIALS.super_admin.username) {
        email = DEFAULT_CREDENTIALS.super_admin.email;
      } else if (username === DEFAULT_CREDENTIALS.admin.username) {
        email = DEFAULT_CREDENTIALS.admin.email;
      } else if (username === DEFAULT_CREDENTIALS.finance.username) {
        email = DEFAULT_CREDENTIALS.finance.email;
      } else {
        // Para professores, o username é o BI - procurar o utilizador
        const { data: profile } = await supabase
          .from('profiles')
          .select('user_id')
          .eq('bi_number', username)
          .maybeSingle();
        
        if (profile) {
          // Construir email "sintético" a partir do BI
          email = `${username.toLowerCase()}@professor.escola.co.ao`;
        }
        
        if (!email) {
          setState(prev => ({ ...prev, isLoading: false }));
          return { success: false, error: 'Utilizador não encontrado' };
        }
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Erro de login Supabase:', error.message);
        setState(prev => ({ ...prev, isLoading: false }));
        return { success: false, error: 'Credenciais inválidas' };
      }

      if (data.user) {
        const user = await transformUser(data.user);
        
        if (user) {
          setState({
            user,
            isAuthenticated: true,
            isLoading: false,
          });
          
          return { 
            success: true, 
            mustChangePassword: user.mustChangePassword,
            userRole: user.role,
          };
        }
      }

      setState(prev => ({ ...prev, isLoading: false }));
      return { success: false, error: 'Erro ao processar login' };
    } catch (error) {
      console.error('Login error:', error);
      setState(prev => ({ ...prev, isLoading: false }));
      return { success: false, error: 'Erro ao fazer login' };
    }
  }, [transformUser]);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });
  }, []);

  const updatePassword = useCallback(async (newPassword: string) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      // Update profile to mark password changed
      if (state.user) {
        await supabase
          .from('profiles')
          .update({ must_change_password: false })
          .eq('user_id', state.user.id);

        setState(prev => ({
          ...prev,
          user: prev.user ? { ...prev.user, mustChangePassword: false } : null,
        }));
      }

      return { success: true };
    } catch (error) {
      console.error('Password update error:', error);
      return { success: false, error: 'Erro ao atualizar senha' };
    }
  }, [state.user]);

  return (
    <AuthContext.Provider value={{ ...state, login, logout, updatePassword, session }}>
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
