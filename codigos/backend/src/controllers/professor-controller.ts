import { Hono } from "hono";
import { z } from "zod";
import type { ServicoEnvioMoedas } from "@/models/services/servico-envio-moedas.ts";
import type { ServicoExtrato } from "@/models/services/servico-extrato.ts";
import { apresentarExtrato, apresentarTransacao } from "@/controllers/http/apresentacao.ts";
import { lerCorpo, respostaDeErro, responder } from "@/controllers/http/http.ts";
import type { SessaoJwt, VariaveisSessao } from "@/controllers/http/sessao-jwt.ts";

const esquemaEnvio = z.object({ alunoId: z.number().int(), valor: z.number(), motivo: z.string() });

type Servicos = Readonly<{ envioMoedas: ServicoEnvioMoedas; extrato: ServicoExtrato }>;

export function criarProfessorController({ envioMoedas, extrato }: Servicos, sessao: SessaoJwt) {
  const app = new Hono<VariaveisSessao>();
  const somenteProfessor = sessao.exigir("PROFESSOR");

  app.get("/professor/alunos", somenteProfessor, async (c) =>
    responder(c, await envioMoedas.listarAlunosParaEnvio(c.get("sessaoId")), (alunos) =>
      alunos.map(({ id, nome, curso }) => ({ id, nome, curso })),
    ),
  );

  app.post("/professor/envios", somenteProfessor, async (c) => {
    const corpo = await lerCorpo(c, esquemaEnvio);
    if (!corpo.ok) return respostaDeErro(c, corpo.erro);
    const enviado = await envioMoedas.enviar({ professorId: c.get("sessaoId"), ...corpo.valor });
    return responder(c, enviado, (e) => ({ ...apresentarTransacao(e), saldo: e.professor.saldo }), 201);
  });

  app.get("/professor/extrato", somenteProfessor, async (c) =>
    responder(c, await extrato.doProfessor(c.get("sessaoId")), apresentarExtrato),
  );

  return app;
}
