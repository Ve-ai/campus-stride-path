import { supabase } from '@/integrations/supabase/client';
import { generateDefaultTeacherPassword } from '@/types/auth';

// ========== Query services ==========

export async function fetchCourses() {
  const { data, error } = await supabase
    .from('courses')
    .select(`
      *,
      school_nuclei (name, logo_url),
      coordinator:teachers!courses_coordinator_fkey (
        id,
        profiles (full_name)
      )
    `)
    .order('name');

  if (error) throw error;
  return data;
}

export interface ClassFilters {
  courseId?: string;
  gradeLevel?: number;
  period?: string;
}

export async function fetchClasses(filters?: ClassFilters) {
  let query = supabase
    .from('classes')
    .select(`
      *,
      course:courses (id, name),
      class_director:teachers!classes_class_director_fkey (
        id,
        full_name,
        profiles (full_name)
      )
    `)
    .order('grade_level')
    .order('section');

  if (filters?.courseId) {
    query = query.eq('course_id', filters.courseId);
  }
  if (filters?.gradeLevel) {
    query = query.eq('grade_level', filters.gradeLevel);
  }
  if (filters?.period) {
    query = query.eq('period', filters.period);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function fetchStudents(classId?: string) {
  let query = supabase
    .from('students')
    .select(`
      *,
      class:classes (
        id,
        section,
        grade_level,
        period,
        course:courses (id, name)
      )
    `)
    .order('full_name');

  if (classId) {
    query = query.eq('class_id', classId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function fetchTeachers() {
  const { data, error } = await supabase
    .from('teachers')
    .select(`
      *,
      profiles (
        full_name,
        phone,
        avatar_url,
        bi_number,
        birth_date,
        birth_place,
        province,
        parent_names
      ),
      teacher_class_assignments (
        id,
        schedule,
        periods,
        class:classes (id, section, grade_level, period, course:courses (name)),
        subject:subjects (id, name)
      )
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export interface GradeFilters {
  studentId?: string;
  classId?: string;
  subjectId?: string;
  trimester?: number;
  teacherId?: string;
}

export async function fetchGrades(filters?: GradeFilters) {
  let query = supabase
    .from('grades')
    .select(`
      *,
      student:students (id, full_name, enrollment_number),
      subject:subjects (id, name),
      teacher:teachers (id)
    `);

  if (filters?.studentId) query = query.eq('student_id', filters.studentId);
  if (filters?.classId) query = query.eq('class_id', filters.classId);
  if (filters?.subjectId) query = query.eq('subject_id', filters.subjectId);
  if (filters?.trimester) query = query.eq('trimester', filters.trimester);

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export interface PaymentFilters {
  studentId?: string;
  month?: number;
  year?: number;
}

export async function fetchPayments(filters?: PaymentFilters) {
  let query = supabase
    .from('payments')
    .select(`
      *,
      student:students (
        id,
        full_name,
        enrollment_number,
        class:classes (
          section,
          grade_level,
          course:courses (name)
        )
      )
    `)
    .order('payment_date', { ascending: false });

  if (filters?.studentId) query = query.eq('student_id', filters.studentId);
  if (filters?.month) query = query.eq('month_reference', filters.month);
  if (filters?.year) query = query.eq('year_reference', filters.year);

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function fetchSchoolNuclei() {
  const { data, error } = await supabase
    .from('school_nuclei')
    .select('*')
    .order('name');

  if (error) throw error;
  return data;
}

export async function fetchSubjects(courseId?: string, gradeLevel?: number) {
  let query = supabase
    .from('subjects')
    .select('*')
    .order('name');

  if (courseId) query = query.eq('course_id', courseId);
  if (gradeLevel) query = query.eq('grade_level', gradeLevel);

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function fetchStatistics() {
  const { data: students, error: studentsError } = await supabase
    .from('students')
    .select('id, status, gender');

  if (studentsError) throw studentsError;

  const totalStudents = students?.length || 0;
  const activeStudents = students?.filter((s) => s.status === 'active').length || 0;
  const dropouts = students?.filter((s) => s.status === 'dropout').length || 0;
  const maleStudents = students?.filter((s) => s.gender === 'Masculino').length || 0;
  const femaleStudents = students?.filter((s) => s.gender === 'Feminino').length || 0;

  const { count: teacherCount } = await supabase
    .from('teachers')
    .select('id', { count: 'exact', head: true })
    .eq('is_active', true);

  const { count: courseCount } = await supabase
    .from('courses')
    .select('id', { count: 'exact', head: true });

  const { count: classCount } = await supabase
    .from('classes')
    .select('id', { count: 'exact', head: true });

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  const { data: payments } = await supabase
    .from('payments')
    .select('base_amount, late_fee')
    .eq('month_reference', currentMonth)
    .eq('year_reference', currentYear);

  const monthlyRevenue =
    payments?.reduce((sum, p) => sum + Number((p as any).base_amount || 0), 0) || 0;
  const monthlyFines =
    payments?.reduce((sum, p) => sum + Number((p as any).late_fee || 0), 0) || 0;

  return {
    students: {
      total: totalStudents,
      active: activeStudents,
      dropouts,
      male: maleStudents,
      female: femaleStudents,
    },
    teachers: teacherCount || 0,
    courses: courseCount || 0,
    classes: classCount || 0,
    finance: {
      monthlyRevenue,
      monthlyFines,
    },
  };
}

// ========== Mutation services ==========

export interface CreateStudentInput {
  enrollment_number: string;
  full_name: string;
  birth_date?: string;
  parent_names?: string;
  birthplace?: string;
  province?: string;
  bi_number?: string;
  bi_issue_date?: string;
  photo_url?: string;
  guardian_name?: string;
  guardian_contact?: string;
  class_id?: string;
  enrollment_year: number;
  gender: string;
}

export async function createStudent(student: CreateStudentInput) {
  const { data, error } = await supabase
    .from('students')
    .insert(student)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export interface CreatePaymentInput {
  student_id: string;
  amount: number; // valor base da mensalidade (sem multa)
  month_reference: number;
  year_reference: number;
  payment_method: string;
  observations?: string;
}

export async function createPayment(payment: CreatePaymentInput) {
  const today = new Date();

  // Calcula o prazo limite: dia 10 do mês seguinte ao mês de referência
  const referenceMonth = payment.month_reference; // 1-12
  const referenceYear = payment.year_reference;

  // Mês seguinte ao de referência
  let dueMonth = referenceMonth + 1;
  let dueYear = referenceYear;
  if (dueMonth > 12) {
    dueMonth = 1;
    dueYear = referenceYear + 1;
  }
  
  // Dia 10 do mês seguinte é o limite (multa após este dia)
  const dueDate = new Date(dueYear, dueMonth - 1, 10); // mês é 0-indexed

  const isLate = today > dueDate;
  const lateFee = isLate ? 1000 : 0;
  const baseAmount = payment.amount;
  const totalAmount = baseAmount + lateFee;

  // Guardar quem registou o pagamento (para auditoria do gestor financeiro)
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError) throw authError;
  const recordedBy = authData.user?.id ?? null;

  const { data, error } = await supabase
    .from('payments')
    .insert({
      student_id: payment.student_id,
      amount: totalAmount,
      base_amount: baseAmount,
      late_fee: lateFee,
      month_reference: payment.month_reference,
      year_reference: payment.year_reference,
      payment_method: payment.payment_method,
      observations: payment.observations,
      recorded_by: recordedBy,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export interface UpdateGradeInput {
  id: string;
  mac?: number;
  npt?: number;
  mt?: number;
  observations?: string;
}

export async function updateGrade({ id, ...updates }: UpdateGradeInput) {
  const { data, error } = await supabase
    .from('grades')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export interface CreateCourseInput {
  name: string;
  school_nucleus_id?: string;
  coordinator_id?: string;
  monthly_fee_10?: number;
  monthly_fee_11?: number;
  monthly_fee_12?: number;
  monthly_fee_13?: number;
  credential_fee?: number;
  tutor_fee?: number;
  internship_fee?: number;
  defense_entry_fee?: number;
}

export async function createCourse(course: CreateCourseInput) {
  const { data, error } = await supabase
    .from('courses')
    .insert(course)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export interface UpdateCourseInput extends CreateCourseInput {
  id: string;
}

export async function updateCourse({ id, ...updates }: UpdateCourseInput) {
  const { data, error } = await supabase
    .from('courses')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export interface DeleteCourseInput {
  id: string;
}

export async function deleteCourse({ id }: DeleteCourseInput) {
  const { error } = await supabase
    .from('courses')
    .delete()
    .eq('id', id);

  if (error) throw error;
}


export interface CreateTeacherInput {
  employee_number: string;
  full_name: string;
  bi_number: string;
  birth_date?: string;
  phone?: string;
  profile_id?: string;
  degree?: string;
  degree_area?: string;
  hire_date?: string;
  gross_salary?: number;
  functions?: string[];
  is_active?: boolean;
}

export async function createTeacher(teacher: CreateTeacherInput) {
  const email = `${teacher.bi_number.toLowerCase()}@professor.escola.co.ao`;

  let birthYear: number | null = null;
  if (teacher.birth_date) {
    const date = new Date(teacher.birth_date);
    const year = date.getFullYear();
    if (!Number.isNaN(year)) {
      birthYear = year;
    }
  }

  if (!birthYear) {
    throw new Error('Ano de nascimento inválido para gerar a senha padrão.');
  }

  const password = generateDefaultTeacherPassword(teacher.full_name, birthYear);

  const { data: existingProfile, error: existingProfileError } = await supabase
    .from('profiles')
    .select('user_id')
    .eq('bi_number', teacher.bi_number)
    .maybeSingle();

  if (existingProfileError) {
    throw existingProfileError;
  }

  let authUserId: string | null = existingProfile?.user_id ?? null;

  if (!authUserId) {
    const { data, error } = await supabase.functions.invoke('admin-create-professor-user', {
      body: {
        email,
        password,
        full_name: teacher.full_name,
        username: teacher.bi_number,
      },
    });

    if (error) {
      console.error('Erro ao criar utilizador de professor via função backend:', error);
      throw new Error(error.message || 'Falha ao criar utilizador de autenticação para o professor.');
    }

    const result = data as { user_id?: string } | null;
    authUserId = result?.user_id ?? null;

    if (!authUserId) {
      throw new Error('Função backend não retornou o ID do utilizador criado.');
    }
  }

  if (!authUserId) {
    throw new Error('Não foi possível obter o utilizador associado ao professor.');
  }

  const { data: existingProfileForUser, error: existingProfileForUserError } = await supabase
    .from('profiles')
    .select('id')
    .eq('user_id', authUserId)
    .maybeSingle();

  if (existingProfileForUserError) {
    throw existingProfileForUserError;
  }

  if (existingProfileForUser) {
    const { error: updateProfileError } = await supabase
      .from('profiles')
      .update({
        full_name: teacher.full_name,
        username: teacher.bi_number,
        bi_number: teacher.bi_number,
        birth_date: teacher.birth_date || null,
        phone: teacher.phone || null,
        must_change_password: true,
      })
      .eq('user_id', authUserId);

    if (updateProfileError) {
      throw updateProfileError;
    }
  } else {
    const { error: insertProfileError } = await supabase
      .from('profiles')
      .insert({
        user_id: authUserId,
        full_name: teacher.full_name,
        username: teacher.bi_number,
        bi_number: teacher.bi_number,
        birth_date: teacher.birth_date || null,
        phone: teacher.phone || null,
        must_change_password: true,
      });

    if (insertProfileError) {
      throw insertProfileError;
    }
  }

  const { data: existingRole, error: existingRoleError } = await supabase
    .from('user_roles')
    .select('id')
    .eq('user_id', authUserId)
    .eq('role', 'professor')
    .maybeSingle();

  if (existingRoleError) {
    throw existingRoleError;
  }

  if (!existingRole) {
    const { error: roleError } = await supabase
      .from('user_roles')
      .insert({
        user_id: authUserId,
        role: 'professor',
      });

    if (roleError) {
      throw roleError;
    }
  }

  const { data: existingTeacher, error: existingTeacherError } = await supabase
    .from('teachers')
    .select('id')
    .eq('user_id', authUserId)
    .maybeSingle();

  if (existingTeacherError) {
    throw existingTeacherError;
  }

  if (existingTeacher) {
    throw new Error('Já existe um professor associado a este utilizador.');
  }

  const { data, error } = await supabase
    .from('teachers')
    .insert({
      employee_number: teacher.employee_number,
      full_name: teacher.full_name,
      user_id: authUserId,
      degree: teacher.degree,
      degree_area: teacher.degree_area,
      hire_date: teacher.hire_date,
      gross_salary: teacher.gross_salary,
      functions: teacher.functions,
      is_active: teacher.is_active,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export interface UpdateTeacherInput {
  id: string;
  full_name?: string;
  degree?: string | null;
  degree_area?: string | null;
  hire_date?: string | null;
  gross_salary?: number | null;
  functions?: string[];
  is_active?: boolean;
}

export async function updateTeacher({ id, ...updates }: UpdateTeacherInput) {
  const { data, error } = await supabase
    .from('teachers')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export interface UpdateTeacherAssignmentScheduleInput {
  id: string;
  schedule: any;
}

export async function updateTeacherAssignmentSchedule({
  id,
  schedule,
}: UpdateTeacherAssignmentScheduleInput) {
  const { data, error } = await supabase
    .from('teacher_class_assignments')
    .update({ schedule })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export interface CreateTeacherAssignmentInput {
  teacher_id: string;
  class_id: string;
  subject_id: string;
  periods: string[];
}

export async function createTeacherAssignments(assignments: CreateTeacherAssignmentInput[]) {
  if (!assignments.length) return [];

  const { data, error } = await supabase
    .from('teacher_class_assignments')
    .insert(assignments)
    .select();

  if (error) throw error;
  return data;
}
