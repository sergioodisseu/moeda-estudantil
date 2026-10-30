import type { Context } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import { z } from "zod";
import type { ErroDominio, Resultado, TipoErro } from "@/models/shared/resultado.ts";

const STATUS_POR_ERRO: Readonly<Record<TipoErro, ContentfulStatusCode>> = {
  VALIDACAO: 400,
  CREDENCIAIS_INVALIDAS: 401,
  NAO_ENCONTRADO: 404,
  CONFLITO: 409,
  SALDO_INSUFICIENTE: 422,
};

export const respostaDeErro = (c: Context, erro: ErroDominio) =>
  c.json({ erro: erro.tipo, mensagem: erro.mensagem }, STATUS_POR_ERRO[erro.tipo]);

export function responder<T, S>(c: Context, resultado: Resultado<T>, apresentar: (valor: T) => S, status: 200 | 201 = 200) {
  return resultado.ok ? c.json(apresentar(resultado.valor), status) : respostaDeErro(c, resultado.erro);
}

/** Valida o corpo da requisição na fronteira; devolve o erro já formatado como Resultado. */
export async function lerCorpo<S extends z.ZodType>(c: Context, esquema: S): Promise<Resultado<z.infer<S>>> {
  const corpo: unknown = await c.req.json().catch(() => undefined);
  const lido = esquema.safeParse(corpo);
  if (lido.success) return { ok: true, valor: lido.data };
  const campos = lido.error.issues.map((i) => i.path.join(".") || "corpo").join(", ");
  return { ok: false, erro: { tipo: "VALIDACAO", mensagem: `Dados inválidos: ${campos}.` } };
}
