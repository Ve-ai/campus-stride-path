import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// Courses
export function useCourses() {
  return useQuery({
    queryKey: ['courses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('courses')
        .select(`
          *,
          school_nuclei (name),
          coordinator:teachers!courses_coordinator_fkey (
            id,
            profiles (full_name)
          )
        `)
        .order('name');
      
      if (error) throw error;
      return data;
    },
  });
}

// Classes
export function useClasses(filters?: { courseId?: string; gradeLevel?: number; period?: string }) {
  return useQuery({
    queryKey: ['classes', filters],
    queryFn: async () => {
      let query = supabase
        .from('classes')
        .select(`
          *,
          course:courses (id, name),
          class_director:teachers!classes_class_director_fkey (
            id,
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
    },
  });
}

// Students
export function useStudents(classId?: string) {
  return useQuery({
    queryKey: ['students', classId],
    queryFn: async () => {
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
    },
  });
}

// Teachers
export function useTeachers() {
  return useQuery({
    queryKey: ['teachers'],
    queryFn: async () => {
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
    },
  });
}


// Grades
export function useGrades(filters?: { studentId?: string; classId?: string; subjectId?: string; trimester?: number }) {
  return useQuery({
    queryKey: ['grades', filters],
    queryFn: async () => {
      let query = supabase
        .from('grades')
        .select(`
          *,
          student:students (id, full_name, enrollment_number),
          subject:subjects (id, name),
          teacher:teachers (id, profiles (full_name))
        `);
      
      if (filters?.studentId) query = query.eq('student_id', filters.studentId);
      if (filters?.classId) query = query.eq('class_id', filters.classId);
      if (filters?.subjectId) query = query.eq('subject_id', filters.subjectId);
      if (filters?.trimester) query = query.eq('trimester', filters.trimester);
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}

// Payments
export function usePayments(filters?: { studentId?: string; month?: number; year?: number }) {
  return useQuery({
    queryKey: ['payments', filters],
    queryFn: async () => {
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
    },
  });
}

// School Nuclei
export function useSchoolNuclei() {
  return useQuery({
    queryKey: ['school_nuclei'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('school_nuclei')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data;
    },
  });
}

// Subjects
export function useSubjects(courseId?: string, gradeLevel?: number) {
  return useQuery({
    queryKey: ['subjects', courseId, gradeLevel],
    queryFn: async () => {
      let query = supabase
        .from('subjects')
        .select('*')
        .order('name');
      
      if (courseId) query = query.eq('course_id', courseId);
      if (gradeLevel) query = query.eq('grade_level', gradeLevel);
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}

// Statistics
export function useStatistics() {
  return useQuery({
    queryKey: ['statistics'],
    queryFn: async () => {
      // Get student counts
      const { data: students, error: studentsError } = await supabase
        .from('students')
        .select('id, status, gender');
      
      if (studentsError) throw studentsError;

      const totalStudents = students?.length || 0;
      const activeStudents = students?.filter(s => s.status === 'active').length || 0;
      const dropouts = students?.filter(s => s.status === 'dropout').length || 0;
      const maleStudents = students?.filter(s => s.gender === 'Masculino').length || 0;
      const femaleStudents = students?.filter(s => s.gender === 'Feminino').length || 0;

      // Get teacher count
      const { count: teacherCount } = await supabase
        .from('teachers')
        .select('id', { count: 'exact', head: true })
        .eq('is_active', true);

      // Get course count
      const { count: courseCount } = await supabase
        .from('courses')
        .select('id', { count: 'exact', head: true });

      // Get class count
      const { count: classCount } = await supabase
        .from('classes')
        .select('id', { count: 'exact', head: true });

      // Get payment stats for current month
      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();
      
      const { data: payments } = await supabase
        .from('payments')
        .select('amount')
        .eq('month_reference', currentMonth)
        .eq('year_reference', currentYear);

      const monthlyRevenue = payments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;

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
        },
      };
    },
  });
}

// Mutations
export function useCreateStudent() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (student: {
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
    }) => {
      const { data, error } = await supabase
        .from('students')
        .insert(student)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: ['statistics'] });
    },
  });
}

export function useCreatePayment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (payment: {
      student_id: string;
      amount: number;
      month_reference: number;
      year_reference: number;
      payment_method: string;
      observations?: string;
    }) => {
      const { data, error } = await supabase
        .from('payments')
        .insert(payment)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['statistics'] });
    },
  });
}

export function useUpdateGrade() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: {
      id: string;
      mac?: number;
      npt?: number;
      mt?: number;
      observations?: string;
    }) => {
      const { data, error } = await supabase
        .from('grades')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grades'] });
    },
  });
}

// Create Course
export function useCreateCourse() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (course: {
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
    }) => {
      const { data, error } = await supabase
        .from('courses')
        .insert(course)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      queryClient.invalidateQueries({ queryKey: ['statistics'] });
    },
  });
}

// Create Teacher
export function useCreateTeacher() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (teacher: {
      employee_number: string;
      full_name?: string;
      profile_id?: string;
      degree?: string;
      degree_area?: string;
      hire_date?: string;
      gross_salary?: number;
      functions?: string[];
      is_active?: boolean;
    }) => {
      const { data, error } = await supabase
        .from('teachers')
        .insert(teacher)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
      queryClient.invalidateQueries({ queryKey: ['statistics'] });
    },
  });
}

// Update Teacher
export function useUpdateTeacher() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: {
      id: string;
      full_name?: string;
      degree?: string | null;
      degree_area?: string | null;
      hire_date?: string | null;
      gross_salary?: number | null;
      functions?: string[];
      is_active?: boolean;
    }) => {
      const { data, error } = await supabase
        .from('teachers')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
      queryClient.invalidateQueries({ queryKey: ['statistics'] });
    },
  });
}

// Update teacher class assignment schedule
export function useUpdateTeacherAssignmentSchedule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      schedule,
    }: {
      id: string;
      schedule: any;
    }) => {
      const { data, error } = await supabase
        .from('teacher_class_assignments')
        .update({ schedule })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
    },
  });
}

// Create teacher assignments
export function useCreateTeacherAssignments() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (assignments: {
      teacher_id: string;
      class_id: string;
      subject_id: string;
      periods: string[];
    }[]) => {
      if (!assignments.length) return [];
      const { data, error } = await supabase
        .from('teacher_class_assignments')
        .insert(assignments)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
    },
  });
}

