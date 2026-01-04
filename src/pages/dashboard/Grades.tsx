import React, { useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useClasses, useStudents, useSubjects, useGrades } from '@/hooks/useDatabase';
import { supabase } from '@/integrations/supabase/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { toast } from 'sonner';
import { Loader2, BarChart3, FileText, Search, AlertTriangle } from 'lucide-react';
import {
  BarChart,
  Bar,
  CartesianGrid,
  Tooltip,
  XAxis,
  YAxis,
  ResponsiveContainer,
} from 'recharts';

export function Grades() {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  if (user.role !== 'professor') {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-foreground">Notas e Avaliações</h1>
        <p className="text-muted-foreground text-sm">
          Esta área é optimizada para o painel do professor. Em breve será
          disponibilizada uma visão específica para outros perfis.
        </p>
      </div>
    );
  }

  return <ProfessorGrades />;
}

function ProfessorGrades() {
  type BulkRow = {
    studentId: string;
    enrollment: string;
    name: string;
    mac: number | null;
    npt: number | null;
    observations: string | null;
  };

  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [selectedTrimester, setSelectedTrimester] = useState<number>(1);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isBulkDialogOpen, setIsBulkDialogOpen] = useState(false);
  const [bulkRows, setBulkRows] = useState<BulkRow[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  const { data: classes } = useClasses();
  const { data: students } = useStudents(selectedClassId || undefined);
  const selectedClass = (classes || []).find((c: any) => c.id === selectedClassId) || null;

  const { data: subjects } = useSubjects(
    selectedClass?.course_id,
    selectedClass?.grade_level,
  );

  const { data: grades, isLoading: loadingGrades } = useGrades(
    selectedClassId
      ? {
          classId: selectedClassId,
          subjectId: selectedSubjectId || undefined,
          studentId: selectedStudentId || undefined,
          trimester: selectedTrimester,
        }
      : undefined,
  );

  const [assignments, setAssignments] = useState<any[]>([]);
  const [loadingAssignments, setLoadingAssignments] = useState(true);

  React.useEffect(() => {
    const loadAssignments = async () => {
      if (!user?.teacherId) {
        setLoadingAssignments(false);
        return;
      }

      const { data, error } = await supabase
        .from('teacher_class_assignments')
        .select('id, class_id, subject_id, subject:subjects (id, name)')
        .eq('teacher_id', user.teacherId);

      if (!error && data) {
        setAssignments(data);
      }

      setLoadingAssignments(false);
    };

    loadAssignments();
  }, [user?.teacherId]);

  const assignedClasses = useMemo(() => {
    if (!classes || assignments.length === 0) return [];
    const classIds = new Set(assignments.map((a) => a.class_id));
    return classes.filter((cls: any) => classIds.has(cls.id));
  }, [classes, assignments]);

  React.useEffect(() => {
    if (!selectedClassId && assignedClasses.length > 0) {
      setSelectedClassId(assignedClasses[0].id);
    }
  }, [assignedClasses, selectedClassId]);

  const classSubjects = useMemo(() => {
    if (!selectedClass) return [];
    // Prefer subjects da atribuição do professor; se não houver, usar todas as disciplinas do curso/classe
    const subjectsFromAssignments = assignments
      .filter((a) => a.class_id === selectedClass.id && a.subject)
      .map((a) => a.subject) as any[];

    if (subjectsFromAssignments.length > 0) {
      const unique = new Map(subjectsFromAssignments.map((s) => [s.id, s]));
      return Array.from(unique.values());
    }

    return subjects || [];
  }, [assignments, selectedClass, subjects]);

  const filteredStudents = useMemo(() => {
    if (!students) return [];
    return students.filter((s: any) =>
      s.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.enrollment_number.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [students, searchTerm]);

  const gradeRows = useMemo(() => {
    if (!grades) return [];
    return grades.map((g: any, index: number) => {
      const mt1 = g.mac != null && g.npt != null ? (g.mac + g.npt) / 2 : null;
      const finalResult = mt1 != null ? (mt1 >= 10 ? 'Aprovado' : 'Reprovado') : '-';
      return {
        order: index + 1,
        id: g.id,
        enrollment: g.student?.enrollment_number,
        name: g.student?.full_name,
        subject: g.subject?.name,
        mac: g.mac,
        npt: g.npt,
        mt1,
        result: finalResult,
        observations: g.observations,
        studentId: g.student?.id,
      };
    });
  }, [grades]);

  const performanceDistribution = useMemo(() => {
    const buckets = {
      baixa: 0, // <10
      media: 0, // 10-13.9
      alta: 0, // >=14
    };

    gradeRows.forEach((row) => {
      if (row.mt1 == null) return;
      if (row.mt1 < 10) buckets.baixa += 1;
      else if (row.mt1 < 14) buckets.media += 1;
      else buckets.alta += 1;
    });

    return [
      { label: 'Abaixo de 10', value: buckets.baixa },
      { label: '10 a 13.9', value: buckets.media },
      { label: '14 ou mais', value: buckets.alta },
    ];
  }, [gradeRows]);

  const [selectedReportStudentId, setSelectedReportStudentId] = useState<string | null>(null);

  const reportStudentGrades = useMemo(() => {
    if (!selectedReportStudentId || !grades) return [];
    return grades
      .filter((g: any) => g.student_id === selectedReportStudentId)
      .map((g: any) => {
        const mt1 = g.mac != null && g.npt != null ? (g.mac + g.npt) / 2 : null;
        const finalResult = mt1 != null ? (mt1 >= 10 ? 'Aprovado' : 'Reprovado') : '-';
        return {
          id: g.id,
          subject: g.subject?.name,
          trimester: g.trimester,
          mac: g.mac,
          npt: g.npt,
          mt1,
          result: finalResult,
          observations: g.observations,
        };
      });
  }, [grades, selectedReportStudentId]);

  const lowPerformanceAlerts = useMemo(() => {
    const alerts: { studentId: string; name: string; mt1: number }[] = [];
    const bestByStudent = new Map<string, { name: string; mt1: number }>();

    gradeRows.forEach((row) => {
      if (row.mt1 == null || !row.studentId) return;
      const existing = bestByStudent.get(row.studentId);
      if (!existing || row.mt1 < existing.mt1) {
        bestByStudent.set(row.studentId, { name: row.name || '', mt1: row.mt1 });
      }
    });

    bestByStudent.forEach((value, studentId) => {
      if (value.mt1 < 10) {
        alerts.push({ studentId, name: value.name, mt1: value.mt1 });
      }
    });

    return alerts;
  }, [gradeRows]);

  const createGradeMutation = useMutation({
    mutationFn: async (payload: {
      studentId: string;
      subjectId: string;
      mac: number;
      npt: number;
      observations?: string;
    }) => {
      if (!user?.teacherId || !selectedClass) {
        throw new Error('Turma ou professor não definido');
      }

      const academicYear = selectedClass.academic_year || new Date().getFullYear();

      const { data, error } = await supabase
        .from('grades')
        .insert({
          academic_year: academicYear,
          class_id: selectedClass.id,
          student_id: payload.studentId,
          subject_id: payload.subjectId,
          teacher_id: user.teacherId,
          trimester: selectedTrimester,
          mac: payload.mac,
          npt: payload.npt,
          observations: payload.observations || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Notas lançadas com sucesso');
      queryClient.invalidateQueries({ queryKey: ['grades'] });
      setIsDialogOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao lançar notas');
    },
  });

  const bulkCreateGradeMutation = useMutation({
    mutationFn: async (rows: BulkRow[]) => {
      if (!user?.teacherId || !selectedClass || !selectedSubjectId) {
        throw new Error('Turma, disciplina ou professor não definido');
      }

      const academicYear = selectedClass.academic_year || new Date().getFullYear();

      const rowsToInsert = rows
        .filter((row) => row.mac != null && row.npt != null)
        .map((row) => ({
          academic_year: academicYear,
          class_id: selectedClass.id,
          student_id: row.studentId,
          subject_id: selectedSubjectId,
          teacher_id: user.teacherId,
          trimester: selectedTrimester,
          mac: row.mac,
          npt: row.npt,
          observations: row.observations,
        }));

      if (!rowsToInsert.length) {
        throw new Error('Preencha pelo menos uma linha com MAC e NPT.');
      }

      const { error } = await supabase.from('grades').insert(rowsToInsert);
      if (error) throw error;
      return rowsToInsert.length;
    },
    onSuccess: (count: number) => {
      toast.success(`${count} lançamento(s) de notas guardado(s) com sucesso`);
      queryClient.invalidateQueries({ queryKey: ['grades'] });
      setIsBulkDialogOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao lançar notas em massa');
    },
  });


  const handleLaunchGrades = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    const studentId = formData.get('studentId') as string;
    const subjectId = formData.get('subjectId') as string;
    const mac = Number(formData.get('mac'));
    const npt = Number(formData.get('npt'));
    const observations = (formData.get('observations') as string) || undefined;

    if (!studentId || !subjectId) {
      toast.error('Selecione o aluno e a disciplina');
      return;
    }

    if (Number.isNaN(mac) || Number.isNaN(npt)) {
      toast.error('As notas devem ser numéricas');
      return;
    }

    if (mac < 0 || mac > 20 || npt < 0 || npt > 20) {
      toast.error('As notas devem estar entre 0 e 20');
      return;
    }

    await createGradeMutation.mutateAsync({ studentId, subjectId, mac, npt, observations });
  };

  const handleOpenBulkDialog = () => {
    if (!selectedClass || !selectedSubjectId) {
      toast.error('Selecione primeiro a turma e a disciplina para lançar em massa.');
      return;
    }

    const baseRows: BulkRow[] = (students || []).map((s: any) => ({
      studentId: s.id,
      enrollment: s.enrollment_number,
      name: s.full_name,
      mac: null,
      npt: null,
      observations: null,
    }));

    setBulkRows(baseRows);
    setIsBulkDialogOpen(true);
  };

  const handleBulkCellChange = (studentId: string, field: keyof Omit<BulkRow, 'studentId' | 'enrollment' | 'name'>, value: string) => {
    setBulkRows((prev) =>
      prev.map((row) => {
        if (row.studentId !== studentId) return row;
        if (field === 'observations') {
          return { ...row, observations: value || null };
        }
        const numeric = value === '' ? null : Number(value);
        return { ...row, [field]: Number.isNaN(numeric) ? row[field] : (numeric as number | null) };
      }),
    );
  };

  const handleCsvUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result || '');
      const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
      if (lines.length <= 1) return;

      const [headerLine, ...dataLines] = lines;
      const headers = headerLine.split(',').map((h) => h.trim().toLowerCase());
      const idxEnrollment = headers.indexOf('matricula');
      const idxMac = headers.indexOf('mac');
      const idxNpt = headers.indexOf('npt');
      const idxObs = headers.indexOf('observacoes');

      if (idxEnrollment === -1 || idxMac === -1 || idxNpt === -1) {
        toast.error('Ficheiro CSV inválido. Certifique-se que contém as colunas matricula, mac, npt.');
        return;
      }

      setBulkRows((prev) => {
        const byEnrollment = new Map(prev.map((row) => [row.enrollment, { ...row }]));

        for (const line of dataLines) {
          const cols = line.split(',');
          if (cols.length < 3) continue;
          const enrollment = (cols[idxEnrollment] || '').trim();
          const macStr = (cols[idxMac] || '').trim();
          const nptStr = (cols[idxNpt] || '').trim();
          const obsStr = idxObs >= 0 ? (cols[idxObs] || '').trim() : '';

          const existing = byEnrollment.get(enrollment);
          if (!existing) continue;

          const mac = macStr === '' ? null : Number(macStr.replace(',', '.'));
          const npt = nptStr === '' ? null : Number(nptStr.replace(',', '.'));

          byEnrollment.set(enrollment, {
            ...existing,
            mac: Number.isNaN(mac) ? existing.mac : mac,
            npt: Number.isNaN(npt) ? existing.npt : npt,
            observations: obsStr || existing.observations,
          });
        }

        return Array.from(byEnrollment.values());
      });
    };

    reader.readAsText(file, 'utf-8');
  };

  const handleSubmitBulkGrades = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const rowsToValidate = bulkRows.filter((row) => row.mac != null && row.npt != null);

    if (!rowsToValidate.length) {
      toast.error('Preencha pelo menos uma linha com MAC e NPT.');
      return;
    }

    for (const row of rowsToValidate) {
      if (row.mac! < 0 || row.mac! > 20 || row.npt! < 0 || row.npt! > 20) {
        toast.error('Todas as notas devem estar entre 0 e 20.');
        return;
      }
    }

    await bulkCreateGradeMutation.mutateAsync(rowsToValidate);
  };
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold text-foreground">Notas e Avaliações</h1>
        <p className="text-muted-foreground text-sm">
          Lançamento e acompanhamento de notas por turma, disciplina e trimestre.
        </p>
      </header>

      <section className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <Card className="stat-card">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Turmas atribuídas</p>
            <p className="text-2xl font-bold">{assignedClasses.length}</p>
          </CardContent>
        </Card>
        <Card className="stat-card">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total registos de notas</p>
            <p className="text-2xl font-bold">{gradeRows.length}</p>
          </CardContent>
        </Card>
        <Card className="stat-card">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Trimestre actual</p>
            <p className="text-2xl font-bold">{selectedTrimester}º</p>
          </CardContent>
        </Card>
        <Card className="stat-card">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Alunos em alerta</p>
            <p className="text-2xl font-bold">{lowPerformanceAlerts.length}</p>
          </CardContent>
        </Card>
      </section>

      {/* Filtros principais */}
      <section className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
        <div>
          <Label>Turma</Label>
          <Select
            value={selectedClassId || ''}
            onValueChange={(v) => {
              setSelectedClassId(v);
              setSelectedSubjectId(null);
              setSelectedStudentId(null);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione a turma" />
            </SelectTrigger>
            <SelectContent>
              {assignedClasses.map((cls: any) => (
                <SelectItem key={cls.id} value={cls.id}>
                  {cls.course?.name || ''} - {cls.grade_level}ª {cls.section}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Disciplina</Label>
          <Select
            value={selectedSubjectId ?? 'all'}
            onValueChange={(v) => setSelectedSubjectId(v === 'all' ? null : v)}
            disabled={!selectedClass}
          >
            <SelectTrigger>
              <SelectValue placeholder="Todas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {classSubjects.map((sub: any) => (
                <SelectItem key={sub.id} value={sub.id}>
                  {sub.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Aluno</Label>
          <Select
            value={selectedStudentId ?? 'all'}
            onValueChange={(v) => {
              const value = v === 'all' ? null : v;
              setSelectedStudentId(value);
              setSelectedReportStudentId(value);
            }}
            disabled={!selectedClass}
          >
            <SelectTrigger>
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {filteredStudents.map((s: any) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.enrollment_number} - {s.full_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-2">
          <Label>Trimestre</Label>
          <Select
            value={String(selectedTrimester)}
            onValueChange={(v) => setSelectedTrimester(Number(v))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1º Trimestre</SelectItem>
              <SelectItem value="2">2º Trimestre</SelectItem>
              <SelectItem value="3">3º Trimestre</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </section>

      {/* Tabela principal de notas */}
      <section className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Filtrar por nome ou matrícula..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 justify-end">
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  className="btn-primary"
                  disabled={!selectedClass || !assignedClasses.length}
                >
                  Lançar Notas
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Lançar Notas (registo individual)</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleLaunchGrades} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Aluno *</Label>
                    <Select name="studentId" disabled={!selectedClass}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o aluno" />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredStudents.map((s: any) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.enrollment_number} - {s.full_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Disciplina *</Label>
                    <Select name="subjectId" disabled={!selectedClass}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a disciplina" />
                      </SelectTrigger>
                      <SelectContent>
                        {classSubjects.map((sub: any) => (
                          <SelectItem key={sub.id} value={sub.id}>
                            {sub.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>MAC (0-20)</Label>
                      <Input
                        name="mac"
                        type="number"
                        min={0}
                        max={20}
                        step={0.1}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>NPT (0-20)</Label>
                      <Input
                        name="npt"
                        type="number"
                        min={0}
                        max={20}
                        step={0.1}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Observações</Label>
                    <Input
                      name="observations"
                      placeholder="Comentário opcional sobre o desempenho"
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit" className="btn-primary" disabled={createGradeMutation.isPending}>
                      {createGradeMutation.isPending && (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      )}
                      Guardar
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>

            {/* Lançamento em massa */}
            <Dialog open={isBulkDialogOpen} onOpenChange={setIsBulkDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  onClick={handleOpenBulkDialog}
                  disabled={!selectedClass || !selectedSubjectId || !assignedClasses.length}
                >
                  Lançar Notas em Massa
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl">
                <DialogHeader>
                  <DialogTitle>Lançar Notas em Massa</DialogTitle>
                  <DialogDescription>
                    Registe MAC e NPT para vários alunos da turma seleccionada nesta disciplina
                    e trimestre. Apenas linhas com notas preenchidas serão gravadas.
                  </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmitBulkGrades} className="space-y-4">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <p className="text-sm text-muted-foreground">
                      Turma: <span className="font-medium">{selectedClass?.grade_level}ª {selectedClass?.section}</span>{' '}
                      &mdash; Disciplina:{' '}
                      <span className="font-medium">
                        {classSubjects.find((s: any) => s.id === selectedSubjectId)?.name || '-'}
                      </span>{' '}
                      &mdash; Trimestre: <span className="font-medium">{selectedTrimester}º</span>
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>Importar de ficheiro CSV (opcional):</span>
                      <Input
                        type="file"
                        accept=".csv,text/csv"
                        onChange={handleCsvUpload}
                        className="max-w-xs cursor-pointer"
                      />
                    </div>
                  </div>

                  <div className="border rounded-lg overflow-hidden">
                    <div className="max-h-80 overflow-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="table-header">
                            <TableHead>Ordem</TableHead>
                            <TableHead>Nº Matrícula</TableHead>
                            <TableHead>Nome</TableHead>
                            <TableHead>MAC (0-20)</TableHead>
                            <TableHead>NPT (0-20)</TableHead>
                            <TableHead>Observações</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {bulkRows.map((row, index) => (
                            <TableRow key={row.studentId} className="table-row-hover">
                              <TableCell>{index + 1}</TableCell>
                              <TableCell className="font-mono text-xs">
                                {row.enrollment}
                              </TableCell>
                              <TableCell className="text-sm">{row.name}</TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  min={0}
                                  max={20}
                                  step={0.1}
                                  value={row.mac ?? ''}
                                  onChange={(e) => handleBulkCellChange(row.studentId, 'mac', e.target.value)}
                                  className="h-8 text-xs"
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  min={0}
                                  max={20}
                                  step={0.1}
                                  value={row.npt ?? ''}
                                  onChange={(e) => handleBulkCellChange(row.studentId, 'npt', e.target.value)}
                                  className="h-8 text-xs"
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  type="text"
                                  value={row.observations ?? ''}
                                  onChange={(e) => handleBulkCellChange(row.studentId, 'observations', e.target.value)}
                                  className="h-8 text-xs"
                                />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3 pt-2 text-xs text-muted-foreground">
                    <p>
                      Dica: pode deixar linhas em branco para alunos sem nota neste momento. As notas
                      inseridas serão validadas entre 0 e 20.
                    </p>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setIsBulkDialogOpen(false)}
                      >
                        Cancelar
                      </Button>
                      <Button
                        type="submit"
                        size="sm"
                        className="btn-primary"
                        disabled={bulkCreateGradeMutation.isPending}
                      >
                        {bulkCreateGradeMutation.isPending && (
                          <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                        )}
                        Lançar notas seleccionadas
                      </Button>
                    </div>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

        <Card className="card-elevated">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Lançamentos de Notas
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!selectedClass ? (
              <p className="text-muted-foreground text-sm">
                Selecione uma turma para visualizar ou lançar notas.
              </p>
            ) : loadingGrades ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : gradeRows.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                Ainda não existem notas registadas para os filtros seleccionados.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="table-header">
                    <TableHead>Ordem</TableHead>
                    <TableHead>Nº Matrícula</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Disciplina</TableHead>
                    <TableHead>MAC</TableHead>
                    <TableHead>NPT</TableHead>
                    <TableHead>MT1</TableHead>
                    <TableHead>Resultado Final</TableHead>
                    <TableHead>Observações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {gradeRows
                    .filter((row) => {
                      if (!searchTerm) return true;
                      const target = `${row.name} ${row.enrollment}`.toLowerCase();
                      return target.includes(searchTerm.toLowerCase());
                    })
                    .map((row) => (
                      <TableRow
                        key={row.id}
                        className="table-row-hover"
                        onClick={() => setSelectedReportStudentId(row.studentId || null)}
                      >
                        <TableCell>{row.order}</TableCell>
                        <TableCell className="font-mono text-sm">{row.enrollment}</TableCell>
                        <TableCell>{row.name}</TableCell>
                        <TableCell>{row.subject}</TableCell>
                        <TableCell>{row.mac ?? '-'}</TableCell>
                        <TableCell>{row.npt ?? '-'}</TableCell>
                        <TableCell>{row.mt1 != null ? row.mt1.toFixed(1) : '-'}</TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              row.result === 'Aprovado'
                                ? 'border-success text-success'
                                : row.result === 'Reprovado'
                                ? 'border-destructive text-destructive'
                                : ''
                            }
                          >
                            {row.result}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {row.observations || '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Relatórios de desempenho */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="card-elevated">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              Distribuição de Notas (MT1)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {gradeRows.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                Registe algumas notas para ver o gráfico de desempenho.
              </p>
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={performanceDistribution}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" />
                    <YAxis allowDecimals={false} stroke="hsl(var(--muted-foreground))" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: 8,
                      }}
                    />
                    <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="card-elevated">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Relatório por Aluno
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {!selectedReportStudentId ? (
              <p className="text-muted-foreground text-sm">
                Clique numa linha da tabela de notas para ver o histórico detalhado do
                aluno.
              </p>
            ) : reportStudentGrades.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                Ainda não existem registos detalhados para este aluno.
              </p>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow className="table-header">
                      <TableHead>Disciplina</TableHead>
                      <TableHead>Trim.</TableHead>
                      <TableHead>MAC</TableHead>
                      <TableHead>NPT</TableHead>
                      <TableHead>MT1</TableHead>
                      <TableHead>Resultado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reportStudentGrades.map((g) => (
                      <TableRow key={g.id} className="table-row-hover">
                        <TableCell>{g.subject}</TableCell>
                        <TableCell>{g.trimester}º</TableCell>
                        <TableCell>{g.mac ?? '-'}</TableCell>
                        <TableCell>{g.npt ?? '-'}</TableCell>
                        <TableCell>{g.mt1 != null ? g.mt1.toFixed(1) : '-'}</TableCell>
                        <TableCell>{g.result}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <div className="p-3 rounded-lg bg-muted/60 text-xs text-muted-foreground">
                  <p className="font-medium mb-1">Sugestões automáticas:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>
                      Reforce trabalhos contínuos (MAC) com actividades práticas e
                      exercícios semanais.
                    </li>
                    <li>
                      Prepare o aluno para a avaliação escrita (NPT) com simulacros de
                      prova e revisão dirigida.
                    </li>
                  </ul>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Alertas de baixo desempenho */}
      <section>
        <Card className="card-elevated">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              Alertas de Baixo Desempenho
            </CardTitle>
          </CardHeader>
          <CardContent>
            {lowPerformanceAlerts.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                Neste momento não há alunos com média trimestral abaixo de 10.
              </p>
            ) : (
              <ul className="space-y-2 text-sm">
                {lowPerformanceAlerts.map((alert) => (
                  <li
                    key={alert.studentId}
                    className="flex items-center justify-between p-2 rounded-md bg-destructive/10 text-destructive"
                  >
                    <span>
                      {alert.name} &mdash; MT1: {alert.mt1.toFixed(1)}
                    </span>
                    <Badge variant="outline" className="border-destructive text-destructive">
                      Prioridade
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
