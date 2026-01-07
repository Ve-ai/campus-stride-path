-- Restrict public access to student photos bucket
UPDATE storage.buckets
SET public = false
WHERE id = 'student-photos';

-- Allow only authenticated staff roles to access student photos
CREATE POLICY "Student photos select for staff"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'student-photos'
  AND EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role IN ('super_admin', 'admin', 'finance', 'professor')
  )
);

CREATE POLICY "Student photos insert for staff"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'student-photos'
  AND EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role IN ('super_admin', 'admin', 'finance', 'professor')
  )
);

CREATE POLICY "Student photos delete for admins"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'student-photos'
  AND EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role IN ('super_admin', 'admin')
  )
);