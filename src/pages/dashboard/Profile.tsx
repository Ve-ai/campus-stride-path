import React from 'react';
import { Camera, Mail, Phone, Shield, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function Profile() {
  const { user } = useAuth();

  if (!user) return null;

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
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Perfil</h1>
        <p className="text-muted-foreground">Gerir as suas informações pessoais</p>
      </div>

      {/* Profile Card */}
      <Card className="card-elevated">
        <CardContent className="p-8">
          <div className="flex flex-col md:flex-row items-center gap-8">
            {/* Avatar */}
            <div className="relative">
              <div className="w-32 h-32 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-5xl font-bold text-primary">
                  {user.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <button className="absolute bottom-0 right-0 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg hover:bg-primary/90 transition-colors">
                <Camera className="w-5 h-5" />
              </button>
            </div>

            {/* Info */}
            <div className="flex-1 text-center md:text-left">
              <h2 className="text-2xl font-bold text-foreground">{user.name}</h2>
              <p className="text-muted-foreground">{getRoleName(user.role)}</p>
              <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-4">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <User className="w-4 h-4" />
                  <span>{user.username}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Shield className="w-4 h-4" />
                  <span>Activo</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit Form */}
      <Card className="card-elevated">
        <CardHeader>
          <CardTitle>Informações Pessoais</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="fullName">Nome Completo</Label>
              <Input id="fullName" defaultValue={user.name} className="input-field" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="username">Nome de Utilizador</Label>
              <Input id="username" defaultValue={user.username} className="input-field" disabled />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="email@escola.co.ao"
                  className="pl-10 input-field"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Contacto</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="phone"
                  type="tel"
                  placeholder="925 000 000"
                  className="pl-10 input-field"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="outline">Cancelar</Button>
            <Button className="btn-primary">Guardar Alterações</Button>
          </div>
        </CardContent>
      </Card>

      {/* Activity Log */}
      <Card className="card-elevated">
        <CardHeader>
          <CardTitle>Actividade Recente</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { action: 'Início de sessão', date: 'Hoje, 08:30', ip: '192.168.1.100' },
              { action: 'Alteração de dados de professor', date: 'Ontem, 14:20', ip: '192.168.1.100' },
              { action: 'Registo de pagamento', date: 'Ontem, 10:15', ip: '192.168.1.100' },
              { action: 'Exportação de relatório', date: '20/12/2025, 16:45', ip: '192.168.1.100' },
            ].map((log, index) => (
              <div
                key={index}
                className="flex items-center justify-between py-3 border-b border-border last:border-0"
              >
                <div>
                  <p className="font-medium text-foreground">{log.action}</p>
                  <p className="text-sm text-muted-foreground">{log.date}</p>
                </div>
                <span className="text-xs text-muted-foreground">{log.ip}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
