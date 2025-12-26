import React, { useState } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  BookOpen,
  Users,
  UserCheck,
  GraduationCap,
  Wallet,
  User,
  Settings,
  LogOut,
  Menu,
  X,
  Bell,
  ChevronDown,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const navigationItems = {
  super_admin: [
    { name: 'Visão Geral', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Cursos', path: '/dashboard/cursos', icon: BookOpen },
    { name: 'Turmas', path: '/dashboard/turmas', icon: Users },
    { name: 'Diretores de Turma', path: '/dashboard/diretores', icon: UserCheck },
    { name: 'Professores', path: '/dashboard/professores', icon: GraduationCap },
    { name: 'Finanças', path: '/dashboard/financas', icon: Wallet },
    { name: 'Perfil', path: '/dashboard/perfil', icon: User },
    { name: 'Configurações', path: '/dashboard/configuracoes', icon: Settings },
  ],
  admin: [
    { name: 'Visão Geral', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Cursos', path: '/dashboard/cursos', icon: BookOpen },
    { name: 'Turmas', path: '/dashboard/turmas', icon: Users },
    { name: 'Diretores de Turma', path: '/dashboard/diretores', icon: UserCheck },
    { name: 'Professores', path: '/dashboard/professores', icon: GraduationCap },
    { name: 'Finanças', path: '/dashboard/financas', icon: Wallet },
    { name: 'Perfil', path: '/dashboard/perfil', icon: User },
    { name: 'Configurações', path: '/dashboard/configuracoes', icon: Settings },
  ],
  finance: [
    { name: 'Visão Geral', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Turmas e Pagamentos', path: '/dashboard/turmas-pagamentos', icon: Users },
    { name: 'Relatórios', path: '/dashboard/relatorios', icon: BookOpen },
    { name: 'Configurações', path: '/dashboard/configuracoes', icon: Settings },
  ],
  professor: [
    { name: 'Visão Geral', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Turmas', path: '/dashboard/turmas', icon: Users },
    { name: 'Notas', path: '/dashboard/notas', icon: BookOpen },
    { name: 'Comunicação', path: '/dashboard/comunicacao', icon: Bell },
    { name: 'Perfil', path: '/dashboard/perfil', icon: User },
  ],
};

export function DashboardLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  if (!user) {
    navigate('/');
    return null;
  }

  const navItems = navigationItems[user.role] || navigationItems.professor;

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getRoleName = (role: string) => {
    const roles: Record<string, string> = {
      super_admin: 'Administrador Supremo',
      admin: 'Administrador',
      finance: 'Gestor Financeiro',
      professor: 'Professor',
    };
    return roles[role] || role;
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-foreground/50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-72 gradient-dark transform transition-transform duration-300 ease-in-out ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between p-6 border-b border-sidebar-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="font-bold text-sidebar-foreground text-lg">SGE</h1>
                <p className="text-xs text-sidebar-foreground/60">Gestão Escolar</p>
              </div>
            </div>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="lg:hidden text-sidebar-foreground/70 hover:text-sidebar-foreground"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => {
                    navigate(item.path);
                    setIsSidebarOpen(false);
                  }}
                  className={`sidebar-item w-full ${isActive ? 'sidebar-item-active' : ''}`}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.name}</span>
                </button>
              );
            })}
          </nav>

          {/* User Info */}
          <div className="p-4 border-t border-sidebar-border">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-sidebar-accent/50">
              <div className="w-10 h-10 rounded-full bg-sidebar-primary flex items-center justify-center">
                <span className="text-sidebar-primary-foreground font-semibold text-sm">
                  {user.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-sidebar-foreground truncate">
                  {user.name}
                </p>
                <p className="text-xs text-sidebar-foreground/60 truncate">
                  {getRoleName(user.role)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="sticky top-0 z-30 bg-card border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="lg:hidden text-foreground hover:text-primary transition-colors"
              >
                <Menu className="w-6 h-6" />
              </button>
              <div>
                <h2 className="text-xl font-semibold text-foreground">
                  {navItems.find((item) => item.path === location.pathname)?.name || 'Dashboard'}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {new Date().toLocaleDateString('pt-PT', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Notifications */}
              <button className="relative p-2 rounded-lg hover:bg-muted transition-colors">
                <Bell className="w-5 h-5 text-muted-foreground" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full" />
              </button>

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted transition-colors">
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                      <span className="text-primary-foreground font-medium text-sm">
                        {user.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-2 py-2">
                    <p className="text-sm font-medium">{user.name}</p>
                    <p className="text-xs text-muted-foreground">{user.username}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/dashboard/perfil')}>
                    <User className="w-4 h-4 mr-2" />
                    Perfil
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/dashboard/configuracoes')}>
                    <Settings className="w-4 h-4 mr-2" />
                    Configurações
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                    <LogOut className="w-4 h-4 mr-2" />
                    Terminar Sessão
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
