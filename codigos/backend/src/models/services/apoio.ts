import { falha, type Resultado } from "@/models/shared/resultado.ts";
import { CpfEmUsoError, LoginEmUsoError, SaldoDesatualizadoError, ValorExcedeLimiteError } from "@/models/repositories/repositorios.ts";
import type { Registro } from "@/models/gateways/servico-email.ts";

/** Converte falhas excepcionais de infraestrutura conhecidas em erro esperado do caso de uso. */
export async function comoResultado<T>(operacao: () => Promise<Resultado<T>>): Promise<Resultado<T>> {
  try {
    return await operacao();
  } catch (erro) {
    if (erro instanceof LoginEmUsoError) return falha("CONFLITO", erro.message);
    if (erro instanceof CpfEmUsoError) return falha("CONFLITO", erro.message);
    if (erro instanceof ValorExcedeLimiteError) return falha("VALIDACAO", erro.message);
    if (erro instanceof SaldoDesatualizadoError) return falha("CONFLITO", erro.message);
    throw erro;
  }
}

export const naoEncontrado = (entidade: string): Resultado<never> => falha("NAO_ENCONTRADO", `${entidade} não encontrado(a).`);

/** Efeito externo executado só depois do commit; a falha é registrada, nunca engolida nem desfaz o commit. */
export async function aposCommit(registro: Registro, descricao: string, efeitos: ReadonlyArray<() => Promise<void>>): Promise<void> {
  const resultados = await Promise.allSettled(efeitos.map((efeito) => efeito()));
  resultados.forEach((r) => r.status === "rejected" && registro.erro(descricao, r.reason));
}

