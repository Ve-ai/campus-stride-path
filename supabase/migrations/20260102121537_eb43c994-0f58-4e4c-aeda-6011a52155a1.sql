-- Add full_name column directly on teachers so newly created records have a name
ALTER TABLE public.teachers
ADD COLUMN IF NOT EXISTS full_name text NOT NULL DEFAULT '';

-- Optional: backfill from profiles if linked
UPDATE public.teachers t
SET full_name = COALESCE(p.full_name, t.full_name)
FROM public.profiles p
WHERE t.profile_id = p.id
  AND (t.full_name IS NULL OR t.full_name = '');