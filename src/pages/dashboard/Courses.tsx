import React, { useState } from 'react';
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

const coursesData = [
  {
    id: '1',
    name: 'Enfermagem Geral',
    coordinator: 'João Silva',
    totalEnrolled: 120,
    male: 50,
    female: 70,
    dropouts: 10,
    dropoutRate: 8.3,
    classes: [
      { class: '10ª', section: 'A', enrolled: 40, maleEnrolled: 15, femaleEnrolled: 25, dropouts: 2 },
      { class: '10ª', section: 'B', enrolled: 38, maleEnrolled: 18, femaleEnrolled: 20, dropouts: 3 },
      { class: '11ª', section: 'A', enrolled: 22, maleEnrolled: 10, femaleEnrolled: 12, dropouts: 3 },
      { class: '12ª', section: 'A', enrolled: 20, maleEnrolled: 7, femaleEnrolled: 13, dropouts: 2 },
    ],
  },
  {
    id: '2',
    name: 'Informática',
    coordinator: 'Maria Santos',
    totalEnrolled: 95,
    male: 72,
    female: 23,
    dropouts: 6,
    dropoutRate: 6.3,
    classes: [
      { class: '10ª', section: 'A', enrolled: 35, maleEnrolled: 28, femaleEnrolled: 7, dropouts: 2 },
      { class: '11ª', section: 'A', enrolled: 32, maleEnrolled: 25, femaleEnrolled: 7, dropouts: 2 },
      { class: '12ª', section: 'A', enrolled: 28, maleEnrolled: 19, femaleEnrolled: 9, dropouts: 2 },
    ],
  },
  {
    id: '3',
    name: 'Contabilidade e Gestão',
    coordinator: 'Ana Pereira',
    totalEnrolled: 85,
    male: 35,
    female: 50,
    dropouts: 5,
    dropoutRate: 5.9,
    classes: [
      { class: '10ª', section: 'A', enrolled: 30, maleEnrolled: 12, femaleEnrolled: 18, dropouts: 1 },
      { class: '11ª', section: 'A', enrolled: 28, maleEnrolled: 11, femaleEnrolled: 17, dropouts: 2 },
      { class: '12ª', section: 'A', enrolled: 27, maleEnrolled: 12, femaleEnrolled: 15, dropouts: 2 },
    ],
  },
  {
    id: '4',
    name: 'Mecânica',
    coordinator: 'Carlos Mendes',
    totalEnrolled: 70,
    male: 68,
    female: 2,
    dropouts: 8,
    dropoutRate: 11.4,
    classes: [
      { class: '10ª', section: 'A', enrolled: 25, maleEnrolled: 24, femaleEnrolled: 1, dropouts: 3 },
      { class: '11ª', section: 'A', enrolled: 23, maleEnrolled: 23, femaleEnrolled: 0, dropouts: 3 },
      { class: '12ª', section: 'A', enrolled: 22, maleEnrolled: 21, femaleEnrolled: 1, dropouts: 2 },
    ],
  },
  {
    id: '5',
    name: 'Electricidade',
    coordinator: 'Pedro Gomes',
    totalEnrolled: 55,
    male: 52,
    female: 3,
    dropouts: 4,
    dropoutRate: 7.3,
    classes: [
      { class: '10ª', section: 'A', enrolled: 20, maleEnrolled: 19, femaleEnrolled: 1, dropouts: 1 },
      { class: '11ª', section: 'A', enrolled: 18, maleEnrolled: 17, femaleEnrolled: 1, dropouts: 2 },
      { class: '12ª', section: 'A', enrolled: 17, maleEnrolled: 16, femaleEnrolled: 1, dropouts: 1 },
    ],
  },
];

export function Courses() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);

  const filteredCourses = coursesData.filter(
    (course) =>
      course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.coordinator.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedCourseData = coursesData.find((c) => c.id === selectedCourse);

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
            placeholder="Pesquisar por nome ou coordenador..."
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
                <p className="text-2xl font-bold">{coursesData.length}</p>
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
                <p className="text-sm text-muted-foreground">Total Matriculados</p>
                <p className="text-2xl font-bold">{coursesData.reduce((acc, c) => acc + c.totalEnrolled, 0)}</p>
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
                <p className="text-sm text-muted-foreground">Total Desistentes</p>
                <p className="text-2xl font-bold">{coursesData.reduce((acc, c) => acc + c.dropouts, 0)}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                <TrendingDown className="w-5 h-5 text-destructive" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="stat-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Taxa Média Desistência</p>
                <p className="text-2xl font-bold">
                  {(coursesData.reduce((acc, c) => acc + c.dropoutRate, 0) / coursesData.length).toFixed(1)}%
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
                  className="table-row-hover"
                  onClick={() => setSelectedCourse(selectedCourse === course.id ? null : course.id)}
                >
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <ChevronRight
                        className={`w-4 h-4 text-muted-foreground transition-transform ${
                          selectedCourse === course.id ? 'rotate-90' : ''
                        }`}
                      />
                      {course.name}
                    </div>
                  </TableCell>
                  <TableCell>{course.coordinator}</TableCell>
                  <TableCell className="text-center font-medium">{course.totalEnrolled}</TableCell>
                  <TableCell className="text-center">{course.male}</TableCell>
                  <TableCell className="text-center">{course.female}</TableCell>
                  <TableCell className="text-center">{course.dropouts}</TableCell>
                  <TableCell className="text-center">
                    <Badge
                      variant="outline"
                      className={
                        course.dropoutRate > 10
                          ? 'badge-danger'
                          : course.dropoutRate > 7
                          ? 'badge-warning'
                          : 'badge-success'
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
                        <DropdownMenuItem>Ver Detalhes</DropdownMenuItem>
                        <DropdownMenuItem>Editar Curso</DropdownMenuItem>
                        <DropdownMenuItem>Gerir Turmas</DropdownMenuItem>
                        <DropdownMenuItem>Exportar Dados</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Selected Course Details */}
      {selectedCourseData && (
        <Card className="card-elevated animate-slide-up">
          <CardHeader>
            <CardTitle>Turmas de {selectedCourseData.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="table-header">
                  <TableHead>Classe</TableHead>
                  <TableHead>Turma</TableHead>
                  <TableHead className="text-center">Matriculados (M/F)</TableHead>
                  <TableHead className="text-center">Desistentes</TableHead>
                  <TableHead className="text-center">% do Curso</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {selectedCourseData.classes.map((classItem, index) => (
                  <TableRow key={index} className="table-row-hover">
                    <TableCell className="font-medium">{classItem.class}</TableCell>
                    <TableCell>{classItem.section}</TableCell>
                    <TableCell className="text-center">
                      {classItem.enrolled} ({classItem.maleEnrolled}/{classItem.femaleEnrolled})
                    </TableCell>
                    <TableCell className="text-center">{classItem.dropouts}</TableCell>
                    <TableCell className="text-center">
                      {((classItem.enrolled / selectedCourseData.totalEnrolled) * 100).toFixed(0)}%
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
