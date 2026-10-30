import { Hono } from "hono";
import { criarAlunoController } from "@/controllers/aluno-controller.ts";
import { criarAutenticacaoController } from "@/controllers/autenticacao-controller.ts";
import { criarSessaoJwt } from "@/controllers/http/sessao-jwt.ts";
import { criarEmpresaParceiraController } from "@/controllers/empresa-parceira-controller.ts";
import { criarProfessorController } from "@/controllers/professor-controller.ts";
import type { VerificarSenha } from "@/models/entities/usuario.ts";
import type { UnidadeDeTrabalho } from "@/models/repositories/repositorios.ts";
import type { Registro, ServicoEmail } from "@/models/gateways/servico-email.ts";
import { criarServicoAluno } from "@/models/services/servico-aluno.ts";
import { criarServicoAutenticacao } from "@/models/services/servico-autenticacao.ts";
import { criarServicoCreditoSemestral } from "@/models/services/servico-credito-semestral.ts";
import { criarServicoEmpresaParceira } from "@/models/services/servico-empresa-parceira.ts";
import { criarServicoEnvioMoedas } from "@/models/services/servico-envio-moedas.ts";
import { criarServicoExtrato } from "@/models/services/servico-extrato.ts";
import { criarServicoResgate } from "@/models/services/servico-resgate.ts";
import { criarServicoVantagem } from "@/models/services/servico-vantagem.ts";

export type DependenciasExternas = Readonly<{
  persistencia: UnidadeDeTrabalho;
  email: ServicoEmail;
  registro: Registro;
  segredoJwt: string;
  verificarSenha: VerificarSenha;
  gerarHashSenha: (senha: string) => Promise<string>;
  gerarCodigo: () => string;
  agora: () => Date;
}>;

/** Injeta as dependências nos casos de uso (Model). */
export function criarServicos(d: DependenciasExternas) {
  const { persistencia, email, registro, agora, gerarHashSenha } = d;
  return {
    autenticacao: criarServicoAutenticacao({ persistencia, verificarSenha: d.verificarSenha }),
    aluno: criarServicoAluno({ persistencia, gerarHashSenha }),
    empresa: criarServicoEmpresaParceira({ persistencia, gerarHashSenha }),
    vantagem: criarServicoVantagem({ persistencia }),
    envioMoedas: criarServicoEnvioMoedas({ persistencia, email, registro, agora }),
    extrato: criarServicoExtrato({ persistencia }),
    resgate: criarServicoResgate({ persistencia, email, registro, agora, gerarCodigo: d.gerarCodigo }),
    creditoSemestral: criarServicoCreditoSemestral({ persistencia }),
  };
}

export type Servicos = ReturnType<typeof criarServicos>;

/** Monta os Controllers (um por perfil + autenticação) sob a mesma aplicação HTTP. */
export function criarApp(servicos: Servicos, segredoJwt: string) {
  const sessao = criarSessaoJwt(segredoJwt);
  return new Hono()
    .route("/", criarAutenticacaoController(servicos.autenticacao, sessao))
    .route("/", criarAlunoController(servicos, sessao))
    .route("/", criarProfessorController(servicos, sessao))
    .route("/", criarEmpresaParceiraController(servicos, sessao));
}
