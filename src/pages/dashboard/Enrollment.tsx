import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, differenceInYears, parseISO } from 'date-fns';
import { pt } from 'date-fns/locale';
import {
  GraduationCap,
  Search,
  Plus,
  FileText,
  Calendar,
  Users,
  CheckCircle,
  AlertCircle,
  Printer,
  X,
  Loader2,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/lib/notifications';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import logoInstituto from '@/assets/logo-instituto-amor-de-deus.png';

interface EnrollmentFormData {
  full_name: string;
  birth_date: string;
  gender: string;
  bi_number: string;
  bi_issue_date: string;
  birthplace: string;
  province: string;
  parent_names: string;
  guardian_name: string;
  guardian_contact: string;
  course_id: string;
  grade_level: number;
}

const initialFormData: EnrollmentFormData = {
  full_name: '',
  birth_date: '',
  gender: '',
  bi_number: '',
  bi_issue_date: '',
  birthplace: '',
  province: '',
  parent_names: '',
  guardian_name: '',
  guardian_contact: '',
  course_id: '',
  grade_level: 10,
};

export function EnrollmentPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [isEnrollmentOpen, setIsEnrollmentOpen] = useState(false);
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);
  const [formData, setFormData] = useState<EnrollmentFormData>(initialFormData);
  const [enrolledStudent, setEnrolledStudent] = useState<any>(null);
  const [selectedCourse, setSelectedCourse] = useState<any>(null);

  const currentYear = new Date().getFullYear();
  const academicYear = new Date().getMonth() >= 8 ? currentYear : currentYear - 1;

  // Fetch courses
  const { data: courses = [] } = useQuery({
    queryKey: ['courses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .order('name');
      if (error) throw error;
      return data;
    },
  });

  // Fetch enrollment period
  const { data: enrollmentPeriod } = useQuery({
    queryKey: ['enrollment-period', academicYear],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('enrollment_periods')
        .select('*')
        .eq('academic_year', academicYear)
        .eq('is_active', true)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  // Fetch classes for placing students
  const { data: classes = [] } = useQuery({
    queryKey: ['classes', academicYear],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('classes')
        .select(`
          *,
          course:courses(id, name),
          students:students(count)
        `)
        .eq('academic_year', academicYear)
        .order('grade_level')
        .order('section');
      if (error) throw error;
      return data;
    },
  });

  // Fetch recent enrollments
  const { data: recentEnrollments = [] } = useQuery({
    queryKey: ['recent-enrollments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('students')
        .select(`
          *,
          class:classes(
            id,
            grade_level,
            section,
            period,
            course:courses(id, name)
          )
        `)
        .eq('enrollment_year', academicYear)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
  });

  // Check if enrollment is open
  const isEnrollmentPeriodOpen = useMemo(() => {
    if (!enrollmentPeriod) return false;
    const today = new Date();
    const start = parseISO(enrollmentPeriod.start_date);
    const end = parseISO(enrollmentPeriod.end_date);
    return today >= start && today <= end;
  }, [enrollmentPeriod]);

  // Generate enrollment number
  const generateEnrollmentNumber = () => {
    const year = academicYear.toString().slice(-2);
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `MAT${year}${random}`;
  };

  // Find best class for student based on age and course
  const findBestClass = (birthDate: string, courseId: string, gradeLevel: number) => {
    const availableClasses = classes.filter(
      (c) => 
        c.course_id === courseId && 
        c.grade_level === gradeLevel &&
        (c.students?.[0]?.count || 0) < (c.max_students || 40)
    );

    if (availableClasses.length === 0) return null;

    // Sort by section (A, B, C...)
    return availableClasses.sort((a, b) => a.section.localeCompare(b.section))[0];
  };

  // Check if student already exists
  const checkDuplicateStudent = async (biNumber: string, fullName: string) => {
    const { data, error } = await supabase
      .from('students')
      .select('id, full_name, enrollment_number')
      .or(`bi_number.eq.${biNumber},full_name.ilike.${fullName}`)
      .limit(1);
    
    if (error) throw error;
    return data?.[0] || null;
  };

  // Enrollment mutation
  const enrollMutation = useMutation({
    mutationFn: async (data: EnrollmentFormData) => {
      // Check for duplicates
      if (data.bi_number) {
        const duplicate = await checkDuplicateStudent(data.bi_number, data.full_name);
        if (duplicate) {
          throw new Error(`Este aluno já está matriculado (${duplicate.enrollment_number})`);
        }
      }

      // Find best class
      const targetClass = findBestClass(data.birth_date, data.course_id, data.grade_level);
      if (!targetClass) {
        throw new Error('Não há turmas disponíveis para este curso e classe');
      }

      const enrollmentNumber = generateEnrollmentNumber();

      // Create student
      const { data: student, error } = await supabase
        .from('students')
        .insert({
          full_name: data.full_name,
          birth_date: data.birth_date,
          gender: data.gender,
          bi_number: data.bi_number || null,
          bi_issue_date: data.bi_issue_date || null,
          birthplace: data.birthplace,
          province: data.province,
          parent_names: data.parent_names,
          guardian_name: data.guardian_name,
          guardian_contact: data.guardian_contact,
          class_id: targetClass.id,
          enrollment_number: enrollmentNumber,
          enrollment_year: academicYear,
          enrollment_date: new Date().toISOString().split('T')[0],
          status: 'active',
        })
        .select(`
          *,
          class:classes(
            id,
            grade_level,
            section,
            period,
            course:courses(id, name, monthly_fee_10, monthly_fee_11, monthly_fee_12, monthly_fee_13)
          )
        `)
        .single();

      if (error) throw error;
      return student;
    },
    onSuccess: (student) => {
      setEnrolledStudent(student);
      setSelectedCourse(courses.find(c => c.id === formData.course_id));
      setIsEnrollmentOpen(false);
      setIsInvoiceOpen(true);
      setFormData(initialFormData);
      queryClient.invalidateQueries({ queryKey: ['recent-enrollments'] });
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      toast.success('Aluno matriculado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const handleEnroll = () => {
    // Verificar período de matrículas (super_admin pode ignorar)
    if (!isEnrollmentPeriodOpen && user?.role !== 'super_admin') {
      toast.error('O período de matrículas está fechado. Contacte o administrador.');
      return;
    }
    
    if (!formData.full_name || !formData.birth_date || !formData.course_id) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }
    enrollMutation.mutate(formData);
  };

  // Get monthly fee based on grade level
  const getMonthlyFee = (course: any, gradeLevel: number) => {
    switch (gradeLevel) {
      case 10: return course?.monthly_fee_10 || 0;
      case 11: return course?.monthly_fee_11 || 0;
      case 12: return course?.monthly_fee_12 || 0;
      case 13: return course?.monthly_fee_13 || 0;
      default: return 0;
    }
  };

  // Generate invoice PDF
  const generateInvoice = () => {
    if (!enrolledStudent) return;

    const doc = new jsPDF();
    const course = enrolledStudent.class?.course;
    const monthlyFee = getMonthlyFee(course, enrolledStudent.class?.grade_level);

    // Header with logo
    const img = new Image();
    img.src = logoInstituto;
    doc.addImage(img, 'PNG', 85, 10, 40, 40);
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('INSTITUTO MÉDIO POLITÉCNICO AMOR DE DEUS', 105, 55, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Viana - Luanda, Angola', 105, 62, { align: 'center' });
    
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('FACTURA DE MATRÍCULA', 105, 75, { align: 'center' });

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Nº: ${enrolledStudent.enrollment_number}`, 20, 85);
    doc.text(`Data: ${format(new Date(), 'dd/MM/yyyy', { locale: pt })}`, 150, 85);

    // Student info
    doc.setFont('helvetica', 'bold');
    doc.text('DADOS DO ALUNO', 20, 100);
    doc.setFont('helvetica', 'normal');
    doc.text(`Nome: ${enrolledStudent.full_name}`, 20, 108);
    doc.text(`Curso: ${course?.name || '-'}`, 20, 115);
    doc.text(`Turma: ${enrolledStudent.class?.grade_level}ª ${enrolledStudent.class?.section}`, 20, 122);
    doc.text(`Ano Lectivo: ${academicYear}/${academicYear + 1}`, 20, 129);

    // Invoice items
    autoTable(doc, {
      startY: 140,
      head: [['Descrição', 'Valor (Kz)']],
      body: [
        ['Taxa de Matrícula', formatCurrency(monthlyFee)],
        ['Primeira Mensalidade', formatCurrency(monthlyFee)],
      ],
      foot: [['TOTAL', formatCurrency(monthlyFee * 2)]],
      theme: 'grid',
      headStyles: { fillColor: [41, 128, 185] },
      footStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold' },
    });

    // Footer
    const finalY = (doc as any).lastAutoTable.finalY + 20;
    doc.setFontSize(9);
    doc.text('Este documento serve como comprovativo de matrícula.', 105, finalY, { align: 'center' });
    doc.text('Guarde-o para futuras referências.', 105, finalY + 5, { align: 'center' });

    doc.save(`Factura_Matricula_${enrolledStudent.enrollment_number}.pdf`);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-AO', {
      style: 'currency',
      currency: 'AOA',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const filteredEnrollments = recentEnrollments.filter((student: any) =>
    student.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.enrollment_number?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const canEnroll = user?.role === 'super_admin' || user?.role === 'admin' || user?.role === 'matricula';

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <GraduationCap className="h-6 w-6 text-primary" />
            Matrículas
          </h1>
          <p className="text-muted-foreground">
            Ano Lectivo {academicYear}/{academicYear + 1}
          </p>
        </div>

        {canEnroll && (
          <div className="flex items-center gap-2">
            {!isEnrollmentPeriodOpen && user?.role !== 'super_admin' && (
              <Badge variant="outline" className="text-warning border-warning">
                Matrículas Bloqueadas
              </Badge>
            )}
            <Button 
              onClick={() => setIsEnrollmentOpen(true)} 
              className="btn-primary"
              disabled={!isEnrollmentPeriodOpen && user?.role !== 'super_admin'}
            >
              <Plus className="w-4 h-4 mr-2" />
              Nova Matrícula
            </Button>
          </div>
        )}
      </div>

      {/* Enrollment Period Status */}
      <Card className={`card-elevated ${isEnrollmentPeriodOpen ? 'border-success/50 bg-success/5' : 'border-warning/50 bg-warning/5'}`}>
        <CardContent className="flex items-center justify-between py-4">
          <div className="flex items-center gap-3">
            {isEnrollmentPeriodOpen ? (
              <CheckCircle className="h-6 w-6 text-success" />
            ) : (
              <AlertCircle className="h-6 w-6 text-warning" />
            )}
            <div>
              <p className="font-medium">
                {isEnrollmentPeriodOpen ? 'Período de Matrículas Aberto' : 'Período de Matrículas Fechado'}
              </p>
              {enrollmentPeriod && (
                <p className="text-sm text-muted-foreground">
                  {format(parseISO(enrollmentPeriod.start_date), 'dd/MM/yyyy')} - {format(parseISO(enrollmentPeriod.end_date), 'dd/MM/yyyy')}
                </p>
              )}
            </div>
          </div>
          {!enrollmentPeriod && user?.role === 'super_admin' && (
            <Button variant="outline" size="sm">
              <Calendar className="w-4 h-4 mr-2" />
              Definir Período
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="card-elevated">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{recentEnrollments.length}</p>
                <p className="text-sm text-muted-foreground">Matrículas Este Ano</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="card-elevated">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-success/10 rounded-lg">
                <CheckCircle className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {classes.reduce((acc: number, c: any) => acc + (c.max_students || 40) - (c.students?.[0]?.count || 0), 0)}
                </p>
                <p className="text-sm text-muted-foreground">Vagas Disponíveis</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-elevated">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-info/10 rounded-lg">
                <GraduationCap className="h-5 w-5 text-info" />
              </div>
              <div>
                <p className="text-2xl font-bold">{courses.length}</p>
                <p className="text-sm text-muted-foreground">Cursos Disponíveis</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-elevated">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-warning/10 rounded-lg">
                <FileText className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">{classes.length}</p>
                <p className="text-sm text-muted-foreground">Turmas Abertas</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Pesquisar por nome ou número de matrícula..."
          className="pl-10"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Recent Enrollments Table */}
      <Card className="card-elevated">
        <CardHeader>
          <CardTitle>Matrículas Recentes</CardTitle>
          <CardDescription>Lista dos alunos matriculados neste ano lectivo</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="table-header">
                <TableHead>Nº Matrícula</TableHead>
                <TableHead>Nome Completo</TableHead>
                <TableHead>Curso</TableHead>
                <TableHead>Turma</TableHead>
                <TableHead>Data Matrícula</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEnrollments.map((student: any) => (
                <TableRow key={student.id} className="table-row-hover">
                  <TableCell className="font-mono">{student.enrollment_number}</TableCell>
                  <TableCell className="font-medium">{student.full_name}</TableCell>
                  <TableCell>{student.class?.course?.name || '-'}</TableCell>
                  <TableCell>
                    {student.class ? `${student.class.grade_level}ª ${student.class.section}` : '-'}
                  </TableCell>
                  <TableCell>
                    {student.enrollment_date 
                      ? format(parseISO(student.enrollment_date), 'dd/MM/yyyy')
                      : format(parseISO(student.created_at), 'dd/MM/yyyy')}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="badge-success">
                      Activo
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
              {filteredEnrollments.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Nenhuma matrícula encontrada
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Enrollment Dialog */}
      <Dialog open={isEnrollmentOpen} onOpenChange={setIsEnrollmentOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              Nova Matrícula
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Course Selection */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Curso *</Label>
                <Select
                  value={formData.course_id}
                  onValueChange={(value) => setFormData({ ...formData, course_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o curso" />
                  </SelectTrigger>
                  <SelectContent>
                    {courses.map((course: any) => (
                      <SelectItem key={course.id} value={course.id}>
                        {course.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Classe *</Label>
                <Select
                  value={formData.grade_level.toString()}
                  onValueChange={(value) => setFormData({ ...formData, grade_level: parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a classe" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10ª Classe</SelectItem>
                    <SelectItem value="11">11ª Classe</SelectItem>
                    <SelectItem value="12">12ª Classe</SelectItem>
                    <SelectItem value="13">13ª Classe</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Separator />

            {/* Personal Data */}
            <div>
              <h3 className="font-semibold mb-4">Dados Pessoais</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-2">
                  <Label>Nome Completo *</Label>
                  <Input
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    placeholder="Nome completo do aluno"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Data de Nascimento *</Label>
                  <Input
                    type="date"
                    value={formData.birth_date}
                    onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Género *</Label>
                  <Select
                    value={formData.gender}
                    onValueChange={(value) => setFormData({ ...formData, gender: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="M">Masculino</SelectItem>
                      <SelectItem value="F">Feminino</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Nº do BI</Label>
                  <Input
                    value={formData.bi_number}
                    onChange={(e) => setFormData({ ...formData, bi_number: e.target.value })}
                    placeholder="Número do BI"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Data de Emissão do BI</Label>
                  <Input
                    type="date"
                    value={formData.bi_issue_date}
                    onChange={(e) => setFormData({ ...formData, bi_issue_date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Naturalidade</Label>
                  <Input
                    value={formData.birthplace}
                    onChange={(e) => setFormData({ ...formData, birthplace: e.target.value })}
                    placeholder="Local de nascimento"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Província</Label>
                  <Select
                    value={formData.province}
                    onValueChange={(value) => setFormData({ ...formData, province: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {['Bengo', 'Benguela', 'Bié', 'Cabinda', 'Cuando Cubango', 'Cuanza Norte', 
                        'Cuanza Sul', 'Cunene', 'Huambo', 'Huíla', 'Luanda', 'Lunda Norte', 
                        'Lunda Sul', 'Malanje', 'Moxico', 'Namibe', 'Uíge', 'Zaire'].map(p => (
                        <SelectItem key={p} value={p}>{p}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <Separator />

            {/* Family Data */}
            <div>
              <h3 className="font-semibold mb-4">Dados Familiares</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-2">
                  <Label>Filiação (Pai e Mãe)</Label>
                  <Input
                    value={formData.parent_names}
                    onChange={(e) => setFormData({ ...formData, parent_names: e.target.value })}
                    placeholder="Nome do pai e da mãe"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Nome do Encarregado</Label>
                  <Input
                    value={formData.guardian_name}
                    onChange={(e) => setFormData({ ...formData, guardian_name: e.target.value })}
                    placeholder="Nome do encarregado de educação"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Contacto do Encarregado</Label>
                  <Input
                    value={formData.guardian_contact}
                    onChange={(e) => setFormData({ ...formData, guardian_contact: e.target.value })}
                    placeholder="Telefone do encarregado"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setIsEnrollmentOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleEnroll} disabled={enrollMutation.isPending} className="btn-primary">
                {enrollMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Matricular Aluno
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Invoice Dialog */}
      <Dialog open={isInvoiceOpen} onOpenChange={setIsInvoiceOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Factura de Matrícula
            </DialogTitle>
          </DialogHeader>

          {enrolledStudent && (
            <div className="space-y-4 py-4">
              <div className="text-center border-b pb-4">
                <img src={logoInstituto} alt="Logo" className="h-16 mx-auto mb-2" />
                <h3 className="font-bold">INSTITUTO MÉDIO POLITÉCNICO AMOR DE DEUS</h3>
                <p className="text-sm text-muted-foreground">Viana - Luanda, Angola</p>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Nº Matrícula:</span>
                  <span className="font-mono font-bold">{enrolledStudent.enrollment_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Nome:</span>
                  <span className="font-medium">{enrolledStudent.full_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Curso:</span>
                  <span>{enrolledStudent.class?.course?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Turma:</span>
                  <span>{enrolledStudent.class?.grade_level}ª {enrolledStudent.class?.section}</span>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Taxa de Matrícula</span>
                  <span>{formatCurrency(getMonthlyFee(enrolledStudent.class?.course, enrolledStudent.class?.grade_level))}</span>
                </div>
                <div className="flex justify-between">
                  <span>Primeira Mensalidade</span>
                  <span>{formatCurrency(getMonthlyFee(enrolledStudent.class?.course, enrolledStudent.class?.grade_level))}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-bold text-lg">
                  <span>TOTAL</span>
                  <span className="text-primary">
                    {formatCurrency(getMonthlyFee(enrolledStudent.class?.course, enrolledStudent.class?.grade_level) * 2)}
                  </span>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button variant="outline" className="flex-1" onClick={() => setIsInvoiceOpen(false)}>
                  <X className="w-4 h-4 mr-2" />
                  Fechar
                </Button>
                <Button className="flex-1 btn-primary" onClick={generateInvoice}>
                  <Printer className="w-4 h-4 mr-2" />
                  Imprimir Factura
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}