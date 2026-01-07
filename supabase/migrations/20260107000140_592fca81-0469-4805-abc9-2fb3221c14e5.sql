-- Add base_amount and late_fee to payments to separate tuition and fines
ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS base_amount numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS late_fee numeric NOT NULL DEFAULT 0;

-- Initialize new columns for existing rows: all historical amounts are treated as base (no fine)
UPDATE public.payments
SET base_amount = amount,
    late_fee = COALESCE(late_fee, 0)
WHERE base_amount = 0;