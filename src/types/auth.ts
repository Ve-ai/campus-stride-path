import type { Enums } from "@/integrations/supabase/types";

export type UserRole = Enums<"app_role">;

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
  biNumber?: string;
  teacherId?: string;
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
    username: 'Lucidio001',
    email: 'supadmin@escola.co.ao',
    defaultPassword: '@Lucidio4321',
    name: 'Administrador Supremo',
  },
  admin: {
    username: 'admin',
    email: 'admin@escola.co.ao',
    defaultPassword: 'password1',
    name: 'Administrador',
  },
  finance: {
    username: 'financa@uni',
    email: 'financa@uni',
    defaultPassword: 'FIN@SrongPass\\',
    name: 'Gestor Financeiro',
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

// Password validation function
export function validatePassword(password: string, previousPasswords: string[] = []): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (password.length < PASSWORD_RULES.minLength) {
    errors.push(`A senha deve ter pelo menos ${PASSWORD_RULES.minLength} caracteres`);
  }

  if (PASSWORD_RULES.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('A senha deve conter pelo menos uma letra maiúscula');
  }

  if (PASSWORD_RULES.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('A senha deve conter pelo menos uma letra minúscula');
  }

  if (PASSWORD_RULES.requireNumber && !/[0-9]/.test(password)) {
    errors.push('A senha deve conter pelo menos um número');
  }

  if (PASSWORD_RULES.requireSymbol && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('A senha deve conter pelo menos um símbolo especial');
  }

  // Check for sequential numbers (e.g., 123, 321)
  if (PASSWORD_RULES.noSequential) {
    const sequentialPatterns = ['012', '123', '234', '345', '456', '567', '678', '789', '890', '987', '876', '765', '654', '543', '432', '321', '210'];
    for (const pattern of sequentialPatterns) {
      if (password.includes(pattern)) {
        errors.push('A senha não pode conter números sequenciais (ex: 123)');
        break;
      }
    }
  }

  // Check for repeating characters (e.g., aaa, 111)
  if (PASSWORD_RULES.noRepeating && /(.)\1{2,}/.test(password)) {
    errors.push('A senha não pode conter caracteres repetidos consecutivos (ex: aaa)');
  }

  // Check against previous passwords
  if (previousPasswords.includes(password)) {
    errors.push('A senha não pode ser igual a uma das últimas 5 senhas utilizadas');
  }

  return { valid: errors.length === 0, errors };
}

// Generate default password for professor based on name and birth year
export function generateDefaultTeacherPassword(fullName: string, birthYear: number): string {
  const initials = fullName
    .split(' ')
    .map(word => word.charAt(0).toUpperCase())
    .join('');
  return `${initials}-${birthYear}`;
}
