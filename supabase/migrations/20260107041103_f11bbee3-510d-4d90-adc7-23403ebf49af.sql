-- Harden audit_logs insert permissions
DROP POLICY IF EXISTS "System can insert audit logs" ON public.audit_logs;

-- Ensure student photo bucket is private
UPDATE storage.buckets
SET public = false
WHERE id = 'student-photos';

-- Reset existing policies on student-photos bucket (if any)
DROP POLICY IF EXISTS "Admins can upload student photos" ON storage.objects;
DROP POLICY IF EXISTS "Staff can view student photos" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update student photos" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete student photos" ON storage.objects;

-- Restrictive policies for student photos
CREATE POLICY "Admins can upload student photos"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'student-photos'
    AND (public.has_role(auth.uid(), 'admin')
      OR public.has_role(auth.uid(), 'super_admin'))
  );

CREATE POLICY "Staff can view student photos"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'student-photos'
    AND (public.has_role(auth.uid(), 'admin')
      OR public.has_role(auth.uid(), 'super_admin')
      OR public.has_role(auth.uid(), 'finance'))
  );

CREATE POLICY "Admins can update student photos"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'student-photos'
    AND (public.has_role(auth.uid(), 'admin')
      OR public.has_role(auth.uid(), 'super_admin'))
  )
  WITH CHECK (
    bucket_id = 'student-photos'
    AND (public.has_role(auth.uid(), 'admin')
      OR public.has_role(auth.uid(), 'super_admin'))
  );

CREATE POLICY "Admins can delete student photos"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'student-photos'
    AND (public.has_role(auth.uid(), 'admin')
      OR public.has_role(auth.uid(), 'super_admin'))
  );