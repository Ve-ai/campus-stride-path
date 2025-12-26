import React, { useState } from 'react';
import {
  Search,
  Filter,
  Plus,
  Users,
  Clock,
  BookOpen,
  MoreHorizontal,
  ChevronDown,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

const classesData = [
  {
    id: '1',
    course: 'Enfermagem Geral',
    class: '10ª',
    section: 'A',
    period: 'Manhã',
    students: 40,
    disciplines: 8,
    director: 'Ana Oliveira',
    year: 2025,
  },
  {
    id: '2',
    course: 'Enfermagem Geral',
    class: '10ª',
    section: 'B',
    period: 'Tarde',
    students: 38,
    disciplines: 8,
    director: 'Carlos Mendes',
    year: 2025,
  },
  {
    id: '3',
    course: 'Informática',
    class: '10ª',
    section: 'A',
    period: 'Manhã',
    students: 35,
    disciplines: 10,
    director: 'Sofia Lima',
    year: 2025,
  },
  {
    id: '4',
    course: 'Informática',
    class: '11ª',
    section: 'A',
    period: 'Tarde',
    students: 32,
    disciplines: 10,
    director: 'Pedro Santos',
    year: 2025,
  },
  {
    id: '5',
    course: 'Contabilidade e Gestão',
    class: '10ª',
    section: 'A',
    period: 'Manhã',
    students: 30,
    disciplines: 9,
    director: 'Maria Ferreira',
    year: 2025,
  },
  {
    id: '6',
    course: 'Mecânica',
    class: '10ª',
    section: 'A',
    period: 'Manhã',
    students: 25,
    disciplines: 8,
    director: 'José Almeida',
    year: 2025,
  },
];

const courses = ['Todos', 'Enfermagem Geral', 'Informática', 'Contabilidade e Gestão', 'Mecânica', 'Electricidade'];
const periods = ['Todos', 'Manhã', 'Tarde'];
const classYears = ['Todas', '10ª', '11ª', '12ª', '13ª'];

export function Classes() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('Todos');
  const [selectedPeriod, setSelectedPeriod] = useState('Todos');
  const [selectedYear, setSelectedYear] = useState('Todas');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const filteredClasses = classesData.filter((classItem) => {
    const matchesSearch =
      classItem.course.toLowerCase().includes(searchTerm.toLowerCase()) ||
      classItem.director.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCourse = selectedCourse === 'Todos' || classItem.course === selectedCourse;
    const matchesPeriod = selectedPeriod === 'Todos' || classItem.period === selectedPeriod;
    const matchesYear = selectedYear === 'Todas' || classItem.class === selectedYear;

    return matchesSearch && matchesCourse && matchesPeriod && matchesYear;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Turmas</h1>
          <p className="text-muted-foreground">Gestão de turmas e estudantes</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="btn-primary">
              <Plus className="w-4 h-4 mr-2" />
              Criar Turma
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Criar Nova Turma</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Curso</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o curso" />
                  </SelectTrigger>
                  <SelectContent>
                    {courses.slice(1).map((course) => (
                      <SelectItem key={course} value={course}>
                        {course}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Classe</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {classYears.slice(1).map((year) => (
                        <SelectItem key={year} value={year}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Turma</Label>
                  <Input placeholder="Ex: A, B, C" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Período</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {periods.slice(1).map((period) => (
                        <SelectItem key={period} value={period}>
                          {period}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Capacidade</Label>
                  <Input type="number" placeholder="Nº de alunos" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Ano Lectivo</Label>
                <Input type="number" defaultValue={new Date().getFullYear()} />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button className="btn-primary" onClick={() => setIsCreateDialogOpen(false)}>
                  Criar Turma
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="stat-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total de Turmas</p>
                <p className="text-2xl font-bold">{classesData.length}</p>
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
                <p className="text-sm text-muted-foreground">Período Manhã</p>
                <p className="text-2xl font-bold">{classesData.filter((c) => c.period === 'Manhã').length}</p>
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
                <p className="text-2xl font-bold">{classesData.filter((c) => c.period === 'Tarde').length}</p>
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
                <p className="text-2xl font-bold">{classesData.reduce((acc, c) => acc + c.students, 0)}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Pesquisar turmas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 input-field"
          />
        </div>
        <Select value={selectedCourse} onValueChange={setSelectedCourse}>
          <SelectTrigger className="w-full md:w-48">
            <SelectValue placeholder="Curso" />
          </SelectTrigger>
          <SelectContent>
            {courses.map((course) => (
              <SelectItem key={course} value={course}>
                {course}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={selectedYear} onValueChange={setSelectedYear}>
          <SelectTrigger className="w-full md:w-32">
            <SelectValue placeholder="Classe" />
          </SelectTrigger>
          <SelectContent>
            {classYears.map((year) => (
              <SelectItem key={year} value={year}>
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
          <SelectTrigger className="w-full md:w-32">
            <SelectValue placeholder="Período" />
          </SelectTrigger>
          <SelectContent>
            {periods.map((period) => (
              <SelectItem key={period} value={period}>
                {period}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Classes Table */}
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
                <TableHead>Director de Turma</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClasses.map((classItem) => (
                <TableRow key={classItem.id} className="table-row-hover">
                  <TableCell className="font-medium">{classItem.course}</TableCell>
                  <TableCell>{classItem.class}</TableCell>
                  <TableCell>{classItem.section}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={classItem.period === 'Manhã' ? 'bg-warning/10 text-warning border-warning/20' : 'bg-accent/10 text-accent border-accent/20'}
                    >
                      {classItem.period}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center font-medium">{classItem.students}</TableCell>
                  <TableCell className="text-center">{classItem.disciplines}</TableCell>
                  <TableCell>{classItem.director}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>Ver Estudantes</DropdownMenuItem>
                        <DropdownMenuItem>Adicionar Estudante</DropdownMenuItem>
                        <DropdownMenuItem>Ver Notas</DropdownMenuItem>
                        <DropdownMenuItem>Editar Turma</DropdownMenuItem>
                        <DropdownMenuItem>Atribuir Director</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
