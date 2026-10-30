import { enviarMoedas } from "@/models/entities/professor.ts";
import type { EnvioMoedas } from "@/models/entities/transacao.ts";
import { sucesso, type Resultado } from "@/models/shared/resultado.ts";
import type { Aluno } from "@/models/entities/aluno.ts";
import type { UnidadeDeTrabalho } from "@/models/repositories/repositorios.ts";
import type { Registro, ServicoEmail } from "@/models/gateways/servico-email.ts";
import { aposCommit, comoResultado, naoEncontrado } from "@/models/services/apoio.ts";

type Dependencias = Readonly<{
  persistencia: UnidadeDeTrabalho;
  email: ServicoEmail;
  registro: Registro;
  agora: () => Date;
}>;

export type EntradaEnvio = Readonly<{ professorId: number; alunoId: number; valor: number; motivo: string }>;

/** UC11 Enviar moedas a aluno (+ UC12 Notificar aluno por email, executado após o commit). */
export function criarServicoEnvioMoedas({ persistencia, email, registro, agora }: Dependencias) {
  const executarEnvio = (entrada: EntradaEnvio): Promise<Resultado<EnvioMoedas>> =>
    persistencia.executar(async ({ professores, alunos, transacoes }) => {
      const professor = await professores.buscarPorId(entrada.professorId);
      if (!professor) return naoEncontrado("Professor");
      const aluno = await alunos.buscarPorId(entrada.alunoId);
      if (!aluno) return naoEncontrado("Aluno");
      const envio = enviarMoedas(professor, aluno, entrada.valor, entrada.motivo);
      if (!envio.ok) return envio;
      const { valor, motivo } = envio.valor;
      await professores.atualizarSaldo(professor.id, professor.saldo, envio.valor.professor.saldo);
      await alunos.atualizarSaldo(aluno.id, aluno.saldo, envio.valor.aluno.saldo);
      const registrado = await transacoes.registrarEnvio({
        tipo: "ENVIO_MOEDAS",
        dataHora: agora(),
        valor,
        motivo,
        professor: envio.valor.professor,
        aluno: envio.valor.aluno,
      });
      return sucesso(registrado);
    });

  async function enviar(entrada: EntradaEnvio): Promise<Resultado<EnvioMoedas>> {
    const resultado = await comoResultado(() => executarEnvio(entrada));
    if (resultado.ok) {
      await aposCommit(registro, "Falha ao notificar o aluno por email", [() => email.notificarRecebimentoMoedas(resultado.valor)]);
    }
    return resultado;
  }

  /** Alunos da instituição do professor, para a seleção do destinatário no UC11. */
  async function listarAlunosParaEnvio(professorId: number): Promise<Resultado<readonly Aluno[]>> {
    const professor = await persistencia.repositorios.professores.buscarPorId(professorId);
    if (!professor) return naoEncontrado("Professor");
    return sucesso(await persistencia.repositorios.alunos.listarPorInstituicao(professor.instituicao.id));
  }

  return { enviar, listarAlunosParaEnvio };
}

export type ServicoEnvioMoedas = ReturnType<typeof criarServicoEnvioMoedas>;
