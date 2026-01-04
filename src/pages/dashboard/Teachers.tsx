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
import { generateDefaultTeacherPassword } from '@/types/auth';
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
import { useTeachers, useCourses, useCreateTeacher, useUpdateTeacher, useClasses, useSubjects, useCreateTeacherAssignments } from '@/hooks/useDatabase';
import { toast } from 'sonner';

export function Teachers() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [disciplineFilter, setDisciplineFilter] = useState<string>('todas');
  const [statusFilter, setStatusFilter] = useState<'todos' | 'ativos' | 'inativos'>('todos');
  const [selectedTeacher, setSelectedTeacher] = useState<any | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState<'pessoais' | 'profissionais' | 'formacao' | 'turmas' | 'salario'>('pessoais');
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
    is_active: true,
  });
  const [assignments, setAssignments] = useState<{
    courseId?: string;
    classId?: string;
    subjectIds: string[];
    periods: string[];
  }[]>([]);

  const { data: teachers, isLoading, error } = useTeachers();
  const { data: courses } = useCourses();
  const { data: classes } = useClasses();
  const { data: subjects } = useSubjects();

  const createTeacherMutation = useCreateTeacher();
  const updateTeacherMutation = useUpdateTeacher();
  const createTeacherAssignmentsMutation = useCreateTeacherAssignments();

  const filteredTeachers =
    teachers
      ?.filter((teacher) => {
        const matchesSearch =
          (teacher.full_name || teacher.profiles?.full_name || '')
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          teacher.employee_number?.includes(searchTerm);

        const matchesDiscipline =
          disciplineFilter === 'todas' ||
          teacher.teacher_class_assignments?.some(
            (a: any) => a.subject?.id === disciplineFilter
          );

        const matchesStatus =
          statusFilter === 'todos' ||
          (statusFilter === 'ativos' && teacher.is_active) ||
          (statusFilter === 'inativos' && !teacher.is_active);

        return matchesSearch && matchesDiscipline && matchesStatus;
      }) || [];

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

  const getDefaultPassword = () => {
    if (!newTeacher.full_name || !newTeacher.birth_date) return '';
    const birthYear = new Date(newTeacher.birth_date).getFullYear();
    if (!birthYear || Number.isNaN(birthYear)) return '';
    return generateDefaultTeacherPassword(newTeacher.full_name, birthYear);
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
                  Passo {['pessoais', 'profissionais', 'formacao', 'turmas', 'salario'].indexOf(currentStep) + 1} de 5
                </span>
                <span className="font-medium capitalize">
                  {currentStep === 'pessoais' && 'Dados pessoais'}
                  {currentStep === 'profissionais' && 'Dados profissionais'}
                  {currentStep === 'formacao' && 'Formação'}
                  {currentStep === 'turmas' && 'Turmas e disciplinas'}
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
                    <Label>Número do BI (será o login)</Label>
                    <Input
                      placeholder="Ex: 000123456LA789"
                      value={newTeacher.bi_number}
                      onChange={(e) => setNewTeacher({ ...newTeacher, bi_number: e.target.value, username: e.target.value })}
                    />
                    <p className="text-xs text-muted-foreground">
                      Este número será utilizado como nome de utilizador (login) do professor.
                    </p>
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
                  <div className="space-y-2">
                    <Label>Estado</Label>
                    <div className="flex items-center gap-3">
                      <Button
                        type="button"
                        variant={newTeacher.is_active ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setNewTeacher({ ...newTeacher, is_active: true })}
                      >
                        Ativo
                      </Button>
                      <Button
                        type="button"
                        variant={!newTeacher.is_active ? 'destructive' : 'outline'}
                        size="sm"
                        onClick={() => setNewTeacher({ ...newTeacher, is_active: false })}
                      >
                        Inativo
                      </Button>
                    </div>
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

              {currentStep === 'turmas' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      Adicione as turmas, disciplinas e períodos em que o professor irá lecionar.
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setAssignments((prev) => [...prev, { courseId: undefined, classId: undefined, subjectIds: [], periods: [] }])
                      }
                    >
                      <Plus className="w-4 h-4 mr-1" /> Adicionar linha
                    </Button>
                  </div>

                  {assignments.length === 0 && (
                    <p className="text-xs text-muted-foreground">
                      Nenhuma turma adicionada ainda. Este passo é opcional e pode ser editado depois.
                    </p>
                  )}

                  <div className="space-y-3">
                    {assignments.map((a, index) => {
                      const classesForCourse = a.courseId
                        ? (classes || []).filter((cls: any) => cls.course_id === a.courseId)
                        : [];

                      return (
                        <div
                          key={index}
                          className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end border rounded-lg p-3"
                        >
                          <div className="space-y-1">
                            <Label className="text-xs">Curso</Label>
                            <Select
                              value={a.courseId}
                              onValueChange={(value) => {
                                setAssignments((prev) => {
                                  const copy = [...prev];
                                  copy[index] = { courseId: value, classId: undefined, subjectIds: [], periods: [] };
                                  return copy;
                                });
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione o curso" />
                              </SelectTrigger>
                              <SelectContent>
                                {(courses || []).map((course: any) => (
                                  <SelectItem key={course.id} value={course.id}>
                                    {course.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-1">
                            <Label className="text-xs">Classe</Label>
                            <Select
                              value={a.classId}
                              onValueChange={(value) => {
                                setAssignments((prev) => {
                                  const copy = [...prev];
                                  copy[index] = { ...copy[index], classId: value, subjectIds: [] };
                                  return copy;
                                });
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione a turma" />
                              </SelectTrigger>
                              <SelectContent>
                                {classesForCourse.map((cls: any) => (
                                  <SelectItem key={cls.id} value={cls.id}>
                                    {cls.grade_level}ª {cls.section} ({cls.period})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-1">
                            <Label className="text-xs">Disciplinas</Label>
                            <div className="flex flex-wrap gap-2 text-xs">
                              {(() => {
                                const selectedClass = classesForCourse.find((cls: any) => cls.id === a.classId);
                                const gradeLevel = selectedClass?.grade_level;
                                const subjectsForClass = (subjects || [])
                                  .filter((subject: any) =>
                                    subject.course_id === a.courseId &&
                                    (!gradeLevel || subject.grade_level === gradeLevel),
                                  );

                                return subjectsForClass.map((subject: any) => {
                                  const checked = a.subjectIds.includes(subject.id);
                                  return (
                                    <button
                                      key={subject.id}
                                      type="button"
                                      disabled={!a.courseId || !a.classId}
                                      onClick={() =>
                                        setAssignments((prev) => {
                                          const copy = [...prev];
                                          const current = copy[index];
                                          copy[index] = {
                                            ...current,
                                            subjectIds: checked
                                              ? current.subjectIds.filter((id) => id !== subject.id)
                                              : [...current.subjectIds, subject.id],
                                          };
                                          return copy;
                                        })
                                      }
                                      className={`px-3 py-1 rounded-full border text-xs ${
                                        checked
                                          ? 'bg-primary text-primary-foreground border-primary'
                                          : 'bg-background text-muted-foreground'
                                      }`}
                                    >
                                      {subject.name}
                                    </button>
                                  );
                                });
                              })()}
                            </div>
                          </div>

                          <div className="space-y-1">
                            <Label className="text-xs">Períodos</Label>
                            <div className="flex gap-2 text-xs">
                              {['Manhã', 'Tarde'].map((period) => {
                                const checked = a.periods.includes(period);
                                return (
                                  <button
                                    key={period}
                                    type="button"
                                    onClick={() =>
                                      setAssignments((prev) => {
                                        const copy = [...prev];
                                        const current = copy[index];
                                        copy[index] = {
                                          ...current,
                                          periods: checked
                                            ? current.periods.filter((p) => p !== period)
                                            : [...current.periods, period],
                                        };
                                        return copy;
                                      })
                                    }
                                    className={`px-3 py-1 rounded-full border text-xs ${
                                      checked
                                        ? 'bg-primary text-primary-foreground border-primary'
                                        : 'bg-background text-muted-foreground'
                                    }`}
                                  >
                                    {period}
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          <div className="flex justify-end mt-2">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() =>
                                setAssignments((prev) => prev.filter((_, i) => i !== index))
                              }
                            >
                              Remover
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {currentStep === 'salario' && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Login do professor (número de BI)</Label>
                    <Input
                      value={newTeacher.bi_number}
                      readOnly
                      placeholder="Preencha o número de BI no primeiro passo"
                    />
                    <p className="text-xs text-muted-foreground">
                      O número de BI será o nome de utilizador para acesso do professor ao sistema.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label>Senha padrão gerada</Label>
                    <Input
                      value={getDefaultPassword() || ''}
                      readOnly
                      placeholder="Será gerada como INICIAIS-ANO (ex: VCM-2001)"
                    />
                    <p className="text-xs text-muted-foreground">
                      A senha padrão é composta pelas iniciais do nome em maiúsculas + ano de nascimento.
                      O professor poderá alterá-la nas configurações de segurança da conta.
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
                      const order: Array<'pessoais' | 'profissionais' | 'formacao' | 'turmas' | 'salario'> = [
                        'pessoais',
                        'profissionais',
                        'formacao',
                        'turmas',
                        'salario',
                      ];
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
                    const order: Array<'pessoais' | 'profissionais' | 'formacao' | 'turmas' | 'salario'> = [
                      'pessoais',
                      'profissionais',
                      'formacao',
                      'turmas',
                      'salario',
                    ];
                    const idx = order.indexOf(currentStep);
                    const isLast = idx === order.length - 1;

                    if (!isLast) {
                      setCurrentStep(order[idx + 1]);
                    } else {
                      createTeacherMutation.mutate(
                        {
                          employee_number: newTeacher.employee_number,
                          full_name: newTeacher.full_name,
                          bi_number: newTeacher.bi_number,
                          birth_date: newTeacher.birth_date || undefined,
                          phone: newTeacher.phone || undefined,
                          degree: newTeacher.degree || undefined,
                          degree_area: newTeacher.degree_area || undefined,
                          hire_date: newTeacher.hire_date || undefined,
                          gross_salary: newTeacher.gross_salary
                            ? parseFloat(newTeacher.gross_salary)
                            : undefined,
                          functions: newTeacher.functions
                            ? newTeacher.functions.split(',').map((f) => f.trim())
                            : [],
                          is_active: newTeacher.is_active,
                        },
                        {
                          onSuccess: async (createdTeacher: any) => {
                            try {
                              if (assignments.length) {
                                const validAssignments = assignments.filter(
                                  (a) => a.classId && a.subjectIds.length && a.periods.length,
                                );

                                if (validAssignments.length) {
                                  await createTeacherAssignmentsMutation.mutateAsync(
                                    validAssignments.flatMap((a) =>
                                      a.subjectIds.map((subjectId) => ({
                                        teacher_id: createdTeacher.id,
                                        class_id: a.classId!,
                                        subject_id: subjectId,
                                        periods: a.periods,
                                      })),
                                    ),
                                  );
                                }
                              }

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
                                is_active: true,
                              });
                              setAssignments([]);
                            } catch (error: any) {
                              toast.error('Erro ao salvar atribuições: ' + error.message);
                            }
                          },
                          onError: (error: any) => {
                            toast.error('Erro ao adicionar professor: ' + error.message);
                          },
                        },
                      );
                    }
                  }}
                  disabled={
                    createTeacherMutation.isPending ||
                    !newTeacher.full_name ||
                    !newTeacher.employee_number
                  }
                >
                  {createTeacherMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      A guardar...
                    </>
                  ) : currentStep === 'salario' ? (
                    'Concluir cadastro'
                  ) : (
                    'Próximo'
                  )}
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

      {/* Pesquisa e filtros */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Pesquisar por nome ou número de funcionário..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 input-field"
          />
        </div>
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Disciplina:</span>
              <Select
                value={disciplineFilter}
                onValueChange={setDisciplineFilter}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas</SelectItem>
                  {Array.from(
                    new Map(
                      (teachers || [])
                        .flatMap((t: any) => t.teacher_class_assignments || [])
                        .filter((a: any) => !!a.subject)
                        .map((a: any) => [a.subject.id, a.subject])
                    ).values()
                  ).map((subject: any) => (
                    <SelectItem key={subject.id} value={subject.id}>
                      {subject.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant={statusFilter === 'todos' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('todos')}
            >
              Todos
            </Button>
            <Button
              type="button"
              variant={statusFilter === 'ativos' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('ativos')}
            >
              Ativos
            </Button>
            <Button
              type="button"
              variant={statusFilter === 'inativos' ? 'destructive' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('inativos')}
            >
              Inativos
            </Button>
          </div>
        </div>
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
                <TableHead>Estado</TableHead>
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
                  <TableRow
                    key={teacher.id}
                    className="table-row-hover cursor-pointer"
                    onClick={() => navigate(`/dashboard/professores/${teacher.id}`)}
                  >
                    <TableCell className="font-medium">{String(index + 1).padStart(2, '0')}</TableCell>
                    <TableCell>{teacher.employee_number}</TableCell>
                    <TableCell className="font-medium">{teacher.full_name || teacher.profiles?.full_name || '-'}</TableCell>
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
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedTeacher(teacher);
                            }}
                          >
                            Ver Perfil Rápido
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/dashboard/professores/${teacher.id}`);
                            }}
                          >
                            Página de Detalhes
                          </DropdownMenuItem>
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
                  <h3 className="text-xl font-semibold">{selectedTeacher.full_name || selectedTeacher.profiles?.full_name}</h3>
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