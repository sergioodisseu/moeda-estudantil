import { sucesso, type Resultado } from "@/models/shared/resultado.ts";
import type { Transacao } from "@/models/entities/transacao.ts";
import type { UnidadeDeTrabalho } from "@/models/repositories/repositorios.ts";
import { naoEncontrado } from "@/models/services/apoio.ts";

export type Extrato = Readonly<{ saldo: number; transacoes: readonly Transacao[] }>;

/** UC13 Consultar extrato: Aluno.consultarExtrato() e Professor.consultarExtrato(). */
export function criarServicoExtrato({ persistencia }: Readonly<{ persistencia: UnidadeDeTrabalho }>) {
  const { alunos, professores, transacoes } = persistencia.repositorios;

  async function doAluno(alunoId: number): Promise<Resultado<Extrato>> {
    const aluno = await alunos.buscarPorId(alunoId);
    if (!aluno) return naoEncontrado("Aluno");
    return sucesso({ saldo: aluno.saldo, transacoes: await transacoes.listarPorAluno(alunoId) });
  }

  async function doProfessor(professorId: number): Promise<Resultado<Extrato>> {
    const professor = await professores.buscarPorId(professorId);
    if (!professor) return naoEncontrado("Professor");
    return sucesso({ saldo: professor.saldo, transacoes: await transacoes.listarPorProfessor(professorId) });
  }

  return { doAluno, doProfessor };
}

export type ServicoExtrato = ReturnType<typeof criarServicoExtrato>;
