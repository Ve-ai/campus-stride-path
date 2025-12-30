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
import { useClasses, useCourses, useStudents, useSubjects } from '@/hooks/useDatabase';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export function Classes() {
  const navigate = useNavigate();
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
    return classes.map(cls => {
      const classStudents = students.filter(s => s.class_id === cls.id && s.status === 'active');
      const classSubjects = subjects?.filter(s => s.course_id === cls.course_id && s.grade_level === cls.grade_level) || [];
      return {
        ...cls,
        totalStudents: classStudents.length,
        subjectCount: classSubjects.length,
        courseName: cls.course?.name || '-',
        directorName: cls.class_director?.profiles?.full_name || 'Não atribuído',
      };
    });
  }, [classes, students, subjects]);

  const filteredClasses = classStats.filter(cls => {
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
            <Button className="btn-primary"><Plus className="w-4 h-4 mr-2" />Criar Turma</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader><DialogTitle>Criar Nova Turma</DialogTitle></DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Curso *</Label>
                <Select value={newClass.course_id} onValueChange={(v) => setNewClass({ ...newClass, course_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione o curso" /></SelectTrigger>
                  <SelectContent>
                    {courses?.map((course) => (<SelectItem key={course.id} value={course.id}>{course.name}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Classe</Label>
                  <Select value={newClass.grade_level} onValueChange={(v) => setNewClass({ ...newClass, grade_level: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
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
                  <Input placeholder="Ex: A" value={newClass.section} onChange={(e) => setNewClass({ ...newClass, section: e.target.value.toUpperCase() })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Período</Label>
                  <Select value={newClass.period} onValueChange={(v) => setNewClass({ ...newClass, period: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Manhã">Manhã</SelectItem>
                      <SelectItem value="Tarde">Tarde</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Máx. Alunos</Label>
                  <Input type="number" value={newClass.max_students} onChange={(e) => setNewClass({ ...newClass, max_students: e.target.value })} />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setIsAddClassOpen(false)}>Cancelar</Button>
              <Button className="btn-primary" onClick={() => createClassMutation.mutate(newClass)} disabled={createClassMutation.isPending}>
                {createClassMutation.isPending ? 'Criando...' : 'Criar Turma'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="stat-card"><CardContent className="p-4"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Total Turmas</p><p className="text-2xl font-bold">{filteredClasses.length}</p></div><div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center"><GraduationCap className="w-5 h-5 text-primary" /></div></div></CardContent></Card>
        <Card className="stat-card"><CardContent className="p-4"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Período Manhã</p><p className="text-2xl font-bold">{filteredClasses.filter(c => c.period === 'Manhã').length}</p></div><div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center"><Clock className="w-5 h-5 text-warning" /></div></div></CardContent></Card>
        <Card className="stat-card"><CardContent className="p-4"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Período Tarde</p><p className="text-2xl font-bold">{filteredClasses.filter(c => c.period === 'Tarde').length}</p></div><div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center"><Clock className="w-5 h-5 text-accent" /></div></div></CardContent></Card>
        <Card className="stat-card"><CardContent className="p-4"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Total Estudantes</p><p className="text-2xl font-bold">{filteredClasses.reduce((s, c) => s + c.totalStudents, 0)}</p></div><div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center"><Users className="w-5 h-5 text-success" /></div></div></CardContent></Card>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" /><Input placeholder="Pesquisar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" /></div>
        <Select value={selectedCourse} onValueChange={setSelectedCourse}><SelectTrigger className="w-full md:w-48"><SelectValue placeholder="Curso" /></SelectTrigger><SelectContent><SelectItem value="Todos">Todos os Cursos</SelectItem>{courses?.map((c) => (<SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>))}</SelectContent></Select>
        <Select value={selectedGrade} onValueChange={setSelectedGrade}><SelectTrigger className="w-full md:w-32"><SelectValue placeholder="Classe" /></SelectTrigger><SelectContent><SelectItem value="Todos">Todas</SelectItem><SelectItem value="10">10ª</SelectItem><SelectItem value="11">11ª</SelectItem><SelectItem value="12">12ª</SelectItem><SelectItem value="13">13ª</SelectItem></SelectContent></Select>
        <Select value={selectedPeriod} onValueChange={setSelectedPeriod}><SelectTrigger className="w-full md:w-32"><SelectValue placeholder="Período" /></SelectTrigger><SelectContent><SelectItem value="Todos">Todos</SelectItem><SelectItem value="Manhã">Manhã</SelectItem><SelectItem value="Tarde">Tarde</SelectItem></SelectContent></Select>
      </div>

      <Card className="card-elevated">
        <CardHeader><CardTitle>Lista de Turmas</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="table-header">
                <TableHead>Curso</TableHead><TableHead>Classe</TableHead><TableHead>Turma</TableHead><TableHead>Período</TableHead><TableHead className="text-center">Nº Alunos</TableHead><TableHead className="text-center">Nº Disciplinas</TableHead><TableHead>Diretor</TableHead><TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClasses.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="text-center py-12 text-muted-foreground">Nenhuma turma encontrada</TableCell></TableRow>
              ) : (
                filteredClasses.map((cls) => (
                  <TableRow key={cls.id} className="table-row-hover cursor-pointer" onClick={() => navigate(`/dashboard/turmas/${cls.id}`)}>
                    <TableCell className="font-medium">{cls.courseName}</TableCell>
                    <TableCell>{cls.grade_level}ª</TableCell>
                    <TableCell><Badge variant="outline">{cls.section}</Badge></TableCell>
                    <TableCell><Badge variant="secondary" className={cls.period === 'Manhã' ? 'bg-warning/10 text-warning' : 'bg-accent/10 text-accent'}>{cls.period}</Badge></TableCell>
                    <TableCell className="text-center">{cls.totalStudents}{cls.max_students && <span className="text-muted-foreground">/{cls.max_students}</span>}</TableCell>
                    <TableCell className="text-center">{cls.subjectCount}</TableCell>
                    <TableCell className="text-muted-foreground">{cls.directorName}</TableCell>
                    <TableCell className="text-right"><Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); navigate(`/dashboard/turmas/${cls.id}`); }}><BookOpen className="w-4 h-4" /></Button></TableCell>
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
