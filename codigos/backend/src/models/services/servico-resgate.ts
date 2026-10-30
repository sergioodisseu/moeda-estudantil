import { resgatarVantagem } from "@/models/entities/aluno.ts";
import { sucesso, type Resultado } from "@/models/shared/resultado.ts";
import type { Resgate } from "@/models/entities/transacao.ts";
import type { UnidadeDeTrabalho } from "@/models/repositories/repositorios.ts";
import type { Registro, ServicoEmail } from "@/models/gateways/servico-email.ts";
import { aposCommit, comoResultado, naoEncontrado } from "@/models/services/apoio.ts";

type Dependencias = Readonly<{
  persistencia: UnidadeDeTrabalho;
  email: ServicoEmail;
  registro: Registro;
  agora: () => Date;
  gerarCodigo: () => string;
}>;

/** UC14 Trocar moedas por vantagem (+ UC15 cupom ao aluno e UC16 conferência à empresa, após o commit). */
export function criarServicoResgate({ persistencia, email, registro, agora, gerarCodigo }: Dependencias) {
  const executarResgate = (alunoId: number, vantagemId: number): Promise<Resultado<Resgate>> =>
    persistencia.executar(async ({ alunos, vantagens, transacoes }) => {
      const aluno = await alunos.buscarPorId(alunoId);
      if (!aluno) return naoEncontrado("Aluno");
      const vantagem = await vantagens.buscarPorId(vantagemId);
      if (!vantagem) return naoEncontrado("Vantagem");
      const alunoAtualizado = resgatarVantagem(aluno, vantagem);
      if (!alunoAtualizado.ok) return alunoAtualizado;
      await alunos.atualizarSaldo(aluno.id, aluno.saldo, alunoAtualizado.valor.saldo);
      return sucesso(
        await transacoes.registrarResgate({
          tipo: "RESGATE",
          dataHora: agora(),
          valor: vantagem.custoEmMoedas,
          codigo: gerarCodigo(),
          aluno: alunoAtualizado.valor,
          vantagem,
        }),
      );
    });

  async function trocar(alunoId: number, vantagemId: number): Promise<Resultado<Resgate>> {
    const resultado = await comoResultado(() => executarResgate(alunoId, vantagemId));
    if (resultado.ok) {
      const resgate = resultado.valor;
      await aposCommit(registro, "Falha ao enviar email do resgate", [
        () => email.enviarCupom(resgate),
        () => email.enviarConferencia(resgate),
      ]);
    }
    return resultado;
  }

  return { trocar };
}

export type ServicoResgate = ReturnType<typeof criarServicoResgate>;
