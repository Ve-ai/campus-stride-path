import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchCourses,
  fetchClasses,
  fetchStudents,
  fetchTeachers,
  fetchGrades,
  fetchPayments,
  fetchSchoolNuclei,
  fetchSubjects,
  fetchStatistics,
  createStudent,
  createPayment,
  updateGrade,
  createCourse,
  updateCourse,
  createTeacher,
  updateTeacher,
  updateTeacherAssignmentSchedule,
  createTeacherAssignments,
  ClassFilters,
  GradeFilters,
  PaymentFilters,
  CreateStudentInput,
  CreatePaymentInput,
  UpdateGradeInput,
  CreateCourseInput,
  UpdateCourseInput,
  CreateTeacherInput,
  UpdateTeacherInput,
  UpdateTeacherAssignmentScheduleInput,
  CreateTeacherAssignmentInput,
} from '@/services/database';

// Courses
export function useCourses() {
  return useQuery<any, any>({
    queryKey: ['courses'],
    queryFn: () => fetchCourses(),
  });
}

// Classes
export function useClasses(filters?: { courseId?: string; gradeLevel?: number; period?: string }) {
  return useQuery<any, any>({
    queryKey: ['classes', filters],
    queryFn: () => fetchClasses(filters as ClassFilters),
  });
}

// Students
export function useStudents(classId?: string) {
  return useQuery<any, any>({
    queryKey: ['students', classId],
    queryFn: () => fetchStudents(classId),
  });
}

// Teachers
export function useTeachers() {
  return useQuery<any, any>({
    queryKey: ['teachers'],
    queryFn: () => fetchTeachers(),
  });
}

// Grades
export function useGrades(filters?: {
  studentId?: string;
  classId?: string;
  subjectId?: string;
  trimester?: number;
  teacherId?: string;
}) {
  return useQuery<any, any>({
    queryKey: ['grades', filters],
    queryFn: () => fetchGrades(filters as GradeFilters),
  });
}

// Payments
export function usePayments(filters?: { studentId?: string; month?: number; year?: number }) {
  return useQuery<any, any>({
    queryKey: ['payments', filters],
    queryFn: () => fetchPayments(filters as PaymentFilters),
  });
}

// School Nuclei
export function useSchoolNuclei() {
  return useQuery<any, any>({
    queryKey: ['school_nuclei'],
    queryFn: () => fetchSchoolNuclei(),
  });
}

// Subjects
export function useSubjects(courseId?: string, gradeLevel?: number) {
  return useQuery<any, any>({
    queryKey: ['subjects', courseId, gradeLevel],
    queryFn: () => fetchSubjects(courseId, gradeLevel),
  });
}

// Statistics
export function useStatistics() {
  return useQuery<any, any>({
    queryKey: ['statistics'],
    queryFn: () => fetchStatistics(),
  });
}

// Mutations
export function useCreateStudent() {
  const queryClient = useQueryClient();

  return useMutation<any, any, CreateStudentInput>({
    mutationFn: (student) => createStudent(student),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: ['statistics'] });
    },
  });
}

export function useCreatePayment() {
  const queryClient = useQueryClient();

  return useMutation<any, any, CreatePaymentInput>({
    mutationFn: (payment) => createPayment(payment),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['statistics'] });
    },
  });
}

export function useUpdateGrade() {
  const queryClient = useQueryClient();

  return useMutation<any, any, UpdateGradeInput>({
    mutationFn: (payload) => updateGrade(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grades'] });
    },
  });
}

// Create Course
export function useCreateCourse() {
  const queryClient = useQueryClient();

  return useMutation<any, any, CreateCourseInput>({
    mutationFn: (course) => createCourse(course),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      queryClient.invalidateQueries({ queryKey: ['statistics'] });
    },
  });
}

// Update Course
export function useUpdateCourse() {
  const queryClient = useQueryClient();

  return useMutation<any, any, UpdateCourseInput>({
    mutationFn: (payload) => updateCourse(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
    },
  });
}

// Create Teacher
export function useCreateTeacher() {
  const queryClient = useQueryClient();

  return useMutation<any, any, CreateTeacherInput>({
    mutationFn: (teacher) => createTeacher(teacher),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
      queryClient.invalidateQueries({ queryKey: ['statistics'] });
    },
  });
}

// Update Teacher
export function useUpdateTeacher() {
  const queryClient = useQueryClient();

  return useMutation<any, any, UpdateTeacherInput>({
    mutationFn: (payload) => updateTeacher(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
      queryClient.invalidateQueries({ queryKey: ['statistics'] });
    },
  });
}

// Update teacher class assignment schedule
export function useUpdateTeacherAssignmentSchedule() {
  const queryClient = useQueryClient();

  return useMutation<any, any, UpdateTeacherAssignmentScheduleInput>({
    mutationFn: (payload) => updateTeacherAssignmentSchedule(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
    },
  });
}

// Create teacher assignments
export function useCreateTeacherAssignments() {
  const queryClient = useQueryClient();

  return useMutation<any, any, CreateTeacherAssignmentInput[]>({
    mutationFn: (assignments) => createTeacherAssignments(assignments),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
    },
  });
}
