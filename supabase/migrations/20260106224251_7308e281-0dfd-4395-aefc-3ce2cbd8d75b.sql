-- Corrigir fluxo de justificativas: novo enum e policies

-- 0) Remover policy que depende da coluna status antes de alterar o tipo
DROP POLICY IF EXISTS "Professores podem justificar faltas pendentes" ON public.faltas_professores;

-- 1) Criar novo tipo de enum com os novos estados
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'professor_absence_status_new'
  ) THEN
    CREATE TYPE public.professor_absence_status_new AS ENUM (
      'registada',
      'nao_justificada',
      'justificativa_pendente',
      'justificada',
      'rejeitada'
    );
  END IF;
END $$;

-- 2) Alterar coluna status para usar o novo tipo, mapeando estados antigos
ALTER TABLE public.faltas_professores
ALTER COLUMN status DROP DEFAULT;

ALTER TABLE public.faltas_professores
ALTER COLUMN status TYPE public.professor_absence_status_new
USING (
  CASE status::text
    WHEN 'pendente' THEN
      CASE
        WHEN justificativa_texto IS NOT NULL THEN 'justificativa_pendente'
        ELSE 'nao_justificada'
      END
    WHEN 'justificada' THEN 'justificada'
    WHEN 'rejeitada' THEN 'rejeitada'
  END::public.professor_absence_status_new
);

ALTER TABLE public.faltas_professores
ALTER COLUMN status SET DEFAULT 'nao_justificada';

-- 3) Remover o tipo antigo e renomear o novo
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'professor_absence_status'
  ) THEN
    DROP TYPE public.professor_absence_status;
  END IF;
END $$;

ALTER TYPE public.professor_absence_status_new RENAME TO professor_absence_status;

-- 4) Recriar policy de professor com a nova lógica
CREATE POLICY "Professores podem justificar faltas nao_justificadas" ON public.faltas_professores
FOR UPDATE
USING (
  has_role(auth.uid(), 'professor'::app_role)
  AND EXISTS (
    SELECT 1 FROM public.teachers t
    WHERE t.id = faltas_professores.professor_id
      AND t.user_id = auth.uid()
  )
  AND status = 'nao_justificada'::public.professor_absence_status
)
WITH CHECK (
  has_role(auth.uid(), 'professor'::app_role)
  AND EXISTS (
    SELECT 1 FROM public.teachers t
    WHERE t.id = faltas_professores.professor_id
      AND t.user_id = auth.uid()
  )
  AND status = 'justificativa_pendente'::public.professor_absence_status
);

-- Policies de admin mantêm-se inalteradas (acesso total independentemente do estado).