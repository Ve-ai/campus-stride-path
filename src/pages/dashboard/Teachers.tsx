import React, { useState } from 'react';
import {
  Search,
  Plus,
  GraduationCap,
  Clock,
  MoreHorizontal,
  Award,
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
import { useTeachers, useCourses } from '@/hooks/useDatabase';
import { toast } from 'sonner';

export function Teachers() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTeacher, setSelectedTeacher] = useState<any | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const { data: teachers, isLoading, error } = useTeachers();
  const { data: courses } = useCourses();

  const filteredTeachers = teachers?.filter(
    (teacher) =>
      teacher.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      teacher.employee_number?.includes(searchTerm)
  ) || [];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-AO', {
      style: 'currency',
      currency: 'AOA',
      minimumFractionDigits: 0,
    }).format(value);
  };

  // Calculate period stats
  const morningTeachers = filteredTeachers.filter(t => 
    t.teacher_class_assignments?.some((a: any) => a.class?.period === 'Manhã')
  ).length;
  
  const afternoonTeachers = filteredTeachers.filter(t => 
    t.teacher_class_assignments?.some((a: any) => a.class?.period === 'Tarde')
  ).length;

  const coordinators = filteredTeachers.filter(t => 
    t.functions?.some((f: string) => f.toLowerCase().includes('coordenador'))
  ).length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-destructive">Erro ao carregar professores</p>
      </div>
    );
  }

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
                        {courses?.map((course) => (
                          <SelectItem key={course.id} value={course.id}>
                            {course.name}
                          </SelectItem>
                        ))}
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
                        <SelectItem value="Manhã">Manhã</SelectItem>
                        <SelectItem value="Tarde">Tarde</SelectItem>
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
              <Button className="btn-primary" onClick={() => {
                toast.success('Funcionalidade em desenvolvimento');
                setIsAddDialogOpen(false);
              }}>
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
                <p className="text-2xl font-bold">{filteredTeachers.length}</p>
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
                <p className="text-2xl font-bold">{morningTeachers}</p>
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
                <p className="text-2xl font-bold">{afternoonTeachers}</p>
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
                <p className="text-2xl font-bold">{coordinators}</p>
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
          placeholder="Pesquisar por nome ou número de funcionário..."
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
                <TableHead>Grau</TableHead>
                <TableHead>Disciplina(s)</TableHead>
                <TableHead>Salário Bruto</TableHead>
                <TableHead>Funções</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTeachers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    Nenhum professor encontrado
                  </TableCell>
                </TableRow>
              ) : (
                filteredTeachers.map((teacher, index) => (
                  <TableRow key={teacher.id} className="table-row-hover" onClick={() => setSelectedTeacher(teacher)}>
                    <TableCell className="font-medium">{String(index + 1).padStart(2, '0')}</TableCell>
                    <TableCell>{teacher.employee_number}</TableCell>
                    <TableCell className="font-medium">{teacher.profiles?.full_name || '-'}</TableCell>
                    <TableCell>
                      {teacher.degree && (
                        <Badge variant="outline" className="text-xs">
                          {teacher.degree}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {teacher.teacher_class_assignments?.slice(0, 2).map((assignment: any, i: number) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {assignment.subject?.name}
                          </Badge>
                        ))}
                        {(teacher.teacher_class_assignments?.length || 0) > 2 && (
                          <Badge variant="secondary" className="text-xs">
                            +{teacher.teacher_class_assignments.length - 2}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{formatCurrency(teacher.gross_salary || 0)}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {teacher.functions && teacher.functions.length > 0 ? (
                          teacher.functions.slice(0, 2).map((f: string, i: number) => (
                            <Badge key={i} variant="secondary" className="text-xs">
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
                ))
              )}
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
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-20 h-20 rounded-xl bg-primary/10 flex items-center justify-center">
                  <GraduationCap className="w-10 h-10 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold">{selectedTeacher.profiles?.full_name}</h3>
                  <p className="text-muted-foreground">{selectedTeacher.employee_number}</p>
                  <div className="flex gap-2 mt-2">
                    {selectedTeacher.degree && (
                      <Badge variant="outline">{selectedTeacher.degree}</Badge>
                    )}
                    {selectedTeacher.is_active ? (
                      <Badge className="badge-success">Activo</Badge>
                    ) : (
                      <Badge variant="destructive">Inactivo</Badge>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Contacto</p>
                  <p className="font-medium">{selectedTeacher.profiles?.phone || '-'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">BI</p>
                  <p className="font-medium">{selectedTeacher.profiles?.bi_number || '-'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Data de Contratação</p>
                  <p className="font-medium">
                    {selectedTeacher.hire_date 
                      ? new Date(selectedTeacher.hire_date).toLocaleDateString('pt-AO')
                      : '-'}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Salário Bruto</p>
                  <p className="font-medium">{formatCurrency(selectedTeacher.gross_salary || 0)}</p>
                </div>
              </div>

              {selectedTeacher.teacher_class_assignments && selectedTeacher.teacher_class_assignments.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Turmas e Disciplinas</p>
                  <div className="space-y-2">
                    {selectedTeacher.teacher_class_assignments.map((assignment: any, i: number) => (
                      <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <div>
                          <p className="font-medium">{assignment.subject?.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {assignment.class?.course?.name} - {assignment.class?.grade_level}ª {assignment.class?.section}
                          </p>
                        </div>
                      </div>
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
