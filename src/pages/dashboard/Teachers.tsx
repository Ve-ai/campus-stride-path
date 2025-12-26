import React, { useState } from 'react';
import {
  Search,
  Plus,
  Users,
  GraduationCap,
  Clock,
  MoreHorizontal,
  Mail,
  Phone,
  Award,
  Briefcase,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const teachersData = [
  {
    id: '1',
    employeeNumber: '0002050',
    name: 'Carlos Mendes',
    course: 'Enfermagem',
    disciplines: ['Matemática', 'Estatística'],
    period: 'Manhã',
    salary: 85000,
    functions: ['Coordenador 10ª A', 'Comissão Disciplinar'],
    workTime: '5 anos',
    phone: '925 654 254',
    email: 'carlos.mendes@escola.co.ao',
    degree: 'Licenciatura em Matemática',
  },
  {
    id: '2',
    employeeNumber: '0002051',
    name: 'Sofia Lima',
    course: 'Informática',
    disciplines: ['Programação', 'Base de Dados'],
    period: 'Tarde',
    salary: 90000,
    functions: ['Coordenadora de Curso'],
    workTime: '7 anos',
    phone: '923 456 789',
    email: 'sofia.lima@escola.co.ao',
    degree: 'Mestrado em Engenharia Informática',
  },
  {
    id: '3',
    employeeNumber: '0002052',
    name: 'Ana Oliveira',
    course: 'Enfermagem',
    disciplines: ['Biologia', 'Anatomia'],
    period: 'Manhã',
    salary: 80000,
    functions: ['Directora de Turma 10ª B'],
    workTime: '3 anos',
    phone: '924 567 890',
    email: 'ana.oliveira@escola.co.ao',
    degree: 'Licenciatura em Biologia',
  },
  {
    id: '4',
    employeeNumber: '0002053',
    name: 'Pedro Santos',
    course: 'Contabilidade',
    disciplines: ['Contabilidade Geral', 'Finanças'],
    period: 'Manhã',
    salary: 82000,
    functions: ['Director de Turma 11ª A'],
    workTime: '4 anos',
    phone: '926 789 012',
    email: 'pedro.santos@escola.co.ao',
    degree: 'Licenciatura em Contabilidade',
  },
  {
    id: '5',
    employeeNumber: '0002054',
    name: 'Maria Ferreira',
    course: 'Mecânica',
    disciplines: ['Física', 'Mecânica Aplicada'],
    period: 'Tarde',
    salary: 78000,
    functions: [],
    workTime: '2 anos',
    phone: '927 890 123',
    email: 'maria.ferreira@escola.co.ao',
    degree: 'Licenciatura em Engenharia Mecânica',
  },
];

export function Teachers() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTeacher, setSelectedTeacher] = useState<typeof teachersData[0] | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const filteredTeachers = teachersData.filter(
    (teacher) =>
      teacher.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      teacher.course.toLowerCase().includes(searchTerm.toLowerCase()) ||
      teacher.employeeNumber.includes(searchTerm)
  );

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-AO', {
      style: 'currency',
      currency: 'AOA',
      minimumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Professores</h1>
          <p className="text-muted-foreground">Gestão do corpo docente</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="btn-primary">
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Professor
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Adicionar Novo Professor</DialogTitle>
            </DialogHeader>
            <Tabs defaultValue="pessoais" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="pessoais">Dados Pessoais</TabsTrigger>
                <TabsTrigger value="profissionais">Profissionais</TabsTrigger>
                <TabsTrigger value="formacao">Formação</TabsTrigger>
                <TabsTrigger value="salario">Salário</TabsTrigger>
              </TabsList>
              <TabsContent value="pessoais" className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2 space-y-2">
                    <Label>Nome Completo</Label>
                    <Input placeholder="Nome completo do professor" />
                  </div>
                  <div className="space-y-2">
                    <Label>Data de Nascimento</Label>
                    <Input type="date" />
                  </div>
                  <div className="space-y-2">
                    <Label>Local de Nascimento</Label>
                    <Input placeholder="Ex: Luanda" />
                  </div>
                  <div className="space-y-2">
                    <Label>Número do BI</Label>
                    <Input placeholder="Ex: 000123456LA789" />
                  </div>
                  <div className="space-y-2">
                    <Label>Data de Emissão do BI</Label>
                    <Input type="date" />
                  </div>
                  <div className="space-y-2">
                    <Label>Contacto</Label>
                    <Input placeholder="Ex: 925 654 254" />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input type="email" placeholder="Ex: professor@escola.co.ao" />
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="profissionais" className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Curso a Ministrar</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o curso" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="enfermagem">Enfermagem</SelectItem>
                        <SelectItem value="informatica">Informática</SelectItem>
                        <SelectItem value="contabilidade">Contabilidade</SelectItem>
                        <SelectItem value="mecanica">Mecânica</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Classe</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">10ª</SelectItem>
                        <SelectItem value="11">11ª</SelectItem>
                        <SelectItem value="12">12ª</SelectItem>
                        <SelectItem value="13">13ª</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-2 space-y-2">
                    <Label>Disciplinas</Label>
                    <Input placeholder="Ex: Matemática, Estatística" />
                  </div>
                  <div className="space-y-2">
                    <Label>Período</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="manha">Manhã</SelectItem>
                        <SelectItem value="tarde">Tarde</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Funções Adicionais</Label>
                    <Input placeholder="Ex: Coordenador de Turma" />
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="formacao" className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Grau Académico</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="licenciatura">Licenciatura</SelectItem>
                        <SelectItem value="mestrado">Mestrado</SelectItem>
                        <SelectItem value="doutoramento">Doutoramento</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Área de Formação</Label>
                    <Input placeholder="Ex: Engenharia Informática" />
                  </div>
                  <div className="col-span-2 space-y-2">
                    <Label>Instituição de Formação</Label>
                    <Input placeholder="Ex: Universidade Agostinho Neto" />
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="salario" className="space-y-4 py-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Salário Bruto (AOA)</Label>
                    <Input type="number" placeholder="Ex: 85000" />
                  </div>
                </div>
              </TabsContent>
            </Tabs>
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancelar
              </Button>
              <Button className="btn-primary" onClick={() => setIsAddDialogOpen(false)}>
                Adicionar Professor
              </Button>
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
                <p className="text-sm text-muted-foreground">Total Professores</p>
                <p className="text-2xl font-bold">{teachersData.length}</p>
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
                <p className="text-2xl font-bold">{teachersData.filter((t) => t.period === 'Manhã').length}</p>
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
                <p className="text-2xl font-bold">{teachersData.filter((t) => t.period === 'Tarde').length}</p>
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
                <p className="text-sm text-muted-foreground">Coordenadores</p>
                <p className="text-2xl font-bold">
                  {teachersData.filter((t) => t.functions.some((f) => f.includes('Coordenador'))).length}
                </p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                <Award className="w-5 h-5 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input
          placeholder="Pesquisar por nome, curso ou número de funcionário..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 input-field"
        />
      </div>

      {/* Teachers Table */}
      <Card className="card-elevated">
        <CardHeader>
          <CardTitle>Lista de Professores</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="table-header">
                <TableHead>Nº</TableHead>
                <TableHead>Nº Funcionário</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Curso</TableHead>
                <TableHead>Disciplina(s)</TableHead>
                <TableHead>Período</TableHead>
                <TableHead>Salário Bruto</TableHead>
                <TableHead>Funções</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTeachers.map((teacher, index) => (
                <TableRow key={teacher.id} className="table-row-hover" onClick={() => setSelectedTeacher(teacher)}>
                  <TableCell className="font-medium">{String(index + 1).padStart(2, '0')}</TableCell>
                  <TableCell>{teacher.employeeNumber}</TableCell>
                  <TableCell className="font-medium">{teacher.name}</TableCell>
                  <TableCell>{teacher.course}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {teacher.disciplines.map((d) => (
                        <Badge key={d} variant="outline" className="text-xs">
                          {d}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={teacher.period === 'Manhã' ? 'bg-warning/10 text-warning border-warning/20' : 'bg-accent/10 text-accent border-accent/20'}
                    >
                      {teacher.period}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatCurrency(teacher.salary)}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {teacher.functions.length > 0 ? (
                        teacher.functions.map((f) => (
                          <Badge key={f} variant="secondary" className="text-xs">
                            {f}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}>
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>Ver Perfil</DropdownMenuItem>
                        <DropdownMenuItem>Editar Dados</DropdownMenuItem>
                        <DropdownMenuItem>Ver Turmas</DropdownMenuItem>
                        <DropdownMenuItem>Avaliar Desempenho</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Teacher Details Dialog */}
      <Dialog open={!!selectedTeacher} onOpenChange={() => setSelectedTeacher(null)}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Perfil do Professor</DialogTitle>
          </DialogHeader>
          {selectedTeacher && (
            <div className="space-y-6 py-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-2xl font-bold text-primary">
                    {selectedTeacher.name.charAt(0)}
                  </span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold">{selectedTeacher.name}</h3>
                  <p className="text-muted-foreground">Nº {selectedTeacher.employeeNumber}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Curso</p>
                  <p className="font-medium">{selectedTeacher.course}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Período</p>
                  <p className="font-medium">{selectedTeacher.period}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Formação</p>
                  <p className="font-medium">{selectedTeacher.degree}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Tempo de Trabalho</p>
                  <p className="font-medium">{selectedTeacher.workTime}</p>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Contactos</p>
                <div className="flex gap-4">
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span>{selectedTeacher.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span>{selectedTeacher.email}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Disciplinas</p>
                <div className="flex flex-wrap gap-2">
                  {selectedTeacher.disciplines.map((d) => (
                    <Badge key={d} variant="secondary">
                      {d}
                    </Badge>
                  ))}
                </div>
              </div>

              {selectedTeacher.functions.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Funções Adicionais</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedTeacher.functions.map((f) => (
                      <Badge key={f} className="bg-primary/10 text-primary border-primary/20">
                        {f}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
