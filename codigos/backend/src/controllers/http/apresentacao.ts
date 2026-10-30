import type { Aluno } from "@/models/entities/aluno.ts";
import type { EmpresaParceira } from "@/models/entities/empresa-parceira.ts";
import type { Transacao } from "@/models/entities/transacao.ts";
import type { Vantagem } from "@/models/entities/vantagem.ts";
import type { Extrato } from "@/models/services/servico-extrato.ts";

/** Representações enviadas à View: nunca expõem senhaHash. */
export const apresentarAluno = (a: Aluno) => ({
  id: a.id,
  login: a.login,
  nome: a.nome,
  email: a.email,
  cpf: a.cpf,
  rg: a.rg,
  endereco: a.endereco,
  curso: a.curso,
  saldo: a.saldo,
  instituicao: a.instituicao,
});

export const apresentarEmpresa = (e: EmpresaParceira) => ({ id: e.id, login: e.login, nome: e.nome, email: e.email });

export const apresentarVantagem = (v: Vantagem) => ({
  id: v.id,
  descricao: v.descricao,
  foto: v.foto,
  custoEmMoedas: v.custoEmMoedas,
  empresa: { id: v.empresa.id, nome: v.empresa.nome },
});

export const apresentarTransacao = (t: Transacao) =>
  t.tipo === "ENVIO_MOEDAS"
    ? {
        tipo: t.tipo,
        id: t.id,
        dataHora: t.dataHora,
        valor: t.valor,
        motivo: t.motivo,
        professor: { id: t.professor.id, nome: t.professor.nome },
        aluno: { id: t.aluno.id, nome: t.aluno.nome },
      }
    : {
        tipo: t.tipo,
        id: t.id,
        dataHora: t.dataHora,
        valor: t.valor,
        codigo: t.codigo,
        vantagem: apresentarVantagem(t.vantagem),
      };

export const apresentarExtrato = (e: Extrato) => ({ saldo: e.saldo, transacoes: e.transacoes.map(apresentarTransacao) });
