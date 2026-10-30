import { describe, expect, test } from "bun:test";
import { criarServicoAluno } from "@/models/services/servico-aluno.ts";
import { criarServicoAutenticacao } from "@/models/services/servico-autenticacao.ts";
import { criarServicoCreditoSemestral } from "@/models/services/servico-credito-semestral.ts";
import { criarServicoEnvioMoedas } from "@/models/services/servico-envio-moedas.ts";
import { criarServicoResgate } from "@/models/services/servico-resgate.ts";
import { aluno, criarCenario, criarEmailEspiao, criarRegistroEspiao, hashFalso, professor, puc, verificarFalso } from "../support/cenario.ts";

const agora = () => new Date("2026-01-01T00:00:00Z");

function envio(falharEmail = false, parcial = {}) {
  const persistencia = criarCenario(parcial);
  const { email, chamadas } = criarEmailEspiao(falharEmail);
  const { registro, erros } = criarRegistroEspiao();
  return { persistencia, chamadas, erros, servico: criarServicoEnvioMoedas({ persistencia, email, registro, agora }) };
}

describe("envio de moedas", () => {
  test("dado saldo, quando envia, então saldos mudam, transação registrada e aluno notificado", async () => {
    const { servico, persistencia, chamadas } = envio();
    const r = await servico.enviar({ professorId: 20, alunoId: 10, valor: 300, motivo: "Ótimo" });
    const e = persistencia.estado();
    expect(r.ok).toBe(true);
    expect([e.professores[0]!.saldo, e.alunos[0]!.saldo, e.transacoes.length]).toEqual([700, 300, 1]);
    expect(chamadas).toEqual(["notificarRecebimentoMoedas"]);
  });
  test("dado saldo insuficiente, quando envia, então nada muda e não há email", async () => {
    const { servico, persistencia, chamadas } = envio();
    const r = await servico.enviar({ professorId: 20, alunoId: 10, valor: 2000, motivo: "x" });
    expect(!r.ok && r.erro.tipo).toBe("SALDO_INSUFICIENTE");
    expect([persistencia.estado().transacoes.length, chamadas.length]).toEqual([0, 0]);
  });
  test("dado falha do email após commit, então registra o erro e mantém a transação", async () => {
    const { servico, persistencia, erros } = envio(true);
    const r = await servico.enviar({ professorId: 20, alunoId: 10, valor: 50, motivo: "x" });
    expect(r.ok).toBe(true);
    expect([erros.length, persistencia.estado().transacoes.length]).toEqual([1, 1]);
  });
  test("dado falha na 2ª escrita, quando envia, então a 1ª reverte e não há email", async () => {
    const { servico, persistencia, chamadas } = envio();
    persistencia.repositorios.transacoes.registrarEnvio = async () => {
      throw new Error("disco");
    };
    await expect(servico.enviar({ professorId: 20, alunoId: 10, valor: 50, motivo: "x" })).rejects.toThrow();
    expect([persistencia.estado().professores[0]!.saldo, chamadas.length]).toEqual([1000, 0]);
  });
});

describe("resgate", () => {
  function criar(saldoAluno: number) {
    const persistencia = criarCenario({ aluno: { saldo: saldoAluno } });
    const { email, chamadas } = criarEmailEspiao();
    const { registro } = criarRegistroEspiao();
    const servico = criarServicoResgate({ persistencia, email, registro, agora, gerarCodigo: () => "ABC12345" });
    return { persistencia, chamadas, servico };
  }
  test("dado saldo, quando troca, então desconta, gera código e envia cupom e conferência", async () => {
    const { servico, persistencia, chamadas } = criar(150);
    const r = await servico.trocar(10, 40);
    expect(r.ok && r.valor.codigo).toBe("ABC12345");
    expect(persistencia.estado().alunos[0]!.saldo).toBe(50);
    expect(chamadas.sort()).toEqual(["enviarConferencia", "enviarCupom"]);
  });
  test("dado saldo insuficiente, quando troca, então erro e nenhum email", async () => {
    const { servico, chamadas, persistencia } = criar(10);
    const r = await servico.trocar(10, 40);
    expect(!r.ok && r.erro.tipo).toBe("SALDO_INSUFICIENTE");
    expect([chamadas.length, persistencia.estado().transacoes.length]).toEqual([0, 0]);
  });
});

test("dado dois professores, quando credita o semestre, então ambos ganham 1000", async () => {
  const persistencia = criarCenario();
  persistencia.estado().professores.push({ ...professor, id: 21, login: "p2", saldo: 5 });
  const n = await criarServicoCreditoSemestral({ persistencia }).creditar();
  expect([n, ...persistencia.estado().professores.map((p) => p.saldo)]).toEqual([2, 2000, 1005]);
});

describe("autenticação", () => {
  const servico = () => criarServicoAutenticacao({ persistencia: criarCenario(), verificarSenha: verificarFalso });
  test("dado credenciais corretas, então devolve o perfil", async () => {
    const r = await servico().autenticar("prof", "123");
    expect(r.ok && r.valor.perfil).toBe("PROFESSOR");
    const a = await servico().autenticar("aluno", "123");
    expect(a.ok && a.valor.perfil).toBe("ALUNO");
    const e = await servico().autenticar("emp", "123");
    expect(e.ok && e.valor.perfil).toBe("EMPRESA_PARCEIRA");
  });
  test("dado senha errada ou login inexistente, então CREDENCIAIS_INVALIDAS", async () => {
    for (const [l, s] of [["prof", "errada"], ["ninguem", "123"]] as const) {
      const r = await servico().autenticar(l, s);
      expect(!r.ok && r.erro.tipo).toBe("CREDENCIAIS_INVALIDAS");
    }
  });
});

describe("cadastro de aluno", () => {
  const entrada = {
    login: "novo", senha: "s", nome: "N", email: "n@x.com", cpf: "99999999999", rg: "8", endereco: "R", curso: "C", instituicaoId: puc.id,
  };
  const servico = () => criarServicoAluno({ persistencia: criarCenario(), gerarHashSenha: hashFalso });
  test("dado dados válidos, então cria com hash da senha", async () => {
    const r = await servico().cadastrar(entrada);
    expect(r.ok && r.valor.senhaHash).toBe("h:s");
    expect(r.ok && "senha" in r.valor).toBe(false);
  });
  test("dado login repetido, então CONFLITO", async () => {
    const r = await servico().cadastrar({ ...entrada, login: aluno.login });
    expect(!r.ok && r.erro.tipo).toBe("CONFLITO");
  });
  test("dado instituição inexistente, então VALIDACAO", async () => {
    const r = await servico().cadastrar({ ...entrada, instituicaoId: 999 });
    expect(!r.ok && r.erro.tipo).toBe("VALIDACAO");
  });
});
