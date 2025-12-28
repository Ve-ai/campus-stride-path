import React from 'react';
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
import { useStatistics } from '@/hooks/useDatabase';
import { Skeleton } from '@/components/ui/skeleton';

// Mock data for charts and tables (will be replaced with real data)
const monthlyTrend = [
  { month: 'Jan', matriculados: 480, desistentes: 5 },
  { month: 'Fev', matriculados: 485, desistentes: 3 },
  { month: 'Mar', matriculados: 490, desistentes: 8 },
  { month: 'Abr', matriculados: 488, desistentes: 6 },
  { month: 'Mai', matriculados: 492, desistentes: 4 },
  { month: 'Jun', matriculados: 485, desistentes: 9 },
];

const courseData = [
  { name: 'Enfermagem', alunos: 120, aproveitamento: 78 },
  { name: 'Informática', alunos: 95, aproveitamento: 82 },
  { name: 'Contabilidade', alunos: 85, aproveitamento: 75 },
  { name: 'Gestão', alunos: 70, aproveitamento: 80 },
  { name: 'Mecânica', alunos: 65, aproveitamento: 72 },
  { name: 'Electricidade', alunos: 50, aproveitamento: 85 },
];

const topClasses = [
  { course: 'Informática', grade: '12ª', section: 'A', average: 15.8, students: 38 },
  { course: 'Enfermagem', grade: '11ª', section: 'B', average: 15.5, students: 42 },
  { course: 'Electricidade', grade: '10ª', section: 'A', average: 15.2, students: 35 },
  { course: 'Gestão', grade: '12ª', section: 'B', average: 14.9, students: 40 },
  { course: 'Contabilidade', grade: '11ª', section: 'A', average: 14.7, students: 37 },
];

const topStudents = [
  { rank: 1, name: 'Maria Santos', enrollment: '2024001', course: 'Informática', grade: '12ª', section: 'A', average: 18.5 },
  { rank: 2, name: 'João Silva', enrollment: '2024002', course: 'Enfermagem', grade: '11ª', section: 'B', average: 18.2 },
  { rank: 3, name: 'Ana Oliveira', enrollment: '2024003', course: 'Electricidade', grade: '10ª', section: 'A', average: 17.9 },
  { rank: 4, name: 'Pedro Alves', enrollment: '2024004', course: 'Gestão', grade: '12ª', section: 'B', average: 17.6 },
  { rank: 5, name: 'Sofia Lima', enrollment: '2024005', course: 'Contabilidade', grade: '11ª', section: 'A', average: 17.4 },
  { rank: 6, name: 'Carlos Mendes', enrollment: '2024006', course: 'Informática', grade: '12ª', section: 'A', average: 17.2 },
  { rank: 7, name: 'Beatriz Costa', enrollment: '2024007', course: 'Enfermagem', grade: '10ª', section: 'A', average: 17.0 },
  { rank: 8, name: 'Miguel Ferreira', enrollment: '2024008', course: 'Mecânica', grade: '11ª', section: 'B', average: 16.8 },
  { rank: 9, name: 'Luísa Rodrigues', enrollment: '2024009', course: 'Gestão', grade: '12ª', section: 'A', average: 16.6 },
  { rank: 10, name: 'André Martins', enrollment: '2024010', course: 'Contabilidade', grade: '10ª', section: 'B', average: 16.4 },
];

const alerts = [
  { type: 'warning', message: 'Turma 10ª A - Enfermagem com baixa frequência (65%)' },
  { type: 'danger', message: '15 estudantes com pagamentos pendentes há mais de 2 meses' },
  { type: 'info', message: 'Notas do 1º trimestre devem ser lançadas até 15/02' },
];

