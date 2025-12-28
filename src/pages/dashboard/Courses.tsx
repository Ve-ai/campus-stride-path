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
import { Badge } from '@/components/ui/badge';
import { useCourses, useTeachers, useSchoolNuclei } from '@/hooks/useDatabase';

export function Courses() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  const { data: courses, isLoading: loadingCourses } = useCourses();
  const { data: teachers } = useTeachers();
  const { data: nuclei } = useSchoolNuclei();

  const filteredCourses = courses?.filter(
    (course) =>
      course.name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const getCoordinator = (coordinatorId: string | null) => {
    if (!coordinatorId) return 'Não atribuído';
    const teacher = teachers?.find(t => t.id === coordinatorId);
    return teacher?.profiles?.full_name || 'Não atribuído';
  };

  const getNucleus = (nucleusId: string | null) => {
    if (!nucleusId) return '-';
    const nucleus = nuclei?.find(n => n.id === nucleusId);
    return nucleus?.name || '-';
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Cursos</h1>
          <p className="text-muted-foreground">Gestão de cursos e suas turmas</p>
        </div>
        <Button className="btn-primary">
          <Plus className="w-4 h-4 mr-2" />
          Adicionar Curso
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Pesquisar por nome do curso..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 input-field"
          />
        </div>
        <Button variant="outline" className="flex items-center gap-2">
          <Filter className="w-4 h-4" />
          Filtros
        </Button>
        <Button variant="outline" className="flex items-center gap-2">
          <Download className="w-4 h-4" />
          Exportar
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="stat-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total de Cursos</p>
                <p className="text-2xl font-bold">{courses?.length || 0}</p>
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
                <p className="text-sm text-muted-foreground">Núcleos Escolares</p>
                <p className="text-2xl font-bold">{nuclei?.length || 0}</p>
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
                <p className="text-sm text-muted-foreground">Coordenadores</p>
                <p className="text-2xl font-bold">
                  {courses?.filter(c => c.coordinator_id).length || 0}
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
                <p className="text-sm text-muted-foreground">Sem Coordenador</p>
                <p className="text-2xl font-bold">
                  {courses?.filter(c => !c.coordinator_id).length || 0}
                </p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
                <TrendingDown className="w-5 h-5 text-warning" />
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
          {loadingCourses ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="table-header">
                  <TableHead>Núcleo Escolar</TableHead>
                  <TableHead>Curso</TableHead>
                  <TableHead>Coordenador</TableHead>
                  <TableHead className="text-center">Mensalidade 10ª</TableHead>
                  <TableHead className="text-center">Mensalidade 11ª</TableHead>
                  <TableHead className="text-center">Mensalidade 12ª</TableHead>
                  <TableHead className="text-center">Mensalidade 13ª</TableHead>
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
                    <TableCell>{getNucleus(course.school_nucleus_id)}</TableCell>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {course.name}
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      </div>
                    </TableCell>
                    <TableCell>{getCoordinator(course.coordinator_id)}</TableCell>
                    <TableCell className="text-center">
                      {course.monthly_fee_10?.toLocaleString('pt-AO')} Kz
                    </TableCell>
                    <TableCell className="text-center">
                      {course.monthly_fee_11?.toLocaleString('pt-AO')} Kz
                    </TableCell>
                    <TableCell className="text-center">
                      {course.monthly_fee_12?.toLocaleString('pt-AO')} Kz
                    </TableCell>
                    <TableCell className="text-center">
                      {course.monthly_fee_13?.toLocaleString('pt-AO')} Kz
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
                        <Button className="btn-primary">
                          <Plus className="w-4 h-4 mr-2" />
                          Adicionar Curso
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
