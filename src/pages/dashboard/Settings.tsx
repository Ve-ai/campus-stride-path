import React, { useState } from 'react';
import {
  Shield,
  Bell,
  Palette,
  Building,
  Users,
  Eye,
  EyeOff,
  Lock,
  Check,
  Plus,
  Upload,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';

export function Settings() {
  const { user } = useAuth();
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const isSuperAdmin = user?.role === 'super_admin';

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Configurações</h1>
        <p className="text-muted-foreground">Gerir as configurações do sistema</p>
      </div>

      <Tabs defaultValue="security" className="space-y-6">
        <TabsList className="bg-muted/50 p-1">
          <TabsTrigger value="security" className="data-[state=active]:bg-background">
            <Shield className="w-4 h-4 mr-2" />
            Segurança
          </TabsTrigger>
          <TabsTrigger value="appearance" className="data-[state=active]:bg-background">
            <Palette className="w-4 h-4 mr-2" />
            Aparência
          </TabsTrigger>
          {isSuperAdmin && (
            <>
              <TabsTrigger value="school" className="data-[state=active]:bg-background">
                <Building className="w-4 h-4 mr-2" />
                Escola
              </TabsTrigger>
              <TabsTrigger value="admins" className="data-[state=active]:bg-background">
                <Users className="w-4 h-4 mr-2" />
                Administradores
              </TabsTrigger>
            </>
          )}
          <TabsTrigger value="notifications" className="data-[state=active]:bg-background">
            <Bell className="w-4 h-4 mr-2" />
            Notificações
          </TabsTrigger>
        </TabsList>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-6">
          <Card className="card-elevated">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="w-5 h-5" />
                Alterar Senha
              </CardTitle>
              <CardDescription>
                A senha deve conter pelo menos 8 caracteres, incluindo letras maiúsculas, minúsculas, números e símbolos.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Senha Actual</Label>
                <div className="relative">
                  <Input
                    type={showCurrentPassword ? 'text' : 'password'}
                    placeholder="Introduza a senha actual"
                    className="pr-10 input-field"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Nova Senha</Label>
                <div className="relative">
                  <Input
                    type={showNewPassword ? 'text' : 'password'}
                    placeholder="Introduza a nova senha"
                    className="pr-10 input-field"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Confirmar Nova Senha</Label>
                <div className="relative">
                  <Input
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Confirme a nova senha"
                    className="pr-10 input-field"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-muted/50 border border-border">
                <p className="text-sm font-medium text-foreground mb-2">Requisitos da senha:</p>
                <ul className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-success" />
                    Mínimo 8 caracteres
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-success" />
                    Letra maiúscula
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-success" />
                    Letra minúscula
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-success" />
                    Número
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-success" />
                    Símbolo especial
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-success" />
                    Sem sequências (123)
                  </li>
                </ul>
              </div>

              <div className="flex justify-end">
                <Button className="btn-primary">Alterar Senha</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Appearance Tab */}
        <TabsContent value="appearance" className="space-y-6">
          <Card className="card-elevated">
            <CardHeader>
              <CardTitle>Tema</CardTitle>
              <CardDescription>Personalize a aparência do sistema</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <Label>Modo de Cor</Label>
                <div className="grid grid-cols-2 gap-4">
                  <button className="p-4 rounded-lg border-2 border-primary bg-background flex flex-col items-center gap-2">
                    <div className="w-12 h-12 rounded-lg bg-background border border-border shadow-sm" />
                    <span className="text-sm font-medium">Claro</span>
                  </button>
                  <button className="p-4 rounded-lg border border-border bg-background flex flex-col items-center gap-2 opacity-50">
                    <div className="w-12 h-12 rounded-lg bg-foreground" />
                    <span className="text-sm font-medium">Escuro</span>
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* School Tab (Super Admin Only) */}
        {isSuperAdmin && (
          <TabsContent value="school" className="space-y-6">
            <Card className="card-elevated">
              <CardHeader>
                <CardTitle>Perfil da Escola</CardTitle>
                <CardDescription>Configure as informações da instituição</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-6">
                  <div className="w-24 h-24 rounded-xl bg-muted flex items-center justify-center border-2 border-dashed border-border">
                    <Upload className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <div>
                    <Button variant="outline">Carregar Logotipo</Button>
                    <p className="text-sm text-muted-foreground mt-2">PNG, JPG ou SVG. Máx. 2MB</p>
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Nome da Instituição</Label>
                    <Input placeholder="Ex: Instituto Técnico de Saúde" className="input-field" />
                  </div>
                  <div className="space-y-2">
                    <Label>Sigla</Label>
                    <Input placeholder="Ex: ITS" className="input-field" />
                  </div>
                  <div className="col-span-2 space-y-2">
                    <Label>Endereço</Label>
                    <Input placeholder="Rua, Bairro, Município, Província" className="input-field" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="card-elevated">
              <CardHeader>
                <CardTitle>Gestão de Cursos</CardTitle>
                <CardDescription>Adicione e configure os cursos da instituição</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full">
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Novo Curso
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Admins Tab (Super Admin Only) */}
        {isSuperAdmin && (
          <TabsContent value="admins" className="space-y-6">
            <Card className="card-elevated">
              <CardHeader>
                <CardTitle>Criar Administrador</CardTitle>
                <CardDescription>Adicione novos administradores ao sistema</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Nome Completo</Label>
                    <Input placeholder="Nome do administrador" className="input-field" />
                  </div>
                  <div className="space-y-2">
                    <Label>Nome de Utilizador</Label>
                    <Input placeholder="Ex: admin-003" className="input-field" />
                  </div>
                  <div className="space-y-2">
                    <Label>Nível de Acesso</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o nível" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Administrador</SelectItem>
                        <SelectItem value="finance">Gestor Financeiro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input type="email" placeholder="email@escola.co.ao" className="input-field" />
                  </div>
                </div>

                <div className="space-y-4">
                  <Label>Permissões</Label>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      'Ver estudantes',
                      'Editar estudantes',
                      'Ver professores',
                      'Editar professores',
                      'Ver finanças',
                      'Registar pagamentos',
                      'Gerar relatórios',
                      'Aprovar alterações',
                    ].map((permission) => (
                      <div key={permission} className="flex items-center justify-between p-3 rounded-lg border border-border">
                        <span className="text-sm">{permission}</span>
                        <Switch />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button className="btn-primary">Criar Administrador</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          <Card className="card-elevated">
            <CardHeader>
              <CardTitle>Preferências de Notificação</CardTitle>
              <CardDescription>Configure como deseja receber notificações</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { label: 'Alertas de pagamentos pendentes', description: 'Receba alertas quando houver pagamentos atrasados' },
                { label: 'Novos registos', description: 'Notificações de novos estudantes ou professores' },
                { label: 'Alterações de notas', description: 'Solicitações de alteração de notas pelos professores' },
                { label: 'Resumo diário', description: 'Receba um resumo das actividades do dia' },
              ].map((item, index) => (
                <div key={index} className="flex items-center justify-between p-4 rounded-lg border border-border">
                  <div>
                    <p className="font-medium text-foreground">{item.label}</p>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>
                  <Switch />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
