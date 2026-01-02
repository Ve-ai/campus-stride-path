import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  GraduationCap,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Award,
  TrendingUp,
  TrendingDown,
  Users,
  BookOpen,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';
import { useTeachers, useGrades, useStudents, useClasses, useUpdateTeacher, useUpdateTeacherAssignmentSchedule } from '@/hooks/useDatabase';
import { toast } from 'sonner';

export function TeacherDetails() {
  const { teacherId } = useParams();
  const navigate = useNavigate();

  const { data: teachers } = useTeachers();
  const { data: grades } = useGrades();
  const { data: students } = useStudents();
  const { data: classes } = useClasses();

  const teacher = teachers?.find(t => t.id === teacherId);

  const updateTeacher = useUpdateTeacher();
  const [formValues, setFormValues] = useState({
    full_name: '',
    employee_number: '',
    degree: '',
    degree_area: '',
    hire_date: '',
    gross_salary: '',
    functions: '',
    is_active: true,
  });

  useEffect(() => {
    if (teacher) {
      setFormValues({
        full_name: teacher.full_name || teacher.profiles?.full_name || '',
        employee_number: teacher.employee_number || '',
        degree: teacher.degree || '',
        degree_area: teacher.degree_area || '',
        hire_date: teacher.hire_date || '',
        gross_salary: teacher.gross_salary ? String(teacher.gross_salary) : '',
        functions: teacher.functions ? teacher.functions.join(', ') : '',
        is_active: teacher.is_active ?? true,
      });
    }
  }, [teacher]);

  if (!teacher) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Professor não encontrado</p>
      </div>
    );
  }

  // Get teacher's class assignments
  const teacherAssignments = teacher.teacher_class_assignments || [];
  const assignedClassIds = teacherAssignments.map((a: any) => a.class?.id).filter(Boolean);
  const assignedSubjectIds = teacherAssignments.map((a: any) => a.subject?.id).filter(Boolean);

  // Get grades for teacher's subjects
  const teacherGrades = grades?.filter(g => 
    assignedSubjectIds.includes(g.subject_id) && assignedClassIds.includes(g.class_id)
  ) || [];

  // Calculate average performance per class
  const classPerformance = assignedClassIds.map((classId: string) => {
    const classGrades = teacherGrades.filter(g => g.class_id === classId);
    const classData = classes?.find(c => c.id === classId);
    const avgMt = classGrades.length > 0 
      ? classGrades.reduce((sum, g) => sum + (g.mt || 0), 0) / classGrades.length 
      : 0;
    
    return {
      class: `${classData?.grade_level}ª ${classData?.section}`,
      course: classData?.course?.name || '',
      average: Math.round(avgMt * 10) / 10,
      students: new Set(classGrades.map(g => g.student_id)).size,
    };
  });

  // Get all students with grades from this teacher
  const studentPerformance = teacherGrades.reduce((acc: any[], grade) => {
    const existingStudent = acc.find(s => s.id === grade.student_id);
    if (existingStudent) {
      existingStudent.totalMt += grade.mt || 0;
      existingStudent.count += 1;
    } else {
      const student = students?.find(s => s.id === grade.student_id);
      const studentClass = classes?.find(c => c.id === student?.class_id);
      acc.push({
        id: grade.student_id,
        name: student?.full_name || '-',
        enrollment: student?.enrollment_number || '-',
        course: studentClass?.course?.name || '-',
        class: `${studentClass?.grade_level || '-'}ª`,
        section: studentClass?.section || '-',
        totalMt: grade.mt || 0,
        count: 1,
      });
    }
    return acc;
  }, []);

  // Calculate averages and sort
  const studentsWithAverage = studentPerformance.map(s => ({
    ...s,
    average: Math.round((s.totalMt / s.count) * 10) / 10,
  }));

  const topStudents = [...studentsWithAverage]
    .sort((a, b) => b.average - a.average)
    .slice(0, 10);

  const bottomStudents = [...studentsWithAverage]
    .sort((a, b) => a.average - b.average)
    .slice(0, 10);

  // Mock monthly productivity data
  const productivityData = [
    { month: 'Set', approved: 85, average: 14.2 },
    { month: 'Out', approved: 82, average: 13.8 },
    { month: 'Nov', approved: 88, average: 14.5 },
    { month: 'Dez', approved: 90, average: 15.1 },
  ];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-AO', {
      style: 'currency',
      currency: 'AOA',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const getInitials = (name: string) => {
    return name
      ?.split(' ')
      .map(n => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'P';
  };

  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string | undefined>(
    teacherAssignments[0]?.id,
  );
  const [schedule, setSchedule] = useState<any>({});

  const updateAssignmentSchedule = useUpdateTeacherAssignmentSchedule();

  useEffect(() => {
    const firstId = teacherAssignments[0]?.id;
    setSelectedAssignmentId(firstId);
  }, [teacherAssignments.length]);

  const selectedAssignment = teacherAssignments.find(
    (a: any) => a.id === selectedAssignmentId,
  );

  useEffect(() => {
    if (selectedAssignment) {
      setSchedule(selectedAssignment.schedule || {});
    }
  }, [selectedAssignment?.id]);

  const days = ['Segunda-Feira', 'Terça-Feira', 'Quarta-Feira', 'Quinta-Feira', 'Sexta-Feira'];
  const times = ['07:30', '08:15', '09:00', '09:45', '10:30', '11:15'];

  const toggleSlot = (day: string, time: string) => {
    setSchedule((prev: any) => {
      const daySchedule = prev[day] || {};
      const isAssigned = !!daySchedule[time];
      return {
        ...prev,
        [day]: {
          ...daySchedule,
          [time]: !isAssigned,
        },
      };
    });
  };

  const handleSaveSchedule = () => {
    if (!selectedAssignment) return;
    updateAssignmentSchedule.mutate(
      { id: selectedAssignment.id, schedule },
      {
        onSuccess: () => toast.success('Horário atualizado com sucesso!'),
        onError: (error: any) => toast.error('Erro ao atualizar horário: ' + error.message),
      },
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-foreground">Perfil do Professor</h1>
          <p className="text-muted-foreground">Detalhes, desempenho e horário</p>
        </div>
      </div>

      <Tabs defaultValue="perfil" className="space-y-6">
        <TabsList>
          <TabsTrigger value="perfil">Perfil</TabsTrigger>
          <TabsTrigger value="desempenho">Desempenho</TabsTrigger>
          <TabsTrigger value="horario">Horário</TabsTrigger>
        </TabsList>

        {/* PERFIL */}
        <TabsContent value="perfil" className="space-y-6">
          {/* Profile Card */}
          <Card className="card-elevated">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex items-start gap-4">
                  <Avatar className="w-24 h-24">
                    <AvatarImage src={teacher.profiles?.avatar_url || undefined} />
                    <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                      {getInitials(formValues.full_name || teacher.profiles?.full_name || '')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h2 className="text-2xl font-bold">{formValues.full_name}</h2>
                    <p className="text-muted-foreground">Nº Funcionário: {formValues.employee_number}</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {teacher.functions?.map((f: string, i: number) => (
                        <Badge key={i} variant="secondary">
                          {f}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="w-4 h-4" />
                      <span>{teacher.profiles?.phone || 'Não informado'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="w-4 h-4" />
                      <span>{teacher.profiles?.birth_place || 'Não informado'}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <GraduationCap className="w-4 h-4" />
                      <span>
                        {formValues.degree || 'Grau não informado'}
                        {formValues.degree_area && ` em ${formValues.degree_area}`}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      <span>
                        Desde {formValues.hire_date ? new Date(formValues.hire_date).getFullYear() : 'Não informado'}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Salário Bruto</p>
                    <p className="text-xl font-bold text-primary">
                      {formValues.gross_salary
                        ? formatCurrency(Number(formValues.gross_salary))
                        : formatCurrency(teacher.gross_salary || 0)}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Edit Form */}
          <Card className="card-elevated">
            <CardHeader>
              <CardTitle>Dados do Professor</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nome completo</Label>
                  <Input
                    value={formValues.full_name}
                    onChange={(e) => setFormValues((prev) => ({ ...prev, full_name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Nº de funcionário</Label>
                  <Input value={formValues.employee_number} disabled />
                </div>
                <div className="space-y-2">
                  <Label>Grau académico</Label>
                  <Input
                    value={formValues.degree}
                    onChange={(e) => setFormValues((prev) => ({ ...prev, degree: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Área de formação</Label>
                  <Input
                    value={formValues.degree_area}
                    onChange={(e) => setFormValues((prev) => ({ ...prev, degree_area: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Data de contratação</Label>
                  <Input
                    type="date"
                    value={formValues.hire_date}
                    onChange={(e) => setFormValues((prev) => ({ ...prev, hire_date: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Salário bruto (AOA)</Label>
                  <Input
                    type="number"
                    value={formValues.gross_salary}
                    onChange={(e) => setFormValues((prev) => ({ ...prev, gross_salary: e.target.value }))}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Funções</Label>
                  <Input
                    placeholder="Ex: Coordenador de Turma, Orientador"
                    value={formValues.functions}
                    onChange={(e) => setFormValues((prev) => ({ ...prev, functions: e.target.value }))}
                  />
                  <p className="text-xs text-muted-foreground">Separe múltiplas funções por vírgula.</p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-3">
                  <Switch
                    checked={formValues.is_active}
                    onCheckedChange={(checked) =>
                      setFormValues((prev) => ({ ...prev, is_active: checked }))
                    }
                  />
                  <span className="text-sm">
                    {formValues.is_active ? 'Professor ativo' : 'Professor inativo'}
                  </span>
                </div>
                <Button
                  className="btn-primary"
                  disabled={updateTeacher.isPending || !formValues.full_name}
                  onClick={() => {
                    updateTeacher.mutate(
                      {
                        id: teacher.id,
                        full_name: formValues.full_name,
                        degree: formValues.degree || null,
                        degree_area: formValues.degree_area || null,
                        hire_date: formValues.hire_date || null,
                        gross_salary: formValues.gross_salary
                          ? Number(formValues.gross_salary)
                          : null,
                        functions: formValues.functions
                          ? formValues.functions
                              .split(',')
                              .map((f) => f.trim())
                              .filter(Boolean)
                          : [],
                        is_active: formValues.is_active,
                      },
                      {
                        onSuccess: () => {
                          toast.success('Dados do professor atualizados com sucesso!');
                        },
                        onError: (error: any) => {
                          toast.error('Erro ao atualizar professor: ' + error.message);
                        },
                      },
                    );
                  }}
                >
                  {updateTeacher.isPending ? 'A guardar...' : 'Guardar alterações'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* DESEMPENHO */}
        <TabsContent value="desempenho" className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="stat-card">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Turmas</p>
                    <p className="text-2xl font-bold">{assignedClassIds.length}</p>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Users className="w-5 h-5 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="stat-card">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Disciplinas</p>
                    <p className="text-2xl font-bold">{new Set(assignedSubjectIds).size}</p>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-accent" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="stat-card">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Alunos</p>
                    <p className="text-2xl font-bold">{studentsWithAverage.length}</p>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                    <GraduationCap className="w-5 h-5 text-success" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="stat-card">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Média Geral</p>
                    <p className="text-2xl font-bold">
                      {studentsWithAverage.length > 0
                        ? (
                            studentsWithAverage.reduce((s, st) => s + st.average, 0) /
                            studentsWithAverage.length
                          ).toFixed(1)
                        : '-'}
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
                    <Award className="w-5 h-5 text-warning" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="card-elevated">
              <CardHeader>
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  Produtividade por Mês
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={productivityData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="approved"
                        name="% Aprovados"
                        stroke="hsl(142, 76%, 36%)"
                        strokeWidth={2}
                        dot={{ r: 4 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="average"
                        name="Média"
                        stroke="hsl(var(--primary))"
                        strokeWidth={2}
                        dot={{ r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="card-elevated">
              <CardHeader>
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <Award className="w-5 h-5 text-primary" />
                  Aproveitamento por Turma
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={classPerformance}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="class" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <YAxis
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={12}
                        domain={[0, 20]}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                      />
                      <Bar
                        dataKey="average"
                        name="Média"
                        fill="hsl(var(--primary))"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Top & Bottom Students */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="card-elevated">
              <CardHeader>
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-success" />
                  Top 10 Melhores Estudantes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="table-header">
                      <TableHead>Nº</TableHead>
                      <TableHead>Matrícula</TableHead>
                      <TableHead>Nome</TableHead>
                      <TableHead>Curso</TableHead>
                      <TableHead>Classe</TableHead>
                      <TableHead>Turma</TableHead>
                      <TableHead className="text-right">Média</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topStudents.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={7}
                          className="text-center py-8 text-muted-foreground"
                        >
                          Sem dados disponíveis
                        </TableCell>
                      </TableRow>
                    ) : (
                      topStudents.map((student, index) => (
                        <TableRow key={student.id} className="table-row-hover">
                          <TableCell>{index + 1}</TableCell>
                          <TableCell className="font-mono">{student.enrollment}</TableCell>
                          <TableCell className="font-medium">{student.name}</TableCell>
                          <TableCell>{student.course}</TableCell>
                          <TableCell>{student.class}</TableCell>
                          <TableCell>{student.section}</TableCell>
                          <TableCell className="text-right">
                            <Badge className="badge-success">{student.average}</Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card className="card-elevated">
              <CardHeader>
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <TrendingDown className="w-5 h-5 text-destructive" />
                  Top 10 Piores Estudantes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="table-header">
                      <TableHead>Nº</TableHead>
                      <TableHead>Matrícula</TableHead>
                      <TableHead>Nome</TableHead>
                      <TableHead>Curso</TableHead>
                      <TableHead>Classe</TableHead>
                      <TableHead>Turma</TableHead>
                      <TableHead className="text-right">Média</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bottomStudents.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={7}
                          className="text-center py-8 text-muted-foreground"
                        >
                          Sem dados disponíveis
                        </TableCell>
                      </TableRow>
                    ) : (
                      bottomStudents.map((student, index) => (
                        <TableRow key={student.id} className="table-row-hover">
                          <TableCell>{index + 1}</TableCell>
                          <TableCell className="font-mono">{student.enrollment}</TableCell>
                          <TableCell className="font-medium">{student.name}</TableCell>
                          <TableCell>{student.course}</TableCell>
                          <TableCell>{student.class}</TableCell>
                          <TableCell>{student.section}</TableCell>
                          <TableCell className="text-right">
                            <Badge variant="destructive">{student.average}</Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* HORÁRIO */}
        <TabsContent value="horario" className="space-y-6">
          <Card className="card-elevated">
            <CardHeader>
              <CardTitle>Horário do Professor</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {teacherAssignments.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  Este professor ainda não possui turmas/disciplinas atribuídas.
                </p>
              ) : (
                <>
                  <div className="flex flex-col md:flex-row md:items-center gap-4 justify-between">
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Disciplina</p>
                      <select
                        className="border rounded-md px-3 py-2 bg-background text-sm"
                        value={selectedAssignmentId}
                        onChange={(e) => setSelectedAssignmentId(e.target.value)}
                      >
                        {teacherAssignments.map((a: any) => (
                          <option key={a.id} value={a.id}>
                            {a.subject?.name} - {a.class?.grade_level}ª {a.class?.section} ({
                              a.class?.course?.name
                            })
                          </option>
                        ))}
                      </select>
                    </div>
                    {selectedAssignment && (
                      <div className="text-sm text-muted-foreground">
                        Turma selecionada:{' '}
                        <span className="font-medium text-foreground">
                          {selectedAssignment.class?.grade_level}ª {selectedAssignment.class?.section} -{' '}
                          {selectedAssignment.subject?.name}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="overflow-x-auto">
                    <Table className="min-w-[700px]">
                      <TableHeader>
                        <TableRow>
                          <TableHead>Horas</TableHead>
                          {days.map((day) => (
                            <TableHead key={day} className="text-center">
                              {day}
                            </TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {times.map((time) => (
                          <TableRow key={time}>
                            <TableCell className="font-mono text-xs md:text-sm w-20">
                              {time}
                            </TableCell>
                            {days.map((day) => {
                              const isAssigned = schedule?.[day]?.[time];
                              return (
                                <TableCell key={day} className="p-0">
                                  <button
                                    type="button"
                                    onClick={() => toggleSlot(day, time)}
                                    className={`w-full h-12 text-xs md:text-sm border-l border-t last:border-r focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                                      isAssigned
                                        ? 'bg-primary/10 text-primary font-medium'
                                        : 'hover:bg-muted'
                                    }`}
                                  >
                                    {isAssigned && selectedAssignment
                                      ? `${selectedAssignment.class?.grade_level}ª ${selectedAssignment.class?.section}`
                                      : ''}
                                  </button>
                                </TableCell>
                              );
                            })}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  <div className="flex justify-end pt-4">
                    <Button
                      className="btn-primary"
                      disabled={updateAssignmentSchedule.isPending || !selectedAssignment}
                      onClick={handleSaveSchedule}
                    >
                      {updateAssignmentSchedule.isPending
                        ? 'A guardar horário...'
                        : 'Guardar horário'}
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
