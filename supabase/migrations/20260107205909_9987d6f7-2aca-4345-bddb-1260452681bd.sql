-- Create enrollment_periods table for controlling enrollment windows
CREATE TABLE public.enrollment_periods (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    academic_year integer NOT NULL,
    start_date date NOT NULL,
    end_date date NOT NULL,
    is_active boolean NOT NULL DEFAULT true,
    created_by uuid REFERENCES auth.users(id),
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    UNIQUE(academic_year)
);

-- Enable RLS
ALTER TABLE public.enrollment_periods ENABLE ROW LEVEL SECURITY;

-- RLS Policies for enrollment_periods
CREATE POLICY "Admins can manage enrollment periods"
ON public.enrollment_periods
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Matricula staff can view enrollment periods"
ON public.enrollment_periods
FOR SELECT
USING (has_role(auth.uid(), 'matricula'::app_role));

CREATE POLICY "Public can view active enrollment periods"
ON public.enrollment_periods
FOR SELECT
USING (is_active = true);

-- Add enrollment_date to students to track when they enrolled
ALTER TABLE public.students 
ADD COLUMN IF NOT EXISTS enrollment_date date DEFAULT CURRENT_DATE;

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_students_enrollment_date ON public.students(enrollment_date);
CREATE INDEX IF NOT EXISTS idx_students_class_birth ON public.students(class_id, birth_date);

-- Update RLS for students to allow matricula role to insert and view
CREATE POLICY "Matricula staff can insert students"
ON public.students
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'matricula'::app_role));

CREATE POLICY "Matricula staff can view students"
ON public.students
FOR SELECT
USING (has_role(auth.uid(), 'matricula'::app_role));

-- Allow teachers table to be viewed by matricula for coordinator selection
CREATE POLICY "Matricula staff can view teachers"
ON public.teachers
FOR SELECT
USING (has_role(auth.uid(), 'matricula'::app_role));

-- Allow courses to be viewed by matricula
CREATE POLICY "Matricula staff can view courses"
ON public.courses
FOR SELECT
USING (has_role(auth.uid(), 'matricula'::app_role));

-- Allow classes to be viewed and updated by matricula (for placing students)
CREATE POLICY "Matricula staff can view classes"
ON public.classes
FOR SELECT
USING (has_role(auth.uid(), 'matricula'::app_role));

CREATE POLICY "Matricula staff can update classes"
ON public.classes
FOR UPDATE
USING (has_role(auth.uid(), 'matricula'::app_role));

-- Allow payments to be created by matricula (for enrollment invoice)
CREATE POLICY "Matricula staff can create payments"
ON public.payments
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'matricula'::app_role));