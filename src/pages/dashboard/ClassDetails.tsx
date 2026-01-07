import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Users,
  GraduationCap,
  Plus,
  Download,
  UserPlus,
  Search,
  CalendarIcon,
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import logoInstituto from '@/assets/logo-instituto-amor-de-deus.png';
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { useClasses, useCourses, useTeachers, useSubjects, useCreateStudent } from '@/hooks/useDatabase';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { toast } from "@/lib/notifications";
export function ClassDetails() {
  const { classId } = useParams();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [newStudent, setNewStudent] = useState({
    enrollment_number: '',
    full_name: '',
    gender: 'Masculino',
    bi_number: '',
    birth_date: undefined as Date | undefined,
    birthplace: '',
    province: '',
    father_name: '',
    mother_name: '',
    guardian_name: '',
    guardian_contact: '',
    enrollment_date: undefined as Date | undefined,
  });

  const formatDateInput = (date: Date | undefined) => {
    if (!date) return '';
    return date.toLocaleDateString('pt-PT');
  };

  const parseDateInput = (value: string): Date | undefined => {
    const trimmed = value.trim();
    if (!trimmed) return undefined;

    const [dd, mm, yyyy] = trimmed.split('/');
    if (!dd || !mm || !yyyy) return undefined;

    const day = Number(dd);
    const month = Number(mm) - 1;
    const year = Number(yyyy);

    const date = new Date(year, month, day);
    if (
      Number.isNaN(date.getTime()) ||
      date.getDate() !== day ||
      date.getMonth() !== month ||
      date.getFullYear() !== year
    ) {
      return undefined;
    }
    return date;
  };

  const handleBirthDateInputChange = (value: string) => {
    const parsed = parseDateInput(value);
    if (!parsed && value.trim()) {
      toast.error('Data de nascimento inválida. Use o formato dd/mm/aaaa.');
      return;
    }
    setNewStudent((prev) => ({ ...prev, birth_date: parsed }));
  };

  const handleEnrollmentDateInputChange = (value: string) => {
    const parsed = parseDateInput(value);
    if (!parsed && value.trim()) {
      toast.error('Data de matrícula inválida. Use o formato dd/mm/aaaa.');
      return;
    }
    setNewStudent((prev) => ({ ...prev, enrollment_date: parsed }));
  };

  type NewStudentErrors = {
    full_name?: string;
    enrollment_number?: string;
    bi_number?: string;
    birth_date?: string;
    birthplace?: string;
    province?: string;
    father_name?: string;
    mother_name?: string;
    guardian_name?: string;
    enrollment_date?: string;
  };

  const [errors, setErrors] = useState<NewStudentErrors>({});


  const createStudent = useCreateStudent();
  
  const generateEnrollmentNumber = () => {
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `${year}${random}`;
  };
  
  const { data: classes } = useClasses();
  const { data: courses } = useCourses();
  const { data: teachers } = useTeachers();
  const { data: subjects } = useSubjects();

  // Fetch students for this class
  const { data: students, refetch: refetchStudents } = useQuery({
    queryKey: ['students', classId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('class_id', classId)
        .order('full_name');
      if (error) throw error;
      return data;
    },
    enabled: !!classId,
  });

  // Fetch grades for students in this class
  const { data: grades } = useQuery({
    queryKey: ['grades', classId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('grades')
        .select('*')
        .eq('class_id', classId);
      if (error) throw error;
      return data;
    },
    enabled: !!classId,
  });

  // Fetch payments for students in this class
  const { data: payments } = useQuery({
    queryKey: ['payments', classId],
    queryFn: async () => {
      if (!students || students.length === 0) return [];

      const studentIds = students.map((s) => s.id);

      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .in('student_id', studentIds);

      if (error) throw error;
      return data;
    },
    enabled: !!classId && !!students,
  });

  const classData = classes?.find(c => c.id === classId);
  const course = courses?.find(c => c.id === classData?.course_id);
  const director = teachers?.find(t => t.id === classData?.class_director_id);
  const classSubjects = subjects?.filter(s => 
    s.course_id === classData?.course_id && 
    s.grade_level === classData?.grade_level
  ) || [];

  const filteredStudents = students?.filter(s =>
    s.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.enrollment_number.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const [selectedSubjectId, setSelectedSubjectId] = useState<string | undefined>(
    classSubjects[0]?.id,
  );

  React.useEffect(() => {
    if (classSubjects.length > 0 && !selectedSubjectId) {
      setSelectedSubjectId(classSubjects[0].id);
    }
  }, [classSubjects, selectedSubjectId]);

  const gradesByKey = React.useMemo(() => {
    const map = new Map<string, any>();
    (grades || []).forEach((g) => {
      map.set(`${g.student_id}-${g.subject_id}-${g.trimester}`, g);
    });
    return map;
  }, [grades]);

  const getGradeFor = (
    studentId: string,
    subjectId: string,
    trimester: number,
  ) => gradesByKey.get(`${studentId}-${subjectId}-${trimester}`);

  const selectedSubject = classSubjects.find((s) => s.id === selectedSubjectId);

  const handleCreateStudent = async () => {
    if (!newStudent.full_name.trim()) {
      toast.error('Nome do estudante é obrigatório');
      return;
    }

    if (!newStudent.enrollment_number) {
      toast.error('Número de matrícula é obrigatório');
      return;
    }

    const parentNames = [newStudent.father_name, newStudent.mother_name]
      .filter((n) => n.trim().length > 0)
      .join(' / ');

    const birthDateString = newStudent.birth_date
      ? newStudent.birth_date.toISOString().split('T')[0]
      : undefined;

    const enrollmentDate = newStudent.enrollment_date || new Date();
    const enrollmentYear = enrollmentDate.getFullYear();

    let photoUrl: string | undefined;

    if (photoFile) {
      const fileExt = photoFile.name.split('.').pop();
      const fileName = `${newStudent.enrollment_number || generateEnrollmentNumber()}-${Date.now()}.${fileExt}`;
      const filePath = `students/${fileName}`;

      const { data, error } = await supabase.storage
        .from('student-photos')
        .upload(filePath, photoFile);

      if (error) {
        toast.error('Erro ao carregar foto: ' + error.message);
        return;
      }

      const publicUrl = supabase.storage
        .from('student-photos')
        .getPublicUrl(data.path).data.publicUrl;

      photoUrl = publicUrl;
    }

    createStudent.mutate(
      {
        enrollment_number: newStudent.enrollment_number,
        full_name: newStudent.full_name,
        enrollment_year: enrollmentYear,
        gender: newStudent.gender,
        class_id: classId,
        guardian_name: newStudent.guardian_name || undefined,
        guardian_contact: newStudent.guardian_contact || undefined,
        bi_number: newStudent.bi_number || undefined,
        birthplace: newStudent.birthplace || undefined,
        province: newStudent.province || undefined,
        parent_names: parentNames || undefined,
        birth_date: birthDateString as any,
        photo_url: photoUrl,
      },
      {
        onSuccess: () => {
          toast.success('Estudante criado com sucesso!');
          refetchStudents();
          setIsDialogOpen(false);
          setPhotoFile(null);
          setNewStudent({
            enrollment_number: '',
            full_name: '',
            gender: 'Masculino',
            bi_number: '',
            birth_date: undefined,
            birthplace: '',
            province: '',
            father_name: '',
            mother_name: '',
            guardian_name: '',
            guardian_contact: '',
            enrollment_date: undefined,
          });
        },
        onError: (error: any) => {
          toast.error('Erro ao criar estudante: ' + error.message);
        },
      },
    );
  };
  if (!classData) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Turma não encontrada</p>
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
          <h1 className="text-2xl font-bold text-foreground">
            {course?.name} - {classData.grade_level}ª {classData.section}
          </h1>
          <p className="text-muted-foreground">
            Diretor de Turma: {director?.profiles?.full_name || 'Não atribuído'}
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              className="btn-primary"
              onClick={() => {
                setNewStudent((current) => ({
                  ...current,
                  enrollment_number: current.enrollment_number || generateEnrollmentNumber(),
                }));
              }}
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Adicionar Estudante
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Novo Estudante para esta Turma</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
              <div className="space-y-2 md:col-span-2">
                <Label>Foto do estudante</Label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Nome Completo *</Label>
                <Input
                  placeholder="Nome do estudante"
                  value={newStudent.full_name}
                  onChange={(e) =>
                    setNewStudent({ ...newStudent, full_name: e.target.value })
                  }
                  className={cn(errors.full_name && 'border-destructive focus-visible:ring-destructive')}
                />
                {errors.full_name && (
                  <p className="text-sm text-destructive">{errors.full_name}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Nº Matrícula *</Label>
                <Input
                  placeholder="Número de matrícula"
                  value={newStudent.enrollment_number}
                  onChange={(e) =>
                    setNewStudent({ ...newStudent, enrollment_number: e.target.value })
                  }
                  className={cn(errors.enrollment_number && 'border-destructive focus-visible:ring-destructive')}
                />
                {errors.enrollment_number && (
                  <p className="text-sm text-destructive">{errors.enrollment_number}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>BI *</Label>
                <Input
                  placeholder="Número do BI"
                  value={newStudent.bi_number}
                  onChange={(e) =>
                    setNewStudent({ ...newStudent, bi_number: e.target.value })
                  }
                  className={cn(errors.bi_number && 'border-destructive focus-visible:ring-destructive')}
                />
                {errors.bi_number && (
                  <p className="text-sm text-destructive">{errors.bi_number}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Género</Label>
                <Select
                  value={newStudent.gender}
                  onValueChange={(value) =>
                    setNewStudent({ ...newStudent, gender: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Masculino">Masculino</SelectItem>
                    <SelectItem value="Feminino">Feminino</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Data de Nascimento *</Label>
                <div className="space-y-1">
                  <Input
                    placeholder="dd/mm/aaaa"
                    value={formatDateInput(newStudent.birth_date)}
                    onChange={(e) => handleBirthDateInputChange(e.target.value)}
                    className={cn(errors.birth_date && 'border-destructive focus-visible:ring-destructive')}
                  />
                  {errors.birth_date && (
                    <p className="text-sm text-destructive">{errors.birth_date}</p>
                  )}
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !newStudent.birth_date && "text-muted-foreground",
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {newStudent.birth_date ? (
                          newStudent.birth_date.toLocaleDateString('pt-PT')
                        ) : (
                          <span>Selecionar data</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={newStudent.birth_date}
                        onSelect={(date) =>
                          setNewStudent({ ...newStudent, birth_date: date || undefined })
                        }
                        disabled={(date) => {
                          const today = new Date();
                          const tenYearsAgo = new Date(
                            today.getFullYear() - 10,
                            today.getMonth(),
                            today.getDate(),
                          );
                          return (
                            date > tenYearsAgo ||
                            date > today ||
                            date < new Date('1900-01-01')
                          );
                        }}
                        initialFocus
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Naturalidade *</Label>
                <Input
                  placeholder="Cidade/Local de nascimento"
                  value={newStudent.birthplace}
                  onChange={(e) =>
                    setNewStudent({ ...newStudent, birthplace: e.target.value })
                  }
                  className={cn(errors.birthplace && 'border-destructive focus-visible:ring-destructive')}
                />
                {errors.birthplace && (
                  <p className="text-sm text-destructive">{errors.birthplace}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Província *</Label>
                <Input
                  placeholder="Província"
                  value={newStudent.province}
                  onChange={(e) =>
                    setNewStudent({ ...newStudent, province: e.target.value })
                  }
                  className={cn(errors.province && 'border-destructive focus-visible:ring-destructive')}
                />
                {errors.province && (
                  <p className="text-sm text-destructive">{errors.province}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Filiação - Nome do Pai *</Label>
                <Input
                  placeholder="Nome do pai"
                  value={newStudent.father_name}
                  onChange={(e) =>
                    setNewStudent({ ...newStudent, father_name: e.target.value })
                  }
                  className={cn(errors.father_name && 'border-destructive focus-visible:ring-destructive')}
                />
                {errors.father_name && (
                  <p className="text-sm text-destructive">{errors.father_name}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Filiação - Nome da Mãe *</Label>
                <Input
                  placeholder="Nome da mãe"
                  value={newStudent.mother_name}
                  onChange={(e) =>
                    setNewStudent({ ...newStudent, mother_name: e.target.value })
                  }
                  className={cn(errors.mother_name && 'border-destructive focus-visible:ring-destructive')}
                />
                {errors.mother_name && (
                  <p className="text-sm text-destructive">{errors.mother_name}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Nome do Encarregado *</Label>
                <Input
                  placeholder="Nome do encarregado de educação"
                  value={newStudent.guardian_name}
                  onChange={(e) =>
                    setNewStudent({ ...newStudent, guardian_name: e.target.value })
                  }
                  className={cn(errors.guardian_name && 'border-destructive focus-visible:ring-destructive')}
                />
                {errors.guardian_name && (
                  <p className="text-sm text-destructive">{errors.guardian_name}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Contacto do Encarregado (opcional)</Label>
                <Input
                  placeholder="9xx xxx xxx"
                  value={newStudent.guardian_contact}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, '').slice(0, 9);
                    const formatted = digits
                      .replace(/(\d{3})(\d{0,3})(\d{0,3})/, (match, p1, p2, p3) => {
                        if (p3) return `${p1} ${p2} ${p3}`.trim();
                        if (p2) return `${p1} ${p2}`.trim();
                        return p1;
                      });
                    setNewStudent({ ...newStudent, guardian_contact: formatted });
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label>Data de Matrícula *</Label>
                <div className="space-y-1">
                  <Input
                    placeholder="dd/mm/aaaa"
                    value={formatDateInput(newStudent.enrollment_date)}
                    onChange={(e) => handleEnrollmentDateInputChange(e.target.value)}
                    className={cn(errors.enrollment_date && 'border-destructive focus-visible:ring-destructive')}
                  />
                  {errors.enrollment_date && (
                    <p className="text-sm text-destructive">{errors.enrollment_date}</p>
                  )}
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !newStudent.enrollment_date && "text-muted-foreground",
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {newStudent.enrollment_date ? (
                          newStudent.enrollment_date.toLocaleDateString('pt-PT')
                        ) : (
                          <span>Selecionar data</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={newStudent.enrollment_date}
                        onSelect={(date) =>
                          setNewStudent({ ...newStudent, enrollment_date: date || undefined })
                        }
                        disabled={(date) => date > new Date()}
                        initialFocus
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>


            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button className="btn-primary" onClick={handleCreateStudent}>
                Guardar Estudante
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        <Button variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Exportar
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="stat-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Alunos</p>
                <p className="text-2xl font-bold">{students?.length || 0}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="stat-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Disciplinas</p>
                <p className="text-2xl font-bold">{classSubjects.length}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-accent" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="stat-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Período</p>
                <p className="text-2xl font-bold">
                  {classData.period === 'morning' ? 'Manhã' : 'Tarde'}
                </p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="stat-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Ano Letivo</p>
                <p className="text-2xl font-bold">{classData.academic_year}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-warning" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Content Tabs */}
      <Tabs defaultValue="students" className="space-y-4">
        <TabsList>
          <TabsTrigger value="students">Estudantes</TabsTrigger>
          <TabsTrigger value="grades">Notas</TabsTrigger>
          <TabsTrigger value="subjects">Disciplinas</TabsTrigger>
          <TabsTrigger value="finance">Finanças</TabsTrigger>
        </TabsList>

        <TabsContent value="students" className="space-y-4">
          {/* Search */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Pesquisar estudante..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <Card className="card-elevated">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="table-header">
                    <TableHead>N°</TableHead>
                    <TableHead>N° Matrícula</TableHead>
                    <TableHead>Nome Completo</TableHead>
                    <TableHead>Encarregado</TableHead>
                    <TableHead>Contato</TableHead>
                    <TableHead className="text-center">Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.map((student, index) => (
                    <TableRow
                      key={student.id}
                      className="table-row-hover cursor-pointer"
                      onClick={() => navigate(`/dashboard/financas/estudante/${student.id}`)}
                    >
                      <TableCell>{index + 1}</TableCell>
                      <TableCell className="font-mono">{student.enrollment_number}</TableCell>
                      <TableCell className="font-medium">{student.full_name}</TableCell>
                      <TableCell>{student.guardian_name || '-'}</TableCell>
                      <TableCell>{student.guardian_contact || '-'}</TableCell>
                      <TableCell className="text-center">
                        <Badge 
                          variant="outline" 
                          className={student.status === 'active' ? 'badge-success' : 'badge-danger'}
                        >
                          {student.status === 'active' ? 'Ativo' : 'Desistente'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredStudents.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-12">
                        <div className="flex flex-col items-center gap-4">
                          <Users className="w-12 h-12 text-muted-foreground/50" />
                          <p>Nenhum estudante matriculado nesta turma</p>
                          <Button
                            className="btn-primary"
                            onClick={() => {
                              setNewStudent((current) => ({
                                ...current,
                                enrollment_number:
                                  current.enrollment_number || generateEnrollmentNumber(),
                              }));
                              setIsDialogOpen(true);
                            }}
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Adicionar Estudante
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="grades" className="space-y-4">
          <Card className="card-elevated">
            <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <CardTitle>Mini pauta por disciplina (3 trimestres)</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Notas da turma por disciplina, apresentando os 3 trimestres no mesmo mapa.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <Label>Disciplina</Label>
                  <Select
                    value={selectedSubjectId}
                    onValueChange={(value) => setSelectedSubjectId(value)}
                  >
                    <SelectTrigger className="w-[220px]">
                      <SelectValue placeholder="Selecionar disciplina" />
                    </SelectTrigger>
                    <SelectContent>
                      {classSubjects.map((subject) => (
                        <SelectItem key={subject.id} value={subject.id}>
                          {subject.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  disabled={!selectedSubjectId}
                  onClick={() => {
                    if (!selectedSubject || !selectedSubjectId) return;

                    const doc = new jsPDF('landscape');

                    const pageWidth = doc.internal.pageSize.getWidth();
                    const imgSize = 20;
                    const imgX = (pageWidth - imgSize) / 2;

                    try {
                      // Logotipo centrado no topo
                      // @ts-ignore - jsPDF aceita path de imagem fornecido pelo bundler
                      doc.addImage(logoInstituto, 'PNG', imgX, 8, imgSize, imgSize);
                    } catch (e) {
                      // Se por algum motivo a imagem falhar, continuamos apenas com o texto
                      console.error('Erro ao adicionar logotipo à mini pauta:', e);
                    }

                    // Garantir que todo o texto (exceto notas em falta) fica a preto por padrão
                    doc.setTextColor(0, 0, 0);

                    // Cabeçalho semelhante ao modelo enviado
                    let currentY = 8 + imgSize + 4;
                    doc.setFontSize(11);
                    doc.text('INSTITUTO TECNICO PRIVADO AMOR DE DEUS', pageWidth / 2, currentY, {
                      align: 'center',
                    });

                    currentY += 5;
                    doc.setFontSize(9);
                    doc.text('NIF:7000001295', pageWidth / 2, currentY, { align: 'center' });

                    currentY += 5;
                    doc.text('NEGAGE', pageWidth / 2, currentY, { align: 'center' });

                    currentY += 5;
                    doc.setFontSize(10);
                    doc.text('MINI PAUTA GERAL', pageWidth / 2, currentY, { align: 'center' });

                    currentY += 6;
                    doc.setFontSize(8);
                    const curso = course?.name || 'Curso';
                    const classe = `${classData.grade_level}ª`;
                    const turma = classData.section;
                    const periodo = classData.period || '';
                    const anoLectivo = classData.academic_year || '';
                    doc.text(
                      `Curso: ${curso}   Classe: ${classe}   Turma: ${turma}   Periodo: ${periodo}   Ano Lectivo: ${anoLectivo}`,
                      pageWidth / 2,
                      currentY,
                      { align: 'center' },
                    );

                    currentY += 5;
                    doc.text(`Disciplina: ${selectedSubject.name}`, 14, currentY);

                    const headRow1: string[] = [
                      'Nº',
                      'NOME COMPLETO',
                      'Iº TRIMESTRE',
                      '',
                      '',
                      '',
                      'IIº TRIMESTRE',
                      '',
                      '',
                      '',
                      'IIIº TRIMESTRE',
                      '',
                      '',
                      '',
                      'MFD',
                    ];

                    const headRow2: string[] = [
                      '',
                      '',
                      'MAC',
                      'NPP',
                      'NPT',
                      'MT',
                      'MAC',
                      'NPP',
                      'NPT',
                      'MT',
                      'MAC',
                      'NPP',
                      'NPT',
                      'MT',
                      '',
                    ];

                    const body = filteredStudents.map((student, index) => {
                      const row: (string | number)[] = [index + 1, student.full_name];

                      const g1 = getGradeFor(student.id, selectedSubjectId, 1);
                      const g2 = getGradeFor(student.id, selectedSubjectId, 2);
                      const g3 = getGradeFor(student.id, selectedSubjectId, 3);

                      const pushGrade = (g: any) => {
                        row.push(g?.mac ?? '-', g?.npp ?? '-', g?.npt ?? '-', g?.mt ?? '-');
                      };

                      pushGrade(g1);
                      pushGrade(g2);
                      pushGrade(g3);

                      const mts = [g1?.mt, g2?.mt, g3?.mt].filter(
                        (v): v is number => typeof v === 'number',
                      );
                      const mfd = mts.length
                        ? (mts.reduce((sum, v) => sum + v, 0) / mts.length).toFixed(1)
                        : '-';

                      row.push(mfd);

                      return row;
                    });

                    autoTable(doc, {
                      head: [headRow1, headRow2],
                      body,
                      startY: currentY + 6,
                      margin: { top: currentY + 2, left: 8, right: 8 },
                      styles: { fontSize: 7, cellPadding: 1, overflow: 'linebreak', textColor: [0, 0, 0] },
                      headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0] },
                      theme: 'grid',
                      pageBreak: 'auto',
                      didParseCell: (data) => {
                        if (data.section === 'body') {
                          const raw = data.cell.raw;
                          const value = typeof raw === 'string' || typeof raw === 'number'
                            ? Number(raw)
                            : NaN;

                          if (!Number.isNaN(value) && value < 10) {
                            data.cell.styles.textColor = [255, 0, 0];
                          } else {
                            data.cell.styles.textColor = [0, 0, 0];
                          }
                        }
                      },
                    });

                    doc.save(
                      `mini-pauta-${classData.grade_level}a-${classData.section}-${selectedSubject.name}.pdf`,
                    );
                  }}
                >
                  <Download className="w-4 h-4" />
                  Exportar mini pauta (PDF)
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {!selectedSubjectId ? (
                <p className="text-sm text-muted-foreground">
                  Selecione uma disciplina para visualizar a mini pauta.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="table-header">
                        <TableHead className="sticky left-0 bg-background z-10">N°</TableHead>
                        <TableHead className="sticky left-16 bg-background z-10 min-w-[220px]">
                          Nome Completo
                        </TableHead>
                        <TableHead colSpan={4} className="text-center border-l">
                          Iº TRIMESTRE
                        </TableHead>
                        <TableHead colSpan={4} className="text-center border-l">
                          IIº TRIMESTRE
                        </TableHead>
                        <TableHead colSpan={4} className="text-center border-l">
                          IIIº TRIMESTRE
                        </TableHead>
                        <TableHead className="text-center border-l">MFD</TableHead>
                      </TableRow>
                      <TableRow className="table-header">
                        <TableHead className="sticky left-0 bg-background z-10"></TableHead>
                        <TableHead className="sticky left-16 bg-background z-10"></TableHead>
                        {Array.from({ length: 3 }).map((_, idx) => (
                          <React.Fragment key={idx}>
                            <TableHead className="text-center text-xs border-l">MAC</TableHead>
                            <TableHead className="text-center text-xs">NPP</TableHead>
                            <TableHead className="text-center text-xs">NPT</TableHead>
                            <TableHead className="text-center text-xs">MT</TableHead>
                          </React.Fragment>
                        ))}
                        <TableHead className="text-center text-xs border-l">MFD</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredStudents.map((student, index) => {
                        const g1 = getGradeFor(student.id, selectedSubjectId!, 1);
                        const g2 = getGradeFor(student.id, selectedSubjectId!, 2);
                        const g3 = getGradeFor(student.id, selectedSubjectId!, 3);

                        const mts = [g1?.mt, g2?.mt, g3?.mt].filter(
                          (v): v is number => typeof v === 'number',
                        );
                        const mfd = mts.length
                          ? (mts.reduce((sum, v) => sum + v, 0) / mts.length).toFixed(1)
                          : '-';

                        return (
                          <TableRow key={student.id} className="table-row-hover">
                            <TableCell className="sticky left-0 bg-background">
                              {index + 1}
                            </TableCell>
                            <TableCell className="sticky left-16 bg-background font-medium">
                              {student.full_name}
                            </TableCell>
                            {[g1, g2, g3].map((g, idx) => (
                              <React.Fragment key={`${student.id}-tri-${idx}`}>
                                <TableCell className="text-center border-l">
                                  {g?.mac ?? '-'}
                                </TableCell>
                                <TableCell className="text-center">-</TableCell>
                                <TableCell className="text-center">
                                  {g?.npt ?? '-'}
                                </TableCell>
                                <TableCell className="text-center font-medium">
                                  {g?.mt ?? '-'}
                                </TableCell>
                              </React.Fragment>
                            ))}
                            <TableCell className="text-center font-semibold border-l">
                              {mfd}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                      {filteredStudents.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={2 + 3 * 4 + 1} className="text-center text-muted-foreground py-8">
                            Nenhum estudante para exibir notas
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subjects" className="space-y-4">
          <Card className="card-elevated">
            <CardHeader>
              <CardTitle>Disciplinas da {classData.grade_level}ª Classe</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="table-header">
                    <TableHead>N°</TableHead>
                    <TableHead>Disciplina</TableHead>
                    <TableHead>Professor</TableHead>
                    <TableHead className="text-center">Aproveitamento Médio</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {classSubjects.map((subject, index) => (
                    <TableRow key={subject.id} className="table-row-hover">
                      <TableCell>{index + 1}</TableCell>
                      <TableCell className="font-medium">{subject.name}</TableCell>
                      <TableCell>-</TableCell>
                      <TableCell className="text-center">-</TableCell>
                    </TableRow>
                  ))}
                  {classSubjects.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                        Nenhuma disciplina cadastrada para esta classe
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="finance" className="space-y-4">
          <Card className="card-elevated">
            <CardHeader>
              <CardTitle>Resumo Financeiro por Estudante</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="table-header">
                    <TableHead>N°</TableHead>
                    <TableHead>N° Matrícula</TableHead>
                    <TableHead>Nome do Estudante</TableHead>
                    <TableHead className="text-center">Meses pagos</TableHead>
                    <TableHead className="text-center">Meses adiantados</TableHead>
                    <TableHead className="text-center">Regalias</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.length > 0 ? (
                    filteredStudents.map((student, index) => {
                      const currentYear = new Date().getFullYear();
                      const currentMonth = new Date().getMonth() + 1;

                      const studentPayments = (payments || []).filter(
                        (p) => p.student_id === student.id && p.year_reference === currentYear,
                      );

                      const uniqueMonths = Array.from(
                        new Set(studentPayments.map((p) => p.month_reference)),
                      );

                      const monthsPaid = uniqueMonths.filter((m) => m <= currentMonth).length;
                      const monthsInAdvance = uniqueMonths.filter((m) => m > currentMonth).length;

                      return (
                        <TableRow key={student.id} className="table-row-hover">
                          <TableCell>{index + 1}</TableCell>
                          <TableCell className="font-mono">{student.enrollment_number}</TableCell>
                          <TableCell className="font-medium">{student.full_name}</TableCell>
                          <TableCell className="text-center">{monthsPaid}</TableCell>
                          <TableCell className="text-center">{monthsInAdvance}</TableCell>
                          <TableCell className="text-center text-muted-foreground">-</TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        Nenhum estudante matriculado nesta turma
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
</TabsContent>
       </Tabs>
     </div>
   );
}
