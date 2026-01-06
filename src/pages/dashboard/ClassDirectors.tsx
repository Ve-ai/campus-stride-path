import React, { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  Users,
  UserCheck,
  Phone,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useClasses, useTeachers } from '@/hooks/useDatabase';
import { toast } from "@/lib/notifications";
import { supabase } from '@/integrations/supabase/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export function ClassDirectors() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('');
  const [selectedClassId, setSelectedClassId] = useState<string>('');

  const { data: classes, isLoading: loadingClasses } = useClasses();
  const { data: teachers, isLoading: loadingTeachers } = useTeachers();
  const queryClient = useQueryClient();

  const assignDirectorMutation = useMutation({
    mutationFn: async ({ classId, teacherId }: { classId: string; teacherId: string }) => {
      const { error } = await supabase
        .from('classes')
        .update({ class_director_id: teacherId })
        .eq('id', classId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Director de turma nomeado com sucesso');
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      setIsAssignDialogOpen(false);
      setSelectedTeacherId('');
      setSelectedClassId('');
    },
    onError: (error) => {
      toast.error('Erro ao nomear director: ' + (error as Error).message);
    },
  });

  const isLoading = loadingClasses || loadingTeachers;

  // Get class directors from classes that have a director assigned
  const directorsData = useMemo(() => {
    if (!classes || !teachers) return [];

    // Group classes by director
    const directorMap = new Map<string, {
      teacher: any;
      classes: any[];
    }>();

    classes.forEach(classItem => {
      if (classItem.class_director_id && classItem.class_director) {
        const existing = directorMap.get(classItem.class_director_id);
        if (existing) {
          existing.classes.push(classItem);
        } else {
          // Find the teacher details
          const teacher = teachers.find(t => t.id === classItem.class_director_id);
          if (teacher) {
            directorMap.set(classItem.class_director_id, {
              teacher,
              classes: [classItem],
            });
          }
        }
      }
    });

    return Array.from(directorMap.values()).map((item, index) => ({
      id: item.teacher.id,
      order: index + 1,
      employeeNumber: item.teacher.employee_number,
      name: item.teacher.profiles?.full_name || '-',
      classes: item.classes.map(c => ({
        course: c.course?.name || '-',
        class: `${c.grade_level}ª`,
        section: c.section,
      })),
      status: item.teacher.is_active ? 'Activa' : 'Inactiva',
      phone: item.teacher.profiles?.phone || '-',
      totalClasses: item.classes.length,
      averagePerformance: 75 + Math.random() * 20, // Mock for now
    }));
  }, [classes, teachers]);

  // Get classes without directors
  const classesWithoutDirector = useMemo(() => {
    if (!classes) return [];
    return classes.filter(c => !c.class_director_id);
  }, [classes]);

  // Get teachers without class director role
  const availableTeachers = useMemo(() => {
    if (!teachers || !classes) return [];
    const directorIds = new Set(classes.filter(c => c.class_director_id).map(c => c.class_director_id));
    return teachers.filter(t => !directorIds.has(t.id));
  }, [teachers, classes]);

  const filteredDirectors = directorsData.filter(
    (director) =>
      director.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      director.employeeNumber.includes(searchTerm)
  );

  const totalClasses = directorsData.reduce((acc, d) => acc + d.totalClasses, 0);
  const averagePerformance = directorsData.length > 0
    ? directorsData.reduce((acc, d) => acc + d.averagePerformance, 0) / directorsData.length
    : 0;

  if (isLoading) {
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
                <Select
                  value={selectedTeacherId}
                  onValueChange={(v) => setSelectedTeacherId(v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o professor" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableTeachers.length === 0 ? (
                      <SelectItem value="" disabled>
                        Nenhum professor disponível
                      </SelectItem>
                    ) : (
                      availableTeachers.map((teacher) => (
                        <SelectItem key={teacher.id} value={teacher.id}>
                          {teacher.profiles?.full_name} ({teacher.employee_number})
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Turma</Label>
                <Select
                  value={selectedClassId}
                  onValueChange={(v) => setSelectedClassId(v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a turma" />
                  </SelectTrigger>
                  <SelectContent>
                    {classesWithoutDirector.length === 0 ? (
                      <SelectItem value="" disabled>
                        Todas as turmas têm director
                      </SelectItem>
                    ) : (
                      classesWithoutDirector.map((classItem) => (
                        <SelectItem key={classItem.id} value={classItem.id}>
                          {classItem.course?.name} - {classItem.grade_level}ª {classItem.section}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={() => setIsAssignDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button
                  className="btn-primary"
                  disabled={!selectedTeacherId || !selectedClassId || assignDirectorMutation.isPending}
                  onClick={() =>
                    assignDirectorMutation.mutate({
                      classId: selectedClassId,
                      teacherId: selectedTeacherId,
                    })
                  }
                >
                  {assignDirectorMutation.isPending ? 'A nomear...' : 'Nomear'}
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
                <p className="text-2xl font-bold">{totalClasses}</p>
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
                <p className="text-2xl font-bold">{classesWithoutDirector.length}</p>
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
                <p className="text-2xl font-bold">{averagePerformance.toFixed(1)}%</p>
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
              {filteredDirectors.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    Nenhum director de turma encontrado
                  </TableCell>
                </TableRow>
              ) : (
                filteredDirectors.map((director) => (
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
                        {director.averagePerformance.toFixed(1)}%
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
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
