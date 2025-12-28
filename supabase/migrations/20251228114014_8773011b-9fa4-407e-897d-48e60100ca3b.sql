-- Add unique constraint for school_nuclei name
ALTER TABLE public.school_nuclei ADD CONSTRAINT school_nuclei_name_unique UNIQUE (name);

-- Add unique constraint for courses name
ALTER TABLE public.courses ADD CONSTRAINT courses_name_unique UNIQUE (name);

-- Add unique constraint for subjects (course_id, name, grade_level)
ALTER TABLE public.subjects ADD CONSTRAINT subjects_course_name_grade_unique UNIQUE (course_id, name, grade_level);

-- Add unique constraint for classes
ALTER TABLE public.classes ADD CONSTRAINT classes_unique UNIQUE (course_id, grade_level, section, period, academic_year);