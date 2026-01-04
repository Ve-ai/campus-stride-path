-- Restrict access to teacher data
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;

-- Remove overly permissive policy that allowed any authenticated user to view all teachers
DROP POLICY IF EXISTS "Authenticated users can view teachers" ON public.teachers;

-- Keep existing policies:
-- - "Admins can manage teachers" (ALL)
-- - "Super admins can manage teachers" (ALL)
-- - "Teachers can view their own data" (SELECT)
-- These already enforce that only admins/super_admins manage teachers and
-- individual teachers can see only their own record.
