import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  UserCheck,
  UserX,
  GraduationCap,
  Wallet,
  AlertTriangle,
  FileText,
  ArrowUpRight,
  ArrowDownRight,
  Trophy,
  Medal,
  Download,
  Bell,
  Clock,
  PieChart as PieChartIcon,
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
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from 'recharts';
import { useStatistics, useCourses, useClasses, useStudents, usePayments, useGrades } from '@/hooks/useDatabase';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { toast } from "@/lib/notifications";
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export function Overview() {
  const { user } = useAuth();
  const navigate = useNavigate();

  if (user?.role === 'professor') {
    return <ProfessorOverview />;
  }

  const { data: stats, isLoading } = useStatistics();
  const { data: courses } = useCourses();
  const { data: classes } = useClasses();
  const { data: students } = useStudents();
  const { data: payments } = usePayments();
  const { data: grades } = useGrades();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-AO', {
      style: 'currency',
      currency: 'AOA',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const studentStats = stats?.students || { total: 0, active: 0, dropouts: 0, male: 0, female: 0 };
  const financialStats = stats?.finance || { monthlyRevenue: 0 };

  // Calculate real gender distribution
  const enrollmentByGender = [
    { name: 'Masculino', value: studentStats.male || 0, color: 'hsl(217, 91%, 45%)' },
    { name: 'Feminino', value: studentStats.female || 0, color: 'hsl(340, 82%, 52%)' },
  ];

  // Calculate course data with real statistics
  const courseData = React.useMemo(() => {
    if (!courses || !students) return [];
    
    return courses.map(course => {
      const courseClasses = classes?.filter(c => c.course_id === course.id) || [];
      const classIds = courseClasses.map(c => c.id);
      const courseStudents = students.filter(s => classIds.includes(s.class_id || ''));
      const activeStudents = courseStudents.filter(s => s.status === 'active');
      const dropouts = courseStudents.filter(s => s.status === 'dropout');
      const males = courseStudents.filter(s => s.gender === 'Masculino');
      const females = courseStudents.filter(s => s.gender === 'Feminino');
      
      return {
        id: course.id,
        name: course.name,
        coordinator: course.coordinator?.profiles?.full_name || 'Não atribuído',
        total: courseStudents.length,
        males: males.length,
        females: females.length,
        dropouts: dropouts.length,
        dropoutRate: courseStudents.length > 0 
          ? ((dropouts.length / courseStudents.length) * 100).toFixed(1) 
          : '0.0',
      };
    }).filter(c => c.total > 0);
  }, [courses, students, classes]);

  // Monthly trend data (mock for now, can be enhanced with real data)
  const monthlyTrend = [
    { month: 'Jan', matriculados: studentStats.active || 0, desistentes: 0 },
    { month: 'Fev', matriculados: studentStats.active || 0, desistentes: 0 },
    { month: 'Mar', matriculados: studentStats.active || 0, desistentes: 0 },
    { month: 'Abr', matriculados: studentStats.active || 0, desistentes: Math.floor((studentStats.dropouts || 0) / 3) },
    { month: 'Mai', matriculados: studentStats.active || 0, desistentes: Math.floor((studentStats.dropouts || 0) / 2) },
    { month: 'Jun', matriculados: studentStats.active || 0, desistentes: studentStats.dropouts || 0 },
  ];

  // Calculate payment stats
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  const paidStudentIds = new Set(
    payments?.filter(p => p.month_reference === currentMonth && p.year_reference === currentYear)
      .map(p => p.student_id) || []
  );
  const paidPercentage = studentStats.active > 0 
    ? ((paidStudentIds.size / studentStats.active) * 100).toFixed(1) 
    : '0';

  const totalLateFeesCurrentMonth = (payments || []).reduce((sum, p) => {
    if (!p.payment_date || !p.late_fee) return sum;
    const date = new Date(p.payment_date);
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    if (month === currentMonth && year === currentYear) {
      return sum + Number(p.late_fee || 0);
    }
    return sum;
  }, 0);

  // Alerts based on real data
  const alerts = React.useMemo(() => {
    const alertsList = [];
    
    // Alert for classes with few students
    const lowStudentClasses = classes?.filter(c => {
      const classStudents = students?.filter(s => s.class_id === c.id && s.status === 'active') || [];
      return classStudents.length < 10 && classStudents.length > 0;
    }) || [];
    
    if (lowStudentClasses.length > 0) {
      alertsList.push({
        type: 'warning',
        message: `${lowStudentClasses.length} turma(s) com menos de 10 alunos`,
      });
    }

    // Alert for pending payments
    const pendingStudents = (studentStats.active || 0) - paidStudentIds.size;
    if (pendingStudents > 0) {
      alertsList.push({
        type: 'danger',
        message: `${pendingStudents} estudantes com pagamentos pendentes este mês`,
      });
    }

    // Alert for dropouts
    if (studentStats.dropouts > 0) {
      alertsList.push({
        type: 'info',
        message: `${studentStats.dropouts} estudantes desistiram este ano`,
      });
    }

    return alertsList;
  }, [classes, students, studentStats, paidStudentIds]);

  // Top classes based on real grades data
  const topClasses = React.useMemo(() => {
    if (!classes || !students || !grades) return [];

    // Aggregate MT1 (average of MAC and NPT) per class
    const gradesByClass = new Map<string, number[]>();

    (grades as any[]).forEach((g) => {
      if (!g.class_id) return;
      const mt1 = g.mac != null && g.npt != null ? (g.mac + g.npt) / 2 : null;
      if (mt1 == null) return;

      const arr = gradesByClass.get(g.class_id) ?? [];
      arr.push(mt1);
      gradesByClass.set(g.class_id, arr);
    });

    return (classes as any[])
      .map((cls) => {
        const scores = gradesByClass.get(cls.id) || [];
        if (scores.length === 0) return null; // Sem notas, sem ranking para esta turma

        const average =
          scores.reduce((sum, value) => sum + value, 0) / scores.length;
        const classStudents = (students as any[]).filter(
          (s) => s.class_id === cls.id && s.status === 'active',
        );

        return {
          id: cls.id,
          courseId: cls.course_id,
          course: cls.course?.name || '-',
          grade: `${cls.grade_level}ª`,
          section: cls.section,
          students: classStudents.length,
          average: average.toFixed(1),
        };
      })
      .filter((c): c is {
        id: string;
        courseId: string;
        course: string;
        grade: string;
        section: string;
        students: number;
        average: string;
      } => c !== null)
      .sort((a, b) => parseFloat(b.average) - parseFloat(a.average))
      .slice(0, 5);
  }, [classes, students, grades]);

  // Top students based on real grades data
  const topStudents = React.useMemo(() => {
    if (!grades || !students || !classes) return [];

    type StudentAgg = {
      total: number;
      count: number;
      studentId: string;
      name: string;
      enrollment: string;
    };

    const aggByStudent = new Map<string, StudentAgg>();

    (grades as any[]).forEach((g) => {
      const studentId = g.student?.id as string | undefined;
      if (!studentId) return;

      const mt1 = g.mac != null && g.npt != null ? (g.mac + g.npt) / 2 : null;
      if (mt1 == null) return;

      const current = aggByStudent.get(studentId) || {
        total: 0,
        count: 0,
        studentId,
        name: g.student?.full_name as string,
        enrollment: g.student?.enrollment_number as string,
      };

      current.total += mt1;
      current.count += 1;
      aggByStudent.set(studentId, current);
    });

    const rows = Array.from(aggByStudent.values())
      .map((item) => {
        const studentRecord = (students as any[]).find((s) => s.id === item.studentId);
        if (!studentRecord || studentRecord.status !== 'active' || !studentRecord.class_id) {
          return null;
        }

        const cls = (classes as any[]).find((c) => c.id === studentRecord.class_id);
        if (!cls) return null;

        const average = item.total / item.count;

        return {
          id: studentRecord.id,
          name: item.name,
          enrollment: item.enrollment,
          course: cls.course?.name || '-',
          grade: `${cls.grade_level}ª`,
          section: cls.section,
          average: average.toFixed(1),
        };
      })
      .filter((r): r is {
        id: string;
        name: string;
        enrollment: string;
        course: string;
        grade: string;
        section: string;
        average: string;
      } => r !== null)
      .sort((a, b) => parseFloat(b.average) - parseFloat(a.average))
      .slice(0, 10)
      .map((student, index) => ({
        rank: index + 1,
        ...student,
      }));

    return rows;
  }, [grades, students, classes]);


  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="stat-card">
              <CardContent className="p-6">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-4 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="stat-card">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total de Estudantes</p>
                <p className="text-3xl font-bold text-foreground mt-2">{studentStats.total}</p>
                <div className="flex items-center gap-1 mt-2 text-sm">
                  <span className="flex items-center text-success">
                    <ArrowUpRight className="w-4 h-4" />
                    {studentStats.active}
                  </span>
                  <span className="text-muted-foreground">activos</span>
                </div>
              </div>
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Users className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="stat-card">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Matriculados Activos</p>
                <p className="text-3xl font-bold text-foreground mt-2">{studentStats.active}</p>
                <div className="flex items-center gap-1 mt-2 text-sm">
                  <span className="text-success font-medium">
                    {studentStats.total > 0 ? ((studentStats.active / studentStats.total) * 100).toFixed(1) : 0}%
                  </span>
                  <span className="text-muted-foreground">do total</span>
                </div>
              </div>
              <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                <UserCheck className="w-6 h-6 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="stat-card">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Desistentes</p>
                <p className="text-3xl font-bold text-foreground mt-2">{studentStats.dropouts}</p>
                <div className="flex items-center gap-1 mt-2 text-sm">
                  <span className="flex items-center text-destructive">
                    <ArrowDownRight className="w-4 h-4" />
                    {studentStats.total > 0 ? ((studentStats.dropouts / studentStats.total) * 100).toFixed(1) : 0}%
                  </span>
                  <span className="text-muted-foreground">do total</span>
                </div>
              </div>
              <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center">
                <UserX className="w-6 h-6 text-destructive" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="stat-card">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Receita Mensal</p>
                <p className="text-2xl font-bold text-foreground mt-2">{formatCurrency(financialStats.monthlyRevenue)}</p>
                <div className="flex items-center gap-1 mt-2 text-sm">
                  <span className="text-success font-medium">{paidPercentage}%</span>
                  <span className="text-muted-foreground">pagos</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Multas no mês: <span className="font-semibold text-accent">{formatCurrency(totalLateFeesCurrentMonth)}</span>
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                <Wallet className="w-6 h-6 text-accent" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>


      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gender Distribution */}
        <Card className="card-elevated">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Distribuição por Género</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              {studentStats.total > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={enrollmentByGender}
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {enrollmentByGender.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  Sem dados disponíveis
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Monthly Trend */}
        <Card className="card-elevated">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Evolução Mensal (Desistências)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyTrend}>
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
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="desistentes"
                    name="Desistentes"
                    stroke="hsl(0, 84%, 60%)"
                    strokeWidth={2}
                    dot={{ fill: 'hsl(0, 84%, 60%)' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts Section */}
      {alerts.length > 0 && (
        <Card className="card-elevated">
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Bell className="w-5 h-5 text-warning" />
              Alertas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {alerts.map((alert, index) => (
                <div
                  key={index}
                  className={`flex items-center gap-3 p-4 rounded-lg ${
                    alert.type === 'danger'
                      ? 'bg-destructive/10 text-destructive'
                      : alert.type === 'warning'
                      ? 'bg-warning/10 text-warning'
                      : 'bg-primary/10 text-primary'
                  }`}
                >
                  <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm font-medium">{alert.message}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Courses Table */}
      <Card className="card-elevated">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-primary" />
            Resumo por Curso
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="table-header">
                <TableHead>Curso</TableHead>
                <TableHead>Coordenador</TableHead>
                <TableHead className="text-center">Total Matriculados</TableHead>
                <TableHead className="text-center">Masculinos</TableHead>
                <TableHead className="text-center">Femininos</TableHead>
                <TableHead className="text-center">Desistentes</TableHead>
                <TableHead className="text-center">% Desistência</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {courseData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Sem dados de cursos disponíveis
                  </TableCell>
                </TableRow>
              ) : (
                courseData.map((course) => (
                  <TableRow
                    key={course.id}
                    className="table-row-hover cursor-pointer"
                    onClick={() => navigate(`/dashboard/cursos/${course.id}`)}
                  >
                    <TableCell className="font-medium">{course.name}</TableCell>
                    <TableCell>{course.coordinator}</TableCell>
                    <TableCell className="text-center font-semibold">{course.total}</TableCell>
                    <TableCell className="text-center">{course.males}</TableCell>
                    <TableCell className="text-center">{course.females}</TableCell>
                    <TableCell className="text-center">
                      <span className="text-destructive">{course.dropouts}</span>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant="outline"
                        className={
                          parseFloat(course.dropoutRate) <= 5
                            ? 'bg-success/10 text-success border-success/20'
                            : parseFloat(course.dropoutRate) <= 10
                            ? 'bg-warning/10 text-warning border-warning/20'
                            : 'bg-destructive/10 text-destructive border-destructive/20'
                        }
                      >
                        {course.dropoutRate}%
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Best Classes Table */}
      <Card className="card-elevated">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Trophy className="w-5 h-5 text-warning" />
            Melhores Turmas do Trimestre
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Posição</TableHead>
                <TableHead>Curso</TableHead>
                <TableHead>Classe</TableHead>
                <TableHead>Turma</TableHead>
                <TableHead>Nº Alunos</TableHead>
                <TableHead className="text-right">Média Geral</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topClasses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Sem dados disponíveis
                  </TableCell>
                </TableRow>
              ) : (
                topClasses.map((cls, index) => (
                  <TableRow
                    key={cls.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => navigate(`/dashboard/cursos/${cls.courseId}`)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {index === 0 ? (
                          <span className="text-xl">🥇</span>
                        ) : index === 1 ? (
                          <span className="text-xl">🥈</span>
                        ) : index === 2 ? (
                          <span className="text-xl">🥉</span>
                        ) : (
                          <span className="text-muted-foreground font-medium">{index + 1}º</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{cls.course}</TableCell>
                    <TableCell>{cls.grade}</TableCell>
                    <TableCell>{cls.section}</TableCell>
                    <TableCell>{cls.students}</TableCell>
                    <TableCell className="text-right">
                      <span className="font-semibold text-success">{cls.average}</span>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Top 10 Students */}
      <Card className="card-elevated">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Medal className="w-5 h-5 text-primary" />
            Top 10 Melhores Estudantes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Nº</TableHead>
                <TableHead>Nº Matrícula</TableHead>
                <TableHead>Nome Completo</TableHead>
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
                topStudents.map((student) => (
                  <TableRow
                    key={student.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => navigate(`/dashboard/financas/estudante/${student.id}`)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {student.rank === 1 ? (
                          <span className="text-xl">🥇</span>
                        ) : student.rank === 2 ? (
                          <span className="text-xl">🥈</span>
                        ) : student.rank === 3 ? (
                          <span className="text-xl">🥉</span>
                        ) : (
                          <span className="text-muted-foreground font-medium">{student.rank}º</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{student.enrollment}</TableCell>
                    <TableCell className="font-medium">{student.name}</TableCell>
                    <TableCell>{student.course}</TableCell>
                    <TableCell>{student.grade}</TableCell>
                    <TableCell>{student.section}</TableCell>
                    <TableCell className="text-right">
                      <span className={`font-semibold ${parseFloat(student.average) >= 17 ? 'text-success' : parseFloat(student.average) >= 14 ? 'text-primary' : 'text-foreground'}`}>
                        {student.average}
                      </span>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Course Performance Chart */}
      {courseData.length > 0 && (
        <Card className="card-elevated">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-semibold">Estudantes por Curso</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={courseData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis dataKey="name" type="category" stroke="hsl(var(--muted-foreground))" fontSize={12} width={120} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="total" name="Total Alunos" fill="hsl(217, 91%, 45%)" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="dropouts" name="Desistentes" fill="hsl(0, 84%, 60%)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function ProfessorOverview() {
  const { user } = useAuth();
  const [loading, setLoading] = React.useState(true);
  const [assignedClasses, setAssignedClasses] = React.useState<any[]>([]);

  React.useEffect(() => {
    const loadData = async () => {
      if (!user?.teacherId) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('teacher_class_assignments')
        .select(`
          id,
          class_id,
          subject_id,
          class:classes(grade_level, section, period, course:courses(name)),
          subject:subjects(name)
        `)
        .eq('teacher_id', user.teacherId);

      if (!error && data) {
        setAssignedClasses(data);
      }

      setLoading(false);
    };

    loadData();
  }, [user?.teacherId]);

  const uniqueClasses = React.useMemo(() => {
    const map = new Map<string, any>();
    assignedClasses.forEach((a) => {
      if (!map.has(a.class_id) && a.class) {
        map.set(a.class_id, a.class);
      }
    });
    return Array.from(map.entries()).map(([id, cls]) => ({ id, ...cls }));
  }, [assignedClasses]);

  const totalClasses = uniqueClasses.length;
  const totalSubjects = assignedClasses.length;

  const handleGenerateWeeklyReport = () => {
    toast.info('Geração de relatório semanal em desenvolvimento');
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="stat-card">
              <CardContent className="p-6">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-4 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="stat-card">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Turmas atribuídas</p>
                <p className="text-3xl font-bold text-foreground mt-2">{totalClasses}</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Turmas em que você leciona neste ano lectivo.
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Users className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="stat-card">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Disciplinas atribuídas</p>
                <p className="text-3xl font-bold text-foreground mt-2">{totalSubjects}</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Quantidade total de disciplinas que acompanha nas turmas.
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                <FileText className="w-6 h-6 text-accent" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="stat-card">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Aulas nesta semana</p>
                <p className="text-3xl font-bold text-foreground mt-2">-</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Visão semanal de aulas e avaliações (em desenvolvimento).
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                <Clock className="w-6 h-6 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Turmas atribuídas */}
      <Card className="card-elevated">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-primary" />
            Turmas atribuídas
          </CardTitle>
          <Button size="sm" variant="outline" onClick={handleGenerateWeeklyReport}>
            <Download className="w-4 h-4 mr-2" />
            Gerar Relatório Semanal
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Curso</TableHead>
                <TableHead>Classe</TableHead>
                <TableHead>Turma</TableHead>
                <TableHead>Período</TableHead>
                <TableHead>Disciplinas</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {uniqueClasses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Ainda não existem turmas atribuídas ao seu utilizador.
                  </TableCell>
                </TableRow>
              ) : (
                uniqueClasses.map((cls) => {
                  const disciplines = assignedClasses
                    .filter((a) => a.class_id === cls.id && a.subject)
                    .map((a) => a.subject.name)
                    .join(', ');

                  return (
                    <TableRow key={cls.id}>
                      <TableCell>{cls.course?.name ?? '-'}</TableCell>
                      <TableCell>{cls.grade_level ? `${cls.grade_level}ª` : '-'}</TableCell>
                      <TableCell>{cls.section}</TableCell>
                      <TableCell>{cls.period}</TableCell>
                      <TableCell>{disciplines || '-'}</TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Notificações e desempenho geral (placeholder) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="card-elevated">
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Bell className="w-5 h-5 text-warning" />
              Notificações recentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Aqui irão aparecer alertas sobre prazos de lançamento de notas, ausências frequentes e mensagens
              importantes da direcção.
            </p>
          </CardContent>
        </Card>

        <Card className="card-elevated">
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <PieChartIcon className="w-5 h-5 text-primary" />
              Desempenho geral das turmas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Gráficos de aproveitamento por turma (aprovados, reprovados, em risco) serão mostrados aqui assim que
              começarmos a lançar as notas.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
