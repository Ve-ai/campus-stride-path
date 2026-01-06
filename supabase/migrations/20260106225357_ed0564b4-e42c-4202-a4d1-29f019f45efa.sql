-- Create configuracoes_faltas table and extend faltas_professores for discount logic

-- 1) Create enum for discount type (justified vs not)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'professor_absence_discount_type'
  ) THEN
    CREATE TYPE public.professor_absence_discount_type AS ENUM (
      'justificada',
      'nao_justificada'
    );
  END IF;
END $$;

-- 2) Create configuracoes_faltas table
CREATE TABLE IF NOT EXISTS public.configuracoes_faltas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  desconto_falta_nao_justificada numeric NOT NULL,
  desconto_falta_justificada numeric NOT NULL,
  ativo boolean NOT NULL DEFAULT true,
  criado_em timestamptz NOT NULL DEFAULT now()
);

-- 3) Ensure only one active configuration at a time
CREATE UNIQUE INDEX IF NOT EXISTS configuracoes_faltas_ativo_unico
  ON public.configuracoes_faltas ((true))
  WHERE ativo = true;

-- 4) Enable RLS on configuracoes_faltas
ALTER TABLE public.configuracoes_faltas ENABLE ROW LEVEL SECURITY;

-- 5) RLS policies for configuracoes_faltas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'configuracoes_faltas'
      AND policyname = 'Admins podem gerir configuracoes de faltas'
  ) THEN
    CREATE POLICY "Admins podem gerir configuracoes de faltas" ON public.configuracoes_faltas
      FOR ALL
      USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role))
      WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));
  END IF;
END $$;

-- Opcional: permitir leitura para outros perfis no futuro. Por agora, apenas admins/super_admins.

-- 6) Add discount columns to faltas_professores
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'faltas_professores'
      AND column_name = 'valor_descontado'
  ) THEN
    ALTER TABLE public.faltas_professores
      ADD COLUMN valor_descontado numeric;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'faltas_professores'
      AND column_name = 'tipo_desconto'
  ) THEN
    ALTER TABLE public.faltas_professores
      ADD COLUMN tipo_desconto public.professor_absence_discount_type;
  END IF;
END $$;
