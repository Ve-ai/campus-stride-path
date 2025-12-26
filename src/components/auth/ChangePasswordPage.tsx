import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, Shield, Check, X, Loader2, GraduationCap } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PASSWORD_RULES } from '@/types/auth';

function validatePassword(password: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (password.length < PASSWORD_RULES.minLength) {
    errors.push(`Mínimo de ${PASSWORD_RULES.minLength} caracteres`);
  }
  if (PASSWORD_RULES.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Pelo menos uma letra maiúscula');
  }
  if (PASSWORD_RULES.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Pelo menos uma letra minúscula');
  }
  if (PASSWORD_RULES.requireNumber && !/\d/.test(password)) {
    errors.push('Pelo menos um número');
  }
  if (PASSWORD_RULES.requireSymbol && !/[!@#$%^&*(),.?":{}|<>\-_=+]/.test(password)) {
    errors.push('Pelo menos um símbolo especial');
  }
  if (PASSWORD_RULES.noSequential && /(.)\1{2,}/.test(password)) {
    errors.push('Sem caracteres repetidos consecutivos (ex: aaa)');
  }
  if (PASSWORD_RULES.noSequential && /(012|123|234|345|456|567|678|789|890|abc|bcd|cde|def)/.test(password.toLowerCase())) {
    errors.push('Sem sequências numéricas ou alfabéticas');
  }

  return { isValid: errors.length === 0, errors };
}

export function ChangePasswordPage() {
  const navigate = useNavigate();
  const { updatePassword, user, isLoading } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validation = validatePassword(newPassword);
  const passwordsMatch = newPassword === confirmPassword && confirmPassword !== '';

  const requirements = [
    { text: `Mínimo de ${PASSWORD_RULES.minLength} caracteres`, met: newPassword.length >= PASSWORD_RULES.minLength },
    { text: 'Letra maiúscula', met: /[A-Z]/.test(newPassword) },
    { text: 'Letra minúscula', met: /[a-z]/.test(newPassword) },
    { text: 'Número', met: /\d/.test(newPassword) },
    { text: 'Símbolo especial', met: /[!@#$%^&*(),.?":{}|<>\-_=+]/.test(newPassword) },
    { text: 'Sem repetições (aaa)', met: newPassword.length > 0 && !/(.)\1{2,}/.test(newPassword) },
    { text: 'Sem sequências (123)', met: newPassword.length > 0 && !/(012|123|234|345|456|567|678|789|890)/.test(newPassword) },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validation.isValid) {
      setError('A senha não cumpre os requisitos de segurança');
      return;
    }

    if (!passwordsMatch) {
      setError('As senhas não coincidem');
      return;
    }

    setIsSubmitting(true);
    const result = await updatePassword(newPassword);
    setIsSubmitting(false);

    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.error || 'Erro ao atualizar senha');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-lg animate-slide-up">
        <div className="card-elevated p-8">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-xl gradient-primary flex items-center justify-center shadow-lg">
              <Shield className="w-10 h-10 text-primary-foreground" />
            </div>
          </div>

          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Alteração de Senha Obrigatória
            </h1>
            <p className="text-muted-foreground">
              Por razões de segurança, deve alterar a sua senha no primeiro acesso.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="flex items-center gap-3 p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive">
                <X className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm font-medium">{error}</span>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="currentPassword" className="text-foreground font-medium">
                Senha Atual
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="currentPassword"
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Introduza a senha atual"
                  className="pl-10 pr-12 h-12 input-field"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword" className="text-foreground font-medium">
                Nova Senha
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="newPassword"
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Introduza a nova senha"
                  className="pl-10 pr-12 h-12 input-field"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-foreground font-medium">
                Confirmar Nova Senha
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirme a nova senha"
                  className={`pl-10 pr-12 h-12 input-field ${
                    confirmPassword && (passwordsMatch ? 'border-success' : 'border-destructive')
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Password Requirements */}
            <div className="p-4 rounded-lg bg-muted/50 border border-border">
              <p className="text-sm font-medium text-foreground mb-3">Requisitos da senha:</p>
              <div className="grid grid-cols-2 gap-2">
                {requirements.map((req, index) => (
                  <div
                    key={index}
                    className={`flex items-center gap-2 text-sm ${
                      req.met ? 'text-success' : 'text-muted-foreground'
                    }`}
                  >
                    {req.met ? (
                      <Check className="w-4 h-4 flex-shrink-0" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-muted-foreground/50 flex-shrink-0" />
                    )}
                    <span>{req.text}</span>
                  </div>
                ))}
              </div>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting || !validation.isValid || !passwordsMatch}
              className="w-full h-12 btn-primary text-base font-semibold"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  A atualizar...
                </>
              ) : (
                'Alterar Senha e Continuar'
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
