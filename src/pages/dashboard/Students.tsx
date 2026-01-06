import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Users,
  UserPlus,
  GraduationCap,
  AlertTriangle,
  Loader2,
  CalendarIcon,
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
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useClasses, useCreateStudent, useStudents } from '@/hooks/useDatabase';
import { toast } from "@/lib/notifications";
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

export function Students() {
  const navigate = useNavigate();
  const { data: students, isLoading } = useStudents();
  const { data: classes } = useClasses();
  const createStudent = useCreateStudent();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClassId, setSelectedClassId] = useState<'Todos' | string>('Todos');
  const [selectedStatus, setSelectedStatus] = useState<'Todos' | 'active' | 'dropout'>(
    'Todos',
  );
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [newStudent, setNewStudent] = useState({
    enrollment_number: '',
    full_name: '',
    gender: 'Masculino',
    enrollment_year: new Date().getFullYear().toString(),
    class_id: '',
    bi_number: '',
    birth_date: undefined as Date | undefined,
    birthplace: '',
    province: '',
    father_name: '',
    mother_name: '',
    guardian_name: '',
    guardian_contact: '',
    enrollment_date: undefined as Date | undefined,
  });

  const stats = useMemo(() => {
    const total = students?.length || 0;
    const active = students?.filter((s) => s.status === 'active').length || 0;
    const dropouts = students?.filter((s) => s.status === 'dropout').length || 0;
    const males = students?.filter((s) => s.gender === 'Masculino').length || 0;
    const females = students?.filter((s) => s.gender === 'Feminino').length || 0;

    return { total, active, dropouts, males, females };
  }, [students]);

  const filteredStudents = useMemo(() => {
    if (!students) return [];

    return students.filter((student) => {
      const matchesSearch =
        student.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.enrollment_number.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesClass =
        selectedClassId === 'Todos' || student.class_id === selectedClassId;
      const matchesStatus =
        selectedStatus === 'Todos' || (student.status || 'active') === selectedStatus;

      return matchesSearch && matchesClass && matchesStatus;
    });
  }, [students, searchTerm, selectedClassId, selectedStatus]);

  const generateEnrollmentNumber = () => {
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `${year}${random}`;
  };

  const handleCreateStudent = async () => {
    if (!newStudent.full_name.trim()) {
      toast.error('Nome do estudante é obrigatório');
      return;
    }

    if (!newStudent.enrollment_number) {
      toast.error('Número de matrícula é obrigatório');
      return;
    }

    const parentNames = [newStudent.father_name, newStudent.mother_name]
      .filter((n) => n.trim().length > 0)
      .join(' / ');

    const birthDateString = newStudent.birth_date
      ? newStudent.birth_date.toISOString().split('T')[0]
      : undefined;

    const enrollmentDate = newStudent.enrollment_date || new Date();
    const enrollmentYear = enrollmentDate.getFullYear();

    let photoUrl: string | undefined;

    if (photoFile) {
      const fileExt = photoFile.name.split('.').pop();
      const fileName = `${newStudent.enrollment_number || generateEnrollmentNumber()}-${Date.now()}.${fileExt}`;
      const filePath = `students/${fileName}`;

      const { data, error } = await supabase.storage
        .from('student-photos')
        .upload(filePath, photoFile);

      if (error) {
        toast.error('Erro ao carregar foto: ' + error.message);
        return;
      }

      const publicUrl = supabase.storage
        .from('student-photos')
        .getPublicUrl(data.path).data.publicUrl;

      photoUrl = publicUrl;
    }

    createStudent.mutate(
      {
        enrollment_number: newStudent.enrollment_number,
        full_name: newStudent.full_name,
        enrollment_year: enrollmentYear,
        gender: newStudent.gender,
        class_id: newStudent.class_id || undefined,
        guardian_name: newStudent.guardian_name || undefined,
        guardian_contact: newStudent.guardian_contact || undefined,
        bi_number: newStudent.bi_number || undefined,
        birthplace: newStudent.birthplace || undefined,
        province: newStudent.province || undefined,
        parent_names: parentNames || undefined,
        birth_date: birthDateString as any,
        photo_url: photoUrl,
      },
      {
        onSuccess: () => {
          toast.success('Estudante criado com sucesso!');
          setIsDialogOpen(false);
          setPhotoFile(null);
          setNewStudent({
            enrollment_number: '',
            full_name: '',
            gender: 'Masculino',
            enrollment_year: new Date().getFullYear().toString(),
            class_id: '',
            bi_number: '',
            birth_date: undefined,
            birthplace: '',
            province: '',
            father_name: '',
            mother_name: '',
            guardian_name: '',
            guardian_contact: '',
            enrollment_date: undefined,
          });
        },
        onError: (error: any) => {
          toast.error('Erro ao criar estudante: ' + error.message);
        },
      },
    );
  };

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
          <h1 className="text-2xl font-bold text-foreground">Estudantes</h1>
          <p className="text-muted-foreground">
            Gestão de matrículas, turmas e informações dos estudantes
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              className="btn-primary"
              onClick={() => {
                setNewStudent((current) => ({
                  ...current,
                  enrollment_number: generateEnrollmentNumber(),
                }));
              }}
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Adicionar Estudante
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Novo Estudante</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
              <div className="space-y-2 md:col-span-2">
                <Label>Foto do estudante</Label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Nome Completo *</Label>
                <Input
                  placeholder="Nome do estudante"
                  value={newStudent.full_name}
                  onChange={(e) =>
                    setNewStudent({ ...newStudent, full_name: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Nº Matrícula *</Label>
                <Input
                  placeholder="Número de matrícula"
                  value={newStudent.enrollment_number}
                  onChange={(e) =>
                    setNewStudent({ ...newStudent, enrollment_number: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>BI</Label>
                <Input
                  placeholder="Número do BI"
                  value={newStudent.bi_number}
                  onChange={(e) =>
                    setNewStudent({ ...newStudent, bi_number: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Género</Label>
                <Select
                  value={newStudent.gender}
                  onValueChange={(value) =>
                    setNewStudent({ ...newStudent, gender: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Masculino">Masculino</SelectItem>
                    <SelectItem value="Feminino">Feminino</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Data de Nascimento</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !newStudent.birth_date && 'text-muted-foreground',
                      )}
                    >
                      {newStudent.birth_date ? (
                        newStudent.birth_date.toLocaleDateString()
                      ) : (
                        <span>Escolha a data</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={newStudent.birth_date}
                      onSelect={(date) =>
                        setNewStudent({ ...newStudent, birth_date: date || undefined })
                      }
                      initialFocus
                      className={cn('p-3 pointer-events-auto')}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label>Naturalidade</Label>
                <Input
                  placeholder="Local de nascimento"
                  value={newStudent.birthplace}
                  onChange={(e) =>
                    setNewStudent({ ...newStudent, birthplace: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Província</Label>
                <Input
                  placeholder="Província"
                  value={newStudent.province}
                  onChange={(e) =>
                    setNewStudent({ ...newStudent, province: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Ano de Matrícula</Label>
                <Input
                  type="number"
                  value={newStudent.enrollment_year}
                  onChange={(e) =>
                    setNewStudent({ ...newStudent, enrollment_year: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Data de Matrícula</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !newStudent.enrollment_date && 'text-muted-foreground',
                      )}
                    >
                      {newStudent.enrollment_date ? (
                        newStudent.enrollment_date.toLocaleDateString()
                      ) : (
                        <span>Escolha a data</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={newStudent.enrollment_date}
                      onSelect={(date) =>
                        setNewStudent({
                          ...newStudent,
                          enrollment_date: date || undefined,
                        })
                      }
                      initialFocus
                      className={cn('p-3 pointer-events-auto')}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Turma</Label>
                <Select
                  value={newStudent.class_id}
                  onValueChange={(value) =>
                    setNewStudent({ ...newStudent, class_id: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a turma (opcional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes?.map((cls) => (
                      <SelectItem key={cls.id} value={cls.id}>
                        {cls.course?.name} - {cls.grade_level}ª {cls.section}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Filiação — Nome do Pai</Label>
                <Input
                  placeholder="Nome do pai"
                  value={newStudent.father_name}
                  onChange={(e) =>
                    setNewStudent({ ...newStudent, father_name: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Filiação — Nome da Mãe</Label>
                <Input
                  placeholder="Nome da mãe"
                  value={newStudent.mother_name}
                  onChange={(e) =>
                    setNewStudent({ ...newStudent, mother_name: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Nome do Encarregado de Educação</Label>
                <Input
                  placeholder="Nome do encarregado"
                  value={newStudent.guardian_name}
                  onChange={(e) =>
                    setNewStudent({ ...newStudent, guardian_name: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Contacto do Encarregado</Label>
                <Input
                  placeholder="Telefone do encarregado"
                  value={newStudent.guardian_contact}
                  onChange={(e) =>
                    setNewStudent({ ...newStudent, guardian_contact: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button
                className="btn-primary"
                onClick={handleCreateStudent}
                disabled={createStudent.isPending}
              >
                {createStudent.isPending ? 'A guardar...' : 'Guardar Estudante'}
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
                <p className="text-sm text-muted-foreground">Total de Estudantes</p>
                <p className="text-2xl font-bold">{stats.total}</p>
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
                <p className="text-sm text-muted-foreground">Activos</p>
                <p className="text-2xl font-bold">{stats.active}</p>
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
                <p className="text-sm text-muted-foreground">Desistentes</p>
                <p className="text-2xl font-bold">{stats.dropouts}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-warning" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="stat-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Distribuição por Género</p>
                <p className="text-sm font-medium">
                  {stats.males} Masculino / {stats.females} Feminino
                </p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-accent" />
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
            placeholder="Pesquisar por nome ou nº de matrícula"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select
          value={selectedClassId}
          onValueChange={(value) => setSelectedClassId(value as 'Todos' | string)}
        >
          <SelectTrigger className="w-full md:w-56">
            <SelectValue placeholder="Turma" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Todos">Todas as turmas</SelectItem>
            {classes?.map((cls) => (
              <SelectItem key={cls.id} value={cls.id}>
                {cls.course?.name} - {cls.grade_level}ª {cls.section}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={selectedStatus}
          onValueChange={(value) =>
            setSelectedStatus(value as 'Todos' | 'active' | 'dropout')
          }
        >
          <SelectTrigger className="w-full md:w-40">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Todos">Todos</SelectItem>
            <SelectItem value="active">Activos</SelectItem>
            <SelectItem value="dropout">Desistentes</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card className="card-elevated">
        <CardHeader>
          <CardTitle>Lista de Estudantes</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="table-header">
                <TableHead>Nº Matrícula</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Turma</TableHead>
                <TableHead>Encarregado</TableHead>
                <TableHead>Contacto</TableHead>
                <TableHead className="text-center">Estado</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStudents.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center text-muted-foreground py-12"
                  >
                    Nenhum estudante encontrado
                  </TableCell>
                </TableRow>
              ) : (
                filteredStudents.map((student) => {
                  const cls = classes?.find((c) => c.id === student.class_id);
                  const classLabel = cls
                    ? `${cls.course?.name} - ${cls.grade_level}ª ${cls.section}`
                    : 'Sem turma';

                  return (
                    <TableRow key={student.id} className="table-row-hover">
                      <TableCell className="font-mono">
                        {student.enrollment_number}
                      </TableCell>
                      <TableCell className="font-medium">
                        {student.full_name}
                      </TableCell>
                      <TableCell>{classLabel}</TableCell>
                      <TableCell>{student.guardian_name || '-'}</TableCell>
                      <TableCell>{student.guardian_contact || '-'}</TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant="outline"
                          className={
                            (student.status || 'active') === 'active'
                              ? 'badge-success'
                              : 'badge-danger'
                          }
                        >
                          {(student.status || 'active') === 'active'
                            ? 'Ativo'
                            : 'Desistente'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            navigate(`/dashboard/financas/estudante/${student.id}`)
                          }
                        >
                          Ver Finanças
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
