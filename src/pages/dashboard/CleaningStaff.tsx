import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { format, differenceInBusinessDays } from 'date-fns';
import { pt } from 'date-fns/locale';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, UserPlus, Calendar, DollarSign, Search, AlertCircle } from 'lucide-react';

interface CleaningStaff {
  id: string;
  nome_completo: string;
  funcao: string;
  bi_number: string | null;
  bi_issue_date: string | null;
  birth_date: string | null;
  phone: string | null;
  address: string | null;
  dias_trabalho: string[];
  salario_bruto: number;
  data_admissao: string;
  is_active: boolean;
  faltas: number;
  presencas: number;
}

interface Attendance {
  id: string;
  pessoal_id: string;
  data: string;
  tipo: 'presenca' | 'falta' | 'falta_justificada';
  observacoes: string | null;
}

const DIAS_SEMANA = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'];

export function CleaningStaffPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [staff, setStaff] = useState<CleaningStaff[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isAttendanceDialogOpen, setIsAttendanceDialogOpen] = useState(false);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<CleaningStaff | null>(null);
  const [passwordConfirm, setPasswordConfirm] = useState('');

  const [newStaff, setNewStaff] = useState({
    nome_completo: '',
    funcao: 'Auxiliar de Limpeza',
    bi_number: '',
    bi_issue_date: '',
    birth_date: '',
    phone: '',
    address: '',
    dias_trabalho: ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'] as string[],
    salario_bruto: 0,
    data_admissao: format(new Date(), 'yyyy-MM-dd'),
  });

  const [attendanceData, setAttendanceData] = useState({
    data: format(new Date(), 'yyyy-MM-dd'),
    tipo: 'presenca' as 'presenca' | 'falta' | 'falta_justificada',
    observacoes: '',
  });

  const [paymentData, setPaymentData] = useState({
    mes_referencia: new Date().getMonth() + 1,
    ano_referencia: new Date().getFullYear(),
    descontos: 0,
    observacoes: '',
  });

  const isFinanceOrAdmin = user?.role === 'finance' || user?.role === 'super_admin' || user?.role === 'admin';

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const { data: staffData, error: staffError } = await supabase
        .from('pessoal_limpeza')
        .select('*')
        .eq('is_active', true)
        .order('nome_completo');

      if (staffError) throw staffError;

      // Fetch attendance counts for each staff member
      const staffWithAttendance = await Promise.all(
        (staffData || []).map(async (member) => {
          const { data: attendanceData } = await supabase
            .from('presencas_limpeza')
            .select('tipo')
            .eq('pessoal_id', member.id);

          const faltas = attendanceData?.filter(a => a.tipo === 'falta' || a.tipo === 'falta_justificada').length || 0;
          const presencas = attendanceData?.filter(a => a.tipo === 'presenca').length || 0;

          return {
            ...member,
            faltas,
            presencas,
          };
        })
      );

      setStaff(staffWithAttendance);
    } catch (error: any) {
      toast({
        title: 'Erro ao carregar dados',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddStaff = async () => {
    try {
      const { error } = await supabase.from('pessoal_limpeza').insert({
        nome_completo: newStaff.nome_completo,
        funcao: newStaff.funcao,
        bi_number: newStaff.bi_number || null,
        bi_issue_date: newStaff.bi_issue_date || null,
        birth_date: newStaff.birth_date || null,
        phone: newStaff.phone || null,
        address: newStaff.address || null,
        dias_trabalho: newStaff.dias_trabalho,
        salario_bruto: newStaff.salario_bruto,
        data_admissao: newStaff.data_admissao,
      });

      if (error) throw error;

      toast({
        title: 'Funcionário adicionado',
        description: 'O funcionário foi adicionado com sucesso.',
      });

      setIsAddDialogOpen(false);
      setNewStaff({
        nome_completo: '',
        funcao: 'Auxiliar de Limpeza',
        bi_number: '',
        bi_issue_date: '',
        birth_date: '',
        phone: '',
        address: '',
        dias_trabalho: ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'],
        salario_bruto: 0,
        data_admissao: format(new Date(), 'yyyy-MM-dd'),
      });
      fetchStaff();
    } catch (error: any) {
      toast({
        title: 'Erro ao adicionar funcionário',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleAddAttendance = async () => {
    if (!selectedStaff) return;

    try {
      const { error } = await supabase.from('presencas_limpeza').insert({
        pessoal_id: selectedStaff.id,
        data: attendanceData.data,
        tipo: attendanceData.tipo,
        observacoes: attendanceData.observacoes || null,
      });

      if (error) throw error;

      toast({
        title: 'Registo adicionado',
        description: `${attendanceData.tipo === 'presenca' ? 'Presença' : 'Falta'} registada com sucesso.`,
      });

      setIsAttendanceDialogOpen(false);
      setAttendanceData({
        data: format(new Date(), 'yyyy-MM-dd'),
        tipo: 'presenca',
        observacoes: '',
      });
      fetchStaff();
    } catch (error: any) {
      toast({
        title: 'Erro ao registar',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handlePayment = async () => {
    if (!selectedStaff) return;

    // Verify password for finance manager
    if (user?.role === 'finance' && passwordConfirm !== 'confirmar123') {
      toast({
        title: 'Senha incorrecta',
        description: 'A senha de confirmação está incorrecta.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const valorLiquido = selectedStaff.salario_bruto - paymentData.descontos;

      const { error } = await supabase.from('pagamentos_limpeza').insert({
        pessoal_id: selectedStaff.id,
        mes_referencia: paymentData.mes_referencia,
        ano_referencia: paymentData.ano_referencia,
        valor_bruto: selectedStaff.salario_bruto,
        descontos: paymentData.descontos,
        valor_liquido: valorLiquido,
        pago_por: user?.id,
        observacoes: paymentData.observacoes || null,
      });

      if (error) throw error;

      toast({
        title: 'Pagamento registado',
        description: `Pagamento de ${valorLiquido.toLocaleString('pt-AO')} Kz registado com sucesso.`,
      });

      setIsPaymentDialogOpen(false);
      setPasswordConfirm('');
      setPaymentData({
        mes_referencia: new Date().getMonth() + 1,
        ano_referencia: new Date().getFullYear(),
        descontos: 0,
        observacoes: '',
      });
    } catch (error: any) {
      toast({
        title: 'Erro ao registar pagamento',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleDiaTrabalhoChange = (dia: string, checked: boolean) => {
    if (checked) {
      setNewStaff(prev => ({
        ...prev,
        dias_trabalho: [...prev.dias_trabalho, dia],
      }));
    } else {
      setNewStaff(prev => ({
        ...prev,
        dias_trabalho: prev.dias_trabalho.filter(d => d !== dia),
      }));
    }
  };

  const selectAllDays = () => {
    setNewStaff(prev => ({
      ...prev,
      dias_trabalho: [...DIAS_SEMANA],
    }));
  };

  const filteredStaff = staff.filter(s =>
    s.nome_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.funcao.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const MESES = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Pessoal de Limpeza</h1>
          <p className="text-muted-foreground">Gestão de funcionários de limpeza</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <UserPlus className="w-4 h-4" />
              Adicionar Funcionário
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Adicionar Funcionário de Limpeza</DialogTitle>
              <DialogDescription>
                Preencha os dados pessoais e informações de trabalho do funcionário.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome Completo *</Label>
                  <Input
                    id="nome"
                    value={newStaff.nome_completo}
                    onChange={(e) => setNewStaff({ ...newStaff, nome_completo: e.target.value })}
                    placeholder="Nome completo"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="funcao">Função</Label>
                  <Select
                    value={newStaff.funcao}
                    onValueChange={(value) => setNewStaff({ ...newStaff, funcao: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Auxiliar de Limpeza">Auxiliar de Limpeza</SelectItem>
                      <SelectItem value="Chefe de Limpeza">Chefe de Limpeza</SelectItem>
                      <SelectItem value="Servente">Servente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bi">Nº do BI</Label>
                  <Input
                    id="bi"
                    value={newStaff.bi_number}
                    onChange={(e) => setNewStaff({ ...newStaff, bi_number: e.target.value })}
                    placeholder="000000000LA000"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bi_date">Data de Emissão do BI</Label>
                  <Input
                    id="bi_date"
                    type="date"
                    value={newStaff.bi_issue_date}
                    onChange={(e) => setNewStaff({ ...newStaff, bi_issue_date: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="birth">Data de Nascimento</Label>
                  <Input
                    id="birth"
                    type="date"
                    value={newStaff.birth_date}
                    onChange={(e) => setNewStaff({ ...newStaff, birth_date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    value={newStaff.phone}
                    onChange={(e) => setNewStaff({ ...newStaff, phone: e.target.value })}
                    placeholder="+244 9XX XXX XXX"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Endereço</Label>
                <Input
                  id="address"
                  value={newStaff.address}
                  onChange={(e) => setNewStaff({ ...newStaff, address: e.target.value })}
                  placeholder="Endereço completo"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Dias de Trabalho</Label>
                  <Button type="button" variant="outline" size="sm" onClick={selectAllDays}>
                    Selecionar Todos
                  </Button>
                </div>
                <div className="flex flex-wrap gap-4 p-4 border rounded-lg">
                  {DIAS_SEMANA.map((dia) => (
                    <div key={dia} className="flex items-center space-x-2">
                      <Checkbox
                        id={dia}
                        checked={newStaff.dias_trabalho.includes(dia)}
                        onCheckedChange={(checked) => handleDiaTrabalhoChange(dia, checked as boolean)}
                      />
                      <Label htmlFor={dia} className="cursor-pointer">{dia}</Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="salario">Salário Bruto (Kz)</Label>
                  <Input
                    id="salario"
                    type="number"
                    value={newStaff.salario_bruto}
                    onChange={(e) => setNewStaff({ ...newStaff, salario_bruto: parseFloat(e.target.value) || 0 })}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="admissao">Data de Admissão</Label>
                  <Input
                    id="admissao"
                    type="date"
                    value={newStaff.data_admissao}
                    onChange={(e) => setNewStaff({ ...newStaff, data_admissao: e.target.value })}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleAddStaff} disabled={!newStaff.nome_completo}>
                Adicionar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Pesquisar funcionário..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Funcionários</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{staff.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Presenças</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {staff.reduce((acc, s) => acc + s.presencas, 0)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Faltas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {staff.reduce((acc, s) => acc + s.faltas, 0)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Folha Salarial</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {staff.reduce((acc, s) => acc + s.salario_bruto, 0).toLocaleString('pt-AO')} Kz
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Staff Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">Nº</TableHead>
                <TableHead>Nome Completo</TableHead>
                <TableHead>Função</TableHead>
                <TableHead className="text-center">Faltas</TableHead>
                <TableHead className="text-center">Presenças</TableHead>
                <TableHead className="text-right">Salário Bruto</TableHead>
                <TableHead className="text-center">Acções</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    Carregando...
                  </TableCell>
                </TableRow>
              ) : filteredStaff.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Nenhum funcionário encontrado
                  </TableCell>
                </TableRow>
              ) : (
                filteredStaff.map((member, index) => (
                  <TableRow key={member.id}>
                    <TableCell className="font-medium">{index + 1}</TableCell>
                    <TableCell>{member.nome_completo}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{member.funcao}</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={member.faltas > 3 ? 'destructive' : 'secondary'}>
                        {member.faltas}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        {member.presencas}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {member.salario_bruto.toLocaleString('pt-AO')} Kz
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedStaff(member);
                            setIsAttendanceDialogOpen(true);
                          }}
                        >
                          <Calendar className="w-4 h-4" />
                        </Button>
                        {isFinanceOrAdmin && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedStaff(member);
                              setIsPaymentDialogOpen(true);
                            }}
                          >
                            <DollarSign className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Attendance Dialog */}
      <Dialog open={isAttendanceDialogOpen} onOpenChange={setIsAttendanceDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registar Presença/Falta</DialogTitle>
            <DialogDescription>
              {selectedStaff?.nome_completo}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Data</Label>
              <Input
                type="date"
                value={attendanceData.data}
                onChange={(e) => setAttendanceData({ ...attendanceData, data: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select
                value={attendanceData.tipo}
                onValueChange={(value: 'presenca' | 'falta' | 'falta_justificada') => 
                  setAttendanceData({ ...attendanceData, tipo: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="presenca">Presença</SelectItem>
                  <SelectItem value="falta">Falta</SelectItem>
                  <SelectItem value="falta_justificada">Falta Justificada</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Observações</Label>
              <Input
                value={attendanceData.observacoes}
                onChange={(e) => setAttendanceData({ ...attendanceData, observacoes: e.target.value })}
                placeholder="Observações (opcional)"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAttendanceDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddAttendance}>
              Registar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment Dialog */}
      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registar Pagamento</DialogTitle>
            <DialogDescription>
              {selectedStaff?.nome_completo}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Mês</Label>
                <Select
                  value={paymentData.mes_referencia.toString()}
                  onValueChange={(value) => 
                    setPaymentData({ ...paymentData, mes_referencia: parseInt(value) })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MESES.map((mes, index) => (
                      <SelectItem key={index} value={(index + 1).toString()}>
                        {mes}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Ano</Label>
                <Input
                  type="number"
                  value={paymentData.ano_referencia}
                  onChange={(e) => 
                    setPaymentData({ ...paymentData, ano_referencia: parseInt(e.target.value) })
                  }
                />
              </div>
            </div>
            <div className="p-4 bg-muted rounded-lg space-y-2">
              <div className="flex justify-between">
                <span>Salário Bruto:</span>
                <span className="font-medium">{selectedStaff?.salario_bruto.toLocaleString('pt-AO')} Kz</span>
              </div>
              <div className="flex justify-between text-red-600">
                <span>Descontos:</span>
                <span>-{paymentData.descontos.toLocaleString('pt-AO')} Kz</span>
              </div>
              <div className="flex justify-between font-bold text-lg border-t pt-2">
                <span>Valor Líquido:</span>
                <span>{((selectedStaff?.salario_bruto || 0) - paymentData.descontos).toLocaleString('pt-AO')} Kz</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Descontos (Kz)</Label>
              <Input
                type="number"
                value={paymentData.descontos}
                onChange={(e) => 
                  setPaymentData({ ...paymentData, descontos: parseFloat(e.target.value) || 0 })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Observações</Label>
              <Input
                value={paymentData.observacoes}
                onChange={(e) => setPaymentData({ ...paymentData, observacoes: e.target.value })}
                placeholder="Observações (opcional)"
              />
            </div>
            {user?.role === 'finance' && (
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-500" />
                  Senha de Confirmação
                </Label>
                <Input
                  type="password"
                  value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                  placeholder="Digite a senha de confirmação"
                />
                <p className="text-xs text-muted-foreground">
                  Por segurança, digite a senha de confirmação para processar o pagamento.
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPaymentDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handlePayment}>
              Confirmar Pagamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
