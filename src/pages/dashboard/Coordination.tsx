import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, differenceInDays, differenceInMonths, isPast, isFuture } from 'date-fns';
import { pt } from 'date-fns/locale';
import {
  GraduationCap,
  Briefcase,
  BookOpen,
  Users,
  Clock,
  MapPin,
  User,
  Calendar,
  FileText,
  Plus,
  Edit,
  Search,
  Filter,
  ChevronDown,
  AlertCircle,
  CheckCircle,
  Building2,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { toast } from 'sonner';

interface Estagio {
  id: string;
  student_id: string;
  local_estagio: string | null;
  tempo_estagio_meses: number | null;
  data_inicio: string | null;
  data_termino: string | null;
  supervisor_nome: string | null;
  supervisor_contacto: string | null;
  observacoes: string | null;
  status: string;
}

interface TrabalhoFimCurso {
  id: string;
  student_id: string;
  tema: string | null;
  tutor_id: string | null;
  data_defesa: string | null;
  nota_final: number | null;
  status: string;
  observacoes: string | null;
  tutor?: {
    id: string;
    full_name: string;
  };
}

interface Student13 {
  id: string;
  full_name: string;
  enrollment_number: string;
  photo_url: string | null;
  class?: {
    id: string;
    section: string;
    period: string;
    course?: {
      id: string;
      name: string;
    };
  };
  estagio?: Estagio;
  tfc?: TrabalhoFimCurso;
}

export function Coordination() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCourseId, setSelectedCourseId] = useState<string>('all');
  const [selectedTab, setSelectedTab] = useState('overview');
  
  // Dialog states
  const [isEstagioDialogOpen, setIsEstagioDialogOpen] = useState(false);
  const [isTfcDialogOpen, setIsTfcDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student13 | null>(null);
  
  // Form states
  const [estagioForm, setEstagioForm] = useState({
    local_estagio: '',
    tempo_estagio_meses: '',
    data_inicio: '',
    data_termino: '',
    supervisor_nome: '',
    supervisor_contacto: '',
    observacoes: '',
    status: 'pendente',
  });
  
  const [tfcForm, setTfcForm] = useState({
    tema: '',
    tutor_id: '',
    data_defesa: '',
    observacoes: '',
    status: 'em_elaboracao',
  });

  // Fetch 13th grade students
  const { data: students13, isLoading: isLoadingStudents } = useQuery({
    queryKey: ['students-13'],
    queryFn: async () => {
      const { data: classes, error: classesError } = await supabase
        .from('classes')
        .select('id')
        .eq('grade_level', 13);

      if (classesError) throw classesError;
      
      const classIds = classes?.map(c => c.id) || [];
      
      if (classIds.length === 0) return [];

      const { data: students, error: studentsError } = await supabase
        .from('students')
        .select(`
          id,
          full_name,
          enrollment_number,
          photo_url,
          class_id
        `)
        .in('class_id', classIds)
        .eq('status', 'active');

      if (studentsError) throw studentsError;
      
      // Fetch class details
      const { data: classDetails } = await supabase
        .from('classes')
        .select(`
          id,
          section,
          period,
          course_id
        `)
        .in('id', classIds);

      // Fetch courses
      const courseIds = [...new Set(classDetails?.map(c => c.course_id) || [])];
      const { data: courses } = await supabase
        .from('courses')
        .select('id, name')
        .in('id', courseIds);

      // Fetch estagios
      const studentIds = students?.map(s => s.id) || [];
      const { data: estagios } = await supabase
        .from('estagios')
        .select('*')
        .in('student_id', studentIds);

      // Fetch TFCs
      const { data: tfcs } = await supabase
        .from('trabalhos_fim_curso')
        .select('*')
        .in('student_id', studentIds);

      // Fetch tutors for TFCs
      const tutorIds = [...new Set(tfcs?.map(t => t.tutor_id).filter(Boolean) || [])];
      const { data: tutors } = await supabase
        .from('teachers')
        .select('id, full_name')
        .in('id', tutorIds);

      // Map everything together
      return students?.map(student => {
        const classInfo = classDetails?.find(c => c.id === student.class_id);
        const course = courses?.find(c => c.id === classInfo?.course_id);
        const estagio = estagios?.find(e => e.student_id === student.id);
        const tfc = tfcs?.find(t => t.student_id === student.id);
        const tutor = tutors?.find(t => t.id === tfc?.tutor_id);

        return {
          ...student,
          class: classInfo ? {
            ...classInfo,
            course,
          } : undefined,
          estagio,
          tfc: tfc ? {
            ...tfc,
            tutor,
          } : undefined,
        };
      }) as Student13[];
    },
  });

  // Fetch teachers for tutor selection
  const { data: teachers } = useQuery({
    queryKey: ['teachers-tutors'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('teachers')
        .select('id, full_name')
        .eq('is_active', true)
        .order('full_name');
      
      if (error) throw error;
      return data;
    },
  });

  // Fetch courses for filter
  const { data: courses } = useQuery({
    queryKey: ['courses-coordination'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('courses')
        .select('id, name')
        .order('name');
      
      if (error) throw error;
      return data;
    },
  });

  // Create/Update Estagio mutation
  const estagioMutation = useMutation({
    mutationFn: async ({ studentId, data, isUpdate }: { studentId: string; data: any; isUpdate: boolean }) => {
      if (isUpdate && selectedStudent?.estagio?.id) {
        const { error } = await supabase
          .from('estagios')
          .update(data)
          .eq('id', selectedStudent.estagio.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('estagios')
          .insert({ ...data, student_id: studentId });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students-13'] });
      setIsEstagioDialogOpen(false);
      toast.success('Informações de estágio guardadas com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao guardar informações de estágio');
      console.error(error);
    },
  });

  // Create/Update TFC mutation
  const tfcMutation = useMutation({
    mutationFn: async ({ studentId, data, isUpdate }: { studentId: string; data: any; isUpdate: boolean }) => {
      if (isUpdate && selectedStudent?.tfc?.id) {
        const { error } = await supabase
          .from('trabalhos_fim_curso')
          .update(data)
          .eq('id', selectedStudent.tfc.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('trabalhos_fim_curso')
          .insert({ ...data, student_id: studentId });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students-13'] });
      setIsTfcDialogOpen(false);
      toast.success('Informações de TFC guardadas com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao guardar informações de TFC');
      console.error(error);
    },
  });

  // Filter students
  const filteredStudents = useMemo(() => {
    if (!students13) return [];
    
    return students13.filter(student => {
      const matchesSearch = student.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.enrollment_number.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCourse = selectedCourseId === 'all' || student.class?.course?.id === selectedCourseId;
      
      return matchesSearch && matchesCourse;
    });
  }, [students13, searchTerm, selectedCourseId]);

  // Calculate statistics
  const stats = useMemo(() => {
    if (!students13) return { total: 0, comEstagio: 0, comTfc: 0, estagioEmCurso: 0, tfcEntregue: 0 };
    
    return {
      total: students13.length,
      comEstagio: students13.filter(s => s.estagio).length,
      comTfc: students13.filter(s => s.tfc).length,
      estagioEmCurso: students13.filter(s => s.estagio?.status === 'em_curso').length,
      tfcEntregue: students13.filter(s => s.tfc?.status === 'entregue' || s.tfc?.status === 'defendido' || s.tfc?.status === 'aprovado').length,
    };
  }, [students13]);

  // Calculate remaining time for internship
  const calcularTempoRestante = (dataTermino: string | null) => {
    if (!dataTermino) return null;
    
    const termino = new Date(dataTermino);
    const hoje = new Date();
    
    if (isPast(termino)) {
      return { texto: 'Concluído', tipo: 'concluido' };
    }
    
    const diasRestantes = differenceInDays(termino, hoje);
    const mesesRestantes = differenceInMonths(termino, hoje);
    
    if (diasRestantes <= 7) {
      return { texto: `${diasRestantes} dias restantes`, tipo: 'urgente' };
    } else if (mesesRestantes < 1) {
      return { texto: `${diasRestantes} dias restantes`, tipo: 'proximo' };
    } else {
      return { texto: `${mesesRestantes} meses restantes`, tipo: 'normal' };
    }
  };

  const handleOpenEstagioDialog = (student: Student13) => {
    setSelectedStudent(student);
    if (student.estagio) {
      setEstagioForm({
        local_estagio: student.estagio.local_estagio || '',
        tempo_estagio_meses: student.estagio.tempo_estagio_meses?.toString() || '',
        data_inicio: student.estagio.data_inicio || '',
        data_termino: student.estagio.data_termino || '',
        supervisor_nome: student.estagio.supervisor_nome || '',
        supervisor_contacto: student.estagio.supervisor_contacto || '',
        observacoes: student.estagio.observacoes || '',
        status: student.estagio.status || 'pendente',
      });
    } else {
      setEstagioForm({
        local_estagio: '',
        tempo_estagio_meses: '',
        data_inicio: '',
        data_termino: '',
        supervisor_nome: '',
        supervisor_contacto: '',
        observacoes: '',
        status: 'pendente',
      });
    }
    setIsEstagioDialogOpen(true);
  };

  const handleOpenTfcDialog = (student: Student13) => {
    setSelectedStudent(student);
    if (student.tfc) {
      setTfcForm({
        tema: student.tfc.tema || '',
        tutor_id: student.tfc.tutor_id || '',
        data_defesa: student.tfc.data_defesa || '',
        observacoes: student.tfc.observacoes || '',
        status: student.tfc.status || 'em_elaboracao',
      });
    } else {
      setTfcForm({
        tema: '',
        tutor_id: '',
        data_defesa: '',
        observacoes: '',
        status: 'em_elaboracao',
      });
    }
    setIsTfcDialogOpen(true);
  };

  const handleSaveEstagio = () => {
    if (!selectedStudent) return;
    
    const data = {
      local_estagio: estagioForm.local_estagio || null,
      tempo_estagio_meses: estagioForm.tempo_estagio_meses ? parseInt(estagioForm.tempo_estagio_meses) : null,
      data_inicio: estagioForm.data_inicio || null,
      data_termino: estagioForm.data_termino || null,
      supervisor_nome: estagioForm.supervisor_nome || null,
      supervisor_contacto: estagioForm.supervisor_contacto || null,
      observacoes: estagioForm.observacoes || null,
      status: estagioForm.status,
    };
    
    estagioMutation.mutate({
      studentId: selectedStudent.id,
      data,
      isUpdate: !!selectedStudent.estagio,
    });
  };

  const handleSaveTfc = () => {
    if (!selectedStudent) return;
    
    const data = {
      tema: tfcForm.tema || null,
      tutor_id: tfcForm.tutor_id || null,
      data_defesa: tfcForm.data_defesa || null,
      observacoes: tfcForm.observacoes || null,
      status: tfcForm.status,
    };
    
    tfcMutation.mutate({
      studentId: selectedStudent.id,
      data,
      isUpdate: !!selectedStudent.tfc,
    });
  };

  const getStatusBadge = (status: string, type: 'estagio' | 'tfc') => {
    const estagioColors: Record<string, string> = {
      pendente: 'bg-yellow-100 text-yellow-800',
      em_curso: 'bg-blue-100 text-blue-800',
      concluido: 'bg-green-100 text-green-800',
      cancelado: 'bg-red-100 text-red-800',
    };
    
    const tfcColors: Record<string, string> = {
      em_elaboracao: 'bg-yellow-100 text-yellow-800',
      entregue: 'bg-blue-100 text-blue-800',
      defendido: 'bg-purple-100 text-purple-800',
      aprovado: 'bg-green-100 text-green-800',
      reprovado: 'bg-red-100 text-red-800',
    };
    
    const estagioLabels: Record<string, string> = {
      pendente: 'Pendente',
      em_curso: 'Em Curso',
      concluido: 'Concluído',
      cancelado: 'Cancelado',
    };
    
    const tfcLabels: Record<string, string> = {
      em_elaboracao: 'Em Elaboração',
      entregue: 'Entregue',
      defendido: 'Defendido',
      aprovado: 'Aprovado',
      reprovado: 'Reprovado',
    };
    
    const colors = type === 'estagio' ? estagioColors : tfcColors;
    const labels = type === 'estagio' ? estagioLabels : tfcLabels;
    
    return (
      <Badge className={colors[status] || 'bg-gray-100 text-gray-800'}>
        {labels[status] || status}
      </Badge>
    );
  };

  if (isLoadingStudents) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Coordenação - 13ª Classe</h1>
          <p className="text-muted-foreground">
            Gestão de estágios e trabalhos de fim de curso
          </p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Alunos</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-blue-100">
                <Briefcase className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Com Estágio</p>
                <p className="text-2xl font-bold">{stats.comEstagio}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-green-100">
                <Clock className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Estágio em Curso</p>
                <p className="text-2xl font-bold">{stats.estagioEmCurso}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-purple-100">
                <BookOpen className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Com TFC</p>
                <p className="text-2xl font-bold">{stats.comTfc}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-emerald-100">
                <CheckCircle className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">TFC Entregue</p>
                <p className="text-2xl font-bold">{stats.tfcEntregue}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Pesquisar por nome ou número..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={selectedCourseId} onValueChange={setSelectedCourseId}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Filtrar por curso" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os cursos</SelectItem>
                {courses?.map((course) => (
                  <SelectItem key={course.id} value={course.id}>
                    {course.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="estagios">Estágios</TabsTrigger>
          <TabsTrigger value="tfcs">Trabalhos de Fim de Curso</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Alunos da 13ª Classe</CardTitle>
              <CardDescription>
                Lista completa de alunos com informações de estágio e TFC
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Aluno</TableHead>
                    <TableHead>Curso / Turma</TableHead>
                    <TableHead>Estágio</TableHead>
                    <TableHead>TFC</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.map((student) => {
                    const tempoRestante = calcularTempoRestante(student.estagio?.data_termino || null);
                    
                    return (
                      <TableRow key={student.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <span className="text-primary font-medium">
                                {student.full_name.charAt(0)}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium">{student.full_name}</p>
                              <p className="text-sm text-muted-foreground">{student.enrollment_number}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="font-medium">{student.class?.course?.name || 'N/A'}</p>
                          <p className="text-sm text-muted-foreground">
                            Turma {student.class?.section} - {student.class?.period}
                          </p>
                        </TableCell>
                        <TableCell>
                          {student.estagio ? (
                            <div className="space-y-1">
                              {getStatusBadge(student.estagio.status, 'estagio')}
                              {tempoRestante && (
                                <p className={`text-xs ${
                                  tempoRestante.tipo === 'urgente' ? 'text-red-600' :
                                  tempoRestante.tipo === 'proximo' ? 'text-yellow-600' :
                                  tempoRestante.tipo === 'concluido' ? 'text-green-600' :
                                  'text-muted-foreground'
                                }`}>
                                  {tempoRestante.texto}
                                </p>
                              )}
                            </div>
                          ) : (
                            <Badge variant="outline" className="text-muted-foreground">
                              Não registado
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {student.tfc ? (
                            <div className="space-y-1">
                              {getStatusBadge(student.tfc.status, 'tfc')}
                              {student.tfc.tutor && (
                                <p className="text-xs text-muted-foreground">
                                  Tutor: {student.tfc.tutor.full_name}
                                </p>
                              )}
                            </div>
                          ) : (
                            <Badge variant="outline" className="text-muted-foreground">
                              Não registado
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenEstagioDialog(student)}
                            >
                              <Briefcase className="w-4 h-4 mr-1" />
                              Estágio
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenTfcDialog(student)}
                            >
                              <BookOpen className="w-4 h-4 mr-1" />
                              TFC
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              
              {filteredStudents.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum aluno encontrado
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Estágios Tab */}
        <TabsContent value="estagios" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="w-5 h-5" />
                Estágios Curriculares
              </CardTitle>
              <CardDescription>
                Acompanhamento detalhado dos estágios
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Aluno</TableHead>
                    <TableHead>Local de Estágio</TableHead>
                    <TableHead>Período</TableHead>
                    <TableHead>Tempo Restante</TableHead>
                    <TableHead>Supervisor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.filter(s => s.estagio).map((student) => {
                    const tempoRestante = calcularTempoRestante(student.estagio?.data_termino || null);
                    
                    return (
                      <TableRow key={student.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{student.full_name}</p>
                            <p className="text-sm text-muted-foreground">{student.enrollment_number}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-muted-foreground" />
                            <span>{student.estagio?.local_estagio || 'N/A'}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {student.estagio?.data_inicio && student.estagio?.data_termino ? (
                              <>
                                <p>{format(new Date(student.estagio.data_inicio), 'dd/MM/yyyy', { locale: pt })}</p>
                                <p className="text-muted-foreground">
                                  até {format(new Date(student.estagio.data_termino), 'dd/MM/yyyy', { locale: pt })}
                                </p>
                              </>
                            ) : (
                              <span className="text-muted-foreground">N/A</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {tempoRestante && (
                            <Badge className={
                              tempoRestante.tipo === 'urgente' ? 'bg-red-100 text-red-800' :
                              tempoRestante.tipo === 'proximo' ? 'bg-yellow-100 text-yellow-800' :
                              tempoRestante.tipo === 'concluido' ? 'bg-green-100 text-green-800' :
                              'bg-blue-100 text-blue-800'
                            }>
                              {tempoRestante.texto}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <p>{student.estagio?.supervisor_nome || 'N/A'}</p>
                            {student.estagio?.supervisor_contacto && (
                              <p className="text-muted-foreground">{student.estagio.supervisor_contacto}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(student.estagio?.status || 'pendente', 'estagio')}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenEstagioDialog(student)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              
              {filteredStudents.filter(s => s.estagio).length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum estágio registado
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TFCs Tab */}
        <TabsContent value="tfcs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                Trabalhos de Fim de Curso
              </CardTitle>
              <CardDescription>
                Acompanhamento dos TFCs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Aluno</TableHead>
                    <TableHead>Tema</TableHead>
                    <TableHead>Tutor</TableHead>
                    <TableHead>Data de Defesa</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.filter(s => s.tfc).map((student) => (
                    <TableRow key={student.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{student.full_name}</p>
                          <p className="text-sm text-muted-foreground">{student.enrollment_number}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="max-w-xs truncate" title={student.tfc?.tema || ''}>
                          {student.tfc?.tema || 'N/A'}
                        </p>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-muted-foreground" />
                          <span>{student.tfc?.tutor?.full_name || 'N/A'}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {student.tfc?.data_defesa ? (
                          format(new Date(student.tfc.data_defesa), 'dd/MM/yyyy', { locale: pt })
                        ) : (
                          <span className="text-muted-foreground">Não definida</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(student.tfc?.status || 'em_elaboracao', 'tfc')}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenTfcDialog(student)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              {filteredStudents.filter(s => s.tfc).length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum TFC registado
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Estágio Dialog */}
      <Dialog open={isEstagioDialogOpen} onOpenChange={setIsEstagioDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Briefcase className="w-5 h-5" />
              {selectedStudent?.estagio ? 'Editar' : 'Adicionar'} Estágio Curricular
            </DialogTitle>
            <DialogDescription>
              {selectedStudent?.full_name} - {selectedStudent?.enrollment_number}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="col-span-2">
              <Label htmlFor="local_estagio">Local de Estágio</Label>
              <Input
                id="local_estagio"
                value={estagioForm.local_estagio}
                onChange={(e) => setEstagioForm({ ...estagioForm, local_estagio: e.target.value })}
                placeholder="Nome da empresa/instituição"
              />
            </div>
            
            <div>
              <Label htmlFor="tempo_estagio_meses">Duração (meses)</Label>
              <Input
                id="tempo_estagio_meses"
                type="number"
                value={estagioForm.tempo_estagio_meses}
                onChange={(e) => setEstagioForm({ ...estagioForm, tempo_estagio_meses: e.target.value })}
                placeholder="Ex: 3"
              />
            </div>
            
            <div>
              <Label htmlFor="status_estagio">Status</Label>
              <Select
                value={estagioForm.status}
                onValueChange={(value) => setEstagioForm({ ...estagioForm, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="em_curso">Em Curso</SelectItem>
                  <SelectItem value="concluido">Concluído</SelectItem>
                  <SelectItem value="cancelado">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="data_inicio">Data de Início</Label>
              <Input
                id="data_inicio"
                type="date"
                value={estagioForm.data_inicio}
                onChange={(e) => setEstagioForm({ ...estagioForm, data_inicio: e.target.value })}
              />
            </div>
            
            <div>
              <Label htmlFor="data_termino">Data de Término</Label>
              <Input
                id="data_termino"
                type="date"
                value={estagioForm.data_termino}
                onChange={(e) => setEstagioForm({ ...estagioForm, data_termino: e.target.value })}
              />
            </div>
            
            <div>
              <Label htmlFor="supervisor_nome">Nome do Supervisor</Label>
              <Input
                id="supervisor_nome"
                value={estagioForm.supervisor_nome}
                onChange={(e) => setEstagioForm({ ...estagioForm, supervisor_nome: e.target.value })}
                placeholder="Nome completo"
              />
            </div>
            
            <div>
              <Label htmlFor="supervisor_contacto">Contacto do Supervisor</Label>
              <Input
                id="supervisor_contacto"
                value={estagioForm.supervisor_contacto}
                onChange={(e) => setEstagioForm({ ...estagioForm, supervisor_contacto: e.target.value })}
                placeholder="Telefone ou email"
              />
            </div>
            
            <div className="col-span-2">
              <Label htmlFor="observacoes_estagio">Observações</Label>
              <Textarea
                id="observacoes_estagio"
                value={estagioForm.observacoes}
                onChange={(e) => setEstagioForm({ ...estagioForm, observacoes: e.target.value })}
                placeholder="Notas adicionais..."
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEstagioDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveEstagio} disabled={estagioMutation.isPending}>
              {estagioMutation.isPending ? 'A guardar...' : 'Guardar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* TFC Dialog */}
      <Dialog open={isTfcDialogOpen} onOpenChange={setIsTfcDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              {selectedStudent?.tfc ? 'Editar' : 'Adicionar'} Trabalho de Fim de Curso
            </DialogTitle>
            <DialogDescription>
              {selectedStudent?.full_name} - {selectedStudent?.enrollment_number}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="col-span-2">
              <Label htmlFor="tema">Tema do Trabalho</Label>
              <Textarea
                id="tema"
                value={tfcForm.tema}
                onChange={(e) => setTfcForm({ ...tfcForm, tema: e.target.value })}
                placeholder="Título completo do trabalho de fim de curso"
                rows={2}
              />
            </div>
            
            <div>
              <Label htmlFor="tutor_id">Tutor</Label>
              <Select
                value={tfcForm.tutor_id}
                onValueChange={(value) => setTfcForm({ ...tfcForm, tutor_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar tutor" />
                </SelectTrigger>
                <SelectContent>
                  {teachers?.map((teacher) => (
                    <SelectItem key={teacher.id} value={teacher.id}>
                      {teacher.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="status_tfc">Status</Label>
              <Select
                value={tfcForm.status}
                onValueChange={(value) => setTfcForm({ ...tfcForm, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="em_elaboracao">Em Elaboração</SelectItem>
                  <SelectItem value="entregue">Entregue</SelectItem>
                  <SelectItem value="defendido">Defendido</SelectItem>
                  <SelectItem value="aprovado">Aprovado</SelectItem>
                  <SelectItem value="reprovado">Reprovado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="data_defesa">Data de Defesa</Label>
              <Input
                id="data_defesa"
                type="date"
                value={tfcForm.data_defesa}
                onChange={(e) => setTfcForm({ ...tfcForm, data_defesa: e.target.value })}
              />
            </div>
            
            <div className="col-span-2">
              <Label htmlFor="observacoes_tfc">Observações</Label>
              <Textarea
                id="observacoes_tfc"
                value={tfcForm.observacoes}
                onChange={(e) => setTfcForm({ ...tfcForm, observacoes: e.target.value })}
                placeholder="Notas adicionais..."
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsTfcDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveTfc} disabled={tfcMutation.isPending}>
              {tfcMutation.isPending ? 'A guardar...' : 'Guardar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
