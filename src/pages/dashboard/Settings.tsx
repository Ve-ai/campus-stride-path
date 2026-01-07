import React, { useState, useEffect } from 'react';
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
  Trash2,
  Edit,
  Loader2,
  RefreshCw,
  Wallet,
  Calendar,
  GraduationCap,
  ArrowRightLeft,
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
import { useCourses, useTeachers, useDeleteCourse } from '@/hooks/useDatabase';
import { toast } from "@/lib/notifications";
import { CourseEditForm } from './CourseEditForm';
import { supabase } from '@/integrations/supabase/client';
import {
  executeAcademicYearTransition,
  getTransitionPreview,
  getCurrentAcademicYear,
} from '@/services/academicYearTransition';
import { Progress } from '@/components/ui/progress';

export function Settings() {
  const { user, updatePassword } = useAuth();
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isAddAdminOpen, setIsAddAdminOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<any | null>(null);
  const [isEditCourseOpen, setIsEditCourseOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window === 'undefined') return 'light';
    const stored = localStorage.getItem('theme');
    return stored === 'dark' ? 'dark' : 'light';
  });

  const { data: courses, isLoading: loadingCourses } = useCourses();
  const { data: teachers } = useTeachers();
  const deleteCourse = useDeleteCourse();
  const [isSeedingData, setIsSeedingData] = useState(false);
  const [isSeedingFinance, setIsSeedingFinance] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionPreview, setTransitionPreview] = useState<any[]>([]);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [transitionResult, setTransitionResult] = useState<any>(null);

  const currentAcademicYear = getCurrentAcademicYear();
  const isSuperAdmin = user?.role === 'super_admin';

  // Carrega preview quando abre a aba de transição
  const loadTransitionPreview = async () => {
    setIsLoadingPreview(true);
    try {
      const preview = await getTransitionPreview(currentAcademicYear);
      setTransitionPreview(preview);
    } catch (error) {
      console.error('Erro ao carregar preview:', error);
      toast.error('Erro ao carregar dados de transição');
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const handleAcademicYearTransition = async () => {
    if (!confirm(`Tem a certeza que pretende executar a transição de ano letivo de ${currentAcademicYear}/${currentAcademicYear + 1} para ${currentAcademicYear + 1}/${currentAcademicYear + 2}? Esta ação irá mover os alunos para as suas novas turmas.`)) {
      return;
    }

    setIsTransitioning(true);
    try {
      const result = await executeAcademicYearTransition(currentAcademicYear);
      setTransitionResult(result);
      
      if (result.errors.length === 0) {
        toast.success(`Transição concluída! ${result.promoted} promovidos, ${result.retained} retidos, ${result.graduated} graduados.`);
      } else {
        toast.warning(`Transição concluída com ${result.errors.length} erros. Verifique os detalhes.`);
      }
      
      // Recarrega preview
      await loadTransitionPreview();
    } catch (error) {
      console.error('Erro na transição:', error);
      toast.error('Erro ao executar transição de ano letivo');
    } finally {
      setIsTransitioning(false);
    }
  };

  const applyTheme = (value: 'light' | 'dark') => {
    setTheme(value);
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      if (value === 'dark') {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', value);
    }
  };

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

  const handleSeedDemoData = async () => {
    if (!isSuperAdmin) {
      toast.error('Apenas o administrador supremo pode limpar os dados de exemplo.');
      return;
    }

    if (!confirm('Tem a certeza que pretende apagar todos os dados de exemplo? Esta ação não pode ser desfeita.')) {
      return;
    }

    try {
      setIsSeedingData(true);
      const { data, error } = await supabase.functions.invoke('reset-demo');

      if (error) {
        console.error('Reset demo error:', error);
        toast.error('Erro ao limpar dados de exemplo.');
        return;
      }

      toast.success(data?.message || 'Dados de exemplo removidos com sucesso.');
    } catch (err) {
      console.error('Reset demo error:', err);
      toast.error('Erro inesperado ao limpar dados de exemplo.');
    } finally {
      setIsSeedingData(false);
    }
  };

  const handleSeedFinance = async () => {
    if (!isSuperAdmin) {
      toast.error('Apenas o administrador supremo pode inicializar o Gestor Financeiro.');
      return;
    }

    setIsSeedingFinance(true);
    try {
      const { data, error } = await supabase.functions.invoke('seed-finance', {
        body: { resetPassword: true },
      });

      if (error) {
        console.error('Seed finance error:', error);
        toast.error('Erro ao criar Gestor Financeiro: ' + error.message);
      } else if (data?.password) {
        toast.success(
          `Gestor Financeiro criado/atualizado com sucesso!\nUtilizador: ${data.username || 'financa@uni'}\nSenha temporária: ${data.password}`,
        );
      } else {
        toast.info(
          'Gestor Financeiro já existe. Clique novamente em "Inicializar Gestor Financeiro" para gerar uma nova senha, se necessário.',
        );
      }
    } catch (err) {
      console.error('Seed finance error:', err);
      toast.error('Erro inesperado ao criar Gestor Financeiro');
    } finally {
      setIsSeedingFinance(false);
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
              <TabsTrigger value="courses" className="data-[state=active]:bg-background">
                <Building className="w-4 h-4 mr-2" />
                Cursos
              </TabsTrigger>
              <TabsTrigger value="admins" className="data-[state=active]:bg-background">
                <Users className="w-4 h-4 mr-2" />
                Administradores
              </TabsTrigger>
              <TabsTrigger 
                value="academic-year" 
                className="data-[state=active]:bg-background"
                onClick={() => loadTransitionPreview()}
              >
                <ArrowRightLeft className="w-4 h-4 mr-2" />
                Ano Letivo
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

          {isSuperAdmin && (
            <Card className="card-elevated border-destructive/40 bg-destructive/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-destructive">
                  <RefreshCw className="w-5 h-5" />
                  Limpar dados de exemplo
                </CardTitle>
                <CardDescription>
                  Apaga todos os dados de teste (alunos, cursos, turmas, professores, pagamentos, faltas, notas) deixando apenas as contas de administração e finanças já configuradas.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-between gap-4 flex-wrap">
                <p className="text-sm text-muted-foreground max-w-xl">
                  Esta ação é destrutiva e não pode ser desfeita. Os dados reais inseridos manualmente também serão removidos.
                </p>
                <Button
                  variant="destructive"
                  onClick={handleSeedDemoData}
                  disabled={isSeedingData}
                  className="shrink-0"
                >
                  {isSeedingData ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      A limpar dados de exemplo...
                    </>
                  ) : (
                    'Limpar dados de exemplo'
                  )}
                </Button>
              </CardContent>
            </Card>
          )}

          {isSuperAdmin && (
            <Card className="card-elevated">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="w-5 h-5" />
                  Inicializar Gestor Financeiro
                </CardTitle>
                <CardDescription>
                  Cria automaticamente uma conta de Gestor Financeiro permanente (função "finance") para o sistema.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-between gap-4 flex-wrap">
                <p className="text-sm text-muted-foreground max-w-xl">
                  O utilizador será criado com credenciais geradas automaticamente. Guarde a senha apresentada para
                  partilhar com o Gestor Financeiro.
                </p>
                <Button
                  variant="outline"
                  onClick={handleSeedFinance}
                  disabled={isSeedingFinance}
                  className="shrink-0"
                >
                  {isSeedingFinance ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      A criar Gestor Financeiro...
                    </>
                  ) : (
                    'Inicializar Gestor Financeiro'
                  )}
                </Button>
              </CardContent>
            </Card>
          )}
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
                  <button
                    type="button"
                    onClick={() => applyTheme('light')}
                    className={`p-4 rounded-lg border-2 flex flex-col items-center gap-2 transition-colors ${
                      theme === 'light' ? 'border-primary bg-background' : 'border-border bg-muted/40'
                    }`}
                  >
                    <div className="w-12 h-12 rounded-lg bg-background border border-border shadow-sm" />
                    <span className="text-sm font-medium">Claro</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => applyTheme('dark')}
                    className={`p-4 rounded-lg border-2 flex flex-col items-center gap-2 transition-colors ${
                      theme === 'dark' ? 'border-primary bg-background' : 'border-border bg-muted/40'
                    }`}
                  >
                    <div className="w-12 h-12 rounded-lg bg-foreground" />
                    <span className="text-sm font-medium">Escuro</span>
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Courses Tab (Super Admin Only) */}
        {isSuperAdmin && (
          <TabsContent value="courses" className="space-y-6">
            <Card className="card-elevated">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Gestão de Cursos</CardTitle>
                  <CardDescription>Visualize e atualize os cursos da instituição</CardDescription>
                </div>
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
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setEditingCourse(course);
                                  setIsEditCourseOpen(true);
                                }}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-destructive"
                                onClick={() => {
                                  if (!window.confirm('Tem a certeza que deseja eliminar este curso?')) return;
                                  deleteCourse.mutate(
                                    { id: course.id },
                                    {
                                      onSuccess: () => toast.success('Curso eliminado com sucesso'),
                                      onError: (err: any) => toast.error(err.message || 'Erro ao eliminar curso'),
                                    },
                                  );
                                }}
                              >
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

            {/* Edit course dialog */}
            <Dialog
              open={isEditCourseOpen}
              onOpenChange={(open) => {
                setIsEditCourseOpen(open);
                if (!open) setEditingCourse(null);
              }}
            >
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>Editar Curso</DialogTitle>
                </DialogHeader>
                {editingCourse && (
                  <CourseEditForm
                    course={editingCourse}
                    onClose={() => {
                      setIsEditCourseOpen(false);
                      setEditingCourse(null);
                    }}
                    onUpdated={() => toast.success('Curso atualizado com sucesso')}
                  />
                )}
              </DialogContent>
            </Dialog>
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
                            <div
                              key={permission}
                              className="flex items-center justify-between p-3 rounded-lg border border-border"
                            >
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
                        <Button
                          className="btn-primary"
                          onClick={() => {
                            toast.success('Administrador criado!');
                            setIsAddAdminOpen(false);
                          }}
                        >
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
                        <Badge variant="outline" className="badge-success">
                          Activo
                        </Badge>
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

        {/* Academic Year Transition Tab (Super Admin Only) */}
        {isSuperAdmin && (
          <TabsContent value="academic-year" className="space-y-6">
            <Card className="card-elevated">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Transição de Ano Letivo
                </CardTitle>
                <CardDescription>
                  Gerir a transição de alunos entre anos letivos. O ano letivo atual é {currentAcademicYear}/{currentAcademicYear + 1} (Setembro a Julho).
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Info Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                    <div className="flex items-center gap-2 text-primary mb-2">
                      <GraduationCap className="w-5 h-5" />
                      <span className="font-semibold">Aprovados</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Alunos com média ≥ 10 vão para a próxima classe. 12ª aprovados vão para 13ª (Estágio Curricular).
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-warning/10 border border-warning/20">
                    <div className="flex items-center gap-2 text-warning mb-2">
                      <RefreshCw className="w-5 h-5" />
                      <span className="font-semibold">Reprovados</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Alunos com média &lt; 10 ficam na mesma classe para o novo ano letivo.
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-success/10 border border-success/20">
                    <div className="flex items-center gap-2 text-success mb-2">
                      <Check className="w-5 h-5" />
                      <span className="font-semibold">Graduados</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Alunos da 13ª que concluem o estágio são marcados como graduados.
                    </p>
                  </div>
                </div>

                {/* Preview Table */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-foreground">Previsão de Transição</h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={loadTransitionPreview}
                      disabled={isLoadingPreview}
                    >
                      {isLoadingPreview ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <RefreshCw className="w-4 h-4 mr-2" />
                      )}
                      Atualizar
                    </Button>
                  </div>

                  {isLoadingPreview ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    </div>
                  ) : transitionPreview.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow className="table-header">
                          <TableHead>Turma</TableHead>
                          <TableHead>Curso</TableHead>
                          <TableHead className="text-center">Total</TableHead>
                          <TableHead className="text-center">Aprovados</TableHead>
                          <TableHead className="text-center">Reprovados</TableHead>
                          <TableHead className="text-center">Taxa Aprovação</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {transitionPreview.map((item) => (
                          <TableRow key={item.classId} className="table-row-hover">
                            <TableCell className="font-medium">{item.className}</TableCell>
                            <TableCell>{item.courseName}</TableCell>
                            <TableCell className="text-center">{item.totalStudents}</TableCell>
                            <TableCell className="text-center">
                              <Badge className="badge-success">{item.approved}</Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge variant="destructive">{item.failed}</Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="flex items-center gap-2">
                                <Progress 
                                  value={item.totalStudents > 0 ? (item.approved / item.totalStudents) * 100 : 0} 
                                  className="w-16 h-2"
                                />
                                <span className="text-sm text-muted-foreground">
                                  {item.totalStudents > 0 
                                    ? Math.round((item.approved / item.totalStudents) * 100) 
                                    : 0}%
                                </span>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>Clique em "Atualizar" para ver a previsão de transição.</p>
                    </div>
                  )}
                </div>

                {/* Transition Result */}
                {transitionResult && (
                  <div className="p-4 rounded-lg bg-muted/50 border border-border space-y-3">
                    <h4 className="font-semibold text-foreground">Resultado da Transição</h4>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-success">{transitionResult.promoted}</p>
                        <p className="text-sm text-muted-foreground">Promovidos</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-warning">{transitionResult.retained}</p>
                        <p className="text-sm text-muted-foreground">Retidos</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-primary">{transitionResult.graduated}</p>
                        <p className="text-sm text-muted-foreground">Graduados</p>
                      </div>
                    </div>
                    {transitionResult.errors.length > 0 && (
                      <div className="mt-4 p-3 rounded bg-destructive/10 border border-destructive/20">
                        <p className="text-sm font-medium text-destructive mb-2">Erros ({transitionResult.errors.length}):</p>
                        <ul className="text-xs text-destructive/80 space-y-1">
                          {transitionResult.errors.slice(0, 5).map((err: string, i: number) => (
                            <li key={i}>• {err}</li>
                          ))}
                          {transitionResult.errors.length > 5 && (
                            <li>• ... e mais {transitionResult.errors.length - 5} erros</li>
                          )}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {/* Execute Transition Button */}
                <div className="flex items-center justify-between pt-4 border-t border-border">
                  <div>
                    <p className="font-medium text-foreground">Executar Transição</p>
                    <p className="text-sm text-muted-foreground">
                      Move os alunos para as novas turmas do ano letivo {currentAcademicYear + 1}/{currentAcademicYear + 2}
                    </p>
                  </div>
                  <Button
                    onClick={handleAcademicYearTransition}
                    disabled={isTransitioning}
                    className="btn-primary"
                  >
                    {isTransitioning ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        A executar transição...
                      </>
                    ) : (
                      <>
                        <ArrowRightLeft className="w-4 h-4 mr-2" />
                        Executar Transição de Ano
                      </>
                    )}
                  </Button>
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
                {
                  label: 'Alertas de pagamentos pendentes',
                  description: 'Receba alertas quando houver pagamentos atrasados',
                },
                {
                  label: 'Novos registos',
                  description: 'Notificações de novos estudantes ou professores',
                },
                {
                  label: 'Alterações de notas',
                  description: 'Solicitações de alteração de notas pelos professores',
                },
                {
                  label: 'Resumo diário',
                  description: 'Receba um resumo das actividades do dia',
                },
              ].map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 rounded-lg border border-border"
                >
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
