import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  User,
  Phone,
  MapPin,
  Calendar,
  CreditCard,
  Download,
  Printer,
  CheckCircle,
  XCircle,
  Clock,
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useStudents, usePayments, useClasses, useCourses, useCreatePayment } from '@/hooks/useDatabase';
import { toast } from 'sonner';

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export function StudentFinanceDetails() {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);

  const { data: students } = useStudents();
  const { data: payments } = usePayments();
  const { data: classes } = useClasses();
  const { data: courses } = useCourses();
  const createPayment = useCreatePayment();

  const student = students?.find(s => s.id === studentId);
  const studentClass = classes?.find(c => c.id === student?.class_id);
  const course = courses?.find(c => c.id === studentClass?.course_id);

  // Get monthly fee based on course and grade level
  const getMonthlyFee = () => {
    if (!course || !studentClass) return 5000;
    const gradeKey = `monthly_fee_${studentClass.grade_level}` as keyof typeof course;
    return (course[gradeKey] as number) || 5000;
  };

  const monthlyFee = getMonthlyFee();

  const [newPayment, setNewPayment] = useState({
    month: (new Date().getMonth() + 1).toString(),
    year: new Date().getFullYear().toString(),
    amount: monthlyFee.toString(),
    method: 'Transferência',
    observations: '',
  });

  // Get student's payments
  const studentPayments = useMemo(() => {
    if (!payments || !studentId) return [];
    return payments
      .filter(p => p.student_id === studentId)
      .sort((a, b) => {
        if (a.year_reference !== b.year_reference) {
          return b.year_reference - a.year_reference;
        }
        return b.month_reference - a.month_reference;
      });
  }, [payments, studentId]);

  // Calculate payment status per month
  const currentYear = new Date().getFullYear();
  const paymentStatus = useMemo(() => {
    return MONTHS.map((month, index) => {
      const monthNum = index + 1;
      const payment = studentPayments.find(
        p => p.month_reference === monthNum && p.year_reference === currentYear
      );
      
      const isPast = monthNum < new Date().getMonth() + 1;
      const isCurrent = monthNum === new Date().getMonth() + 1;
      
      return {
        month,
        monthNum,
        paid: !!payment,
        amount: payment?.amount || 0,
        date: payment?.payment_date,
        status: payment ? 'paid' : (isPast ? 'overdue' : (isCurrent ? 'pending' : 'future')),
      };
    });
  }, [studentPayments, currentYear]);

  const paidMonths = paymentStatus.filter(p => p.paid).length;
  const overdueMonths = paymentStatus.filter(p => p.status === 'overdue').length;
  const totalPaid = studentPayments
    .filter(p => p.year_reference === currentYear)
    .reduce((sum, p) => sum + Number(p.amount), 0);

  const lastPayment = studentPayments[0];

  const handlePrintInvoice = (payment?: any) => {
    if (!student || !studentClass || !course) {
      toast.error('Dados do estudante incompletos para gerar fatura.');
      return;
    }

    const targetPayment = payment || lastPayment;
    if (!targetPayment) {
      toast.error('Nenhum pagamento disponível para imprimir.');
      return;
    }

    const nucleusName = (course as any).school_nuclei?.name || 'Núcleo Escolar';
    const nucleusLogo = (course as any).school_nuclei?.logo_url as string | undefined;

    const monthLabel = MONTHS[targetPayment.month_reference - 1] || '';
    const paymentDate = targetPayment.payment_date
      ? new Date(targetPayment.payment_date).toLocaleDateString('pt-AO')
      : new Date().toLocaleDateString('pt-AO');

    const classLabel = `${studentClass.grade_level}ª ${studentClass.section} - ${studentClass.period}`;
    const courseName = course.name as string;

    const amountFormatted = new Intl.NumberFormat('pt-AO', {
      style: 'currency',
      currency: 'AOA',
      minimumFractionDigits: 0,
    }).format(Number(targetPayment.amount));

    const printWindow = window.open('', '_blank', 'width=900,height=650');
    if (!printWindow) {
      toast.error('Não foi possível abrir a janela de impressão.');
      return;
    }

    printWindow.document.write(`<!DOCTYPE html>
<html lang="pt-AO">
  <head>
    <meta charSet="UTF-8" />
    <title>Fatura - ${student.full_name}</title>
    <style>
      body { font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 40px; color: #111827; }
      .header { display: flex; align-items: center; gap: 16px; border-bottom: 2px solid #e5e7eb; padding-bottom: 16px; margin-bottom: 24px; }
      .logo { width: 72px; height: 72px; object-fit: contain; }
      .title { font-size: 20px; font-weight: 700; margin: 0; }
      .subtitle { font-size: 12px; color: #6b7280; margin: 2px 0 0 0; }
      .section { margin-bottom: 16px; }
      .section-title { font-size: 13px; font-weight: 600; margin-bottom: 8px; text-transform: uppercase; color: #374151; }
      table { width: 100%; border-collapse: collapse; font-size: 13px; }
      td { padding: 6px 4px; }
      .label { color: #6b7280; width: 160px; }
      .value { font-weight: 500; }
      .amount { font-size: 18px; font-weight: 700; color: #047857; margin-top: 4px; }
      .footer { display: flex; justify-content: space-between; margin-top: 40px; }
      .signature { width: 45%; text-align: center; }
      .signature-line { border-top: 1px solid #9ca3af; margin-top: 48px; padding-top: 4px; font-size: 12px; color: #6b7280; }
      .stamp-box { width: 45%; border: 1px dashed #9ca3af; padding: 16px; text-align: center; font-size: 12px; color: #6b7280; }
      .badge { display: inline-block; padding: 2px 8px; border-radius: 9999px; border: 1px solid #d1d5db; font-size: 11px; color: #374151; }
    </style>
  </head>
  <body>
    <div class="header">
      ${nucleusLogo ? `<img src="${nucleusLogo}" alt="Logotipo ${nucleusName}" class="logo" />` : ''}
      <div>
        <h1 class="title">${nucleusName}</h1>
        <p class="subtitle">Comprovativo de Pagamento de Mensalidade</p>
      </div>
    </div>

    <div class="section">
      <div class="section-title">Dados do Estudante</div>
      <table>
        <tr><td class="label">Nome</td><td class="value">${student.full_name}</td></tr>
        <tr><td class="label">Nº Matrícula</td><td class="value">${student.enrollment_number}</td></tr>
        <tr><td class="label">Curso</td><td class="value">${courseName}</td></tr>
        <tr><td class="label">Turma</td><td class="value">${classLabel}</td></tr>
      </table>
    </div>

    <div class="section">
      <div class="section-title">Dados do Pagamento</div>
      <table>
        <tr><td class="label">Mês pago</td><td class="value">${monthLabel} / ${targetPayment.year_reference}</td></tr>
        <tr><td class="label">Data do pagamento</td><td class="value">${paymentDate}</td></tr>
        <tr><td class="label">Método</td><td class="value"><span class="badge">${targetPayment.payment_method || 'N/D'}</span></td></tr>
        <tr><td class="label">Valor pago</td><td class="value amount">${amountFormatted}</td></tr>
      </table>
    </div>

    <div class="footer">
      <div class="signature">
        <div class="signature-line">Assinatura do Responsável Financeiro</div>
      </div>
      <div class="stamp-box">
        Espaço reservado para carimbo da instituição
      </div>
    </div>
  </body>
</html>`);

    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const handleCreatePayment = () => {
    if (!studentId) return;
    
    createPayment.mutate({
      student_id: studentId,
      amount: parseFloat(newPayment.amount),
      month_reference: parseInt(newPayment.month),
      year_reference: parseInt(newPayment.year),
      payment_method: newPayment.method,
      observations: newPayment.observations,
    }, {
      onSuccess: (createdPayment) => {
        toast.success('Pagamento registado com sucesso!');
        setIsPaymentOpen(false);
        setNewPayment({
          month: (new Date().getMonth() + 1).toString(),
          year: new Date().getFullYear().toString(),
          amount: monthlyFee.toString(),
          method: 'Transferência',
          observations: '',
        });
        handlePrintInvoice(createdPayment);
      },
      onError: (error) => {
        toast.error('Erro ao registar pagamento: ' + error.message);
      },
    });
  };
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
      .toUpperCase() || 'E';
  };

  if (!student) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Estudante não encontrado</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-foreground">Detalhes Financeiros</h1>
          <p className="text-muted-foreground">Pagamentos e histórico do estudante</p>
        </div>
        <Dialog open={isPaymentOpen} onOpenChange={setIsPaymentOpen}>
          <DialogTrigger asChild>
            <Button className="btn-primary">
              <CreditCard className="w-4 h-4 mr-2" />
              Registar Pagamento
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Registar Pagamento</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Mês</Label>
                  <Select
                    value={newPayment.month}
                    onValueChange={(v) => setNewPayment({ ...newPayment, month: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MONTHS.map((month, index) => (
                        <SelectItem key={index} value={(index + 1).toString()}>
                          {month}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Ano</Label>
                  <Input
                    type="number"
                    value={newPayment.year}
                    onChange={(e) => setNewPayment({ ...newPayment, year: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Valor (AOA)</Label>
                <Input
                  type="number"
                  value={newPayment.amount}
                  onChange={(e) => setNewPayment({ ...newPayment, amount: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Método de Pagamento</Label>
                <Select
                  value={newPayment.method}
                  onValueChange={(v) => setNewPayment({ ...newPayment, method: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Transferência">Transferência Bancária</SelectItem>
                    <SelectItem value="Numerário">Numerário</SelectItem>
                    <SelectItem value="Multicaixa">Multicaixa Express</SelectItem>
                    <SelectItem value="Depósito">Depósito Bancário</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Observações</Label>
                <Input
                  placeholder="Observações (opcional)"
                  value={newPayment.observations}
                  onChange={(e) => setNewPayment({ ...newPayment, observations: e.target.value })}
                />
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setIsPaymentOpen(false)}>
                Cancelar
              </Button>
              <Button 
                className="btn-primary" 
                onClick={handleCreatePayment}
                disabled={createPayment.isPending}
              >
                {createPayment.isPending ? 'Registando...' : 'Registar'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        <Button variant="outline" onClick={() => handlePrintInvoice()}>
          <Printer className="w-4 h-4 mr-2" />
          Imprimir Fatura
        </Button>
      </div>

      {/* Student Info Card */}
      <Card className="card-elevated">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex items-start gap-4">
              <Avatar className="w-20 h-20">
                <AvatarImage src={student.photo_url || undefined} />
                <AvatarFallback className="text-xl bg-primary/10 text-primary">
                  {getInitials(student.full_name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-xl font-bold">{student.full_name}</h2>
                <p className="text-muted-foreground">Nº Matrícula: {student.enrollment_number}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline">
                    {course?.name} - {studentClass?.grade_level}ª {studentClass?.section}
                  </Badge>
                </div>
              </div>
            </div>
            <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <User className="w-4 h-4" />
                  <span>Encarregado: {student.guardian_name || 'Não informado'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="w-4 h-4" />
                  <span>{student.guardian_contact || 'Não informado'}</span>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Mensalidade</p>
                <p className="text-xl font-bold text-primary">{formatCurrency(monthlyFee)}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Total Pago ({currentYear})</p>
                <p className="text-xl font-bold text-success">{formatCurrency(totalPaid)}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Personal and Academic Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="card-elevated">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Dados pessoais</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">BI</span>
              <span className="font-medium">{student.bi_number || 'Não informado'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Data de nascimento</span>
              <span className="font-medium">
                {student.birth_date
                  ? new Date(student.birth_date).toLocaleDateString('pt-AO')
                  : 'Não informado'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Naturalidade</span>
              <span className="font-medium">{student.birthplace || 'Não informado'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Província</span>
              <span className="font-medium">{student.province || 'Não informado'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Filiação</span>
              <span className="font-medium">{student.parent_names || 'Não informado'}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="card-elevated">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Dados académicos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Ano de matrícula</span>
              <span className="font-medium">{student.enrollment_year}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Turma</span>
              <span className="font-medium">
                {studentClass
                  ? `${studentClass.grade_level}ª ${studentClass.section}`
                  : 'Não atribuído'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Estado</span>
              <span className="font-medium capitalize">{student.status || 'Ativo'}</span>
            </div>
          </CardContent>
        </Card>
      </div>


      {/* Payment Calendar */}
      <Card className="card-elevated">
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            Calendário de Pagamentos - {currentYear}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {paymentStatus.map((month) => (
              <div
                key={month.monthNum}
                className={`p-4 rounded-lg border-2 transition-all ${
                  month.status === 'paid'
                    ? 'bg-success/10 border-success/50'
                    : month.status === 'overdue'
                    ? 'bg-destructive/10 border-destructive/50'
                    : month.status === 'pending'
                    ? 'bg-warning/10 border-warning/50'
                    : 'bg-muted/50 border-border'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">{month.month.slice(0, 3)}</span>
                  {month.status === 'paid' && <CheckCircle className="w-4 h-4 text-success" />}
                  {month.status === 'overdue' && <XCircle className="w-4 h-4 text-destructive" />}
                  {month.status === 'pending' && <Clock className="w-4 h-4 text-warning" />}
                </div>
                <p className={`text-sm ${
                  month.status === 'paid' ? 'text-success' : 
                  month.status === 'overdue' ? 'text-destructive' :
                  month.status === 'pending' ? 'text-warning' : 'text-muted-foreground'
                }`}>
                  {month.status === 'paid' ? 'Pago' : 
                   month.status === 'overdue' ? 'Atrasado' :
                   month.status === 'pending' ? 'Pendente' : 'Futuro'}
                </p>
                {month.paid && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatCurrency(month.amount)}
                  </p>
                )}
              </div>
            ))}
          </div>
          <div className="flex items-center gap-6 mt-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-success/20 border-2 border-success/50" />
              <span>Pago ({paidMonths})</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-destructive/20 border-2 border-destructive/50" />
              <span>Atrasado ({overdueMonths})</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-warning/20 border-2 border-warning/50" />
              <span>Pendente</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment History */}
      <Card className="card-elevated">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Histórico de Transações</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="table-header">
                <TableHead>Data</TableHead>
                <TableHead>Mês Referente</TableHead>
                <TableHead>Valor Pago</TableHead>
                <TableHead>Método</TableHead>
                <TableHead>Comprovante</TableHead>
                <TableHead>Observações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {studentPayments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Nenhum pagamento registado
                  </TableCell>
                </TableRow>
              ) : (
                studentPayments.map((payment) => (
                  <TableRow key={payment.id} className="table-row-hover">
                    <TableCell>
                      {new Date(payment.payment_date).toLocaleDateString('pt-AO')}
                    </TableCell>
                    <TableCell>
                      {MONTHS[payment.month_reference - 1]} {payment.year_reference}
                    </TableCell>
                    <TableCell className="font-medium text-success">
                      {formatCurrency(Number(payment.amount))}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{payment.payment_method || '-'}</Badge>
                    </TableCell>
                    <TableCell>
                      {payment.receipt_number || '-'}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {payment.observations || '-'}
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
