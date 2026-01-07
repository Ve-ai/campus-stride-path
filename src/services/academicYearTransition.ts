import { supabase } from '@/integrations/supabase/client';

interface ClassData {
  id: string;
  grade_level: number;
  section: string;
  course_id: string;
  max_students: number | null;
  academic_year: number;
  period: string;
  class_director_id: string | null;
  created_at: string;
  updated_at: string;
}

interface TransitionResult {
  promoted: number;
  retained: number;
  graduated: number;
  errors: string[];
}

// Média mínima para aprovação
const PASSING_GRADE = 10;

/**
 * Verifica se o aluno foi aprovado baseado nas notas dos 3 trimestres
 * Um aluno é aprovado se a média das notas MT dos 3 trimestres >= 10
 */
async function isStudentApproved(studentId: string, classId: string, academicYear: number): Promise<boolean> {
  const { data: grades, error } = await supabase
    .from('grades')
    .select('trimester, mt')
    .eq('student_id', studentId)
    .eq('class_id', classId)
    .eq('academic_year', academicYear);

  if (error || !grades || grades.length === 0) {
    // Se não há notas, considera reprovado por falta de dados
    return false;
  }

  // Agrupa notas por disciplina e calcula média geral
  const mtValues = grades
    .filter((g) => g.mt !== null)
    .map((g) => g.mt as number);

  if (mtValues.length === 0) return false;

  const average = mtValues.reduce((sum, mt) => sum + mt, 0) / mtValues.length;
  return average >= PASSING_GRADE;
}

/**
 * Encontra ou cria a próxima turma para o aluno
 */
async function findNextClass(
  courseId: string,
  nextGradeLevel: number,
  newAcademicYear: number,
  existingClasses: ClassData[]
): Promise<string | null> {
  // Filtra turmas do próximo nível e ano
  const availableClasses = existingClasses
    .filter(
      (c) =>
        c.course_id === courseId &&
        c.grade_level === nextGradeLevel &&
        c.academic_year === newAcademicYear
    )
    .sort((a, b) => a.section.localeCompare(b.section));

  for (const cls of availableClasses) {
    // Conta alunos na turma
    const { count } = await supabase
      .from('students')
      .select('id', { count: 'exact', head: true })
      .eq('class_id', cls.id)
      .eq('status', 'active');

    const currentCount = count || 0;
    const maxStudents = cls.max_students || 40;

    if (currentCount < maxStudents) {
      return cls.id;
    }
  }

  // Se não há turma disponível, retorna null (precisa criar nova turma)
  return null;
}

/**
 * Cria uma nova turma para o curso/nível
 */
async function createNewClass(
  courseId: string,
  gradeLevel: number,
  academicYear: number,
  section: string
): Promise<string> {
  const { data, error } = await supabase
    .from('classes')
    .insert({
      course_id: courseId,
      grade_level: gradeLevel,
      academic_year: academicYear,
      section: section,
      period: 'Manhã',
      max_students: 40,
    })
    .select('id')
    .single();

  if (error) throw error;
  return data.id;
}

/**
 * Obtém a próxima seção disponível (A, B, C, ...)
 */
function getNextSection(existingSections: string[]): string {
  const sortedSections = existingSections.sort();
  if (sortedSections.length === 0) return 'A';

  const lastSection = sortedSections[sortedSections.length - 1];
  const nextCharCode = lastSection.charCodeAt(0) + 1;
  return String.fromCharCode(nextCharCode);
}

/**
 * Executa a transição de ano letivo
 * - Aprovados da 10ª, 11ª vão para a próxima classe
 * - Reprovados ficam na mesma classe
 * - Aprovados da 12ª vão para 13ª com Estágio Curricular
 */
