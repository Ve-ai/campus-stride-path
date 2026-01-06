import { supabase } from '@/integrations/supabase/client';

export type FaltasStatus =
  | 'registada'
  | 'nao_justificada'
  | 'justificativa_pendente'
  | 'justificada'
  | 'rejeitada';

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
  valor_descontado?: number | null;
  tipo_desconto?: 'justificada' | 'nao_justificada' | null;
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
  status: 'justificada' | 'rejeitada';
  observacoesAdmin?: string;
}

export interface ConfiguracaoFaltas {
  id: string;
  desconto_falta_nao_justificada: number;
  desconto_falta_justificada: number;
  ativo: boolean;
  criado_em: string;
}

export interface GuardarConfiguracaoFaltasInput {
  descontoFaltaNaoJustificada: number;
  descontoFaltaJustificada: number;
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

// Configuração de faltas (admin)
export async function obterConfiguracaoFaltasAtiva(): Promise<ConfiguracaoFaltas | null> {
  const { data, error } = await supabase
    .from('configuracoes_faltas')
    .select('*')
    .eq('ativo', true)
    .order('criado_em', { ascending: false })
    .maybeSingle();

  if (error) throw error;
  return (data as ConfiguracaoFaltas) || null;
}

export async function guardarConfiguracaoFaltas(
  input: GuardarConfiguracaoFaltasInput,
): Promise<ConfiguracaoFaltas> {
  // Desactivar qualquer configuração actualmente activa
  await supabase
    .from('configuracoes_faltas')
    .update({ ativo: false })
    .eq('ativo', true);

  const { data, error } = await supabase
    .from('configuracoes_faltas')
    .insert({
      desconto_falta_nao_justificada: input.descontoFaltaNaoJustificada,
      desconto_falta_justificada: input.descontoFaltaJustificada,
      ativo: true,
    })
    .select('*')
    .single();

  if (error) throw error;
  return data as ConfiguracaoFaltas;
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
  // Garantir que apenas faltas nao_justificada podem ser justificadas
  const { data: faltaAtual, error: erroFaltaAtual } = await supabase
    .from('faltas_professores')
    .select('id, status, professor_id')
    .eq('id', input.faltaId)
    .maybeSingle();

  if (erroFaltaAtual) throw erroFaltaAtual;
  if (!faltaAtual) throw new Error('Falta não encontrada');
  if (faltaAtual.status !== 'nao_justificada') {
    throw new Error('Só é possível justificar faltas não justificadas.');
  }

  const { data, error } = await supabase
    .from('faltas_professores')
    .update({
      justificativa_texto: input.justificativaTexto,
      justificativa_arquivo_url: input.justificativaArquivoUrl ?? null,
      status: 'justificativa_pendente',
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
  // Carregar falta actual para validar transição
  const { data: faltaAtual, error: erroFaltaAtual } = await supabase
    .from('faltas_professores')
    .select('id, status, professor_id')
    .eq('id', input.faltaId)
    .maybeSingle();

  if (erroFaltaAtual) throw erroFaltaAtual;
  if (!faltaAtual) throw new Error('Falta não encontrada');

  if (faltaAtual.status !== 'justificativa_pendente') {
    throw new Error('Só é possível aprovar ou rejeitar faltas com justificativa pendente.');
  }

  // Obter salário do professor
  const { data: professor, error: erroProfessor } = await supabase
    .from('teachers')
    .select('gross_salary')
    .eq('id', faltaAtual.professor_id)
    .maybeSingle();

  if (erroProfessor) throw erroProfessor;
  const grossSalary = professor?.gross_salary ?? 0;

  // Obter configuração activa de faltas
  const { data: configuracao, error: erroConfiguracao } = await supabase
    .from('configuracoes_faltas')
    .select('*')
    .eq('ativo', true)
    .order('criado_em', { ascending: false })
    .maybeSingle();

  if (erroConfiguracao) throw erroConfiguracao;
  if (!configuracao) {
    throw new Error('Nenhuma configuração de faltas activa encontrada.');
  }

  const tipoDesconto: 'justificada' | 'nao_justificada' =
    input.status === 'justificada' ? 'justificada' : 'nao_justificada';

  const percentagem =
    tipoDesconto === 'nao_justificada'
      ? Number(configuracao.desconto_falta_nao_justificada)
      : Number(configuracao.desconto_falta_justificada);

  const valorDescontado =
    grossSalary && percentagem
      ? (Number(grossSalary) * percentagem) / 100
      : 0;

  const { data, error } = await supabase
    .from('faltas_professores')
    .update({
      status: input.status,
      observacoes_admin: input.observacoesAdmin ?? null,
      tipo_desconto: tipoDesconto,
      valor_descontado: valorDescontado,
    })
    .eq('id', input.faltaId)
    .select('*')
    .single();

  if (error) throw error;
  return data as FaltaProfessor;
}
