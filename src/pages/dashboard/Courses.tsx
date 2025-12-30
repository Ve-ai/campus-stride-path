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
import { useCourses, useTeachers, useSchoolNuclei, useClasses, useStudents, useSubjects } from '@/hooks/useDatabase';
import { toast } from 'sonner';

export function Courses() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const { data: courses, isLoading: loadingCourses } = useCourses();
  const { data: teachers } = useTeachers();
  const { data: nuclei } = useSchoolNuclei();
  const { data: classes } = useClasses();
  const { data: students } = useStudents();
  const { data: subjects } = useSubjects();

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

  const filteredCourses = coursesWithStats.filter(
    (course) =>
      course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.coordinatorName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Summary stats
  const totalStudents = filteredCourses.reduce((sum, c) => sum + c.totalStudents, 0);
  const totalMales = filteredCourses.reduce((sum, c) => sum + c.males, 0);
  const totalFemales = filteredCourses.reduce((sum, c) => sum + c.females, 0);
  const totalDropouts = filteredCourses.reduce((sum, c) => sum + c.dropouts, 0);

  if (loadingCourses) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Cursos</h1>
          <p className="text-muted-foreground">Gestão de cursos e suas turmas</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="btn-primary">
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Curso
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Adicionar Novo Curso</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Nome do Curso</Label>
                <Input placeholder="Ex: Enfermagem Geral" />
              </div>
              <div className="space-y-2">
                <Label>Núcleo Escolar</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o núcleo" />
                  </SelectTrigger>
                  <SelectContent>
                    {nuclei?.map((nucleus) => (
                      <SelectItem key={nucleus.id} value={nucleus.id}>
                        {nucleus.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Coordenador</Label>
                <Select>
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
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Mensalidade 10ª</Label>
                  <Input type="number" placeholder="Ex: 5000" />
                </div>
                <div className="space-y-2">
                  <Label>Mensalidade 11ª</Label>
                  <Input type="number" placeholder="Ex: 5500" />
                </div>
                <div className="space-y-2">
                  <Label>Mensalidade 12ª</Label>
                  <Input type="number" placeholder="Ex: 6000" />
                </div>
                <div className="space-y-2">
                  <Label>Mensalidade 13ª</Label>
                  <Input type="number" placeholder="Ex: 6500" />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button className="btn-primary" onClick={() => {
                  toast.info('Funcionalidade em desenvolvimento');
                  setIsAddDialogOpen(false);
                }}>
                  Adicionar Curso
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Pesquisar por nome do curso ou coordenador..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 input-field"
          />
        </div>
        <Button variant="outline" className="flex items-center gap-2">
          <Filter className="w-4 h-4" />
          Filtros
        </Button>
        <Button variant="outline" className="flex items-center gap-2" onClick={() => toast.info('Exportação em desenvolvimento')}>
          <Download className="w-4 h-4" />
          Exportar
        </Button>
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
                  onClick={() => navigate(`/dashboard/cursos/${course.id}`)}
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
                        <DropdownMenuItem>Editar Curso</DropdownMenuItem>
                        <DropdownMenuItem>Gerir Turmas</DropdownMenuItem>
                        <DropdownMenuItem>Exportar Dados</DropdownMenuItem>
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
    </div>
  );
}
