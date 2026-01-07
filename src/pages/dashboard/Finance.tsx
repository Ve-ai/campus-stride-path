import React, { useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
  Plus,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Label } from '@/components/ui/label';
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { usePayments, useClasses, useStudents, useCourses, useStatistics, useCreatePayment } from '@/hooks/useDatabase';
import { toast } from "@/lib/notifications";

export function Finance() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('Todos');
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [newPayment, setNewPayment] = useState({
    student_id: '',
    amount: '',
    month_reference: (new Date().getMonth() + 1).toString(),
    year_reference: new Date().getFullYear().toString(),
    payment_method: 'Numerário',
    observations: '',
  });

  const { data: payments, isLoading: loadingPayments } = usePayments();
  const { data: classes, isLoading: loadingClasses } = useClasses();
  const { data: students, isLoading: loadingStudents } = useStudents();
  const { data: courses } = useCourses();
  const { data: statistics } = useStatistics();
  const createPaymentMutation = useCreatePayment();

  const isLoading = loadingPayments || loadingClasses || loadingStudents;

  // Calculate financial stats
  const financialStats = useMemo(() => {
    if (!payments || !students) {
      return {
        totalRevenue: 0,
        totalFines: 0,
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

    const monthlyPayments = payments.filter(
      p => p.month_reference === currentMonth && p.year_reference === currentYear,
    );

    const totalBase = monthlyPayments.reduce(
      (sum, p) => sum + Number(p.base_amount ?? p.amount ?? 0),
      0,
    );
    const totalFines = monthlyPayments.reduce(
      (sum, p) => sum + Number(p.late_fee ?? 0),
      0,
    );

    // Estimate pending (assumindo 5000 AOA por estudante)
    const avgMonthlyFee = 5000;
    const pendingPayments = pendingStudents * avgMonthlyFee;

    return {
      totalRevenue: totalBase,
      totalFines,
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
        course_id: classItem.course_id,
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
      const base = monthPayments.reduce(
        (sum, p) => sum + Number(p.base_amount ?? p.amount ?? 0),
        0,
      );
      const fines = monthPayments.reduce(
        (sum, p) => sum + Number(p.late_fee ?? 0),
        0,
      );

      return {
        month,
        receita: base,
        multas: fines,
        pendente: Math.max(0, (financialStats.totalStudents * 5000) - base),
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

  const handleExportReport = () => {
    if (!filteredPayments.length) {
      toast.error('Não há dados para exportar');
      return;
    }

    const header = ['Curso', 'Classe', 'Turma', 'Total Alunos', 'Pagos', 'Pendentes', '% Pagos'];
    const rows = filteredPayments.map((item) => [
      item.course,
      item.class,
      item.section,
      item.totalStudents.toString(),
      item.paidStudents.toString(),
      item.pendingStudents.toString(),
      item.percentage.toString().replace('.', ','),
    ]);

    const csvContent = [header, ...rows]
      .map((cols) => cols.map((c) => `"${c}"`).join(';'))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const now = new Date();
    const fileName = `relatorio-financas-${now.getFullYear()}-${now.getMonth() + 1}.csv`;

    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success('Relatório exportado com sucesso');
  };

  const handleCreatePayment = () => {
    if (!newPayment.student_id) {
      toast.error('Selecione um estudante');
      return;
    }
    if (!newPayment.amount || parseFloat(newPayment.amount) <= 0) {
      toast.error('Valor inválido');
      return;
    }

    createPaymentMutation.mutate({
      student_id: newPayment.student_id,
      amount: parseFloat(newPayment.amount),
      month_reference: parseInt(newPayment.month_reference),
      year_reference: parseInt(newPayment.year_reference),
      payment_method: newPayment.payment_method,
      observations: newPayment.observations || undefined,
    }, {
      onSuccess: () => {
        toast.success('Pagamento registado com sucesso!');
        setIsPaymentDialogOpen(false);
        setNewPayment({
          student_id: '',
          amount: '',
          month_reference: (new Date().getMonth() + 1).toString(),
          year_reference: new Date().getFullYear().toString(),
          payment_method: 'Numerário',
          observations: '',
        });
      },
      onError: (error: any) => {
        toast.error('Erro ao registar pagamento: ' + error.message);
      }
    });
  };

  const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

  const delinquencyByClass = useMemo(() => {
    return paymentsByClass
      .map((item) => ({
        ...item,
        delinquentPercentage:
          item.totalStudents > 0 ? (item.pendingStudents / item.totalStudents) * 100 : 0,
      }))
      .sort((a, b) => b.delinquentPercentage - a.delinquentPercentage);
  }, [paymentsByClass]);

  const financialByCourse = useMemo(() => {
    if (!courses || !classes || !students || !payments) return [];

    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;
    const monthsSoFar = currentMonth;
    const avgMonthlyFee = 5000;

    const studentsById = new Map<string, any>(students.map((s: any) => [s.id, s] as const));
    const classesById = new Map<string, any>(classes.map((c: any) => [c.id, c] as const));

    const courseMap = new Map<
      string,
      {
        courseId: string;
        courseName: string;
        activeStudents: number;
      }
    >();

    classes.forEach((cls) => {
      const courseId = cls.course_id;
      const courseName = cls.course?.name || courses.find((c) => c.id === courseId)?.name || 'Curso';
      const classStudents = students.filter(
        (s) => s.class_id === cls.id && s.status === 'active'
      );

      if (classStudents.length === 0) return;

      const existing =
        courseMap.get(courseId) ||
        {
          courseId,
          courseName,
          activeStudents: 0,
        };

      existing.activeStudents += classStudents.length;
      courseMap.set(courseId, existing);
    });

    const revenueByCourse = new Map<string, number>();

    payments
      .filter((p) => p.year_reference === currentYear)
      .forEach((payment) => {
        const student = studentsById.get(payment.student_id) as any;
        if (!student || !student.class_id) return;
        const cls = classesById.get(student.class_id) as any;
        if (!cls) return;

        const courseId = cls.course_id;
        revenueByCourse.set(
          courseId,
          (revenueByCourse.get(courseId) || 0) + Number(payment.amount)
        );
      });

    return Array.from(courseMap.values()).map((item) => {
      const revenue = revenueByCourse.get(item.courseId) || 0;
      const potential = item.activeStudents * avgMonthlyFee * monthsSoFar;
      const percentageRevenue = potential > 0 ? (revenue / potential) * 100 : 0;

      return {
        ...item,
        revenue,
        potential,
        percentageRevenue,
      };
    });
  }, [courses, classes, students, payments]);

  const trimesterBestClasses = useMemo(() => {
    if (!classes || !students || !payments) return [];

    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;
    const trimesterIndex = Math.floor((currentMonth - 1) / 3);
    const startMonth = trimesterIndex * 3 + 1;
    const endMonth = Math.min(startMonth + 2, 12);
    const monthsInTrimester = endMonth - startMonth + 1;
    const avgMonthlyFee = 5000;

    const studentsById = new Map<string, any>(students.map((s: any) => [s.id, s] as const));

    const revenueByClass = new Map<string, number>();

    payments
      .filter(
        (p) =>
          p.year_reference === currentYear &&
          p.month_reference >= startMonth &&
          p.month_reference <= endMonth
      )
      .forEach((payment) => {
        const student = studentsById.get(payment.student_id) as any;
        if (!student || !student.class_id) return;
        revenueByClass.set(
          student.class_id,
          (revenueByClass.get(student.class_id) || 0) + Number(payment.amount)
        );
      });

    return classes
      .map((cls) => {
        const classStudents = students.filter(
          (s) => s.class_id === cls.id && s.status === 'active'
        );
        if (classStudents.length === 0) return null;

        const revenue = revenueByClass.get(cls.id) || 0;
        const potential = classStudents.length * avgMonthlyFee * monthsInTrimester;
        const percentageRevenue = potential > 0 ? (revenue / potential) * 100 : 0;

        return {
          id: cls.id,
          label: `${cls.grade_level}ª ${cls.section}`,
          course: cls.course?.name || '-',
          revenue,
          potential,
          percentageRevenue,
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null)
      .sort((a, b) => b.percentageRevenue - a.percentageRevenue);
  }, [classes, students, payments]);

  const recentPayments = useMemo(() => {
    if (!payments || !students || !classes) return [];

    const studentsById = new Map<string, any>(students.map((s: any) => [s.id, s] as const));
    const classesById = new Map<string, any>(classes.map((c: any) => [c.id, c] as const));

    return [...payments]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 20)
      .map((payment) => {
        const student = studentsById.get(payment.student_id);
        const classItem = student?.class_id ? classesById.get(student.class_id) : undefined;

        return {
          id: payment.id,
          date: new Date(payment.created_at).toLocaleString('pt-AO'),
          studentName: student?.full_name || 'Estudante desconhecido',
          enrollment: student?.enrollment_number || '-',
          classLabel: classItem ? `${classItem.grade_level}ª ${classItem.section}` : '-',
          amount: Number(payment.amount),
          method: payment.payment_method || 'N/A',
        };
      });
  }, [payments, students, classes]);

  const location = useLocation();

  const [activeTab, setActiveTab] = useState(() => {
    if (location.pathname.endsWith('turmas-pagamentos')) return 'classes';
    if (location.pathname.endsWith('relatorios')) return 'reports';
    return 'overview';
  });

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
          <Button variant="outline" onClick={handleExportReport}>
            <Download className="w-4 h-4 mr-2" />
            Exportar Relatório (CSV)
          </Button>
          <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
            <DialogTrigger asChild>
              <Button className="btn-primary">
                <Wallet className="w-4 h-4 mr-2" />
                Registar Pagamento
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Registar Novo Pagamento</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Estudante *</Label>
                  <Select 
                    value={newPayment.student_id}
                    onValueChange={(v) => setNewPayment({ ...newPayment, student_id: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o estudante" />
                    </SelectTrigger>
                    <SelectContent>
                      {students?.filter(s => s.status === 'active').map((student) => (
                        <SelectItem key={student.id} value={student.id}>
                          {student.enrollment_number} - {student.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Mês Referência *</Label>
                    <Select 
                      value={newPayment.month_reference}
                      onValueChange={(v) => setNewPayment({ ...newPayment, month_reference: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {monthNames.map((month, index) => (
                          <SelectItem key={index} value={(index + 1).toString()}>
                            {month}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Ano Referência *</Label>
                    <Select 
                      value={newPayment.year_reference}
                      onValueChange={(v) => setNewPayment({ ...newPayment, year_reference: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="2025">2025</SelectItem>
                        <SelectItem value="2026">2026</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Valor (AOA) *</Label>
                    <Input 
                      type="number" 
                      placeholder="Ex: 5000" 
                      value={newPayment.amount}
                      onChange={(e) => setNewPayment({ ...newPayment, amount: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Método de Pagamento</Label>
                    <Select 
                      value={newPayment.payment_method}
                      onValueChange={(v) => setNewPayment({ ...newPayment, payment_method: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Numerário">Numerário</SelectItem>
                        <SelectItem value="Transferência">Transferência</SelectItem>
                        <SelectItem value="Depósito">Depósito</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Observações</Label>
                  <Input 
                    placeholder="Observações opcionais..." 
                    value={newPayment.observations}
                    onChange={(e) => setNewPayment({ ...newPayment, observations: e.target.value })}
                  />
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <Button variant="outline" onClick={() => setIsPaymentDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button 
                    className="btn-primary" 
                    onClick={handleCreatePayment}
                    disabled={createPaymentMutation.isPending}
                  >
                    {createPaymentMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Registando...
                      </>
                    ) : (
                      'Registar Pagamento'
                    )}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="w-full sm:w-auto flex flex-wrap gap-2">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="classes">Turmas e Pagamentos</TabsTrigger>
          <TabsTrigger value="reports">Relatórios</TabsTrigger>
          <TabsTrigger value="settings">Configurações</TabsTrigger>
        </TabsList>

        {/* Visão Geral */}
        <TabsContent value="overview" className="space-y-6">
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
                    <p className="text-sm text-muted-foreground mt-1">
                      {financialStats.paidPercentage.toFixed(1)}% do total
                    </p>
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
                    <p className="text-sm font-medium text-muted-foreground">Multas do Mês</p>
                    <p className="text-2xl font-bold text-foreground mt-2">
                      {formatCurrency(financialStats.totalFines)}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Valor adicional cobrado por pagamentos em atraso
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center">
                    <AlertTriangle className="w-6 h-6 text-warning" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts financeiros */}
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
                      <YAxis
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={12}
                        tickFormatter={(v) => `${v / 1000000}M`}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                        formatter={(value: number) => formatCurrency(value)}
                      />
                      <Bar
                        dataKey="receita"
                        name="Receita (Mensalidades)"
                        fill="hsl(142, 76%, 36%)"
                        radius={[4, 4, 0, 0]}
                      />
                      <Bar
                        dataKey="multas"
                        name="Multas"
                        fill="hsl(38, 92%, 50%)"
                        radius={[4, 4, 0, 0]}
                      />
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

          {/* Melhores turmas do trimestre (dados financeiros) */}
          <Card className="card-elevated">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">
                Melhores turmas do trimestre (desempenho financeiro)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="table-header">
                    <TableHead>Turma</TableHead>
                    <TableHead>Curso</TableHead>
                    <TableHead className="text-right">Receita realizada</TableHead>
                    <TableHead className="text-right">Potencial do trimestre</TableHead>
                    <TableHead className="text-right">% realizado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {trimesterBestClasses.slice(0, 5).map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.label}</TableCell>
                      <TableCell>{item.course}</TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(item.revenue)}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {formatCurrency(item.potential)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge
                          variant="outline"
                          className="bg-primary/5 text-primary border-primary/20"
                        >
                          {item.percentageRevenue.toFixed(1)}%
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Potencial de receita por curso */}
          <Card className="card-elevated">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">
                Potencial de receita acumulada por curso (ano corrente)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {financialByCourse.map((course) => (
                <div
                  key={course.courseId}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                >
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{course.courseName}</span>
                    <span className="text-xs text-muted-foreground">
                      {course.activeStudents} estudantes activos
                    </span>
                  </div>
                  <div className="flex flex-col sm:items-end gap-1 min-w-[220px]">
                    <div className="flex items-center justify-between w-full text-xs">
                      <span className="text-muted-foreground">Realizado</span>
                      <span className="font-medium">{formatCurrency(course.revenue)}</span>
                    </div>
                    <div className="flex items-center justify-between w-full text-xs">
                      <span className="text-muted-foreground">Potencial</span>
                      <span>{formatCurrency(course.potential)}</span>
                    </div>
                    <div className="flex items-center gap-2 w-full mt-1">
                      <Progress value={course.percentageRevenue} className="h-2 flex-1" />
                      <span className="text-xs font-medium w-12 text-right">
                        {course.percentageRevenue.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Turmas e Pagamentos */}
        <TabsContent value="classes" className="space-y-6">
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
                      <TableRow
                        key={item.id}
                        className="table-row-hover cursor-pointer"
                        onClick={() => navigate(`/dashboard/turmas/${item.id}`)}
                      >
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
                                ? 'bg-success/10 text-success border-success/20'
                                : item.percentage >= 80
                                ? 'bg-warning/10 text-warning border-warning/20'
                                : 'bg-destructive/10 text-destructive border-destructive/20'
                            }
                          >
                            {item.percentage}%
                          </Badge>
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
                                  navigate(`/dashboard/turmas/${item.id}`);
                                }}
                              >
                                Ver Estudantes
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setIsPaymentDialogOpen(true);
                                }}
                              >
                                Registar Pagamento
                              </DropdownMenuItem>
                              <DropdownMenuItem>Enviar Lembretes</DropdownMenuItem>
                              <DropdownMenuItem>Exportar Lista</DropdownMenuItem>
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
        </TabsContent>

        {/* Relatórios */}
        <TabsContent value="reports" className="space-y-6">
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Inadimplência por turma */}
            <Card className="card-elevated xl:col-span-2">
              <CardHeader>
                <CardTitle>Inadimplência por Turma</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="h-[260px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={delinquencyByClass.slice(0, 10)} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis
                        type="number"
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={12}
                        tickFormatter={(v) => `${v.toFixed(0)}%`}
                      />
                      <YAxis
                        type="category"
                        dataKey={(item) => `${item.class} ${item.section}`}
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={12}
                        width={80}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                        formatter={(value: number) => `${value.toFixed(1)}%`}
                        labelFormatter={(label) => `Turma ${label}`}
                      />
                      <Bar
                        dataKey="delinquentPercentage"
                        name="Inadimplência"
                        fill="hsl(0, 84%, 60%)"
                        radius={[0, 4, 4, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow className="table-header">
                      <TableHead>Turma</TableHead>
                      <TableHead className="text-center">Total</TableHead>
                      <TableHead className="text-center">Pendentes</TableHead>
                      <TableHead className="text-center">Inadimplência</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {delinquencyByClass.slice(0, 8).map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">{item.course}</span>
                            <span className="text-xs text-muted-foreground">
                              {item.class} - Turma {item.section}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">{item.totalStudents}</TableCell>
                        <TableCell className="text-center text-destructive font-medium">
                          {item.pendingStudents}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge className="bg-destructive/10 text-destructive border-destructive/20">
                            {item.delinquentPercentage.toFixed(1)}%
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Análise por curso */}
            <Card className="card-elevated">
              <CardHeader>
                <CardTitle>Análise por Curso</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={financialByCourse}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="courseName" stroke="hsl(var(--muted-foreground))" fontSize={11} hide />
                      <YAxis
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={12}
                        tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                        formatter={(value: number, name, props) => [
                          formatCurrency(value as number),
                          'Receita realizada',
                        ]}
                      />
                      <Bar
                        dataKey="revenue"
                        name="Receita realizada"
                        fill="hsl(142, 76%, 36%)"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="space-y-2">
                  {financialByCourse.map((course) => (
                    <div
                      key={course.courseId}
                      className="flex items-center justify-between gap-3"
                    >
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{course.courseName}</span>
                        <span className="text-xs text-muted-foreground">
                          {course.activeStudents} estudantes activos
                        </span>
                      </div>
                      <div className="flex flex-col items-end gap-1 min-w-[160px]">
                        <div className="flex items-center justify-between w-full text-[11px]">
                          <span className="text-muted-foreground">Realizado</span>
                          <span className="font-medium">
                            {formatCurrency(course.revenue)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between w-full text-[11px]">
                          <span className="text-muted-foreground">Potencial</span>
                          <span>{formatCurrency(course.potential)}</span>
                        </div>
                        <div className="flex items-center gap-2 w-full mt-1">
                          <Progress
                            value={course.percentageRevenue}
                            className="h-2 flex-1"
                          />
                          <span className="text-xs font-medium w-10 text-right">
                            {course.percentageRevenue.toFixed(0)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Auditoria de transações */}
          <Card className="card-elevated">
            <CardHeader>
              <CardTitle>Auditoria de Transações Recentes</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="table-header">
                    <TableHead>Data</TableHead>
                    <TableHead>Estudante</TableHead>
                    <TableHead>Turma</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead>Método</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentPayments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        Nenhuma transação registada.
                      </TableCell>
                    </TableRow>
                  ) : (
                    recentPayments.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="whitespace-nowrap text-xs md:text-sm">{item.date}</TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="text-sm font-medium">{item.studentName}</span>
                            <span className="text-xs text-muted-foreground">{item.enrollment}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{item.classLabel}</TableCell>
                        <TableCell className="text-right text-sm font-medium">
                          {formatCurrency(item.amount)}
                        </TableCell>
                        <TableCell className="text-sm">
                          <Badge variant="outline" className="px-2 py-0.5 text-xs">
                            {item.method}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Configurações */}
        <TabsContent value="settings" className="space-y-4">
          <Card className="card-elevated">
            <CardHeader>
              <CardTitle>Configurações do Módulo Financeiro</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">
                As configurações detalhadas de propinas, multas e métodos de pagamento serão configuradas aqui em
                próximas iterações.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
