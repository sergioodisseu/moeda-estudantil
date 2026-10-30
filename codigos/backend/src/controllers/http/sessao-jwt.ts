import { createMiddleware } from "hono/factory";
import { sign, verify } from "hono/jwt";
import { z } from "zod";
import type { Perfil, Sessao } from "@/models/services/servico-autenticacao.ts";

const DURACAO_TOKEN_SEGUNDOS = 8 * 60 * 60;
const ALGORITMO = "HS256";

const esquemaToken = z.object({
  sub: z.string(),
  perfil: z.enum(["ALUNO", "PROFESSOR", "EMPRESA_PARCEIRA"]),
});

export type VariaveisSessao = { Variables: { sessaoId: number } };

/** Autenticação por token: emite na entrada e exige o perfil correto nas rotas protegidas. */
export function criarSessaoJwt(segredo: string) {
  const emitir = (sessao: Sessao): Promise<string> =>
    sign(
      { sub: String(sessao.id), perfil: sessao.perfil, exp: Math.floor(Date.now() / 1000) + DURACAO_TOKEN_SEGUNDOS },
      segredo,
      ALGORITMO,
    );

  const exigir = (perfil: Perfil) =>
    createMiddleware<VariaveisSessao>(async (c, next) => {
      const token = c.req.header("Authorization")?.replace(/^Bearer /, "");
      const payload = token ? await verify(token, segredo, ALGORITMO).catch(() => undefined) : undefined;
      const lido = esquemaToken.safeParse(payload);
      if (!lido.success) return c.json({ erro: "NAO_AUTENTICADO", mensagem: "Autenticação necessária." }, 401);
      if (lido.data.perfil !== perfil) return c.json({ erro: "ACESSO_NEGADO", mensagem: "Perfil sem acesso a este recurso." }, 403);
      c.set("sessaoId", Number(lido.data.sub));
      await next();
    });

  return { emitir, exigir };
}

export type SessaoJwt = ReturnType<typeof criarSessaoJwt>;
