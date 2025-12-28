import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Users,
  GraduationCap,
  TrendingUp,
  TrendingDown,
  ChevronRight,
  Download,
  Filter,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useCourses, useClasses, useTeachers, useSubjects } from '@/hooks/useDatabase';

export function CourseDetails() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [selectedClass, setSelectedClass] = useState<string>('all');
  
  const { data: courses } = useCourses();
  const { data: classes } = useClasses();
  const { data: teachers } = useTeachers();
  const { data: subjects } = useSubjects();

  const course = courses?.find(c => c.id === courseId);
  const courseClasses = classes?.filter(c => c.course_id === courseId) || [];
  const courseSubjects = subjects?.filter(s => s.course_id === courseId) || [];
  
  const coordinator = teachers?.find(t => t.id === course?.coordinator_id);

  // Group classes by grade level
  const classesByGrade = courseClasses.reduce((acc, cls) => {
    const grade = cls.grade_level;
    if (!acc[grade]) acc[grade] = [];
    acc[grade].push(cls);
    return acc;
  }, {} as Record<number, typeof courseClasses>);

  if (!course) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Curso não encontrado</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard/cursos')}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-foreground">{course.name}</h1>
          <p className="text-muted-foreground">
            Coordenador: {coordinator?.profiles?.full_name || 'Não atribuído'}
          </p>
        </div>
        <Button variant="outline" className="flex items-center gap-2">
          <Download className="w-4 h-4" />
          Exportar Relatório
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="stat-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Turmas</p>
                <p className="text-2xl font-bold">{courseClasses.length}</p>
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
                <p className="text-sm text-muted-foreground">Total Disciplinas</p>
                <p className="text-2xl font-bold">{courseSubjects.length}</p>
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
                <p className="text-sm text-muted-foreground">Mensalidade 10ª</p>
                <p className="text-2xl font-bold">
                  {course.monthly_fee_10?.toLocaleString('pt-AO')} Kz
                </p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="stat-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Taxa Credencial</p>
                <p className="text-2xl font-bold">
                  {course.credential_fee?.toLocaleString('pt-AO')} Kz
                </p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
                <TrendingDown className="w-5 h-5 text-warning" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Select value={selectedClass} onValueChange={setSelectedClass}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filtrar por classe" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as Classes</SelectItem>
            <SelectItem value="10">10ª Classe</SelectItem>
            <SelectItem value="11">11ª Classe</SelectItem>
            <SelectItem value="12">12ª Classe</SelectItem>
            <SelectItem value="13">13ª Classe</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Classes by Grade Level */}
      {Object.entries(classesByGrade)
        .filter(([grade]) => selectedClass === 'all' || grade === selectedClass)
        .sort(([a], [b]) => Number(a) - Number(b))
        .map(([grade, gradeClasses]) => (
          <Card key={grade} className="card-elevated">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-primary" />
                {grade}ª Classe
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="table-header">
                    <TableHead>Turma</TableHead>
                    <TableHead>Período</TableHead>
                    <TableHead className="text-center">Máx. Alunos</TableHead>
                    <TableHead>Diretor de Turma</TableHead>
                    <TableHead className="text-center">Ano Letivo</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {gradeClasses.map((cls) => {
                    const director = teachers?.find(t => t.id === cls.class_director_id);
                    return (
                      <TableRow
                        key={cls.id}
                        className="table-row-hover cursor-pointer"
                        onClick={() => navigate(`/dashboard/turmas/${cls.id}`)}
                      >
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {cls.section}
                            <ChevronRight className="w-4 h-4 text-muted-foreground" />
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {cls.period === 'morning' ? 'Manhã' : 'Tarde'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">{cls.max_students}</TableCell>
                        <TableCell>
                          {director?.profiles?.full_name || 'Não atribuído'}
                        </TableCell>
                        <TableCell className="text-center">{cls.academic_year}</TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/dashboard/turmas/${cls.id}`);
                            }}
                          >
                            Ver Detalhes
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {gradeClasses.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        Nenhuma turma cadastrada para esta classe
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ))}

      {/* Subjects */}
      <Card className="card-elevated">
        <CardHeader>
          <CardTitle>Disciplinas do Curso</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="table-header">
                <TableHead>Disciplina</TableHead>
                <TableHead className="text-center">Classe</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {courseSubjects.map((subject) => (
                <TableRow key={subject.id} className="table-row-hover">
                  <TableCell className="font-medium">{subject.name}</TableCell>
                  <TableCell className="text-center">{subject.grade_level}ª</TableCell>
                </TableRow>
              ))}
              {courseSubjects.length === 0 && (
                <TableRow>
                  <TableCell colSpan={2} className="text-center text-muted-foreground py-8">
                    Nenhuma disciplina cadastrada
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
