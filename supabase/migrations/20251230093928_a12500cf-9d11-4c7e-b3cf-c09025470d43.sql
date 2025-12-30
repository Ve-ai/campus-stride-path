
-- Fix security issue: students table is publicly readable
-- Remove the old policy that allows all authenticated users to view
DROP POLICY IF EXISTS "Authenticated users can view students" ON public.students;

-- Create more restrictive policies for students table
-- Only admins, super_admins, and professors can view students
CREATE POLICY "Admins and professors can view students" 
ON public.students 
FOR SELECT 
USING (
  has_role(auth.uid(), 'super_admin'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'professor'::app_role)
);

-- Finance role can view limited student info for payment purposes
CREATE POLICY "Finance can view students for payments" 
ON public.students 
FOR SELECT 
USING (has_role(auth.uid(), 'finance'::app_role));

-- Fix security issue: grades table is publicly readable
-- Remove the old policy that allows all authenticated users to view
DROP POLICY IF EXISTS "Authenticated users can view grades" ON public.grades;

-- Create more restrictive policies for grades table
-- Admins can view all grades
CREATE POLICY "Admins can view all grades" 
ON public.grades 
FOR SELECT 
USING (
  has_role(auth.uid(), 'super_admin'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role)
);

-- Teachers can view grades for classes they are assigned to
CREATE POLICY "Teachers can view grades for their classes" 
ON public.grades 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM teacher_class_assignments tca
    JOIN teachers t ON t.id = tca.teacher_id
    WHERE t.user_id = auth.uid() 
    AND tca.class_id = grades.class_id
  )
);
