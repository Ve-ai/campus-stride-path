import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Plus,
  GraduationCap,
  Clock,
  MoreHorizontal,
  Award,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useTeachers, useCourses, useCreateTeacher } from '@/hooks/useDatabase';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export function Teachers() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTeacher, setSelectedTeacher] = useState<any | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState<'pessoais' | 'profissionais' | 'formacao' | 'salario'>('pessoais');
  const [newTeacher, setNewTeacher] = useState({
    full_name: '',
    phone: '',
    bi_number: '',
    birth_date: '',
    birth_place: '',
    employee_number: '',
    degree: '',
    degree_area: '',
    hire_date: '',
    gross_salary: '',
    functions: '',
    username: '',
  });

  const { data: teachers, isLoading, error } = useTeachers();
  const { data: courses } = useCourses();
  const queryClient = useQueryClient();

  // Create teacher mutation with profile creation
  const createTeacherMutation = useMutation({
    mutationFn: async (teacherData: typeof newTeacher) => {
      // First, create the profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .insert({
          user_id: crypto.randomUUID(), // Generate a placeholder user_id
          full_name: teacherData.full_name,
          phone: teacherData.phone,
          bi_number: teacherData.bi_number,
          birth_date: teacherData.birth_date || null,
          birth_place: teacherData.birth_place,
        })
        .select()
        .single();

      if (profileError) throw profileError;

      // Then create the teacher
      const { data: teacher, error: teacherError } = await supabase
        .from('teachers')
        .insert({
          profile_id: profileData.id,
          employee_number: teacherData.employee_number,
          degree: teacherData.degree || null,
          degree_area: teacherData.degree_area || null,
          hire_date: teacherData.hire_date || null,
          gross_salary: teacherData.gross_salary ? parseFloat(teacherData.gross_salary) : 0,
          functions: teacherData.functions ? teacherData.functions.split(',').map(f => f.trim()) : [],
        })
        .select()
        .single();

      if (teacherError) throw teacherError;
      return teacher;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
      queryClient.invalidateQueries({ queryKey: ['statistics'] });
      toast.success('Professor adicionado com sucesso!');
      setIsAddDialogOpen(false);
      setCurrentStep('pessoais');
      setNewTeacher({
        full_name: '',
        phone: '',
        bi_number: '',
        birth_date: '',
        birth_place: '',
        employee_number: '',
        degree: '',
        degree_area: '',
        hire_date: '',
        gross_salary: '',
        functions: '',
        username: '',
      });
    },
    onError: (error: any) => {
      toast.error('Erro ao adicionar professor: ' + error.message);
    },
  });

  const filteredTeachers = teachers?.filter(
    (teacher) =>
      teacher.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      teacher.employee_number?.includes(searchTerm)
  ) || [];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-AO', {
      style: 'currency',
      currency: 'AOA',
      minimumFractionDigits: 0,
    }).format(value);
  };

  // Calculate period stats
  const morningTeachers = filteredTeachers.filter(t => 
    t.teacher_class_assignments?.some((a: any) => a.class?.period === 'Manhã')
  ).length;
  
  const afternoonTeachers = filteredTeachers.filter(t => 
    t.teacher_class_assignments?.some((a: any) => a.class?.period === 'Tarde')
  ).length;

  const coordinators = filteredTeachers.filter(t => 
    t.functions?.some((f: string) => f.toLowerCase().includes('coordenador'))
  ).length;

  const generateEmployeeNumber = () => {
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `PROF-${year}-${random}`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-destructive">Erro ao carregar professores</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Professores</h1>
          <p className="text-muted-foreground">Gestão do corpo docente</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="btn-primary" onClick={() => {
              setNewTeacher({ ...newTeacher, employee_number: generateEmployeeNumber() });
            }}>
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Professor
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Adicionar Novo Professor</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>
                  Passo {['pessoais', 'profissionais', 'formacao', 'salario'].indexOf(currentStep) + 1} de 4
                </span>
                <span className="font-medium capitalize">
                  {currentStep === 'pessoais' && 'Dados pessoais'}
                  {currentStep === 'profissionais' && 'Dados profissionais'}
                  {currentStep === 'formacao' && 'Formação'}
                  {currentStep === 'salario' && 'Salário'}
                </span>
              </div>

              {currentStep === 'pessoais' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2 space-y-2">
                    <Label>Nome Completo *</Label>
                    <Input
                      placeholder="Nome completo do professor"
                      value={newTeacher.full_name}
                      onChange={(e) => setNewTeacher({ ...newTeacher, full_name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Data de Nascimento</Label>
                    <Input
                      type="date"
                      value={newTeacher.birth_date}
                      onChange={(e) => setNewTeacher({ ...newTeacher, birth_date: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Local de Nascimento</Label>
                    <Input
                      placeholder="Ex: Luanda"
                      value={newTeacher.birth_place}
                      onChange={(e) => setNewTeacher({ ...newTeacher, birth_place: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Número do BI</Label>
                    <Input
                      placeholder="Ex: 000123456LA789"
                      value={newTeacher.bi_number}
                      onChange={(e) => setNewTeacher({ ...newTeacher, bi_number: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Contacto</Label>
                    <Input
                      placeholder="Ex: 925 654 254"
                      value={newTeacher.phone}
                      onChange={(e) => setNewTeacher({ ...newTeacher, phone: e.target.value })}
                    />
                  </div>
                </div>
              )}

              {currentStep === 'profissionais' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nº de Funcionário *</Label>
                    <Input
                      placeholder="Ex: PROF-2025-001"
                      value={newTeacher.employee_number}
                      onChange={(e) => setNewTeacher({ ...newTeacher, employee_number: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Data de Contratação</Label>
                    <Input
                      type="date"
                      value={newTeacher.hire_date}
                      onChange={(e) => setNewTeacher({ ...newTeacher, hire_date: e.target.value })}
                    />
                  </div>
                  <div className="col-span-2 space-y-2">
                    <Label>Funções Adicionais</Label>
                    <Input
                      placeholder="Ex: Coordenador de Turma, Orientador"
                      value={newTeacher.functions}
                      onChange={(e) => setNewTeacher({ ...newTeacher, functions: e.target.value })}
                    />
                    <p className="text-xs text-muted-foreground">
                      Separe múltiplas funções por vírgula
                    </p>
                  </div>
                </div>
              )}

              {currentStep === 'formacao' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Grau Académico</Label>
                    <Select
                      value={newTeacher.degree}
                      onValueChange={(v) => setNewTeacher({ ...newTeacher, degree: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Licenciatura">Licenciatura</SelectItem>
                        <SelectItem value="Mestrado">Mestrado</SelectItem>
                        <SelectItem value="Doutoramento">Doutoramento</SelectItem>
                        <SelectItem value="Técnico">Técnico</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Área de Formação</Label>
                    <Input
                      placeholder="Ex: Engenharia Informática"
                      value={newTeacher.degree_area}
                      onChange={(e) => setNewTeacher({ ...newTeacher, degree_area: e.target.value })}
                    />
                  </div>
                </div>
              )}

              {currentStep === 'salario' && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Nome de utilizador para acesso</Label>
                    <Input
                      placeholder="Ex: j.silva"
                      value={newTeacher.username}
                      onChange={(e) => setNewTeacher({ ...newTeacher, username: e.target.value })}
                    />
                    <p className="text-xs text-muted-foreground">
                      Este nome de utilizador será associado às credenciais do professor.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label>Salário Bruto (AOA)</Label>
                    <Input
                      type="number"
                      placeholder="Ex: 85000"
                      value={newTeacher.gross_salary}
                      onChange={(e) => setNewTeacher({ ...newTeacher, gross_salary: e.target.value })}
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-between gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    if (currentStep === 'pessoais') {
                      setIsAddDialogOpen(false);
                    } else {
                      const order: Array<'pessoais' | 'profissionais' | 'formacao' | 'salario'> = ['pessoais', 'profissionais', 'formacao', 'salario'];
                      const idx = order.indexOf(currentStep);
                      setCurrentStep(order[Math.max(0, idx - 1)]);
                    }
                  }}
                >
                  {currentStep === 'pessoais' ? 'Cancelar' : 'Anterior'}
                </Button>
                <Button
                  className="btn-primary"
                  onClick={() => {
                    const order: Array<'pessoais' | 'profissionais' | 'formacao' | 'salario'> = ['pessoais', 'profissionais', 'formacao', 'salario'];
                    const idx = order.indexOf(currentStep);
                    const isLast = idx === order.length - 1;

                    if (!isLast) {
                      setCurrentStep(order[idx + 1]);
                    } else {
                      createTeacherMutation.mutate(newTeacher);
                    }
                  }}
                  disabled={
                    createTeacherMutation.isPending ||
                    !newTeacher.full_name ||
                    !newTeacher.employee_number
                  }
                >
                  {createTeacherMutation.isPending
                    ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        A guardar...
                      </>
                    )
                    : currentStep === 'salario'
                      ? 'Concluir cadastro'
                      : 'Próximo'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="stat-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Professores</p>
                <p className="text-2xl font-bold">{filteredTeachers.length}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="stat-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Período Manhã</p>
                <p className="text-2xl font-bold">{morningTeachers}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-warning" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="stat-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Período Tarde</p>
                <p className="text-2xl font-bold">{afternoonTeachers}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-accent" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="stat-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Coordenadores</p>
                <p className="text-2xl font-bold">{coordinators}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                <Award className="w-5 h-5 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input
          placeholder="Pesquisar por nome ou número de funcionário..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 input-field"
        />
      </div>

      {/* Teachers Table */}
      <Card className="card-elevated">
        <CardHeader>
          <CardTitle>Lista de Professores</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="table-header">
                <TableHead>Nº</TableHead>
                <TableHead>Nº Funcionário</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Grau</TableHead>
                <TableHead>Disciplina(s)</TableHead>
                <TableHead>Salário Bruto</TableHead>
                <TableHead>Funções</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTeachers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    Nenhum professor encontrado
                  </TableCell>
                </TableRow>
              ) : (
                filteredTeachers.map((teacher, index) => (
                  <TableRow key={teacher.id} className="table-row-hover cursor-pointer" onClick={() => setSelectedTeacher(teacher)}>
                    <TableCell className="font-medium">{String(index + 1).padStart(2, '0')}</TableCell>
                    <TableCell>{teacher.employee_number}</TableCell>
                    <TableCell className="font-medium">{teacher.profiles?.full_name || '-'}</TableCell>
                    <TableCell>
                      {teacher.degree && (
                        <Badge variant="outline" className="text-xs">
                          {teacher.degree}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {teacher.teacher_class_assignments?.slice(0, 2).map((assignment: any, i: number) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {assignment.subject?.name}
                          </Badge>
                        ))}
                        {(teacher.teacher_class_assignments?.length || 0) > 2 && (
                          <Badge variant="secondary" className="text-xs">
                            +{teacher.teacher_class_assignments.length - 2}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{formatCurrency(teacher.gross_salary || 0)}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {teacher.functions && teacher.functions.length > 0 ? (
                          teacher.functions.slice(0, 2).map((f: string, i: number) => (
                            <Badge key={i} variant="secondary" className="text-xs">
                              {f}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}>
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation();
                            setSelectedTeacher(teacher);
                          }}>Ver Perfil</DropdownMenuItem>
                          <DropdownMenuItem>Editar Dados</DropdownMenuItem>
                          <DropdownMenuItem>Ver Turmas</DropdownMenuItem>
                          <DropdownMenuItem>Avaliar Desempenho</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Teacher Details Dialog */}
      <Dialog open={!!selectedTeacher} onOpenChange={() => setSelectedTeacher(null)}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Perfil do Professor</DialogTitle>
          </DialogHeader>
          {selectedTeacher && (
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-20 h-20 rounded-xl bg-primary/10 flex items-center justify-center">
                  <GraduationCap className="w-10 h-10 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold">{selectedTeacher.profiles?.full_name}</h3>
                  <p className="text-muted-foreground">{selectedTeacher.employee_number}</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedTeacher.degree && (
                      <Badge variant="outline">{selectedTeacher.degree}</Badge>
                    )}
                    {selectedTeacher.functions?.map((f: string, i: number) => (
                      <Badge key={i} variant="secondary">{f}</Badge>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Área de Formação</p>
                  <p className="font-medium">{selectedTeacher.degree_area || '-'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Salário Bruto</p>
                  <p className="font-medium">{formatCurrency(selectedTeacher.gross_salary || 0)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Contacto</p>
                  <p className="font-medium">{selectedTeacher.profiles?.phone || '-'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">BI</p>
                  <p className="font-medium">{selectedTeacher.profiles?.bi_number || '-'}</p>
                </div>
              </div>

              {selectedTeacher.teacher_class_assignments?.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Turmas Atribuídas</h4>
                  <div className="space-y-2">
                    {selectedTeacher.teacher_class_assignments.map((assignment: any, i: number) => (
                      <div key={i} className="flex items-center justify-between p-2 bg-muted rounded-lg">
                        <span>{assignment.subject?.name}</span>
                        <Badge variant="outline">
                          {assignment.class?.course?.name} - {assignment.class?.grade_level}ª {assignment.class?.section}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}