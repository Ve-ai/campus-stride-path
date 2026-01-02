-- Create bucket for student photos
insert into storage.buckets (id, name, public)
values ('student-photos', 'student-photos', true)
on conflict (id) do nothing;

-- Allow public read access to student photos
create policy "Public read student photos"
on storage.objects
for select
using (bucket_id = 'student-photos');

-- Allow admins and super admins to manage student photos
create policy "Staff manage student photos"
on storage.objects
for all
using (
  bucket_id = 'student-photos'
  and (
    has_role(auth.uid(), 'admin'::app_role)
    or has_role(auth.uid(), 'super_admin'::app_role)
  )
)
with check (
  bucket_id = 'student-photos'
  and (
    has_role(auth.uid(), 'admin'::app_role)
    or has_role(auth.uid(), 'super_admin'::app_role)
  )
);