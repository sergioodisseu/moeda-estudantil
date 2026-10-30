import { creditarMoedasSemestrais } from "@/models/entities/professor.ts";
import type { UnidadeDeTrabalho } from "@/models/repositories/repositorios.ts";

/** UC17 Creditar moedas semestrais ao professor (ator: Sistema, início de cada semestre). */
export function criarServicoCreditoSemestral({ persistencia }: Readonly<{ persistencia: UnidadeDeTrabalho }>) {
  async function creditar(): Promise<number> {
    return persistencia.executar(async ({ professores }) => {
      const todos = await professores.listar();
      for (const professor of todos) {
        await professores.atualizarSaldo(professor.id, professor.saldo, creditarMoedasSemestrais(professor).saldo);
      }
      return todos.length;
    });
  }

  return { creditar };
}
