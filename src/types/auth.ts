export type UserRole = 'super_admin' | 'admin' | 'finance' | 'professor';

export interface User {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  email?: string;
  phone?: string;
  avatar?: string;
  mustChangePassword: boolean;
  lastLogin?: Date;
  createdAt: Date;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export const DEFAULT_CREDENTIALS = {
  super_admin: {
    username: 'supadmin-001',
    defaultPassword: 'XyZ@2025StrongPass',
  },
  admin: {
    username: 'admin-002',
    defaultPassword: 'AbC#2025SecurePass',
  },
  finance: {
    username: 'financas-003',
    defaultPassword: 'Fin@2025StrongKey',
  },
} as const;

export const PASSWORD_RULES = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSymbol: true,
  noSequential: true,
  noRepeating: true,
  historyCount: 5,
};