export async function executeAcademicYearTransition(
  currentAcademicYear: number
): Promise<TransitionResult> {
  const newAcademicYear = currentAcademicYear + 1;
  const result: TransitionResult = {
    promoted: 0,
    retained: 0,
    graduated: 0,
    errors: [],
  };

  try {
    // Busca todas as turmas do ano atual
    const { data: currentClasses, error: classesError } = await supabase
      .from('classes')
      .select('*')
      .eq('academic_year', currentAcademicYear);

    if (classesError) throw classesError;
    if (!currentClasses || currentClasses.length === 0) {
      result.errors.push('Nenhuma turma encontrada para o ano letivo atual.');
      return result;
    }

    // Busca todas as turmas (incluindo novas do próximo ano)
    const { data: allClasses, error: allClassesError } = await supabase
      .from('classes')
      .select('*');

    if (allClassesError) throw allClassesError;

    // Processa cada turma
    for (const currentClass of currentClasses) {
      // Busca alunos da turma
      const { data: students, error: studentsError } = await supabase
        .from('students')
        .select('id, full_name, birth_date, class_id, status')
        .eq('class_id', currentClass.id)
        .eq('status', 'active');

      if (studentsError) {
        result.errors.push(`Erro ao buscar alunos da turma ${currentClass.section}: ${studentsError.message}`);
        continue;
      }

      if (!students || students.length === 0) continue;

      for (const student of students) {
        try {
          const isApproved = await isStudentApproved(
            student.id,
            currentClass.id,
            currentAcademicYear
          );

          if (isApproved) {
            // Aluno aprovado - vai para próximo nível
            const currentGrade = currentClass.grade_level;

            if (currentGrade === 12) {
              // Aprovado da 12ª vai para 13ª (Estágio Curricular)
              let targetClassId = await findNextClass(
                currentClass.course_id,
                13,
                newAcademicYear,
                allClasses || []
              );

              if (!targetClassId) {
                // Cria turma de 13ª classe se não existir
                const existingSections = (allClasses || [])
                  .filter(
                    (c) =>
                      c.course_id === currentClass.course_id &&
                      c.grade_level === 13 &&
                      c.academic_year === newAcademicYear
                  )
                  .map((c) => c.section);

                const newSection = getNextSection(existingSections);
                targetClassId = await createNewClass(
                  currentClass.course_id,
                  13,
                  newAcademicYear,
                  newSection
                );

                // Adiciona à lista de turmas (apenas para rastreamento, não precisa de todos os campos)
                (allClasses as any[])?.push({
                  id: targetClassId,
                  course_id: currentClass.course_id,
                  grade_level: 13,
                  section: newSection,
                  academic_year: newAcademicYear,
                  max_students: 40,
                  period: 'Manhã',
                  class_director_id: null,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                });
              }

              // Atualiza aluno e cria registro de estágio
              await supabase
                .from('students')
                .update({ class_id: targetClassId })
                .eq('id', student.id);

              // Cria registro de estágio se não existir
              const { data: existingInternship } = await supabase
                .from('estagios')
                .select('id')
                .eq('student_id', student.id)
                .maybeSingle();

              if (!existingInternship) {
                await supabase
                  .from('estagios')
                  .insert({
                    student_id: student.id,
                    status: 'pendente',
                  });
              }

              // Cria registro de TFC se não existir
              const { data: existingTFC } = await supabase
                .from('trabalhos_fim_curso')
                .select('id')
                .eq('student_id', student.id)
                .maybeSingle();

              if (!existingTFC) {
                await supabase
                  .from('trabalhos_fim_curso')
                  .insert({
                    student_id: student.id,
                    status: 'em_elaboracao',
                  });
              }

              result.graduated++;
            } else if (currentGrade < 12) {
              // Aprovado de outras classes vai para próximo nível
              const nextGrade = currentGrade + 1;

              let targetClassId = await findNextClass(
                currentClass.course_id,
                nextGrade,
                newAcademicYear,
                allClasses || []
              );

              if (!targetClassId) {
                // Cria nova turma se necessário
                const existingSections = (allClasses || [])
                  .filter(
                    (c) =>
                      c.course_id === currentClass.course_id &&
                      c.grade_level === nextGrade &&
                      c.academic_year === newAcademicYear
                  )
                  .map((c) => c.section);

                const newSection = getNextSection(existingSections);
                targetClassId = await createNewClass(
                  currentClass.course_id,
                  nextGrade,
                  newAcademicYear,
                  newSection
                );

                (allClasses as any[])?.push({
                  id: targetClassId,
                  course_id: currentClass.course_id,
                  grade_level: nextGrade,
                  section: newSection,
                  academic_year: newAcademicYear,
                  max_students: 40,
                  period: 'Manhã',
                  class_director_id: null,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                });
              }

              await supabase
                .from('students')
                .update({ class_id: targetClassId })
                .eq('id', student.id);

              result.promoted++;
            } else if (currentGrade === 13) {
              // Alunos da 13ª que completaram estágio - atualizar status
              await supabase
                .from('students')
                .update({ status: 'graduated' })
                .eq('id', student.id);

              result.graduated++;
            }
          } else {
            // Aluno reprovado - fica na mesma turma (nova turma do mesmo nível)
            let targetClassId = await findNextClass(
              currentClass.course_id,
              currentClass.grade_level,
              newAcademicYear,
              allClasses || []
            );

            if (!targetClassId) {
              // Cria nova turma do mesmo nível
              const existingSections = (allClasses || [])
                .filter(
                  (c) =>
                    c.course_id === currentClass.course_id &&
                    c.grade_level === currentClass.grade_level &&
                    c.academic_year === newAcademicYear
                )
                .map((c) => c.section);

              const newSection = getNextSection(existingSections);
              targetClassId = await createNewClass(
                currentClass.course_id,
                currentClass.grade_level,
                newAcademicYear,
                newSection
              );

              (allClasses as any[])?.push({
                id: targetClassId,
                course_id: currentClass.course_id,
                grade_level: currentClass.grade_level,
                section: newSection,
                academic_year: newAcademicYear,
                max_students: 40,
                period: 'Manhã',
                class_director_id: null,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              });
            }

            await supabase
              .from('students')
              .update({ class_id: targetClassId })
              .eq('id', student.id);

            result.retained++;
          }
        } catch (studentError) {
          const errorMessage = studentError instanceof Error ? studentError.message : 'Erro desconhecido';
          result.errors.push(`Erro ao processar aluno ${student.full_name}: ${errorMessage}`);
        }
      }
    }

    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    result.errors.push(`Erro geral na transição: ${errorMessage}`);
    return result;
  }
}

