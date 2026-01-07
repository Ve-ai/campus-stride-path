-- Create cleaning staff table
CREATE TABLE public.pessoal_limpeza (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    nome_completo TEXT NOT NULL,
    funcao TEXT NOT NULL DEFAULT 'Auxiliar de Limpeza',
    bi_number TEXT,
    bi_issue_date DATE,
    birth_date DATE,
    phone TEXT,
    address TEXT,
    dias_trabalho TEXT[] NOT NULL DEFAULT ARRAY['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'],
    salario_bruto NUMERIC NOT NULL DEFAULT 0,
    data_admissao DATE NOT NULL DEFAULT CURRENT_DATE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create cleaning staff attendance/absences table
CREATE TABLE public.presencas_limpeza (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    pessoal_id UUID NOT NULL REFERENCES public.pessoal_limpeza(id) ON DELETE CASCADE,
    data DATE NOT NULL,
    tipo TEXT NOT NULL CHECK (tipo IN ('presenca', 'falta', 'falta_justificada')),
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create cleaning staff payments table
CREATE TABLE public.pagamentos_limpeza (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    pessoal_id UUID NOT NULL REFERENCES public.pessoal_limpeza(id) ON DELETE CASCADE,
    mes_referencia INTEGER NOT NULL,
    ano_referencia INTEGER NOT NULL,
    valor_bruto NUMERIC NOT NULL,
    descontos NUMERIC NOT NULL DEFAULT 0,
    valor_liquido NUMERIC NOT NULL,
    data_pagamento DATE NOT NULL DEFAULT CURRENT_DATE,
    pago_por UUID,
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(pessoal_id, mes_referencia, ano_referencia)
);

-- Enable RLS
ALTER TABLE public.pessoal_limpeza ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.presencas_limpeza ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pagamentos_limpeza ENABLE ROW LEVEL SECURITY;

-- RLS Policies for pessoal_limpeza
CREATE POLICY "Admins podem gerir pessoal de limpeza"
ON public.pessoal_limpeza
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Finance pode ver pessoal de limpeza"
ON public.pessoal_limpeza
FOR SELECT
USING (has_role(auth.uid(), 'finance'::app_role));

-- RLS Policies for presencas_limpeza
CREATE POLICY "Admins podem gerir presencas"
ON public.presencas_limpeza
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Finance pode ver presencas"
ON public.presencas_limpeza
FOR SELECT
USING (has_role(auth.uid(), 'finance'::app_role));

-- RLS Policies for pagamentos_limpeza
CREATE POLICY "Finance pode gerir pagamentos limpeza"
ON public.pagamentos_limpeza
FOR ALL
USING (has_role(auth.uid(), 'finance'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Admins podem ver pagamentos limpeza"
ON public.pagamentos_limpeza
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add coordinator role to app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'coordinator';