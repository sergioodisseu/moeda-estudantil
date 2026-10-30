import { Hono } from "hono";
import { z } from "zod";
import type { ServicoEmpresaParceira } from "@/models/services/servico-empresa-parceira.ts";
import type { ServicoVantagem } from "@/models/services/servico-vantagem.ts";
import { apresentarEmpresa, apresentarVantagem } from "@/controllers/http/apresentacao.ts";
import { lerCorpo, respostaDeErro, responder } from "@/controllers/http/http.ts";
import type { SessaoJwt, VariaveisSessao } from "@/controllers/http/sessao-jwt.ts";

const dadosEmpresa = { nome: z.string(), email: z.email() };
const esquemaCadastro = z.object({ ...dadosEmpresa, login: z.string(), senha: z.string() });
const esquemaAtualizacao = z.object(dadosEmpresa);
const esquemaVantagem = z.object({ descricao: z.string(), foto: z.string(), custoEmMoedas: z.number() });

type Servicos = Readonly<{ empresa: ServicoEmpresaParceira; vantagem: ServicoVantagem }>;

export function criarEmpresaParceiraController({ empresa, vantagem }: Servicos, sessao: SessaoJwt) {
  const app = new Hono<VariaveisSessao>();
  const somenteEmpresa = sessao.exigir("EMPRESA_PARCEIRA");

  app.post("/empresas", async (c) => {
    const corpo = await lerCorpo(c, esquemaCadastro);
    if (!corpo.ok) return respostaDeErro(c, corpo.erro);
    return responder(c, await empresa.cadastrar(corpo.valor), apresentarEmpresa, 201);
  });

  app.get("/empresa", somenteEmpresa, async (c) => responder(c, await empresa.consultar(c.get("sessaoId")), apresentarEmpresa));

  app.put("/empresa", somenteEmpresa, async (c) => {
    const corpo = await lerCorpo(c, esquemaAtualizacao);
    if (!corpo.ok) return respostaDeErro(c, corpo.erro);
    return responder(c, await empresa.atualizar(c.get("sessaoId"), corpo.valor), apresentarEmpresa);
  });

  app.delete("/empresa", somenteEmpresa, async (c) => {
    const excluida = await empresa.excluir(c.get("sessaoId"));
    return excluida.ok ? c.body(null, 204) : respostaDeErro(c, excluida.erro);
  });

  app.get("/empresa/vantagens", somenteEmpresa, async (c) =>
    c.json((await vantagem.listarDaEmpresa(c.get("sessaoId"))).map(apresentarVantagem)),
  );

  app.post("/empresa/vantagens", somenteEmpresa, async (c) => {
    const corpo = await lerCorpo(c, esquemaVantagem);
    if (!corpo.ok) return respostaDeErro(c, corpo.erro);
    return responder(c, await vantagem.cadastrar(c.get("sessaoId"), corpo.valor), apresentarVantagem, 201);
  });

  return app;
}