/**
 * Obtém estatísticas de aprovação/reprovação do ano atual
 */
export async function getTransitionPreview(academicYear: number) {
  const { data: classes, error: classesError } = await supabase
    .from('classes')
    .select(`
      id,
      grade_level,
      section,
      course_id,
      courses (name)
    `)
    .eq('academic_year', academicYear);

  if (classesError) throw classesError;
  if (!classes) return [];

  const preview = [];

  for (const cls of classes) {
    const { data: students } = await supabase
      .from('students')
      .select('id, full_name')
      .eq('class_id', cls.id)
      .eq('status', 'active');

    let approved = 0;
    let failed = 0;

    for (const student of students || []) {
      const isApproved = await isStudentApproved(student.id, cls.id, academicYear);
      if (isApproved) {
        approved++;
      } else {
        failed++;
      }
    }

    preview.push({
      classId: cls.id,
      className: `${cls.grade_level}ª ${cls.section}`,
      courseName: (cls as any).courses?.name || 'N/A',
      totalStudents: (students || []).length,
      approved,
      failed,
      gradeLevel: cls.grade_level,
    });
  }

  return preview;
}

/**
 * Obtém o ano letivo atual baseado na data
 * O ano letivo vai de Setembro a Julho
 */
export function getCurrentAcademicYear(): number {
  const now = new Date();
  const month = now.getMonth() + 1; // 1-12
  const year = now.getFullYear();

  // Se estamos entre Janeiro e Julho, o ano letivo é o ano anterior
  // Se estamos entre Setembro e Dezembro, o ano letivo é o ano atual
  if (month >= 1 && month <= 7) {
    return year - 1;
  }
  return year;
}
