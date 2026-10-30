import { describe, expect, test } from "bun:test";
import { resgatarVantagem, validarDadosAluno } from "@/models/entities/aluno.ts";
import { CREDITO_SEMESTRAL, creditarMoedasSemestrais, enviarMoedas } from "@/models/entities/professor.ts";
import { cadastrarVantagem } from "@/models/entities/vantagem.ts";
import { aluno, empresa, professor, ufmg, vantagem } from "../support/cenario.ts";

const erroDe = (r: { ok: boolean; erro?: { tipo: string } }) => (r.ok ? undefined : r.erro?.tipo);

describe("enviarMoedas", () => {
  test("dado saldo suficiente, quando envia, então debita professor e credita aluno", () => {
    const r = enviarMoedas(professor, aluno, 300, " Bom ");
    expect(r.ok && [r.valor.professor.saldo, r.valor.aluno.saldo, r.valor.motivo]).toEqual([700, 300, "Bom"]);
  });
  test("dado saldo insuficiente, quando envia, então SALDO_INSUFICIENTE", () => {
    expect(erroDe(enviarMoedas(professor, aluno, 1001, "x"))).toBe("SALDO_INSUFICIENTE");
  });
  test("dado motivo vazio, quando envia, então VALIDACAO", () => {
    expect(erroDe(enviarMoedas(professor, aluno, 10, "  "))).toBe("VALIDACAO");
  });
  test("dado aluno de outra instituição, quando envia, então VALIDACAO", () => {
    expect(erroDe(enviarMoedas(professor, { ...aluno, instituicao: ufmg }, 10, "x"))).toBe("VALIDACAO");
  });
  test("dado valor <= 0 ou fracionado, quando envia, então VALIDACAO", () => {
    for (const v of [0, -5, 1.5]) expect(erroDe(enviarMoedas(professor, aluno, v, "x"))).toBe("VALIDACAO");
  });
});

describe("resgatarVantagem", () => {
  test("dado saldo suficiente, quando resgata, então desconta o custo", () => {
    const r = resgatarVantagem({ ...aluno, saldo: 150 }, vantagem);
    expect(r.ok && r.valor.saldo).toBe(50);
  });
  test("dado saldo insuficiente, quando resgata, então SALDO_INSUFICIENTE", () => {
    expect(erroDe(resgatarVantagem({ ...aluno, saldo: 99 }, vantagem))).toBe("SALDO_INSUFICIENTE");
  });
});

test("dado saldo restante, quando credita semestre, então acumula 1000", () => {
  expect(creditarMoedasSemestrais({ ...professor, saldo: 250 }).saldo).toBe(250 + CREDITO_SEMESTRAL);
});

describe("cadastrarVantagem", () => {
  test("dado dados válidos, então vincula à empresa", () => {
    const r = cadastrarVantagem(empresa, { descricao: "d", foto: "f", custoEmMoedas: 5 });
    expect(r.ok && r.valor.empresa.id).toBe(empresa.id);
  });
  test("dado custo inválido ou descrição vazia, então VALIDACAO", () => {
    expect(erroDe(cadastrarVantagem(empresa, { descricao: "d", foto: "f", custoEmMoedas: 0 }))).toBe("VALIDACAO");
    expect(erroDe(cadastrarVantagem(empresa, { descricao: " ", foto: "f", custoEmMoedas: 5 }))).toBe("VALIDACAO");
  });
});

describe("validarDadosAluno", () => {
  const { id: _i, login: _l, senhaHash: _s, saldo: _sa, ...dados } = aluno;
  test("dado todos os campos, então sucesso", () => expect(validarDadosAluno(dados).ok).toBe(true));
  test("dado campo vazio ou CPF fora de 11 dígitos, então VALIDACAO", () => {
    expect(erroDe(validarDadosAluno({ ...dados, cpf: "" }))).toBe("VALIDACAO");
    expect(erroDe(validarDadosAluno({ ...dados, cpf: "123" }))).toBe("VALIDACAO");
  });
});
