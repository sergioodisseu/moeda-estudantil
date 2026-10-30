import { Hono } from "hono";
import { z } from "zod";
import type { ServicoAluno } from "@/models/services/servico-aluno.ts";
import type { ServicoExtrato } from "@/models/services/servico-extrato.ts";
import type { ServicoResgate } from "@/models/services/servico-resgate.ts";
import type { ServicoVantagem } from "@/models/services/servico-vantagem.ts";
import { apresentarAluno, apresentarExtrato, apresentarVantagem } from "@/controllers/http/apresentacao.ts";
import { lerCorpo, respostaDeErro, responder } from "@/controllers/http/http.ts";
import type { SessaoJwt, VariaveisSessao } from "@/controllers/http/sessao-jwt.ts";

const dadosAluno = {
  nome: z.string(),
  email: z.email(),
  cpf: z.string(),
  rg: z.string(),
  endereco: z.string(),
  curso: z.string(),
  instituicaoId: z.number().int(),
};
const esquemaCadastro = z.object({ ...dadosAluno, login: z.string(), senha: z.string() });
const esquemaAtualizacao = z.object(dadosAluno);
const esquemaResgate = z.object({ vantagemId: z.number().int() });

type Servicos = Readonly<{
  aluno: ServicoAluno;
  extrato: ServicoExtrato;
  resgate: ServicoResgate;
  vantagem: ServicoVantagem;
}>;

export function criarAlunoController({ aluno, extrato, resgate, vantagem }: Servicos, sessao: SessaoJwt) {
  const app = new Hono<VariaveisSessao>();
  const somenteAluno = sessao.exigir("ALUNO");

  app.get("/instituicoes", async (c) => c.json(await aluno.listarInstituicoes()));

  app.post("/alunos", async (c) => {
    const corpo = await lerCorpo(c, esquemaCadastro);
    if (!corpo.ok) return respostaDeErro(c, corpo.erro);
    return responder(c, await aluno.cadastrar(corpo.valor), apresentarAluno, 201);
  });

  app.get("/aluno", somenteAluno, async (c) => responder(c, await aluno.consultar(c.get("sessaoId")), apresentarAluno));

  app.put("/aluno", somenteAluno, async (c) => {
    const corpo = await lerCorpo(c, esquemaAtualizacao);
    if (!corpo.ok) return respostaDeErro(c, corpo.erro);
    return responder(c, await aluno.atualizar(c.get("sessaoId"), corpo.valor), apresentarAluno);
  });

  app.delete("/aluno", somenteAluno, async (c) => {
    const excluido = await aluno.excluir(c.get("sessaoId"));
    return excluido.ok ? c.body(null, 204) : respostaDeErro(c, excluido.erro);
  });

  app.get("/aluno/extrato", somenteAluno, async (c) =>
    responder(c, await extrato.doAluno(c.get("sessaoId")), apresentarExtrato),
  );

  app.get("/aluno/vantagens", somenteAluno, async (c) => c.json((await vantagem.listarCatalogo()).map(apresentarVantagem)));

  app.post("/aluno/resgates", somenteAluno, async (c) => {
    const corpo = await lerCorpo(c, esquemaResgate);
    if (!corpo.ok) return respostaDeErro(c, corpo.erro);
    const trocado = await resgate.trocar(c.get("sessaoId"), corpo.valor.vantagemId);
    return responder(c, trocado, (r) => ({ id: r.id, codigo: r.codigo, valor: r.valor, saldo: r.aluno.saldo, vantagem: apresentarVantagem(r.vantagem) }), 201);
  });

  return app;
}
