-- Add periods column to teacher_class_assignments for morning/afternoon tracking
ALTER TABLE public.teacher_class_assignments
ADD COLUMN IF NOT EXISTS periods text[] NOT NULL DEFAULT ARRAY[]::text[];