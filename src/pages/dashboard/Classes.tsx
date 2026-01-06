import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Plus,
  Users,
  GraduationCap,
  Clock,
  BookOpen,
  Loader2,
  Phone,
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { useClasses, useCourses, useStudents, useSubjects, useGrades } from '@/hooks/useDatabase';
import { toast } from "@/lib/notifications";
import { supabase } from '@/integrations/supabase/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';

export function Classes() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Se for professor, mostra painel específico de turmas atribuídas
  if (user?.role === 'professor') {
    return <ProfessorClasses />;
  }

  // Vista original para admins / super_admin / finance
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('Todos');
  const [selectedPeriod, setSelectedPeriod] = useState('Todos');
  const [selectedGrade, setSelectedGrade] = useState('Todos');
  const [isAddClassOpen, setIsAddClassOpen] = useState(false);
  const [newClass, setNewClass] = useState({
    course_id: '',
    section: '',
    grade_level: '10',
    period: 'Manhã',
    max_students: '40',
    academic_year: new Date().getFullYear().toString(),
  });

  const { data: classes, isLoading } = useClasses();
  const { data: courses } = useCourses();
  const { data: students } = useStudents();
  const { data: subjects } = useSubjects();
  const queryClient = useQueryClient();

  const createClassMutation = useMutation({
    mutationFn: async (classData: typeof newClass) => {
      const { data, error } = await supabase
        .from('classes')
        .insert({
          course_id: classData.course_id,
          section: classData.section,
          grade_level: parseInt(classData.grade_level),
          period: classData.period,
          max_students: parseInt(classData.max_students),
          academic_year: parseInt(classData.academic_year),
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      toast.success('Turma criada com sucesso!');
      setIsAddClassOpen(false);
    },
  });

  const classStats = useMemo(() => {
    if (!classes || !students) return [];
    return classes.map((cls) => {
      const classStudents = students.filter(
        (s) => s.class_id === cls.id && s.status === 'active',
      );
      const classSubjects =
        subjects?.filter(
          (s) => s.course_id === cls.course_id && s.grade_level === cls.grade_level,
        ) || [];
      return {
        ...cls,
        totalStudents: classStudents.length,
        subjectCount: classSubjects.length,
        courseName: cls.course?.name || '-',
        directorName: cls.class_director?.profiles?.full_name || 'Não atribuído',
      };
    });
  }, [classes, students, subjects]);

  const filteredClasses = classStats.filter((cls) => {
    const matchesSearch = cls.courseName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCourse = selectedCourse === 'Todos' || cls.course_id === selectedCourse;
    const matchesPeriod = selectedPeriod === 'Todos' || cls.period === selectedPeriod;
    const matchesGrade = selectedGrade === 'Todos' || cls.grade_level.toString() === selectedGrade;
    return matchesSearch && matchesCourse && matchesPeriod && matchesGrade;
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Turmas</h1>
          <p className="text-muted-foreground">Gestão de turmas e estudantes</p>
        </div>
        <Dialog open={isAddClassOpen} onOpenChange={setIsAddClassOpen}>
          <DialogTrigger asChild>
            <Button className="btn-primary">
              <Plus className="w-4 h-4 mr-2" />Criar Turma
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Criar Nova Turma</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Curso *</Label>
                <Select
                  value={newClass.course_id}
                  onValueChange={(v) => setNewClass({ ...newClass, course_id: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o curso" />
                  </SelectTrigger>
                  <SelectContent>
                    {courses?.map((course) => (
                      <SelectItem key={course.id} value={course.id}>
                        {course.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Classe</Label>
                  <Select
                    value={newClass.grade_level}
                    onValueChange={(v) => setNewClass({ ...newClass, grade_level: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10ª</SelectItem>
                      <SelectItem value="11">11ª</SelectItem>
                      <SelectItem value="12">12ª</SelectItem>
                      <SelectItem value="13">13ª</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Turma *</Label>
                  <Input
                    placeholder="Ex: A"
                    value={newClass.section}
                    onChange={(e) =>
                      setNewClass({ ...newClass, section: e.target.value.toUpperCase() })
                    }
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Período</Label>
                  <Select
                    value={newClass.period}
                    onValueChange={(v) => setNewClass({ ...newClass, period: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Manhã">Manhã</SelectItem>
                      <SelectItem value="Tarde">Tarde</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Máx. Alunos</Label>
                  <Input
                    type="number"
                    value={newClass.max_students}
                    onChange={(e) =>
                      setNewClass({ ...newClass, max_students: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setIsAddClassOpen(false)}>
                Cancelar
              </Button>
              <Button
                className="btn-primary"
                onClick={() => createClassMutation.mutate(newClass)}
                disabled={createClassMutation.isPending}
              >
                {createClassMutation.isPending ? 'Criando...' : 'Criar Turma'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="stat-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Turmas</p>
                <p className="text-2xl font-bold">{filteredClasses.length}</p>
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
                <p className="text-sm text-muted-foreground">Período Manhã</p>
                <p className="text-2xl font-bold">
                  {filteredClasses.filter((c) => c.period === 'Manhã').length}
                </p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-warning" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="stat-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Período Tarde</p>
                <p className="text-2xl font-bold">
                  {filteredClasses.filter((c) => c.period === 'Tarde').length}
                </p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-accent" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="stat-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Estudantes</p>
                <p className="text-2xl font-bold">
                  {filteredClasses.reduce((s, c) => s + c.totalStudents, 0)}
                </p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Pesquisar..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedCourse} onValueChange={setSelectedCourse}>
          <SelectTrigger className="w-full md:w-48">
            <SelectValue placeholder="Curso" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Todos">Todos os Cursos</SelectItem>
            {courses?.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={selectedGrade} onValueChange={setSelectedGrade}>
          <SelectTrigger className="w-full md:w-32">
            <SelectValue placeholder="Classe" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Todos">Todas</SelectItem>
            <SelectItem value="10">10ª</SelectItem>
            <SelectItem value="11">11ª</SelectItem>
            <SelectItem value="12">12ª</SelectItem>
            <SelectItem value="13">13ª</SelectItem>
          </SelectContent>
        </Select>
        <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
          <SelectTrigger className="w-full md:w-32">
            <SelectValue placeholder="Período" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Todos">Todos</SelectItem>
            <SelectItem value="Manhã">Manhã</SelectItem>
            <SelectItem value="Tarde">Tarde</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="card-elevated">
        <CardHeader>
          <CardTitle>Lista de Turmas</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="table-header">
                <TableHead>Curso</TableHead>
                <TableHead>Classe</TableHead>
                <TableHead>Turma</TableHead>
                <TableHead>Período</TableHead>
                <TableHead className="text-center">Nº Alunos</TableHead>
                <TableHead className="text-center">Nº Disciplinas</TableHead>
                <TableHead>Diretor</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClasses.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="text-center py-12 text-muted-foreground"
                  >
                    Nenhuma turma encontrada
                  </TableCell>
                </TableRow>
              ) : (
                filteredClasses.map((cls) => (
                  <TableRow
                    key={cls.id}
                    className="table-row-hover cursor-pointer"
                    onClick={() => navigate(`/dashboard/turmas/${cls.id}`)}
                  >
                    <TableCell className="font-medium">{cls.courseName}</TableCell>
                    <TableCell>{cls.grade_level}ª</TableCell>
                    <TableCell>
                      <Badge variant="outline">{cls.section}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={
                          cls.period === 'Manhã'
                            ? 'bg-warning/10 text-warning'
                            : 'bg-accent/10 text-accent'
                        }
                      >
                        {cls.period}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      {cls.totalStudents}
                      {cls.max_students && (
                        <span className="text-muted-foreground">
                          /{cls.max_students}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">{cls.subjectCount}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {cls.directorName}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/dashboard/turmas/${cls.id}`);
                        }}
                      >
                        <BookOpen className="w-4 h-4" />
                      </Button>
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

function ProfessorClasses() {
  const { user } = useAuth();
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const { data: classes } = useClasses();
  const { data: students } = useStudents(selectedClassId || undefined);
  const { data: grades } = useGrades(
    selectedClassId && user?.teacherId
      ? { classId: selectedClassId, teacherId: user.teacherId }
      : undefined,
  );

  // Carrega atribuições do professor para descobrir as turmas
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
        .select('id, class_id')
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

  const filteredClasses = assignedClasses.filter((cls: any) => {
    const courseName = cls.course?.name || '';
    return (
      courseName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${cls.grade_level}ª ${cls.section}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
    );
  });

  const selectedClass = assignedClasses.find((c: any) => c.id === selectedClassId) ||
    (filteredClasses.length > 0 ? filteredClasses[0] : undefined);

  React.useEffect(() => {
    if (!selectedClassId && filteredClasses.length > 0) {
      setSelectedClassId(filteredClasses[0].id);
    }
  }, [filteredClasses, selectedClassId]);

  const filteredStudents = (students || []).filter((s: any) =>
    s.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.enrollment_number.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const studentGradeRows = useMemo(() => {
    if (!grades) return [];
    return grades
      .filter((g: any) => !user?.teacherId || g.teacher?.id === user.teacherId)
      .map((g: any) => {
        const mt1 = g.mac != null && g.npt != null ? (g.mac + g.npt) / 2 : null;
        const finalResult = mt1 != null ? (mt1 >= 10 ? 'Aprovado' : 'Reprovado') : '-';
        return {
          id: g.id,
          enrollment: g.student?.enrollment_number,
          name: g.student?.full_name,
          subject: g.subject?.name,
          mac: g.mac,
          npt: g.npt,
          mt1,
          finalResult,
        };
      });
  }, [grades, user?.teacherId]);

  if (loadingAssignments) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Turmas</h1>
          <p className="text-muted-foreground">
            Lista das turmas em que você leciona, com acesso rápido aos estudantes.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="stat-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Turmas atribuídas</p>
                <p className="text-2xl font-bold">{assignedClasses.length}</p>
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
                <p className="text-sm text-muted-foreground">Total estudantes</p>
                <p className="text-2xl font-bold">{students?.length || 0}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="stat-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Turma seleccionada</p>
                <p className="text-lg font-semibold">
                  {selectedClass
                    ? `${selectedClass.course?.name || ''} - ${selectedClass.grade_level}ª ${selectedClass.section}`
                    : 'Nenhuma turma seleccionada'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de turmas */}
      <Card className="card-elevated">
        <CardHeader>
          <CardTitle>Turmas atribuídas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Pesquisar por curso ou turma..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Table>
            <TableHeader>
              <TableRow className="table-header">
                <TableHead>Curso</TableHead>
                <TableHead>Classe</TableHead>
                <TableHead>Turma</TableHead>
                <TableHead>Período</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClasses.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="text-center py-10 text-muted-foreground"
                  >
                    Não existem turmas atribuídas ao seu utilizador.
                  </TableCell>
                </TableRow>
              ) : (
                filteredClasses.map((cls: any) => (
                  <TableRow
                    key={cls.id}
                    className={`cursor-pointer table-row-hover ${
                      selectedClassId === cls.id ? 'bg-muted/60' : ''
                    }`}
                    onClick={() => setSelectedClassId(cls.id)}
                  >
                    <TableCell className="font-medium">
                      {cls.course?.name || '-'}
                    </TableCell>
                    <TableCell>{cls.grade_level}ª</TableCell>
                    <TableCell>
                      <Badge variant="outline">{cls.section}</Badge>
                    </TableCell>
                    <TableCell>{cls.period}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Estudantes da turma seleccionada */}
      <Card className="card-elevated">
        <CardHeader>
          <CardTitle>Estudantes da turma</CardTitle>
        </CardHeader>
        <CardContent>
          {selectedClass ? (
            <Table>
              <TableHeader>
                <TableRow className="table-header">
                  <TableHead>Nº Matrícula</TableHead>
                  <TableHead>Nome Completo</TableHead>
                  <TableHead>Contacto do Encarregado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={3}
                      className="text-center py-10 text-muted-foreground"
                    >
                      Nenhum estudante encontrado para esta turma.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredStudents.map((student: any) => (
                    <TableRow key={student.id} className="table-row-hover">
                      <TableCell className="font-mono text-sm">
                        {student.enrollment_number}
                      </TableCell>
                      <TableCell className="font-medium">
                        {student.full_name}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">
                            {student.guardian_contact || 'Sem contacto registado'}
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          ) : (
            <p className="text-muted-foreground text-sm">
              Selecione uma turma na lista acima para visualizar os estudantes e contactos.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Notas médias por estudante (para a turma seleccionada) */}
      <Card className="card-elevated">
        <CardHeader>
          <CardTitle>Notas por estudante (turma seleccionada)</CardTitle>
        </CardHeader>
        <CardContent>
          {selectedClass ? (
            studentGradeRows.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                Ainda não existem notas registadas para esta turma/disciplina.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="table-header">
                    <TableHead>Nº Matrícula</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Disciplina</TableHead>
                    <TableHead>MAC</TableHead>
                    <TableHead>NPT</TableHead>
                    <TableHead>MT1</TableHead>
                    <TableHead>Resultado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {studentGradeRows.map((row) => (
                    <TableRow key={row.id} className="table-row-hover">
                      <TableCell className="font-mono text-sm">{row.enrollment}</TableCell>
                      <TableCell>{row.name}</TableCell>
                      <TableCell>{row.subject}</TableCell>
                      <TableCell>{row.mac ?? '-'}</TableCell>
                      <TableCell>{row.npt ?? '-'}</TableCell>
                      <TableCell>{row.mt1 != null ? row.mt1.toFixed(1) : '-'}</TableCell>
                      <TableCell>{row.finalResult}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )
          ) : (
            <p className="text-muted-foreground text-sm">
              Selecione uma turma para ver as notas médias dos estudantes.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
