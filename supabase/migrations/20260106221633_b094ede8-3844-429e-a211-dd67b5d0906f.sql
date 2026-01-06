-- 1) Enum para status das faltas de professores
CREATE TYPE public.professor_absence_status AS ENUM ('pendente', 'justificada', 'rejeitada');

-- 2) Tabela faltas_professores
CREATE TABLE public.faltas_professores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  professor_id uuid NOT NULL REFERENCES public.teachers(id) ON DELETE RESTRICT,
  disciplina_id uuid NOT NULL REFERENCES public.subjects(id) ON DELETE RESTRICT,
  data_falta date NOT NULL,
  motivo text NULL,
  justificativa_texto text NULL,
  justificativa_arquivo_url text NULL,
  status public.professor_absence_status NOT NULL DEFAULT 'pendente',
  observacoes_admin text NULL,
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now()
);

-- 3) Trigger para atualizar atualizado_em
CREATE OR REPLACE FUNCTION public.update_faltas_professores_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.atualizado_em = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER trg_update_faltas_professores_updated_at
BEFORE UPDATE ON public.faltas_professores
FOR EACH ROW
EXECUTE FUNCTION public.update_faltas_professores_updated_at();

-- 4) Activar RLS
ALTER TABLE public.faltas_professores ENABLE ROW LEVEL SECURITY;

-- 5) Policies
-- Professores: podem ver apenas as suas faltas
CREATE POLICY "Professores podem ver as suas faltas" ON public.faltas_professores
FOR SELECT
USING (
  has_role(auth.uid(), 'professor'::app_role)
  AND EXISTS (
    SELECT 1 FROM public.teachers t
    WHERE t.id = faltas_professores.professor_id
      AND t.user_id = auth.uid()
  )
);

-- Professores: podem actualizar justificativa apenas se status = pendente
CREATE POLICY "Professores podem justificar faltas pendentes" ON public.faltas_professores
FOR UPDATE
USING (
  has_role(auth.uid(), 'professor'::app_role)
  AND EXISTS (
    SELECT 1 FROM public.teachers t
    WHERE t.id = faltas_professores.professor_id
      AND t.user_id = auth.uid()
  )
)
WITH CHECK (
  has_role(auth.uid(), 'professor'::app_role)
  AND EXISTS (
    SELECT 1 FROM public.teachers t
    WHERE t.id = faltas_professores.professor_id
      AND t.user_id = auth.uid()
  )
  AND status = 'pendente'::public.professor_absence_status
);

-- Admin (e super_admin): total acesso (SELECT/INSERT/UPDATE)
CREATE POLICY "Admins podem gerir todas as faltas" ON public.faltas_professores
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'super_admin'::app_role)
);

CREATE POLICY "Admins podem registar faltas" ON public.faltas_professores
FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'super_admin'::app_role)
);

CREATE POLICY "Admins podem actualizar faltas" ON public.faltas_professores
FOR UPDATE
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'super_admin'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'super_admin'::app_role)
);

-- Não criar policy de DELETE para manter histórico e evitar remoções acidentais; apenas admins via SQL fora da app poderiam apagar se necessário.