
-- Tabela para informações de estágio curricular
CREATE TABLE public.estagios (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  local_estagio TEXT,
  tempo_estagio_meses INTEGER,
  data_inicio DATE,
  data_termino DATE,
  supervisor_nome TEXT,
  supervisor_contacto TEXT,
  observacoes TEXT,
  status TEXT DEFAULT 'pendente' CHECK (status IN ('pendente', 'em_curso', 'concluido', 'cancelado')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela para informações do Trabalho de Fim de Curso
CREATE TABLE public.trabalhos_fim_curso (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  tema TEXT,
  tutor_id UUID REFERENCES public.teachers(id),
  data_defesa DATE,
  nota_final NUMERIC,
  status TEXT DEFAULT 'em_elaboracao' CHECK (status IN ('em_elaboracao', 'entregue', 'defendido', 'aprovado', 'reprovado')),
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.estagios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trabalhos_fim_curso ENABLE ROW LEVEL SECURITY;

-- Policies para estagios
CREATE POLICY "Admins podem gerir estagios" ON public.estagios
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Authenticated users podem ver estagios" ON public.estagios
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Policies para trabalhos_fim_curso
CREATE POLICY "Admins podem gerir TFCs" ON public.trabalhos_fim_curso
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Authenticated users podem ver TFCs" ON public.trabalhos_fim_curso
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Tutores podem ver seus TFCs" ON public.trabalhos_fim_curso
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM teachers t 
      WHERE t.id = trabalhos_fim_curso.tutor_id 
      AND t.user_id = auth.uid()
    )
  );

-- Triggers para updated_at
CREATE TRIGGER update_estagios_updated_at
  BEFORE UPDATE ON public.estagios
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tfcs_updated_at
  BEFORE UPDATE ON public.trabalhos_fim_curso
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
