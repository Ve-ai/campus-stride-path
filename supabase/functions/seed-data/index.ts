import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    console.log('Starting data seed...')

    // 1. Create School Nucleus
    const { data: nucleus, error: nucleusError } = await supabase
      .from('school_nuclei')
      .upsert({
        name: 'Instituto Técnico de Saúde de Luanda',
        logo_url: null
      }, { onConflict: 'name' })
      .select()
      .single()

    if (nucleusError && !nucleusError.message.includes('duplicate')) {
      console.log('Nucleus error:', nucleusError)
    }

    // Get or create nucleus
    const { data: existingNucleus } = await supabase
      .from('school_nuclei')
      .select('id')
      .eq('name', 'Instituto Técnico de Saúde de Luanda')
      .single()

    const nucleusId = existingNucleus?.id

    console.log('Nucleus ID:', nucleusId)

    // 2. Create Courses
    const coursesData = [
      { 
        name: 'Enfermagem Geral', 
        school_nucleus_id: nucleusId,
        monthly_fee_10: 15000,
        monthly_fee_11: 18000,
        monthly_fee_12: 20000,
        monthly_fee_13: 22000,
        internship_fee: 25000,
        credential_fee: 5000,
        defense_entry_fee: 15000,
        tutor_fee: 30000
      },
      { 
        name: 'Informática', 
        school_nucleus_id: nucleusId,
        monthly_fee_10: 12000,
        monthly_fee_11: 15000,
        monthly_fee_12: 18000,
        monthly_fee_13: 20000,
        internship_fee: 20000,
        credential_fee: 5000,
        defense_entry_fee: 15000,
        tutor_fee: 25000
      },
      { 
        name: 'Contabilidade e Gestão', 
        school_nucleus_id: nucleusId,
        monthly_fee_10: 13000,
        monthly_fee_11: 16000,
        monthly_fee_12: 18000,
        monthly_fee_13: 20000,
        internship_fee: 22000,
        credential_fee: 5000,
        defense_entry_fee: 15000,
        tutor_fee: 28000
      },
      { 
        name: 'Análises Clínicas', 
        school_nucleus_id: nucleusId,
        monthly_fee_10: 16000,
        monthly_fee_11: 19000,
        monthly_fee_12: 22000,
        monthly_fee_13: 25000,
        internship_fee: 30000,
        credential_fee: 6000,
        defense_entry_fee: 18000,
        tutor_fee: 35000
      },
    ]

    for (const course of coursesData) {
      const { error } = await supabase
        .from('courses')
        .upsert(course, { onConflict: 'name' })
      
      if (error && !error.message.includes('duplicate')) {
        console.log('Course error:', error)
      }
    }

    // Get courses
    const { data: courses } = await supabase.from('courses').select('id, name')
    console.log('Courses created:', courses?.length)

    // 3. Create Subjects for each course
    const subjectsData: { name: string; course_name: string; grade_level: number }[] = []
    
    // Enfermagem subjects
    const enfermagemSubjects = ['Anatomia', 'Biologia', 'Química', 'Matemática', 'Português', 'Inglês', 'Enfermagem Básica', 'Farmacologia']
    // Informática subjects  
    const informaticaSubjects = ['Programação', 'Base de Dados', 'Redes', 'Matemática', 'Português', 'Inglês', 'Sistemas Operativos', 'Web Design']
    // Contabilidade subjects
    const contabilidadeSubjects = ['Contabilidade Geral', 'Economia', 'Gestão', 'Matemática', 'Português', 'Inglês', 'Direito Comercial', 'Estatística']
    // Análises subjects
    const analisesSubjects = ['Bioquímica', 'Microbiologia', 'Hematologia', 'Matemática', 'Português', 'Inglês', 'Parasitologia', 'Imunologia']

    const courseSubjectsMap: { [key: string]: string[] } = {
      'Enfermagem Geral': enfermagemSubjects,
      'Informática': informaticaSubjects,
      'Contabilidade e Gestão': contabilidadeSubjects,
      'Análises Clínicas': analisesSubjects,
    }

    for (const course of courses || []) {
      const subjects = courseSubjectsMap[course.name] || []
      for (const subject of subjects) {
        for (const gradeLevel of [10, 11, 12, 13]) {
          subjectsData.push({
            name: subject,
            course_name: course.name,
            grade_level: gradeLevel
          })
        }
      }
    }

    for (const subjectData of subjectsData) {
      const course = courses?.find(c => c.name === subjectData.course_name)
      if (course) {
        const { error } = await supabase
          .from('subjects')
          .upsert({
            name: subjectData.name,
            course_id: course.id,
            grade_level: subjectData.grade_level
          }, { onConflict: 'course_id,name,grade_level' })
        
        if (error && !error.message.includes('duplicate')) {
          console.log('Subject error:', error)
        }
      }
    }

    console.log('Subjects created')

    // 4. Create Classes for each course
    const periods = ['Manhã', 'Tarde']
    const sections = ['A', 'B']
    const academicYear = 2025

    for (const course of courses || []) {
      for (const gradeLevel of [10, 11, 12, 13]) {
        for (const period of periods) {
          for (const section of sections) {
            const { error } = await supabase
              .from('classes')
              .upsert({
                course_id: course.id,
                grade_level: gradeLevel,
                section: section,
                period: period,
                academic_year: academicYear,
                max_students: 40
              }, { onConflict: 'course_id,grade_level,section,period,academic_year' })
            
            if (error && !error.message.includes('duplicate')) {
              console.log('Class error:', error)
            }
          }
        }
      }
    }

    // Get classes
    const { data: classes } = await supabase.from('classes').select('id, course_id, grade_level, section, period')
    console.log('Classes created:', classes?.length)

    // 5. Create Teachers with profiles
    const teachersData = [
      { name: 'Carlos Alberto Mendes', employeeNumber: 'PROF001', degree: 'Licenciatura', degreeArea: 'Matemática', salary: 85000, phone: '925654254' },
      { name: 'Sofia Maria Lima', employeeNumber: 'PROF002', degree: 'Mestrado', degreeArea: 'Engenharia Informática', salary: 95000, phone: '923456789' },
      { name: 'Ana Paula Oliveira', employeeNumber: 'PROF003', degree: 'Licenciatura', degreeArea: 'Biologia', salary: 80000, phone: '924567890' },
      { name: 'Pedro João Santos', employeeNumber: 'PROF004', degree: 'Licenciatura', degreeArea: 'Contabilidade', salary: 82000, phone: '926789012' },
      { name: 'Maria Helena Ferreira', employeeNumber: 'PROF005', degree: 'Licenciatura', degreeArea: 'Enfermagem', salary: 78000, phone: '927890123' },
      { name: 'João Manuel Costa', employeeNumber: 'PROF006', degree: 'Mestrado', degreeArea: 'Química', salary: 90000, phone: '928901234' },
      { name: 'Teresa Isabel Nunes', employeeNumber: 'PROF007', degree: 'Licenciatura', degreeArea: 'Português', salary: 75000, phone: '929012345' },
      { name: 'António Fernando Silva', employeeNumber: 'PROF008', degree: 'Doutoramento', degreeArea: 'Bioquímica', salary: 110000, phone: '921123456' },
    ]

    for (const teacher of teachersData) {
      // Check if teacher already exists
      const { data: existingTeacher } = await supabase
        .from('teachers')
        .select('id')
        .eq('employee_number', teacher.employeeNumber)
        .single()

      if (!existingTeacher) {
        const { error } = await supabase
          .from('teachers')
          .insert({
            employee_number: teacher.employeeNumber,
            degree: teacher.degree,
            degree_area: teacher.degreeArea,
            gross_salary: teacher.salary,
            hire_date: '2020-01-15',
            is_active: true,
            functions: ['Professor']
          })
        
        if (error) {
          console.log('Teacher error:', error)
        }
      }
    }

    // Get teachers
    const { data: teachers } = await supabase.from('teachers').select('id, employee_number')
    console.log('Teachers created:', teachers?.length)

    // 6. Create Students
    const firstNames = ['Pedro', 'Maria', 'João', 'Ana', 'Carlos', 'Sofia', 'Manuel', 'Catarina', 'António', 'Isabel', 'Miguel', 'Francisca', 'José', 'Beatriz', 'Paulo']
    const lastNames = ['Alves', 'Santos', 'Ferreira', 'Costa', 'Silva', 'Oliveira', 'Mendes', 'Nunes', 'Pereira', 'Rodrigues', 'Martins', 'Sousa', 'Fernandes', 'Gonçalves', 'Gomes']
    const provinces = ['Luanda', 'Benguela', 'Huambo', 'Huíla', 'Bié', 'Malanje', 'Kwanza Norte', 'Kwanza Sul']
    const genders = ['Masculino', 'Feminino']

    let studentCount = 0
    const classesToPopulate = classes?.slice(0, 16) || [] // First 16 classes

    for (const classItem of classesToPopulate) {
      const numStudents = Math.floor(Math.random() * 15) + 25 // 25-40 students per class

      for (let i = 0; i < numStudents; i++) {
        const firstName = firstNames[Math.floor(Math.random() * firstNames.length)]
        const lastName1 = lastNames[Math.floor(Math.random() * lastNames.length)]
        const lastName2 = lastNames[Math.floor(Math.random() * lastNames.length)]
        const fullName = `${firstName} ${lastName1} ${lastName2}`
        const gender = genders[Math.floor(Math.random() * genders.length)]
        const province = provinces[Math.floor(Math.random() * provinces.length)]
        
        const enrollmentYear = 2025 - (classItem.grade_level - 10)
        const enrollmentNumber = `${enrollmentYear}${String(studentCount + 1).padStart(4, '0')}`

        const { error } = await supabase
          .from('students')
          .insert({
            full_name: fullName,
            enrollment_number: enrollmentNumber,
            enrollment_year: enrollmentYear,
            class_id: classItem.id,
            gender: gender,
            birth_date: `${2005 - Math.floor(Math.random() * 5)}-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`,
            birthplace: province,
            province: province,
            parent_names: `${lastNames[Math.floor(Math.random() * lastNames.length)]} e ${lastNames[Math.floor(Math.random() * lastNames.length)]}`,
            guardian_name: `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastName1}`,
            guardian_contact: `9${Math.floor(Math.random() * 9) + 2}${Math.floor(1000000 + Math.random() * 9000000)}`,
            status: Math.random() > 0.05 ? 'active' : 'dropout'
          })
        
        if (error && !error.message.includes('duplicate')) {
          console.log('Student error:', error)
        }
        studentCount++
      }
    }

    console.log('Students created:', studentCount)

    // 7. Assign class directors
    if (teachers && teachers.length > 0 && classes && classes.length > 0) {
      const classesForDirectors = classes.slice(0, Math.min(teachers.length, classes.length))
      
      for (let i = 0; i < classesForDirectors.length; i++) {
        const { error } = await supabase
          .from('classes')
          .update({ class_director_id: teachers[i % teachers.length].id })
          .eq('id', classesForDirectors[i].id)
        
        if (error) {
          console.log('Director assignment error:', error)
        }
      }
      console.log('Class directors assigned')
    }

    // 8. Create some payments
    const { data: students } = await supabase.from('students').select('id').limit(100)
    
    if (students) {
      for (const student of students) {
        const monthsPaid = Math.floor(Math.random() * 6) + 1 // 1-6 months paid
        
        for (let month = 1; month <= monthsPaid; month++) {
          const { error } = await supabase
            .from('payments')
            .insert({
              student_id: student.id,
              amount: 15000 + Math.floor(Math.random() * 10000),
              month_reference: month,
              year_reference: 2025,
              payment_date: `2025-${String(month).padStart(2, '0')}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`,
              payment_method: ['Dinheiro', 'Transferência', 'Depósito'][Math.floor(Math.random() * 3)],
              receipt_number: `REC${String(Math.floor(Math.random() * 100000)).padStart(6, '0')}`
            })
          
          if (error && !error.message.includes('duplicate')) {
            console.log('Payment error:', error)
          }
        }
      }
      console.log('Payments created')
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Dados de exemplo criados com sucesso',
        stats: {
          courses: courses?.length || 0,
          classes: classes?.length || 0,
          teachers: teachers?.length || 0,
          students: studentCount
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error: unknown) {
    console.error('Error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
