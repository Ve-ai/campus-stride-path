import React, { useState, useMemo } from 'react';
import {
  Search,
  Wallet,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Download,
  CheckCircle,
  XCircle,
  MoreHorizontal,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
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
} from 'recharts';
import { usePayments, useClasses, useStudents, useCourses, useStatistics } from '@/hooks/useDatabase';
import { toast } from 'sonner';

export function Finance() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('Todos');

  const { data: payments, isLoading: loadingPayments } = usePayments();
  const { data: classes, isLoading: loadingClasses } = useClasses();
  const { data: students, isLoading: loadingStudents } = useStudents();
  const { data: courses } = useCourses();
  const { data: statistics } = useStatistics();

  const isLoading = loadingPayments || loadingClasses || loadingStudents;

  // Calculate financial stats
  const financialStats = useMemo(() => {
    if (!payments || !students) {
      return {
        totalRevenue: 0,
        pendingPayments: 0,
        paidPercentage: 0,
        totalStudents: 0,
        paidStudents: 0,
        pendingStudents: 0,
      };
    }

    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();

    // Students who paid this month
    const paidStudentIds = new Set(
      payments
        .filter(p => p.month_reference === currentMonth && p.year_reference === currentYear)
        .map(p => p.student_id)
    );

    const activeStudents = students.filter(s => s.status === 'active');
    const paidStudents = activeStudents.filter(s => paidStudentIds.has(s.id)).length;
    const pendingStudents = activeStudents.length - paidStudents;

    const totalRevenue = payments
      .filter(p => p.year_reference === currentYear)
      .reduce((sum, p) => sum + Number(p.amount), 0);

    const monthlyRevenue = payments
      .filter(p => p.month_reference === currentMonth && p.year_reference === currentYear)
      .reduce((sum, p) => sum + Number(p.amount), 0);

    // Estimate pending (assuming 5000 AOA per student)
    const avgMonthlyFee = 5000;
    const pendingPayments = pendingStudents * avgMonthlyFee;

    return {
      totalRevenue: monthlyRevenue,
      pendingPayments,
      paidPercentage: activeStudents.length > 0 ? (paidStudents / activeStudents.length) * 100 : 0,
      totalStudents: activeStudents.length,
      paidStudents,
      pendingStudents,
    };
  }, [payments, students]);

  // Calculate payments by class
  const paymentsByClass = useMemo(() => {
    if (!classes || !students || !payments) return [];

    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();

    const paidStudentIds = new Set(
      payments
        .filter(p => p.month_reference === currentMonth && p.year_reference === currentYear)
        .map(p => p.student_id)
    );

    return classes.map(classItem => {
      const classStudents = students.filter(s => s.class_id === classItem.id && s.status === 'active');
      const paidStudents = classStudents.filter(s => paidStudentIds.has(s.id)).length;
      const pendingStudents = classStudents.length - paidStudents;
      const percentage = classStudents.length > 0 ? (paidStudents / classStudents.length) * 100 : 0;

      return {
        id: classItem.id,
        course: classItem.course?.name || '-',
        class: `${classItem.grade_level}ª`,
        section: classItem.section,
        totalStudents: classStudents.length,
        paidStudents,
        pendingStudents,
        percentage: Math.round(percentage * 10) / 10,
      };
    }).filter(c => c.totalStudents > 0);
  }, [classes, students, payments]);

  // Monthly data for chart
  const monthlyData = useMemo(() => {
    if (!payments) return [];

    const currentYear = new Date().getFullYear();
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

    return months.slice(0, new Date().getMonth() + 1).map((month, index) => {
      const monthPayments = payments.filter(
        p => p.month_reference === index + 1 && p.year_reference === currentYear
      );
      const receita = monthPayments.reduce((sum, p) => sum + Number(p.amount), 0);

      return {
        month,
        receita,
        pendente: Math.max(0, (financialStats.totalStudents * 5000) - receita),
      };
    });
  }, [payments, financialStats.totalStudents]);

  const filteredPayments = paymentsByClass.filter((item) => {
    const matchesSearch = item.course.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCourse = selectedCourse === 'Todos' || item.course === selectedCourse;
    return matchesSearch && matchesCourse;
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-AO', {
      style: 'currency',
      currency: 'AOA',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const paymentDistribution = [
    { name: 'Pagos', value: financialStats.paidStudents, color: 'hsl(142, 76%, 36%)' },
    { name: 'Pendentes', value: financialStats.pendingStudents, color: 'hsl(0, 84%, 60%)' },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Finanças</h1>
          <p className="text-muted-foreground">Gestão de pagamentos e mensalidades</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => toast.info('Exportação em desenvolvimento')}>
            <Download className="w-4 h-4 mr-2" />
            Exportar Relatório
          </Button>
          <Button className="btn-primary" onClick={() => toast.info('Registo de pagamento em desenvolvimento')}>
            <Wallet className="w-4 h-4 mr-2" />
            Registar Pagamento
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="stat-card">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Receita Mensal</p>
                <p className="text-2xl font-bold text-foreground mt-2">
                  {formatCurrency(financialStats.totalRevenue)}
                </p>
                <div className="flex items-center gap-1 mt-2 text-sm">
                  <span className="flex items-center text-success">
                    <TrendingUp className="w-4 h-4 mr-1" />
                    {financialStats.paidPercentage.toFixed(1)}%
                  </span>
                  <span className="text-muted-foreground">estudantes pagos</span>
                </div>
              </div>
              <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                <Wallet className="w-6 h-6 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="stat-card">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pagamentos Pendentes</p>
                <p className="text-2xl font-bold text-foreground mt-2">
                  {formatCurrency(financialStats.pendingPayments)}
                </p>
                <div className="flex items-center gap-1 mt-2 text-sm">
                  <span className="flex items-center text-destructive">
                    <TrendingDown className="w-4 h-4 mr-1" />
                    {financialStats.pendingStudents}
                  </span>
                  <span className="text-muted-foreground">estudantes pendentes</span>
                </div>
              </div>
              <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-destructive" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="stat-card">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Estudantes Pagos</p>
                <p className="text-2xl font-bold text-foreground mt-2">{financialStats.paidStudents}</p>
                <Progress value={financialStats.paidPercentage} className="mt-3 h-2" />
                <p className="text-sm text-muted-foreground mt-1">{financialStats.paidPercentage.toFixed(1)}% do total</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="stat-card">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Estudantes Pendentes</p>
                <p className="text-2xl font-bold text-foreground mt-2">{financialStats.pendingStudents}</p>
                <div className="flex items-center gap-1 mt-2 text-sm">
                  <span className="text-warning font-medium">{financialStats.pendingStudents} estudantes</span>
                  <span className="text-muted-foreground">requerem atenção</span>
                </div>
              </div>
              <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center">
                <XCircle className="w-6 h-6 text-warning" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="card-elevated">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Receitas Mensais</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => `${v / 1000000}M`} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    formatter={(value: number) => formatCurrency(value)}
                  />
                  <Bar dataKey="receita" name="Receita" fill="hsl(142, 76%, 36%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="card-elevated">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Distribuição de Pagamentos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={paymentDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {paymentDistribution.map((entry, index) => (
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
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Pesquisar por curso..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 input-field"
          />
        </div>
        <Select value={selectedCourse} onValueChange={setSelectedCourse}>
          <SelectTrigger className="w-full md:w-48">
            <SelectValue placeholder="Filtrar por curso" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Todos">Todos os Cursos</SelectItem>
            {courses?.map((course) => (
              <SelectItem key={course.id} value={course.name}>
                {course.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Payments by Class Table */}
      <Card className="card-elevated">
        <CardHeader>
          <CardTitle>Pagamentos por Turma</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="table-header">
                <TableHead>Curso</TableHead>
                <TableHead>Classe</TableHead>
                <TableHead>Turma</TableHead>
                <TableHead className="text-center">Total Estudantes</TableHead>
                <TableHead className="text-center">Estudantes Pagos</TableHead>
                <TableHead className="text-center">Estudantes Pendentes</TableHead>
                <TableHead className="text-center">Percentual</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPayments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    Nenhum dado encontrado
                  </TableCell>
                </TableRow>
              ) : (
                filteredPayments.map((item) => (
                  <TableRow key={item.id} className="table-row-hover">
                    <TableCell className="font-medium">{item.course}</TableCell>
                    <TableCell>{item.class}</TableCell>
                    <TableCell>{item.section}</TableCell>
                    <TableCell className="text-center">{item.totalStudents}</TableCell>
                    <TableCell className="text-center">
                      <span className="text-success font-medium">{item.paidStudents}</span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="text-destructive font-medium">{item.pendingStudents}</span>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant="outline"
                        className={
                          item.percentage >= 90
                            ? 'badge-success'
                            : item.percentage >= 80
                            ? 'badge-warning'
                            : 'badge-danger'
                        }
                      >
                        {item.percentage}%
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>Ver Estudantes</DropdownMenuItem>
                          <DropdownMenuItem>Registar Pagamento</DropdownMenuItem>
                          <DropdownMenuItem>Exportar PDF</DropdownMenuItem>
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
    </div>
  );
}
