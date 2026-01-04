-- Allow admins to manage (or at least insert) profiles for teacher creation
CREATE POLICY "Admins can manage profiles"
ON public.profiles
AS PERMISSIVE
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to insert professor roles into user_roles safely
CREATE POLICY "Admins can assign professor role"
ON public.user_roles
AS PERMISSIVE
FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
  AND role = 'professor'::app_role
);