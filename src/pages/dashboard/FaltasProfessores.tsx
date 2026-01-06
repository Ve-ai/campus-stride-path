import React, { useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTeachers, useSubjects } from '@/hooks/useDatabase';
import {
  useFaltasProfessores,
  useMinhasFaltasProfessores,
  useRegistrarFaltaProfessor,
  useSubmeterJustificativaFalta,
  useActualizarStatusFaltaProfessor,
} from '@/hooks/useFaltasProfessores';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { CalendarIcon, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { toast } from '@/lib/notifications';

function getStatusLabel(
  status:
    | 'registada'
    | 'nao_justificada'
    | 'justificativa_pendente'
    | 'justificada'
    | 'rejeitada',
) {
  switch (status) {
    case 'registada':
      return { label: 'Registada', variant: 'outline' as const };
    case 'nao_justificada':
      return { label: 'Não justificada', variant: 'destructive' as const };
    case 'justificativa_pendente':
      return { label: 'Justificativa pendente', variant: 'outline' as const };
    case 'justificada':
      return { label: 'Justificada', variant: 'success' as const };
    case 'rejeitada':
      return { label: 'Rejeitada', variant: 'destructive' as const };
    default:
      return { label: status, variant: 'outline' as const };
  }
}

export function FaltasProfessoresPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
  const isProfessor = user?.role === 'professor';

  const { data: teachers } = useTeachers();
  const { data: subjects } = useSubjects();

  // Admin state
  const [filtroProfessorId, setFiltroProfessorId] = useState<string | undefined>();
  const [filtroStatus, setFiltroStatus] = useState<
    | 'registada'
    | 'nao_justificada'
    | 'justificativa_pendente'
    | 'justificada'
    | 'rejeitada'
    | 'todos'
  >('todos');
  const [filtroDataInicio, setFiltroDataInicio] = useState<string>('');
  const [filtroDataFim, setFiltroDataFim] = useState<string>('');

  const { data: faltasAdmin, isLoading: loadingFaltasAdmin } = useFaltasProfessores({
    professorId: filtroProfessorId,
    status: filtroStatus === 'todos' ? undefined : filtroStatus,
    dataInicio: filtroDataInicio || undefined,
    dataFim: filtroDataFim || undefined,
  });

  const registrarFaltaMutation = useRegistrarFaltaProfessor();
  const actualizarStatusMutation = useActualizarStatusFaltaProfessor();

  const [novaFalta, setNovaFalta] = useState({
    professorId: '',
    disciplinaId: '',
    dataFalta: '',
    motivo: '',
  });
  const [isDialogNovaFaltaOpen, setIsDialogNovaFaltaOpen] = useState(false);
  const [faltaSelecionadaId, setFaltaSelecionadaId] = useState<string | null>(null);
  const [justificativaTexto, setJustificativaTexto] = useState('');
  const [justificativaArquivoUrl, setJustificativaArquivoUrl] = useState('');
  const [observacoesAdmin, setObservacoesAdmin] = useState('');
  const [acaoStatus, setAcaoStatus] = useState<'justificada' | 'rejeitada'>('justificada');
  const [isDialogStatusOpen, setIsDialogStatusOpen] = useState(false);

  const faltasAdminOrdenadas = useMemo(() => {
    return (faltasAdmin || []).slice().sort((a, b) => b.data_falta.localeCompare(a.data_falta));
  }, [faltasAdmin]);

  // Professor state
  const { data: minhasFaltas, isLoading: loadingMinhasFaltas } = useMinhasFaltasProfessores();
  const submeterJustificativaMutation = useSubmeterJustificativaFalta();

  const [faltaParaJustificarId, setFaltaParaJustificarId] = useState<string | null>(null);
  const [justificativaTextoProfessor, setJustificativaTextoProfessor] = useState('');
  const [justificativaArquivoUrlProfessor, setJustificativaArquivoUrlProfessor] = useState('');
  const [isDialogJustificativaOpen, setIsDialogJustificativaOpen] = useState(false);

  const minhasFaltasOrdenadas = useMemo(() => {
    return (minhasFaltas || []).slice().sort((a, b) => b.data_falta.localeCompare(a.data_falta));
  }, [minhasFaltas]);

  const handleRegistrarFalta = () => {
    if (!novaFalta.professorId) {
      toast.error('Professor é obrigatório');
      return;
    }
    if (!novaFalta.disciplinaId) {
      toast.error('Disciplina é obrigatória');
      return;
    }
    if (!novaFalta.dataFalta) {
      toast.error('Data da falta é obrigatória');
      return;
    }

    registrarFaltaMutation.mutate(
      {
        professorId: novaFalta.professorId,
        disciplinaId: novaFalta.disciplinaId,
        dataFalta: novaFalta.dataFalta,
        motivo: novaFalta.motivo || undefined,
      },
      {
        onSuccess: () => {
          toast.success('Falta registada com sucesso');
          setIsDialogNovaFaltaOpen(false);
          setNovaFalta({ professorId: '', disciplinaId: '', dataFalta: '', motivo: '' });
        },
        onError: (err: any) => {
          toast.error(err?.message || 'Erro ao registar falta');
        },
      },
    );
  };

  const handleActualizarStatus = () => {
    if (!faltaSelecionadaId) return;
    if (!observacoesAdmin) {
      toast.error('Observações administrativas são obrigatórias');
      return;
    }

    actualizarStatusMutation.mutate(
      {
        faltaId: faltaSelecionadaId,
        status: acaoStatus,
        observacoesAdmin,
      },
      {
        onSuccess: () => {
          toast.success('Status da falta actualizado com sucesso');
          setIsDialogStatusOpen(false);
          setFaltaSelecionadaId(null);
          setObservacoesAdmin('');
        },
        onError: (err: any) => {
          toast.error(err?.message || 'Erro ao actualizar status da falta');
        },
      },
    );
  };

  const handleSubmeterJustificativaProfessor = () => {
    if (!faltaParaJustificarId) return;
    if (!justificativaTextoProfessor) {
      toast.error('Justificativa é obrigatória');
      return;
    }

    submeterJustificativaMutation.mutate(
      {
        faltaId: faltaParaJustificarId,
        justificativaTexto: justificativaTextoProfessor,
        justificativaArquivoUrl: justificativaArquivoUrlProfessor || undefined,
      },
      {
        onSuccess: () => {
          toast.success('Justificativa submetida com sucesso');
          setIsDialogJustificativaOpen(false);
          setFaltaParaJustificarId(null);
          setJustificativaTextoProfessor('');
          setJustificativaArquivoUrlProfessor('');
        },
        onError: (err: any) => {
          toast.error(err?.message || 'Erro ao submeter justificativa');
        },
      },
    );
  };

  if (isProfessor && !isAdmin) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Minhas Faltas</h1>
          <p className="text-muted-foreground">Consulte o histórico de faltas e submeta justificativas.</p>
        </div>

        <Card className="card-elevated">
          <CardHeader>
            <CardTitle>Histórico de faltas</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingMinhasFaltas ? (
              <div className="flex items-center justify-center h-40">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : minhasFaltasOrdenadas.length === 0 ? (
              <p className="text-sm text-muted-foreground">Ainda não existem faltas registadas.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Disciplina</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Motivo</TableHead>
                    <TableHead>Justificativa</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {minhasFaltasOrdenadas.map((falta) => {
                    const statusInfo = getStatusLabel(falta.status as any);
                    const podeJustificar = falta.status === 'nao_justificada';
                    return (
                      <TableRow key={falta.id}>
                        <TableCell>{new Date(falta.data_falta).toLocaleDateString('pt-PT')}</TableCell>
                        <TableCell>{falta.disciplina?.name || '-'}</TableCell>
                        <TableCell>
                          <Badge variant={statusInfo.variant === 'destructive' ? 'destructive' : 'outline'}>{statusInfo.label}</Badge>
                        </TableCell>
                        <TableCell className="max-w-xs truncate" title={falta.motivo || ''}>
                          {falta.motivo || '-'}
                        </TableCell>
                        <TableCell className="max-w-xs truncate" title={falta.justificativa_texto || ''}>
                          {falta.justificativa_texto || '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={!podeJustificar || submeterJustificativaMutation.isPending}
                            onClick={() => {
                              setFaltaParaJustificarId(falta.id);
                              setJustificativaTextoProfessor(falta.justificativa_texto || '');
                              setJustificativaArquivoUrlProfessor(falta.justificativa_arquivo_url || '');
                              setIsDialogJustificativaOpen(true);
                            }}
                          >
                            Justificar
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Dialog open={isDialogJustificativaOpen} onOpenChange={setIsDialogJustificativaOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Submeter justificativa</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Justificativa</Label>
                <Textarea
                  value={justificativaTextoProfessor}
                  onChange={(e) => setJustificativaTextoProfessor(e.target.value)}
                  placeholder="Descreva o motivo da falta"
                />
              </div>
              <div className="space-y-2">
                <Label>URL do ficheiro (opcional)</Label>
                <Input
                  value={justificativaArquivoUrlProfessor}
                  onChange={(e) => setJustificativaArquivoUrlProfessor(e.target.value)}
                  placeholder="Link para o documento de justificativa"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsDialogJustificativaOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSubmeterJustificativaProfessor} disabled={submeterJustificativaMutation.isPending}>
                  {submeterJustificativaMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Submeter
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-center space-y-2">
        <h1 className="text-xl font-semibold text-foreground">Sem permissão</h1>
        <p className="text-muted-foreground max-w-md">
          Não tem permissão para aceder ao módulo de faltas de professores.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Faltas de Professores</h1>
          <p className="text-muted-foreground">Registo e gestão de faltas com justificativas.</p>
        </div>
        <Button onClick={() => setIsDialogNovaFaltaOpen(true)}>
          <CalendarIcon className="w-4 h-4 mr-2" />
          Registar falta
        </Button>
      </div>

      <Card className="card-elevated">
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label>Professor</Label>
            <Select
              value={filtroProfessorId || 'todos'}
              onValueChange={(value) => setFiltroProfessorId(value === 'todos' ? undefined : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                {(teachers || []).map((t: any) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.full_name || t.profiles?.full_name || t.employee_number}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select
              value={filtroStatus}
              onValueChange={(value) => setFiltroStatus(value as any)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="registada">Registada</SelectItem>
                <SelectItem value="nao_justificada">Não justificada</SelectItem>
                <SelectItem value="justificativa_pendente">Justificativa pendente</SelectItem>
                <SelectItem value="justificada">Justificada</SelectItem>
                <SelectItem value="rejeitada">Rejeitada</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Data início</Label>
            <Input type="date" value={filtroDataInicio} onChange={(e) => setFiltroDataInicio(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Data fim</Label>
            <Input type="date" value={filtroDataFim} onChange={(e) => setFiltroDataFim(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <Card className="card-elevated">
        <CardHeader>
          <CardTitle>Registos de faltas</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingFaltasAdmin ? (
            <div className="flex items-center justify-center h-40">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : faltasAdminOrdenadas.length === 0 ? (
            <p className="text-sm text-muted-foreground">Ainda não existem faltas registadas.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Professor</TableHead>
                  <TableHead>Disciplina</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Motivo</TableHead>
                  <TableHead>Justificativa</TableHead>
                  <TableHead>Observações</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {faltasAdminOrdenadas.map((falta) => {
                  const statusInfo = getStatusLabel(falta.status as any);
                  return (
                    <TableRow key={falta.id}>
                      <TableCell>{new Date(falta.data_falta).toLocaleDateString('pt-PT')}</TableCell>
                      <TableCell>
                        {falta.professor?.full_name || falta.professor?.employee_number || '-'}
                      </TableCell>
                      <TableCell>{falta.disciplina?.name || '-'}</TableCell>
                      <TableCell>
                        <Badge variant={statusInfo.variant === 'destructive' ? 'destructive' : 'outline'}>{statusInfo.label}</Badge>
                      </TableCell>
                      <TableCell className="max-w-xs truncate" title={falta.motivo || ''}>
                        {falta.motivo || '-'}
                      </TableCell>
                      <TableCell className="max-w-xs truncate" title={falta.justificativa_texto || ''}>
                        {falta.justificativa_texto || '-'}
                      </TableCell>
                      <TableCell className="max-w-xs truncate" title={falta.observacoes_admin || ''}>
                        {falta.observacoes_admin || '-'}
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        {falta.status === 'justificativa_pendente' && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setFaltaSelecionadaId(falta.id);
                                setObservacoesAdmin(falta.observacoes_admin || '');
                                setAcaoStatus('justificada');
                                setIsDialogStatusOpen(true);
                              }}
                            >
                              <CheckCircle2 className="w-4 h-4 mr-1" />
                              Aprovar
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setFaltaSelecionadaId(falta.id);
                                setObservacoesAdmin(falta.observacoes_admin || '');
                                setAcaoStatus('rejeitada');
                                setIsDialogStatusOpen(true);
                              }}
                            >
                              <XCircle className="w-4 h-4 mr-1" />
                              Rejeitar
                            </Button>
                          </>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogNovaFaltaOpen} onOpenChange={setIsDialogNovaFaltaOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registar falta de professor</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Professor</Label>
              <Select
                value={novaFalta.professorId}
                onValueChange={(value) => setNovaFalta((prev) => ({ ...prev, professorId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o professor" />
                </SelectTrigger>
                <SelectContent>
                  {(teachers || []).map((t: any) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.full_name || t.profiles?.full_name || t.employee_number}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Disciplina</Label>
              <Select
                value={novaFalta.disciplinaId}
                onValueChange={(value) => setNovaFalta((prev) => ({ ...prev, disciplinaId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a disciplina" />
                </SelectTrigger>
                <SelectContent>
                  {(subjects || []).map((s: any) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Data da falta</Label>
              <Input
                type="date"
                value={novaFalta.dataFalta}
                onChange={(e) => setNovaFalta((prev) => ({ ...prev, dataFalta: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Motivo (opcional)</Label>
              <Textarea
                value={novaFalta.motivo}
                onChange={(e) => setNovaFalta((prev) => ({ ...prev, motivo: e.target.value }))}
                placeholder="Descreva o motivo da falta"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsDialogNovaFaltaOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleRegistrarFalta} disabled={registrarFaltaMutation.isPending}>
                {registrarFaltaMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Registar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isDialogStatusOpen} onOpenChange={setIsDialogStatusOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {acaoStatus === 'justificada' ? 'Aprovar justificativa' : 'Rejeitar justificativa'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Observações administrativas</Label>
              <Textarea
                value={observacoesAdmin}
                onChange={(e) => setObservacoesAdmin(e.target.value)}
                placeholder="Registe observações adicionais (obrigatório)"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsDialogStatusOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleActualizarStatus} disabled={actualizarStatusMutation.isPending}>
                {actualizarStatusMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Confirmar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
