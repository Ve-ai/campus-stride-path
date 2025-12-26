import React, { useState } from 'react';
import {
  Search,
  Plus,
  Users,
  UserCheck,
  Phone,
  MoreHorizontal,
  Award,
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';

const directorsData = [
  {
    id: '1',
    order: 1,
    employeeNumber: '0002052',
    name: 'Ana Oliveira',
    classes: [
      { course: 'Enfermagem Geral', class: '10ª', section: 'B' },
    ],
    status: 'Activa',
    phone: '924 567 890',
    totalClasses: 1,
    averagePerformance: 78.5,
  },
  {
    id: '2',
    order: 2,
    employeeNumber: '0002053',
    name: 'Pedro Santos',
    classes: [
      { course: 'Contabilidade', class: '11ª', section: 'A' },
    ],
    status: 'Activa',
    phone: '926 789 012',
    totalClasses: 1,
    averagePerformance: 82.3,
  },
  {
    id: '3',
    order: 3,
    employeeNumber: '0002050',
    name: 'Carlos Mendes',
    classes: [
      { course: 'Enfermagem Geral', class: '10ª', section: 'A' },
      { course: 'Enfermagem Geral', class: '11ª', section: 'A' },
    ],
    status: 'Activa',
    phone: '925 654 254',
    totalClasses: 2,
    averagePerformance: 75.8,
  },
  {
    id: '4',
    order: 4,
    employeeNumber: '0002051',
    name: 'Sofia Lima',
    classes: [
      { course: 'Informática', class: '10ª', section: 'A' },
    ],
    status: 'Activa',
    phone: '923 456 789',
    totalClasses: 1,
    averagePerformance: 85.2,
  },
];

const availableTeachers = [
  { id: '1', name: 'Maria Ferreira', employeeNumber: '0002054' },
  { id: '2', name: 'José Almeida', employeeNumber: '0002055' },
];

const availableClasses = [
  { id: '1', course: 'Mecânica', class: '10ª', section: 'A' },
  { id: '2', course: 'Electricidade', class: '10ª', section: 'A' },
  { id: '3', course: 'Informática', class: '11ª', section: 'A' },
];

export function ClassDirectors() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);

  const filteredDirectors = directorsData.filter(
    (director) =>
      director.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      director.employeeNumber.includes(searchTerm)
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Diretores de Turma</h1>
          <p className="text-muted-foreground">Gestão de diretores de turma e suas atribuições</p>
        </div>
        <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
          <DialogTrigger asChild>
            <Button className="btn-primary">
              <Plus className="w-4 h-4 mr-2" />
              Nomear Director
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Nomear Director de Turma</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Professor</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o professor" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableTeachers.map((teacher) => (
                      <SelectItem key={teacher.id} value={teacher.id}>
                        {teacher.name} ({teacher.employeeNumber})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Turma</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a turma" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableClasses.map((classItem) => (
                      <SelectItem key={classItem.id} value={classItem.id}>
                        {classItem.course} - {classItem.class} {classItem.section}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={() => setIsAssignDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button className="btn-primary" onClick={() => setIsAssignDialogOpen(false)}>
                  Nomear
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
                <p className="text-sm text-muted-foreground">Total Diretores</p>
                <p className="text-2xl font-bold">{directorsData.length}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <UserCheck className="w-5 h-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="stat-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Turmas Atribuídas</p>
                <p className="text-2xl font-bold">
                  {directorsData.reduce((acc, d) => acc + d.totalClasses, 0)}
                </p>
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
                <p className="text-sm text-muted-foreground">Turmas sem Director</p>
                <p className="text-2xl font-bold">{availableClasses.length}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-warning" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="stat-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Aproveitamento Médio</p>
                <p className="text-2xl font-bold">
                  {(directorsData.reduce((acc, d) => acc + d.averagePerformance, 0) / directorsData.length).toFixed(1)}%
                </p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                <Award className="w-5 h-5 text-accent" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input
          placeholder="Pesquisar por nome ou número de funcionário..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 input-field"
        />
      </div>

      {/* Directors Table */}
      <Card className="card-elevated">
        <CardHeader>
          <CardTitle>Lista de Diretores de Turma</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="table-header">
                <TableHead>Nº</TableHead>
                <TableHead>Nº Trabalhador</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Turmas</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Contacto</TableHead>
                <TableHead className="text-center">Turmas Dirigidas</TableHead>
                <TableHead className="text-center">Aproveitamento Médio</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDirectors.map((director) => (
                <TableRow key={director.id} className="table-row-hover">
                  <TableCell className="font-medium">{String(director.order).padStart(2, '0')}</TableCell>
                  <TableCell>{director.employeeNumber}</TableCell>
                  <TableCell className="font-medium">{director.name}</TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      {director.classes.map((c, index) => (
                        <Badge key={index} variant="outline" className="text-xs w-fit">
                          {c.course} - {c.class} {c.section}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={director.status === 'Activa' ? 'badge-success' : 'badge-warning'}
                    >
                      {director.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      {director.phone}
                    </div>
                  </TableCell>
                  <TableCell className="text-center font-medium">{director.totalClasses}</TableCell>
                  <TableCell className="text-center">
                    <Badge
                      variant="outline"
                      className={
                        director.averagePerformance >= 80
                          ? 'badge-success'
                          : director.averagePerformance >= 70
                          ? 'badge-warning'
                          : 'badge-danger'
                      }
                    >
                      {director.averagePerformance}%
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>Ver Perfil</DropdownMenuItem>
                        <DropdownMenuItem>Ver Turmas</DropdownMenuItem>
                        <DropdownMenuItem>Atribuir Turma</DropdownMenuItem>
                        <DropdownMenuItem>Remover Turma</DropdownMenuItem>
                        <DropdownMenuItem>Relatório de Actividades</DropdownMenuItem>
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
