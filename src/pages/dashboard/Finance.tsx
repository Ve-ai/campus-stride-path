import React, { useState } from 'react';
import {
  Search,
  Filter,
  Wallet,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Download,
  Users,
  CheckCircle,
  XCircle,
  MoreHorizontal,
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

const financialOverview = {
  totalRevenue: 12500000,
  pendingPayments: 1850000,
  paidPercentage: 87.5,
  totalStudents: 520,
  paidStudents: 455,
  pendingStudents: 65,
};

const monthlyData = [
  { month: 'Jan', receita: 2100000, pendente: 280000 },
  { month: 'Fev', receita: 2050000, pendente: 320000 },
  { month: 'Mar', receita: 2200000, pendente: 250000 },
  { month: 'Abr', receita: 2150000, pendente: 350000 },
  { month: 'Mai', receita: 2000000, pendente: 400000 },
  { month: 'Jun', receita: 2000000, pendente: 250000 },
];

const paymentsByClass = [
  {
    id: '1',
    course: 'Enfermagem Geral',
    class: '10ª',
    section: 'A',
    totalStudents: 40,
    paidStudents: 35,
    pendingStudents: 5,
    percentage: 87.5,
  },
  {
    id: '2',
    course: 'Enfermagem Geral',
    class: '10ª',
    section: 'B',
    totalStudents: 38,
    paidStudents: 32,
    pendingStudents: 6,
    percentage: 84.2,
  },
  {
    id: '3',
    course: 'Informática',
    class: '10ª',
    section: 'A',
    totalStudents: 35,
    paidStudents: 33,
    pendingStudents: 2,
    percentage: 94.3,
  },
  {
    id: '4',
    course: 'Informática',
    class: '11ª',
    section: 'A',
    totalStudents: 32,
    paidStudents: 28,
    pendingStudents: 4,
    percentage: 87.5,
  },
  {
    id: '5',
    course: 'Contabilidade',
    class: '10ª',
    section: 'A',
    totalStudents: 30,
    paidStudents: 27,
    pendingStudents: 3,
    percentage: 90.0,
  },
  {
    id: '6',
    course: 'Mecânica',
    class: '10ª',
    section: 'A',
    totalStudents: 25,
    paidStudents: 20,
    pendingStudents: 5,
    percentage: 80.0,
  },
];

const paymentDistribution = [
  { name: 'Pagos', value: financialOverview.paidStudents, color: 'hsl(142, 76%, 36%)' },
  { name: 'Pendentes', value: financialOverview.pendingStudents, color: 'hsl(0, 84%, 60%)' },
];

export function Finance() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('Todos');

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

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Finanças</h1>
          <p className="text-muted-foreground">Gestão de pagamentos e mensalidades</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Exportar Relatório
          </Button>
          <Button className="btn-primary">
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
                  {formatCurrency(financialOverview.totalRevenue)}
                </p>
                <div className="flex items-center gap-1 mt-2 text-sm">
                  <span className="flex items-center text-success">
                    <TrendingUp className="w-4 h-4 mr-1" />
                    8.2%
                  </span>
                  <span className="text-muted-foreground">vs mês anterior</span>
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
                  {formatCurrency(financialOverview.pendingPayments)}
                </p>
                <div className="flex items-center gap-1 mt-2 text-sm">
                  <span className="flex items-center text-destructive">
                    <TrendingDown className="w-4 h-4 mr-1" />
                    3.5%
                  </span>
                  <span className="text-muted-foreground">vs mês anterior</span>
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
                <p className="text-2xl font-bold text-foreground mt-2">{financialOverview.paidStudents}</p>
                <Progress value={financialOverview.paidPercentage} className="mt-3 h-2" />
                <p className="text-sm text-muted-foreground mt-1">{financialOverview.paidPercentage}% do total</p>
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
                <p className="text-2xl font-bold text-foreground mt-2">{financialOverview.pendingStudents}</p>
                <div className="flex items-center gap-1 mt-2 text-sm">
                  <span className="text-warning font-medium">{65} estudantes</span>
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
                  <Bar dataKey="pendente" name="Pendente" fill="hsl(0, 84%, 60%)" radius={[4, 4, 0, 0]} />
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
            <SelectItem value="Enfermagem Geral">Enfermagem Geral</SelectItem>
            <SelectItem value="Informática">Informática</SelectItem>
            <SelectItem value="Contabilidade">Contabilidade</SelectItem>
            <SelectItem value="Mecânica">Mecânica</SelectItem>
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
              {filteredPayments.map((item) => (
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
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
