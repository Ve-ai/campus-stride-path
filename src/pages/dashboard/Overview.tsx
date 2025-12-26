import React from 'react';
import {
  Users,
  UserCheck,
  UserX,
  GraduationCap,
  Wallet,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  FileText,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

const studentStats = {
  total: 520,
  enrolled: 485,
  dropouts: 35,
  male: 245,
  female: 275,
};

const financialStats = {
  monthlyRevenue: 12500000,
  pendingPayments: 1850000,
  paidPercentage: 87.5,
};

const enrollmentByGender = [
  { name: 'Masculino', value: studentStats.male, color: 'hsl(217, 91%, 45%)' },
  { name: 'Feminino', value: studentStats.female, color: 'hsl(173, 58%, 45%)' },
];

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

const alerts = [
  { type: 'warning', message: 'Turma 10ª A - Enfermagem com baixa frequência (65%)' },
  { type: 'danger', message: '15 estudantes com pagamentos pendentes há mais de 2 meses' },
  { type: 'info', message: 'Notas do 1º trimestre devem ser lançadas até 15/02' },
];

export function Overview() {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-AO', {
      style: 'currency',
      currency: 'AOA',
      minimumFractionDigits: 0,
    }).format(value);
  };

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
                <p className="text-3xl font-bold text-foreground mt-2">{studentStats.enrolled}</p>
                <div className="flex items-center gap-1 mt-2 text-sm">
                  <span className="text-success font-medium">{((studentStats.enrolled / studentStats.total) * 100).toFixed(1)}%</span>
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
                <p className="text-2xl font-bold text-foreground mt-2">{formatCurrency(financialStats.monthlyRevenue)}</p>
                <div className="flex items-center gap-1 mt-2 text-sm">
                  <span className="text-success font-medium">{financialStats.paidPercentage}%</span>
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
