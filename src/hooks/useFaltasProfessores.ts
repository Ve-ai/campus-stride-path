import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  listarFaltas,
  listarMinhasFaltas,
  registrarFalta,
  submeterJustificativa,
  actualizarStatusFalta,
  FaltaProfessor,
  FaltasStatus,
  RegistrarFaltaInput,
  SubmeterJustificativaInput,
  AtualizarStatusFaltaInput,
} from '@/services/faltasProfessores.service';

// Lista de faltas (admin)
export function useFaltasProfessores(filters?: {
  professorId?: string;
  dataInicio?: string;
  dataFim?: string;
  status?: FaltasStatus;
}) {
  return useQuery<FaltaProfessor[], any>({
    queryKey: ['faltas_professores', filters],
    queryFn: () => listarFaltas(filters),
  });
}

// Minhas faltas (professor autenticado)
export function useMinhasFaltasProfessores() {
  return useQuery<FaltaProfessor[], any>({
    queryKey: ['minhas_faltas_professores'],
    queryFn: () => listarMinhasFaltas(),
  });
}

// Registar falta (admin)
export function useRegistrarFaltaProfessor() {
  const queryClient = useQueryClient();
  return useMutation<FaltaProfessor, any, RegistrarFaltaInput>({
    mutationFn: (input) => registrarFalta(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faltas_professores'] });
    },
  });
}

// Submeter justificativa (professor)
export function useSubmeterJustificativaFalta() {
  const queryClient = useQueryClient();
  return useMutation<FaltaProfessor, any, SubmeterJustificativaInput>({
    mutationFn: (input) => submeterJustificativa(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['minhas_faltas_professores'] });
      queryClient.invalidateQueries({ queryKey: ['faltas_professores'] });
    },
  });
}

// Aprovar / rejeitar justificativa (admin)
export function useActualizarStatusFaltaProfessor() {
  const queryClient = useQueryClient();
  return useMutation<FaltaProfessor, any, AtualizarStatusFaltaInput>({
    mutationFn: (input) => actualizarStatusFalta(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faltas_professores'] });
      queryClient.invalidateQueries({ queryKey: ['minhas_faltas_professores'] });
    },
  });
}
