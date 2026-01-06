-- Tighten read access so only authenticated users (including admins, professors, students) can view shared catalog tables

ALTER POLICY "Authenticated users can view classes"
ON public.classes
USING (auth.uid() IS NOT NULL);

ALTER POLICY "Authenticated users can view subjects"
ON public.subjects
USING (auth.uid() IS NOT NULL);

ALTER POLICY "Authenticated users can view school nuclei"
ON public.school_nuclei
USING (auth.uid() IS NOT NULL);

ALTER POLICY "Authenticated users can view assignments"
ON public.teacher_class_assignments
USING (auth.uid() IS NOT NULL);
