import { receberMoedas, type Aluno } from "@/models/entities/aluno.ts";
import type { InstituicaoEnsino } from "@/models/entities/instituicao-ensino.ts";
import { falha, sucesso, type Resultado } from "@/models/shared/resultado.ts";
import type { Usuario } from "@/models/entities/usuario.ts";
import { inteiroPositivo, textoPreenchido } from "@/models/shared/validacao.ts";

export const CREDITO_SEMESTRAL = 1000;

export type Professor = Usuario &
  Readonly<{
    nome: string;
    cpf: string;
    departamento: string;
    saldo: number;
    instituicao: InstituicaoEnsino;
  }>;

export type EnvioRealizado = Readonly<{ professor: Professor; aluno: Aluno; valor: number; motivo: string }>;

export function enviarMoedas(professor: Professor, aluno: Aluno, valor: number, motivo: string): Resultado<EnvioRealizado> {
  if (!inteiroPositivo(valor)) return falha("VALIDACAO", "A quantidade de moedas deve ser um inteiro positivo.");
  // Interpretação (removível): "seus alunos" no enunciado = alunos da mesma instituição do professor.
  if (professor.instituicao.id !== aluno.instituicao.id) return falha("VALIDACAO", "O aluno não pertence à instituição do professor.");
  if (!textoPreenchido(motivo)) return falha("VALIDACAO", "O motivo do reconhecimento é obrigatório.");
  if (professor.saldo < valor) return falha("SALDO_INSUFICIENTE", "Saldo insuficiente para enviar esta quantidade de moedas.");
  return sucesso({
    professor: { ...professor, saldo: professor.saldo - valor },
    aluno: receberMoedas(aluno, valor),
    valor,
    motivo: motivo.trim(),
  });
}

/** O crédito se acumula ao saldo corrente (não substitui). */
export const creditarMoedasSemestrais = (professor: Professor): Professor => ({
  ...professor,
  saldo: professor.saldo + CREDITO_SEMESTRAL,
});
