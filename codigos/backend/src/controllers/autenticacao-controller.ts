import { Hono } from "hono";
import { z } from "zod";
import type { ServicoAutenticacao } from "@/models/services/servico-autenticacao.ts";
import { lerCorpo, respostaDeErro } from "@/controllers/http/http.ts";
import type { SessaoJwt } from "@/controllers/http/sessao-jwt.ts";

const esquemaLogin = z.object({ login: z.string(), senha: z.string() });

export function criarAutenticacaoController(servico: ServicoAutenticacao, sessao: SessaoJwt) {
  return new Hono().post("/auth/login", async (c) => {
    const corpo = await lerCorpo(c, esquemaLogin);
    if (!corpo.ok) return respostaDeErro(c, corpo.erro);
    const autenticado = await servico.autenticar(corpo.valor.login, corpo.valor.senha);
    if (!autenticado.ok) return respostaDeErro(c, autenticado.erro);
    const { perfil, nome } = autenticado.valor;
    return c.json({ token: await sessao.emitir(autenticado.valor), perfil, nome });
  });
}
