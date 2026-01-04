-- Tighten access to sensitive student data
-- Remove professor access to full student records

ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins and professors can view students" ON public.students;

CREATE POLICY "Admins can view students"
ON public.students
FOR SELECT
USING (
  public.has_role(auth.uid(), 'super_admin'::app_role)
  OR public.has_role(auth.uid(), 'admin'::app_role)
);
