import { supabase } from '@/integrations/supabase/client';

export type FaltasStatus = 'pendente' | 'justificada' | 'rejeitada';

export interface FaltaProfessor {
  id: string;
  professor_id: string;
  disciplina_id: string;
  data_falta: string;
  motivo?: string | null;
  justificativa_texto?: string | null;
  justificativa_arquivo_url?: string | null;
  status: FaltasStatus;
  observacoes_admin?: string | null;
  criado_em: string;
  atualizado_em: string;
  professor?: {
    id: string;
    full_name: string | null;
    employee_number: string | null;
  } | null;
  disciplina?: {
    id: string;
    name: string;
  } | null;
}

export interface RegistrarFaltaInput {
  professorId: string;
  disciplinaId: string;
  dataFalta: string; // ISO date
  motivo?: string;
}

export interface SubmeterJustificativaInput {
  faltaId: string;
  justificativaTexto: string;
  justificativaArquivoUrl?: string;
}

export interface AtualizarStatusFaltaInput {
  faltaId: string;
  status: Exclude<FaltasStatus, 'pendente'>;
  observacoesAdmin?: string;
}

// Lista de faltas (admin)
export async function listarFaltas(params?: {
  professorId?: string;
  dataInicio?: string;
  dataFim?: string;
  status?: FaltasStatus;
}): Promise<FaltaProfessor[]> {
  let query = supabase
    .from('faltas_professores')
    .select(`
      *,
      professor:teachers!faltas_professores_professor_id_fkey (
        id,
        full_name,
        employee_number
      ),
      disciplina:subjects!faltas_professores_disciplina_id_fkey (
        id,
        name
      )
    `)
    .order('data_falta', { ascending: false });

  if (params?.professorId) {
    query = query.eq('professor_id', params.professorId);
  }
  if (params?.status) {
    query = query.eq('status', params.status);
  }
  if (params?.dataInicio) {
    query = query.gte('data_falta', params.dataInicio);
  }
  if (params?.dataFim) {
    query = query.lte('data_falta', params.dataFim);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data || []) as FaltaProfessor[];
}

// Lista de faltas do professor autenticado
export async function listarMinhasFaltas(): Promise<FaltaProfessor[]> {
  const { data, error } = await supabase
    .from('faltas_professores')
    .select(`
      *,
      disciplina:subjects!faltas_professores_disciplina_id_fkey (
        id,
        name
      )
    `)
    .order('data_falta', { ascending: false });

  if (error) throw error;
  return (data || []) as FaltaProfessor[];
}

// Registo de falta (admin)
export async function registrarFalta(input: RegistrarFaltaInput): Promise<FaltaProfessor> {
  const { data, error } = await supabase
    .from('faltas_professores')
    .insert({
      professor_id: input.professorId,
      disciplina_id: input.disciplinaId,
      data_falta: input.dataFalta,
      motivo: input.motivo ?? null,
    })
    .select('*')
    .single();

  if (error) throw error;
  return data as FaltaProfessor;
}

// Submissão de justificativa (professor)
export async function submeterJustificativa(
  input: SubmeterJustificativaInput,
): Promise<FaltaProfessor> {
  const { data, error } = await supabase
    .from('faltas_professores')
    .update({
      justificativa_texto: input.justificativaTexto,
      justificativa_arquivo_url: input.justificativaArquivoUrl ?? null,
    })
    .eq('id', input.faltaId)
    .select('*')
    .single();

  if (error) throw error;
  return data as FaltaProfessor;
}

// Aprovar / rejeitar justificativa (admin)
export async function actualizarStatusFalta(
  input: AtualizarStatusFaltaInput,
): Promise<FaltaProfessor> {
  const { data, error } = await supabase
    .from('faltas_professores')
    .update({
      status: input.status,
      observacoes_admin: input.observacoesAdmin ?? null,
    })
    .eq('id', input.faltaId)
    .select('*')
    .single();

  if (error) throw error;
  return data as FaltaProfessor;
}