export function Overview() {
  const { data: stats, isLoading } = useStatistics();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-AO', {
      style: 'currency',
      currency: 'AOA',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const studentStats = stats?.students || { total: 0, active: 0, dropouts: 0, male: 0, female: 0 };
  const financialStats = stats?.finance || { monthlyRevenue: 0 };

  const enrollmentByGender = [
    { name: 'Masculino', value: studentStats.male || 245, color: 'hsl(217, 91%, 45%)' },
    { name: 'Feminino', value: studentStats.female || 275, color: 'hsl(173, 58%, 45%)' },
  ];

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
                <p className="text-3xl font-bold text-foreground mt-2">{studentStats.total || 520}</p>
                <div className="flex items-center gap-1 mt-2 text-sm">
                  <span className="flex items-center text-success">
                    <ArrowUpRight className="w-4 h-4" />
                    5.2%
                  </span>
                  <span className="text-muted-foreground">vs mês anterior</span>
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
                <p className="text-3xl font-bold text-foreground mt-2">{studentStats.active || 485}</p>
                <div className="flex items-center gap-1 mt-2 text-sm">
                  <span className="text-success font-medium">
                    {studentStats.total > 0 ? ((studentStats.active / studentStats.total) * 100).toFixed(1) : 93.3}%
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
                <p className="text-3xl font-bold text-foreground mt-2">{studentStats.dropouts || 35}</p>
                <div className="flex items-center gap-1 mt-2 text-sm">
                  <span className="flex items-center text-destructive">
                    <ArrowDownRight className="w-4 h-4" />
                    2.1%
                  </span>
                  <span className="text-muted-foreground">vs mês anterior</span>
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
                <p className="text-2xl font-bold text-foreground mt-2">{formatCurrency(financialStats.monthlyRevenue || 12500000)}</p>
                <div className="flex items-center gap-1 mt-2 text-sm">
                  <span className="text-success font-medium">87.5%</span>
                  <span className="text-muted-foreground">pagos</span>
                </div>
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
            </div>
          </CardContent>
        </Card>

        {/* Monthly Trend */}
        <Card className="card-elevated">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Evolução Mensal</CardTitle>
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
                    dataKey="matriculados"
                    name="Matriculados"
                    stroke="hsl(217, 91%, 45%)"
                    strokeWidth={2}
                    dot={{ fill: 'hsl(217, 91%, 45%)' }}
                  />
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
              {topClasses.map((cls, index) => (
                <TableRow key={index}>
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
                    <span className="font-semibold text-success">{cls.average.toFixed(1)}</span>
                  </TableCell>
                </TableRow>
              ))}
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
              {topStudents.map((student) => (
                <TableRow key={student.rank}>
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
                    <span className={`font-semibold ${student.average >= 17 ? 'text-success' : student.average >= 14 ? 'text-primary' : 'text-foreground'}`}>
                      {student.average.toFixed(1)}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Course Performance and Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Course Performance */}
        <Card className="card-elevated lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-semibold">Desempenho por Curso</CardTitle>
            <Button variant="outline" size="sm">
              Ver Todos
            </Button>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={courseData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis dataKey="name" type="category" stroke="hsl(var(--muted-foreground))" fontSize={12} width={100} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="alunos" name="Alunos" fill="hsl(217, 91%, 45%)" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="aproveitamento" name="Aproveitamento %" fill="hsl(173, 58%, 45%)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Alerts */}
        <Card className="card-elevated">
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-warning" />
              Alertas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {alerts.map((alert, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg border ${
                  alert.type === 'danger'
                    ? 'bg-destructive/5 border-destructive/20'
                    : alert.type === 'warning'
                    ? 'bg-warning/5 border-warning/20'
                    : 'bg-primary/5 border-primary/20'
                }`}
              >
                <p className="text-sm text-foreground">{alert.message}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="card-elevated">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Ações Rápidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="outline" className="h-auto py-4 flex flex-col gap-2">
              <FileText className="w-5 h-5" />
              <span>Gerar Relatório Geral</span>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex flex-col gap-2">
              <Users className="w-5 h-5" />
              <span>Adicionar Estudante</span>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex flex-col gap-2">
              <GraduationCap className="w-5 h-5" />
              <span>Registar Professor</span>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex flex-col gap-2">
              <Wallet className="w-5 h-5" />
              <span>Registar Pagamento</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
