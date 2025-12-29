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
  Trash2,
  Edit,
  Loader2,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useCourses, useSchoolNuclei, useTeachers } from '@/hooks/useDatabase';
import { toast } from 'sonner';

export function Settings() {
  const { user, updatePassword } = useAuth();
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isAddCourseOpen, setIsAddCourseOpen] = useState(false);
  const [isAddAdminOpen, setIsAddAdminOpen] = useState(false);

  const { data: courses, isLoading: loadingCourses } = useCourses();
  const { data: schoolNuclei } = useSchoolNuclei();
  const { data: teachers } = useTeachers();

  const isSuperAdmin = user?.role === 'super_admin';

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast.error('As senhas não coincidem');
      return;
    }

    if (newPassword.length < 8) {
      toast.error('A senha deve ter pelo menos 8 caracteres');
      return;
    }

    setIsChangingPassword(true);
    const result = await updatePassword(newPassword);
    setIsChangingPassword(false);

    if (result.success) {
      toast.success('Senha alterada com sucesso');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } else {
      toast.error(result.error || 'Erro ao alterar senha');
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-AO', {
      style: 'currency',
      currency: 'AOA',
      minimumFractionDigits: 0,
    }).format(value);
  };

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
              <TabsTrigger value="courses" className="data-[state=active]:bg-background">
                <Building className="w-4 h-4 mr-2" />
                Cursos
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
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
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
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
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
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
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
                    <Check className={`w-4 h-4 ${newPassword.length >= 8 ? 'text-success' : 'text-muted-foreground'}`} />
                    Mínimo 8 caracteres
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className={`w-4 h-4 ${/[A-Z]/.test(newPassword) ? 'text-success' : 'text-muted-foreground'}`} />
                    Letra maiúscula
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className={`w-4 h-4 ${/[a-z]/.test(newPassword) ? 'text-success' : 'text-muted-foreground'}`} />
                    Letra minúscula
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className={`w-4 h-4 ${/[0-9]/.test(newPassword) ? 'text-success' : 'text-muted-foreground'}`} />
                    Número
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className={`w-4 h-4 ${/[!@#$%^&*(),.?":{}|<>]/.test(newPassword) ? 'text-success' : 'text-muted-foreground'}`} />
                    Símbolo especial
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className={`w-4 h-4 ${newPassword === confirmPassword && newPassword.length > 0 ? 'text-success' : 'text-muted-foreground'}`} />
                    Senhas coincidem
                  </li>
                </ul>
              </div>

              <div className="flex justify-end">
                <Button 
                  className="btn-primary" 
                  onClick={handleChangePassword}
                  disabled={isChangingPassword || !newPassword || newPassword !== confirmPassword}
                >
                  {isChangingPassword && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Alterar Senha
                </Button>
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
                    <Button variant="outline" onClick={() => toast.info('Upload em desenvolvimento')}>
                      Carregar Logotipo
                    </Button>
                    <p className="text-sm text-muted-foreground mt-2">PNG, JPG ou SVG. Máx. 2MB</p>
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Nome da Instituição</Label>
                    <Input 
                      placeholder="Ex: Instituto Técnico de Saúde" 
                      className="input-field"
                      defaultValue={schoolNuclei?.[0]?.name || ''}
                    />
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

                <div className="flex justify-end">
                  <Button className="btn-primary" onClick={() => toast.success('Dados salvos!')}>
                    Guardar Alterações
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Courses Tab (Super Admin Only) */}
        {isSuperAdmin && (
          <TabsContent value="courses" className="space-y-6">
            <Card className="card-elevated">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Gestão de Cursos</CardTitle>
                  <CardDescription>Adicione e configure os cursos da instituição</CardDescription>
                </div>
                <Dialog open={isAddCourseOpen} onOpenChange={setIsAddCourseOpen}>
                  <DialogTrigger asChild>
                    <Button className="btn-primary">
                      <Plus className="w-4 h-4 mr-2" />
                      Adicionar Curso
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                      <DialogTitle>Adicionar Novo Curso</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>Nome do Curso</Label>
                        <Input placeholder="Ex: Enfermagem Geral" />
                      </div>
                      <div className="space-y-2">
                        <Label>Coordenador</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o coordenador" />
                          </SelectTrigger>
                          <SelectContent>
                            {teachers?.map((teacher) => (
                              <SelectItem key={teacher.id} value={teacher.id}>
                                {teacher.profiles?.full_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Mensalidade 10ª (AOA)</Label>
                          <Input type="number" placeholder="5000" />
                        </div>
                        <div className="space-y-2">
                          <Label>Mensalidade 11ª (AOA)</Label>
                          <Input type="number" placeholder="5500" />
                        </div>
                        <div className="space-y-2">
                          <Label>Mensalidade 12ª (AOA)</Label>
                          <Input type="number" placeholder="6000" />
                        </div>
                        <div className="space-y-2">
                          <Label>Mensalidade 13ª (AOA)</Label>
                          <Input type="number" placeholder="6500" />
                        </div>
                      </div>
                      <div className="flex justify-end gap-3 pt-4">
                        <Button variant="outline" onClick={() => setIsAddCourseOpen(false)}>
                          Cancelar
                        </Button>
                        <Button className="btn-primary" onClick={() => {
                          toast.success('Curso adicionado!');
                          setIsAddCourseOpen(false);
                        }}>
                          Adicionar Curso
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {loadingCourses ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="table-header">
                        <TableHead>Curso</TableHead>
                        <TableHead>Coordenador</TableHead>
                        <TableHead>Mensalidade 10ª</TableHead>
                        <TableHead>Mensalidade 11ª</TableHead>
                        <TableHead>Mensalidade 12ª</TableHead>
                        <TableHead>Mensalidade 13ª</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {courses?.map((course) => (
                        <TableRow key={course.id} className="table-row-hover">
                          <TableCell className="font-medium">{course.name}</TableCell>
                          <TableCell>{course.coordinator?.profiles?.full_name || '-'}</TableCell>
                          <TableCell>{formatCurrency(course.monthly_fee_10 || 0)}</TableCell>
                          <TableCell>{formatCurrency(course.monthly_fee_11 || 0)}</TableCell>
                          <TableCell>{formatCurrency(course.monthly_fee_12 || 0)}</TableCell>
                          <TableCell>{formatCurrency(course.monthly_fee_13 || 0)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button variant="ghost" size="icon">
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="text-destructive">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Admins Tab (Super Admin Only) */}
        {isSuperAdmin && (
          <TabsContent value="admins" className="space-y-6">
            <Card className="card-elevated">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Administradores do Sistema</CardTitle>
                  <CardDescription>Gerencie os administradores e suas permissões</CardDescription>
                </div>
                <Dialog open={isAddAdminOpen} onOpenChange={setIsAddAdminOpen}>
                  <DialogTrigger asChild>
                    <Button className="btn-primary">
                      <Plus className="w-4 h-4 mr-2" />
                      Criar Administrador
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                      <DialogTitle>Criar Novo Administrador</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2 space-y-2">
                          <Label>Nome Completo</Label>
                          <Input placeholder="Nome do administrador" />
                        </div>
                        <div className="space-y-2">
                          <Label>Nome de Utilizador</Label>
                          <Input placeholder="Ex: admin-003" />
                        </div>
                        <div className="space-y-2">
                          <Label>Email</Label>
                          <Input type="email" placeholder="email@escola.co.ao" />
                        </div>
                        <div className="col-span-2 space-y-2">
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

                      <div className="flex justify-end gap-3 pt-4">
                        <Button variant="outline" onClick={() => setIsAddAdminOpen(false)}>
                          Cancelar
                        </Button>
                        <Button className="btn-primary" onClick={() => {
                          toast.success('Administrador criado!');
                          setIsAddAdminOpen(false);
                        }}>
                          Criar Administrador
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="table-header">
                      <TableHead>Nome</TableHead>
                      <TableHead>Utilizador</TableHead>
                      <TableHead>Nível de Acesso</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow className="table-row-hover">
                      <TableCell className="font-medium">Super Administrador</TableCell>
                      <TableCell>supadmin-001</TableCell>
                      <TableCell>
                        <Badge className="badge-success">Super Admin</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="badge-success">Activo</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="text-muted-foreground text-sm">Não editável</span>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
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
