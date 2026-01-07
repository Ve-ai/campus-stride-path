import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Filter,
  Plus,
  ChevronRight,
  Users,
  TrendingUp,
  TrendingDown,
  MoreHorizontal,
  Download,
  GraduationCap,
  Loader2,
} from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
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
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useCourses, useTeachers, useSchoolNuclei, useClasses, useStudents, useSubjects, useDeleteCourse } from '@/hooks/useDatabase';
import { toast } from "@/lib/notifications";
import { CourseEditForm } from './CourseEditForm';

export function Courses() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [editingCourse, setEditingCourse] = useState<any | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>([]);
  const [singleCourseId, setSingleCourseId] = useState<string>('');
  const [exportDocumentType, setExportDocumentType] = useState<'mini' | 'final' | 'trimestral'>('mini');
  const [selectedTrimester, setSelectedTrimester] = useState<string>('');
  type GradeConfig = {
    subjects: string[];
    subjectsInput: string;
    monthlyFee: string;
    morningSections: string;
    afternoonSections: string;
    internshipFee?: string;
    credentialFee?: string;
    defenseEntryFee?: string;
    tutorFee?: string;
  };

  const [newCourse, setNewCourse] = useState({
    name: '',
    coordinator_id: '',
  });

  const [gradeConfigs, setGradeConfigs] = useState<Record<'10' | '11' | '12' | '13', GradeConfig>>({
    '10': {
      subjects: [],
      subjectsInput: '',
      monthlyFee: '',
      morningSections: '',
      afternoonSections: '',
    },
    '11': {
      subjects: [],
      subjectsInput: '',
      monthlyFee: '',
      morningSections: '',
      afternoonSections: '',
      internshipFee: '',
    },
    '12': {
      subjects: [],
      subjectsInput: '',
      monthlyFee: '',
      morningSections: '',
      afternoonSections: '',
      internshipFee: '',
    },
    '13': {
      subjects: [],
      subjectsInput: '',
      monthlyFee: '',
      morningSections: '',
      afternoonSections: '',
      internshipFee: '',
      defenseEntryFee: '',
      tutorFee: '',
    },
  });

  const { data: courses, isLoading: loadingCourses } = useCourses();
  const { data: teachers } = useTeachers();
  const { data: nuclei } = useSchoolNuclei();
  const { data: classes } = useClasses();
  const { data: students } = useStudents();
  const { data: subjects } = useSubjects();
  const deleteCourse = useDeleteCourse();

  // Calculate statistics for each course
  const coursesWithStats = React.useMemo(() => {
    if (!courses) return [];

    return courses.map(course => {
      const courseClasses = classes?.filter(c => c.course_id === course.id) || [];
      const classIds = courseClasses.map(c => c.id);
      const courseStudents = students?.filter(s => classIds.includes(s.class_id || '')) || [];
      const activeStudents = courseStudents.filter(s => s.status === 'active');
      const dropouts = courseStudents.filter(s => s.status === 'dropout');
      const males = courseStudents.filter(s => s.gender === 'Masculino');
      const females = courseStudents.filter(s => s.gender === 'Feminino');
      const courseSubjects = subjects?.filter(s => s.course_id === course.id) || [];

      return {
        ...course,
        totalStudents: courseStudents.length,
        activeStudents: activeStudents.length,
        males: males.length,
        females: females.length,
        dropouts: dropouts.length,
        dropoutRate: courseStudents.length > 0 
          ? ((dropouts.length / courseStudents.length) * 100).toFixed(1) 
          : '0.0',
        totalClasses: courseClasses.length,
        totalSubjects: courseSubjects.length,
        coordinatorName: course.coordinator?.profiles?.full_name || 'Não atribuído',
        nucleusName: nuclei?.find(n => n.id === course.school_nucleus_id)?.name || '-',
      };
    });
  }, [courses, classes, students, subjects, nuclei]);

  const normalizedSearch = searchTerm.trim().toLowerCase();

  const filteredCourses = React.useMemo(() => {
    if (!coursesWithStats) return [];

    if (!normalizedSearch) return coursesWithStats;

    // Quando há alunos e turmas, tentar filtrar pelo aluno (nome / matrícula / BI)
    if (students && classes) {
      const matchedStudents = students.filter((s) => {
        const fullName = s.full_name?.toLowerCase() || '';
        const enrollment = s.enrollment_number?.toLowerCase() || '';
        const bi = (s.bi_number as string | null)?.toLowerCase() || '';
        return (
          fullName.includes(normalizedSearch) ||
          enrollment.includes(normalizedSearch) ||
          bi.includes(normalizedSearch)
        );
      });

      if (matchedStudents.length > 0) {
        const classIds = new Set(
          matchedStudents
            .map((s) => s.class_id || '')
            .filter((id): id is string => !!id),
        );

        const courseIds = new Set(
          classes
            ?.filter((c) => classIds.has(c.id))
            .map((c) => c.course_id) || [],
        );

        return coursesWithStats.filter((course) => courseIds.has(course.id));
      }
    }

    // Fallback: pesquisa normal por nome de curso ou coordenador
    return coursesWithStats.filter(
      (course) =>
        course.name.toLowerCase().includes(normalizedSearch) ||
        course.coordinatorName.toLowerCase().includes(normalizedSearch),
    );
  }, [coursesWithStats, normalizedSearch, students, classes]);

  // Summary stats
  const totalStudents = filteredCourses.reduce((sum, c) => sum + c.totalStudents, 0);
  const totalMales = filteredCourses.reduce((sum, c) => sum + c.males, 0);
  const totalFemales = filteredCourses.reduce((sum, c) => sum + c.females, 0);
  const totalDropouts = filteredCourses.reduce((sum, c) => sum + c.dropouts, 0);

  const parseList = (value: string) =>
    value
      .split(',')
      .map((item) => item.trim())
      .filter((item) => item.length > 0);

  const handleConfirmCourse = async () => {
    if (!newCourse.name.trim()) {
      toast.error('O nome do curso é obrigatório');
      return;
    }

    try {
      const { data: createdCourse, error } = await supabase
        .from('courses')
        .insert({
          name: newCourse.name,
          coordinator_id: newCourse.coordinator_id || undefined,
          monthly_fee_10: gradeConfigs['10'].monthlyFee
            ? parseFloat(gradeConfigs['10'].monthlyFee)
            : 0,
          monthly_fee_11: gradeConfigs['11'].monthlyFee
            ? parseFloat(gradeConfigs['11'].monthlyFee)
            : 0,
          monthly_fee_12: gradeConfigs['12'].monthlyFee
            ? parseFloat(gradeConfigs['12'].monthlyFee)
            : 0,
          monthly_fee_13: gradeConfigs['13'].monthlyFee
            ? parseFloat(gradeConfigs['13'].monthlyFee)
            : 0,
          internship_fee: gradeConfigs['11'].internshipFee
            ? parseFloat(gradeConfigs['11'].internshipFee)
            : undefined,
          credential_fee: gradeConfigs['11'].credentialFee
            ? parseFloat(gradeConfigs['11'].credentialFee)
            : undefined,
          defense_entry_fee: gradeConfigs['13'].defenseEntryFee
            ? parseFloat(gradeConfigs['13'].defenseEntryFee)
            : undefined,
          tutor_fee: gradeConfigs['13'].tutorFee
            ? parseFloat(gradeConfigs['13'].tutorFee)
            : undefined,
        })
        .select()
        .single();

      if (error) throw error;

      const courseId = createdCourse.id as string;
      const academicYear = new Date().getFullYear();

      // Create subjects for each grade
      const subjectsPayload = Object.entries(gradeConfigs).flatMap(
        ([grade, config]) =>
          config.subjects.map((name) => ({
            course_id: courseId,
            name,
            grade_level: Number(grade),
          })),
      );

      if (subjectsPayload.length > 0) {
        const { error: subjectsError } = await supabase
          .from('subjects')
          .insert(subjectsPayload);
        if (subjectsError) throw subjectsError;
      }

      // Create classes based on periods and turmas
      const classesPayload: any[] = [];
      (['10', '11', '12'] as const).forEach((grade) => {
        const config = gradeConfigs[grade];
        const morningSections = parseList(config.morningSections);
        const afternoonSections = parseList(config.afternoonSections);

        morningSections.forEach((section) => {
          classesPayload.push({
            course_id: courseId,
            grade_level: Number(grade),
            section: section.toUpperCase(),
            period: 'Manhã',
            academic_year: academicYear,
          });
        });

        afternoonSections.forEach((section) => {
          classesPayload.push({
            course_id: courseId,
            grade_level: Number(grade),
            section: section.toUpperCase(),
            period: 'Tarde',
            academic_year: academicYear,
          });
        });
      });

      if (classesPayload.length > 0) {
        const { error: classesError } = await supabase
          .from('classes')
          .insert(classesPayload);
        if (classesError) throw classesError;
      }

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['courses'] }),
        queryClient.invalidateQueries({ queryKey: ['classes'] }),
        queryClient.invalidateQueries({ queryKey: ['subjects'] }),
        queryClient.invalidateQueries({ queryKey: ['statistics'] }),
      ]);

      toast.success('Curso e estrutura académica criados com sucesso!');
      setIsAddDialogOpen(false);
      setWizardStep(1);
      setNewCourse({
        name: '',
        coordinator_id: '',
      });
      setGradeConfigs({
        '10': {
          subjects: [],
          subjectsInput: '',
          monthlyFee: '',
          morningSections: '',
          afternoonSections: '',
        },
        '11': {
          subjects: [],
          subjectsInput: '',
          monthlyFee: '',
          morningSections: '',
          afternoonSections: '',
          internshipFee: '',
        },
        '12': {
          subjects: [],
          subjectsInput: '',
          monthlyFee: '',
          morningSections: '',
          afternoonSections: '',
          internshipFee: '',
        },
        '13': {
          subjects: [],
          subjectsInput: '',
          monthlyFee: '',
          morningSections: '',
          afternoonSections: '',
          internshipFee: '',
          defenseEntryFee: '',
          tutorFee: '',
        },
      });
    } catch (err: any) {
      toast.error('Erro ao guardar curso: ' + err.message);
    }
  };

  if (loadingCourses) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const handleCourseRowClick = (courseId: string) => {
    if (normalizedSearch && students && classes) {
      const matchedStudents = students.filter((s) => {
        const fullName = s.full_name?.toLowerCase() || '';
        const enrollment = s.enrollment_number?.toLowerCase() || '';
        const bi = (s.bi_number as string | null)?.toLowerCase() || '';
        return (
          fullName.includes(normalizedSearch) ||
          enrollment.includes(normalizedSearch) ||
          bi.includes(normalizedSearch)
        );
      });

      const matchingForCourse = matchedStudents.filter((s) => {
        if (!s.class_id) return false;
        const cls = classes.find((c) => c.id === s.class_id);
        return cls?.course_id === courseId;
      });

      if (matchingForCourse.length > 0 && matchingForCourse[0].class_id) {
        navigate(`/dashboard/turmas/${matchingForCourse[0].class_id}`);
        return;
      }
    }

    navigate(`/dashboard/cursos/${courseId}`);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Cursos</h1>
          <p className="text-muted-foreground">Gestão de cursos e suas turmas</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
          setIsAddDialogOpen(open);
          if (!open) {
            setWizardStep(1);
          }
        }}>
          <DialogTrigger asChild>
            <Button className="btn-primary">
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Curso
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Configurar Novo Curso</DialogTitle>
            </DialogHeader>

            {/* Step indicator */}
            <div className="flex items-center justify-between mb-4 text-sm text-muted-foreground">
              <span>
                {wizardStep === 1 && 'Passo 1 de 5 — Dados do Curso'}
                {wizardStep === 2 && 'Passo 2 de 5 — Configuração 10ª Classe'}
                {wizardStep === 3 && 'Passo 3 de 5 — Configuração 11ª Classe'}
                {wizardStep === 4 && 'Passo 4 de 5 — Configuração 12ª Classe'}
                {wizardStep === 5 && 'Passo 5 de 5 — Configuração 13ª Classe'}
              </span>
            </div>

            {/* Step 1: basic course data */}
            {wizardStep === 1 && (
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label>Nome do Curso *</Label>
                  <Input
                    placeholder="Ex: Enfermagem Geral"
                    value={newCourse.name}
                    onChange={(e) =>
                      setNewCourse((c) => ({ ...c, name: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Coordenador</Label>
                  <Select
                    value={newCourse.coordinator_id}
                    onValueChange={(v) =>
                      setNewCourse((c) => ({ ...c, coordinator_id: v }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o coordenador" />
                    </SelectTrigger>
                    <SelectContent>
                      {teachers?.map((teacher) => (
                        <SelectItem key={teacher.id} value={teacher.id}>
                          {teacher.profiles?.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* Helper to render grade configuration blocks */}
            {wizardStep >= 2 && wizardStep <= 5 && (
              <div className="space-y-6 py-2">
                {(['10', '11', '12', '13'] as const)
                  .filter((grade) => {
                    if (wizardStep === 2) return grade === '10';
                    if (wizardStep === 3) return grade === '11';
                    if (wizardStep === 4) return grade === '12';
                    return grade === '13';
                  })
                  .map((grade) => {
                    const config = gradeConfigs[grade];
                    const setConfig = (partial: Partial<GradeConfig>) => {
                      setGradeConfigs((prev) => ({
                        ...prev,
                        [grade]: { ...prev[grade], ...partial },
                      }));
                    };

                    const gradeLabel = `${grade}ª Classe`;

                    return (
                      <Card key={grade} className="card-elevated">
                        <CardHeader>
                          <CardTitle>{gradeLabel}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="space-y-2">
                            <Label>Disciplinas do Curso</Label>
                            <div className="flex gap-2">
                              <Input
                                placeholder="Ex: Matemática, Fisica, Química"
                                value={config.subjectsInput}
                                onChange={(e) => setConfig({ subjectsInput: e.target.value })}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    const items = parseList(config.subjectsInput);
                                    if (items.length > 0) {
                                      setConfig({
                                        subjects: [...config.subjects, ...items],
                                        subjectsInput: '',
                                      });
                                    }
                                  }
                                }}
                              />
                              <Button
                                type="button"
                                className="btn-accent"
                                onClick={() => {
                                  const items = parseList(config.subjectsInput);
                                  if (items.length === 0) return;
                                  setConfig({
                                    subjects: [...config.subjects, ...items],
                                    subjectsInput: '',
                                  });
                                }}
                              >
                                Adicionar
                              </Button>
                            </div>
                            {config.subjects.length > 0 && (
                              <div className="flex flex-wrap gap-2 mt-2">
                                {config.subjects.map((subject) => (
                                  <Badge
                                    key={subject}
                                    variant="outline"
                                    className="flex items-center gap-1"
                                  >
                                    <span>{subject}</span>
                                    <button
                                      type="button"
                                      className="text-xs text-destructive ml-1"
                                      onClick={() =>
                                        setConfig({
                                          subjects: config.subjects.filter(
                                            (s) => s !== subject,
                                          ),
                                        })
                                      }
                                    >
                                      remover
                                    </button>
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>

                          <div className="space-y-2">
                            <Label>Mensalidade</Label>
                            <Input
                              type="number"
                              placeholder="Ex: 5000"
                              value={config.monthlyFee}
                              onChange={(e) => setConfig({ monthlyFee: e.target.value })}
                              onFocus={(e) => e.target.select()}
                            />
                          </div>

                          {(grade === '11' || grade === '12') && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label>Estágio</Label>
                                <Input
                                  type="number"
                                  placeholder="Valor do estágio"
                                  value={config.internshipFee || ''}
                                  onChange={(e) =>
                                    setConfig({ internshipFee: e.target.value })
                                  }
                                  onFocus={(e) => e.target.select()}
                                />
                              </div>
                            </div>
                          )}

                          {grade === '13' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label>Defesa — Entrada do Trabalho</Label>
                                <Input
                                  type="number"
                                  placeholder="Valor de entrada"
                                  value={config.defenseEntryFee || ''}
                                  onChange={(e) =>
                                    setConfig({ defenseEntryFee: e.target.value })
                                  }
                                  onFocus={(e) => e.target.select()}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Defesa — Valor do Tutor</Label>
                                <Input
                                  type="number"
                                  placeholder="Valor do tutor"
                                  value={config.tutorFee || ''}
                                  onChange={(e) => setConfig({ tutorFee: e.target.value })}
                                  onFocus={(e) => e.target.select()}
                                />
                              </div>
                            </div>
                          )}

                          {grade !== '13' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                              <div className="space-y-2">
                                <Label>Período Manhã — Turmas (separadas por vírgulas)</Label>
                                <Input
                                  placeholder="Ex: A, B, C"
                                  value={config.morningSections}
                                  onChange={(e) =>
                                    setConfig({ morningSections: e.target.value })
                                  }
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Período Tarde — Turmas (separadas por vírgulas)</Label>
                                <Input
                                  placeholder="Ex: D, E"
                                  value={config.afternoonSections}
                                  onChange={(e) =>
                                    setConfig({ afternoonSections: e.target.value })
                                  }
                                />
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
              </div>
            )}

            {/* Footer navigation */}
            <div className="flex justify-between pt-4">
              <Button
                variant="outline"
                disabled={wizardStep === 1}
                onClick={() => setWizardStep((s) => (s > 1 ? ((s - 1) as any) : s))}
              >
                Anterior
              </Button>
              {wizardStep < 5 ? (
                <Button
                  className="btn-primary"
                  onClick={() => setWizardStep((s) => (s < 5 ? ((s + 1) as any) : s))}
                >
                  Próximo
                </Button>
              ) : (
                <Button className="btn-primary" onClick={handleConfirmCourse}>
                  Confirmar e Guardar
                </Button>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Pesquisar por curso, coordenador ou estudante (nome, matrícula, BI)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 input-field"
          />
        </div>
        <Button variant="outline" className="flex items-center gap-2">
          <Filter className="w-4 h-4" />
          Filtros
        </Button>
        <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              Exportar
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Exportar dados dos cursos</DialogTitle>
            </DialogHeader>
            <div className="space-y-6 py-2">
              <div className="space-y-2">
                <Label>Exportação múltipla (vários cursos)</Label>
                <p className="text-xs text-muted-foreground">
                  Selecione os cursos que deseja incluir no ficheiro exportado.
                </p>
                <div className="border rounded-md p-3 space-y-2 max-h-64 overflow-y-auto">
                  {coursesWithStats.map((course) => (
                    <label
                      key={course.id}
                      className="flex items-center gap-2 text-sm cursor-pointer"
                    >
                      <Checkbox
                        checked={selectedCourseIds.includes(course.id)}
                        onCheckedChange={(checked) => {
                          setSelectedCourseIds((prev) =>
                            checked
                              ? [...prev, course.id]
                              : prev.filter((id) => id !== course.id),
                          );
                        }}
                      />
                      <span>{course.name}</span>
                    </label>
                  ))}
                  {coursesWithStats.length === 0 && (
                    <p className="text-xs text-muted-foreground">
                      Não há cursos para exportar.
                    </p>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => {
                    if (selectedCourseIds.length === 0) {
                      toast.info('Selecione pelo menos um curso para exportar.');
                      return;
                    }
                    toast.info('Exportação de vários cursos em desenvolvimento.');
                  }}
                >
                  Exportar cursos selecionados
                </Button>
              </div>

              <div className="space-y-2 border-t pt-4">
                <Label>Exportação por curso</Label>
                <p className="text-xs text-muted-foreground">
                  Escolha um curso e o tipo de documento que deseja gerar.
                </p>
                <div className="space-y-2">
                  <Label className="text-xs">Curso</Label>
                  <Select
                    value={singleCourseId}
                    onValueChange={setSingleCourseId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o curso" />
                    </SelectTrigger>
                    <SelectContent>
                      {coursesWithStats.map((course) => (
                        <SelectItem key={course.id} value={course.id}>
                          {course.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Tipo de documento</Label>
                  <div className="flex flex-wrap gap-3 text-sm">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="doc-type"
                        value="mini"
                        checked={exportDocumentType === 'mini'}
                        onChange={() => setExportDocumentType('mini')}
                      />
                      Mini pauta
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="doc-type"
                        value="final"
                        checked={exportDocumentType === 'final'}
                        onChange={() => setExportDocumentType('final')}
                      />
                      Pauta final
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="doc-type"
                        value="trimestral"
                        checked={exportDocumentType === 'trimestral'}
                        onChange={() => setExportDocumentType('trimestral')}
                      />
                      Pauta trimestral
                    </label>
                  </div>
                </div>
                {exportDocumentType === 'trimestral' && (
                  <div className="space-y-2">
                    <Label className="text-xs">Trimestre</Label>
                    <Select
                      value={selectedTrimester}
                      onValueChange={setSelectedTrimester}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o trimestre" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1º Trimestre</SelectItem>
                        <SelectItem value="2">2º Trimestre</SelectItem>
                        <SelectItem value="3">3º Trimestre</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <Button
                  className="btn-primary mt-2"
                  onClick={() => {
                    if (!singleCourseId) {
                      toast.info('Selecione um curso para exportar.');
                      return;
                    }
                    if (exportDocumentType === 'trimestral' && !selectedTrimester) {
                      toast.info('Selecione o trimestre desejado.');
                      return;
                    }
                    toast.info('Exportação por curso em desenvolvimento.');
                  }}
                >
                  Exportar curso
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="stat-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total de Cursos</p>
                <p className="text-2xl font-bold">{filteredCourses.length}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="stat-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Matriculados</p>
                <p className="text-2xl font-bold">{totalStudents}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-accent" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="stat-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Masculinos</p>
                <p className="text-2xl font-bold">{totalMales}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="stat-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Femininos</p>
                <p className="text-2xl font-bold">{totalFemales}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-pink-500/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-pink-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="stat-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Desistentes</p>
                <p className="text-2xl font-bold">{totalDropouts}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                <TrendingDown className="w-5 h-5 text-destructive" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Courses Table */}
      <Card className="card-elevated">
        <CardHeader>
          <CardTitle>Lista de Cursos</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="table-header">
                <TableHead>Curso</TableHead>
                <TableHead>Coordenador</TableHead>
                <TableHead className="text-center">Total Matriculados</TableHead>
                <TableHead className="text-center">Masculinos</TableHead>
                <TableHead className="text-center">Femininos</TableHead>
                <TableHead className="text-center">Desistentes</TableHead>
                <TableHead className="text-center">% Desistência</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCourses.map((course) => (
                <TableRow
                  key={course.id}
                  className="table-row-hover cursor-pointer"
                  onClick={() => handleCourseRowClick(course.id)}
                >
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {course.name}
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </TableCell>
                  <TableCell>{course.coordinatorName}</TableCell>
                  <TableCell className="text-center font-semibold">{course.totalStudents}</TableCell>
                  <TableCell className="text-center">{course.males}</TableCell>
                  <TableCell className="text-center">{course.females}</TableCell>
                  <TableCell className="text-center">
                    <span className="text-destructive">{course.dropouts}</span>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge
                      variant="outline"
                      className={
                        parseFloat(course.dropoutRate) <= 5
                          ? 'bg-success/10 text-success border-success/20'
                          : parseFloat(course.dropoutRate) <= 10
                          ? 'bg-warning/10 text-warning border-warning/20'
                          : 'bg-destructive/10 text-destructive border-destructive/20'
                      }
                    >
                      {course.dropoutRate}%
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
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/dashboard/cursos/${course.id}`);
                        }}>
                          Ver Detalhes
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingCourse(course);
                            setIsEditDialogOpen(true);
                          }}
                        >
                          Editar Curso
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/dashboard/cursos/${course.id}?tab=classes`);
                        }}>
                          Gerir Turmas
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!window.confirm('Tem a certeza que deseja eliminar este curso?')) return;
                            deleteCourse.mutate(
                              { id: course.id },
                              {
                                onSuccess: () => toast.success('Curso eliminado com sucesso'),
                                onError: (err: any) => toast.error(err.message || 'Erro ao eliminar curso'),
                              },
                            );
                          }}
                        >
                          Eliminar Curso
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
              {filteredCourses.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-12">
                    <div className="flex flex-col items-center gap-4">
                      <GraduationCap className="w-12 h-12 text-muted-foreground/50" />
                      <p>Nenhum curso encontrado</p>
                      <Button className="btn-primary" onClick={() => setIsAddDialogOpen(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Adicionar Curso
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit course dialog */}
      <Dialog
        open={isEditDialogOpen}
        onOpenChange={(open) => {
          setIsEditDialogOpen(open);
          if (!open) setEditingCourse(null);
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar Curso</DialogTitle>
          </DialogHeader>
          {editingCourse && (
            <CourseEditForm
              course={editingCourse}
              onClose={() => {
                setIsEditDialogOpen(false);
                setEditingCourse(null);
              }}
              onUpdated={() => toast.success('Curso atualizado com sucesso')}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}