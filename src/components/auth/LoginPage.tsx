import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, User, GraduationCap, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function LoginPage() {
  const navigate = useNavigate();
  const { login, isLoading } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !password.trim()) {
      setError('Por favor, preencha todos os campos');
      return;
    }

    const result = await login({ username: username.trim(), password });
    
    if (result.success) {
      if (result.mustChangePassword) {
        navigate('/change-password');
      } else {
        navigate('/dashboard');
      }
    } else {
      setError(result.error || 'Erro ao fazer login');
    }
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 gradient-dark relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_hsl(217,91%,35%,0.3),_transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_hsl(173,58%,39%,0.2),_transparent_50%)]" />
        
        <div className="relative z-10 flex flex-col justify-center items-center w-full p-12 text-center">
          <div className="w-24 h-24 rounded-2xl gradient-primary flex items-center justify-center mb-8 shadow-xl">
            <GraduationCap className="w-14 h-14 text-primary-foreground" />
          </div>
          
          <h1 className="text-4xl font-bold text-primary-foreground mb-4">
            Sistema de Gestão Escolar
          </h1>
          
          <p className="text-primary-foreground/70 text-lg max-w-md leading-relaxed">
            Plataforma integrada para gestão completa de instituições de ensino. 
            Controle académico, financeiro e administrativo num único lugar.
          </p>

          <div className="mt-12 grid grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-primary-foreground">500+</div>
              <div className="text-primary-foreground/60 text-sm">Estudantes</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary-foreground">25+</div>
              <div className="text-primary-foreground/60 text-sm">Professores</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary-foreground">8</div>
              <div className="text-primary-foreground/60 text-sm">Cursos</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md animate-fade-in">
          {/* Mobile Logo */}
          <div className="lg:hidden flex justify-center mb-8">
            <div className="w-16 h-16 rounded-xl gradient-primary flex items-center justify-center shadow-lg">
              <GraduationCap className="w-10 h-10 text-primary-foreground" />
            </div>
          </div>

          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-foreground mb-2">
              Bem-vindo de volta
            </h2>
            <p className="text-muted-foreground">
              Inicie sessão para aceder ao painel
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="flex items-center gap-3 p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive animate-scale-in">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm font-medium">{error}</span>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="username" className="text-foreground font-medium">
                Nome de Utilizador
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Ex: supadmin-001"
                  className="pl-10 h-12 input-field"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-foreground font-medium">
                Senha
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Introduza a sua senha"
                  className="pl-10 pr-12 h-12 input-field"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 btn-primary text-base font-semibold"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  A entrar...
                </>
              ) : (
                'Iniciar Sessão'
              )}
            </Button>
          </form>

          <div className="mt-8 pt-8 border-t border-border">
            <p className="text-center text-sm text-muted-foreground">
              Sistema de Gestão Escolar v1.0
            </p>
            <p className="text-center text-xs text-muted-foreground/70 mt-1">
              © 2025 Todos os direitos reservados
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
