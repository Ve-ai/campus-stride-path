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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useClasses, useCourses, useTeachers, useSubjects } from '@/hooks/useDatabase';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

export function ClassDetails() {
  const { classId } = useParams();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  
  const { data: classes } = useClasses();
  const { data: courses } = useCourses();
  const { data: teachers } = useTeachers();
  const { data: subjects } = useSubjects();

  // Fetch students for this class
  const { data: students } = useQuery({
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
        <Button className="btn-primary">
          <UserPlus className="w-4 h-4 mr-2" />
          Adicionar Estudante
        </Button>
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
                    <TableRow key={student.id} className="table-row-hover cursor-pointer">
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
                          <Button className="btn-primary">
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
            <CardHeader>
              <CardTitle>Notas por Disciplina</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="table-header">
                      <TableHead className="sticky left-0 bg-background z-10">N°</TableHead>
                      <TableHead className="sticky left-10 bg-background z-10">N° Matrícula</TableHead>
                      <TableHead className="sticky left-28 bg-background z-10 min-w-[200px]">Nome</TableHead>
                      {classSubjects.map((subject) => (
                        <TableHead key={subject.id} colSpan={3} className="text-center border-l">
                          {subject.name}
                        </TableHead>
                      ))}
                    </TableRow>
                    <TableRow className="table-header">
                      <TableHead className="sticky left-0 bg-background z-10"></TableHead>
                      <TableHead className="sticky left-10 bg-background z-10"></TableHead>
                      <TableHead className="sticky left-28 bg-background z-10"></TableHead>
                      {classSubjects.map((subject) => (
                        <React.Fragment key={`headers-${subject.id}`}>
                          <TableHead className="text-center text-xs border-l">MAC</TableHead>
                          <TableHead className="text-center text-xs">NPT</TableHead>
                          <TableHead className="text-center text-xs">MT</TableHead>
                        </React.Fragment>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStudents.map((student, index) => {
                      const studentGrades = grades?.filter(g => g.student_id === student.id) || [];
                      return (
                        <TableRow key={student.id} className="table-row-hover">
                          <TableCell className="sticky left-0 bg-background">{index + 1}</TableCell>
                          <TableCell className="sticky left-10 bg-background font-mono">
                            {student.enrollment_number}
                          </TableCell>
                          <TableCell className="sticky left-28 bg-background font-medium">
                            {student.full_name}
                          </TableCell>
                          {classSubjects.map((subject) => {
                            const grade = studentGrades.find(g => g.subject_id === subject.id);
                            return (
                              <React.Fragment key={`grade-${student.id}-${subject.id}`}>
                                <TableCell className="text-center border-l">
                                  {grade?.mac ?? '-'}
                                </TableCell>
                                <TableCell className="text-center">
                                  {grade?.npt ?? '-'}
                                </TableCell>
                                <TableCell className="text-center font-medium">
                                  {grade?.mt ?? '-'}
                                </TableCell>
                              </React.Fragment>
                            );
                          })}
                        </TableRow>
                      );
                    })}
                    {filteredStudents.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={3 + classSubjects.length * 3} className="text-center text-muted-foreground py-8">
                          Nenhum estudante para exibir notas
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
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
      </Tabs>
    </div>
  );
}
