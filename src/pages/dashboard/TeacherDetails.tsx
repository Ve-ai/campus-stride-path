import React from 'react';
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
import { useTeachers, useGrades, useStudents, useClasses } from '@/hooks/useDatabase';

export function TeacherDetails() {
  const { teacherId } = useParams();
  const navigate = useNavigate();

  const { data: teachers } = useTeachers();
  const { data: grades } = useGrades();
  const { data: students } = useStudents();
  const { data: classes } = useClasses();

  const teacher = teachers?.find(t => t.id === teacherId);

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

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-foreground">Perfil do Professor</h1>
          <p className="text-muted-foreground">Detalhes e produtividade</p>
        </div>
      </div>

      {/* Profile Card */}
      <Card className="card-elevated">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex items-start gap-4">
              <Avatar className="w-24 h-24">
                <AvatarImage src={teacher.profiles?.avatar_url || undefined} />
                <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                  {getInitials(teacher.profiles?.full_name || '')}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-2xl font-bold">{teacher.profiles?.full_name}</h2>
                <p className="text-muted-foreground">Nº Funcionário: {teacher.employee_number}</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {teacher.functions?.map((f: string, i: number) => (
                    <Badge key={i} variant="secondary">{f}</Badge>
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
                  <span>{teacher.degree} em {teacher.degree_area || 'Não informado'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  <span>Desde {teacher.hire_date ? new Date(teacher.hire_date).getFullYear() : 'Não informado'}</span>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Salário Bruto</p>
                <p className="text-xl font-bold text-primary">
                  {formatCurrency(teacher.gross_salary || 0)}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

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
                    ? (studentsWithAverage.reduce((s, st) => s + st.average, 0) / studentsWithAverage.length).toFixed(1)
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
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} domain={[0, 20]} />
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
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
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
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
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
    </div>
  );
}
