import type { Aluno } from "@/models/entities/aluno.ts";
import type { EmpresaParceira } from "@/models/entities/empresa-parceira.ts";
import type { InstituicaoEnsino } from "@/models/entities/instituicao-ensino.ts";
import type { Professor } from "@/models/entities/professor.ts";
import type { Transacao } from "@/models/entities/transacao.ts";
import type { Vantagem } from "@/models/entities/vantagem.ts";
import {
  LoginEmUsoError,
  type Repositorios,
  type UnidadeDeTrabalho,
} from "@/models/repositories/repositorios.ts";

type Estado = {
  instituicoes: InstituicaoEnsino[];
  alunos: Aluno[];
  professores: Professor[];
  empresas: EmpresaParceira[];
  vantagens: Vantagem[];
  transacoes: Transacao[];
  proximoId: number;
};

const copiar = (e: Estado): Estado => structuredClone(e);

const loginUsado = (e: Estado, login: string) =>
  [...e.alunos, ...e.professores, ...e.empresas].some((u) => u.login === login);

function montar(estado: () => Estado): Repositorios {
  const novoId = () => estado().proximoId++;
  const trocar = <T extends { id: number }>(lista: T[], id: number, f: (x: T) => T) => {
    const i = lista.findIndex((x) => x.id === id);
    lista[i] = f(lista[i]!);
    return lista[i]!;
  };
  const saldo = <T extends { id: number; saldo: number }>(lista: T[], id: number, anterior: number, novo: number) => {
    const item = lista.find((x) => x.id === id);
    if (!item || item.saldo !== anterior) throw new Error("saldo desatualizado");
    item.saldo = novo;
  };
  return {
    instituicoes: {
      listar: async () => estado().instituicoes,
      buscarPorId: async (id) => estado().instituicoes.find((i) => i.id === id),
    },
    alunos: {
      criar: async ({ login, senhaHash, ...dados }) => {
        if (loginUsado(estado(), login)) throw new LoginEmUsoError();
        const aluno: Aluno = { id: novoId(), login, senhaHash, saldo: 0, ...dados };
        estado().alunos.push(aluno);
        return aluno;
      },
      buscarPorId: async (id) => estado().alunos.find((a) => a.id === id),
      buscarPorLogin: async (login) => estado().alunos.find((a) => a.login === login),
      listarPorInstituicao: async (id) => estado().alunos.filter((a) => a.instituicao.id === id),
      atualizar: async (id, dados) => trocar(estado().alunos, id, (a) => ({ ...a, ...dados })),
      atualizarSaldo: async (id, anterior, novo) => saldo(estado().alunos, id, anterior, novo),
      excluir: async (id) => {
        estado().alunos = estado().alunos.filter((a) => a.id !== id);
      },
    },
    professores: {
      buscarPorId: async (id) => estado().professores.find((p) => p.id === id),
      buscarPorLogin: async (login) => estado().professores.find((p) => p.login === login),
      listar: async () => estado().professores,
      atualizarSaldo: async (id, anterior, novo) => saldo(estado().professores, id, anterior, novo),
    },
    empresas: {
      criar: async ({ login, senhaHash, ...dados }) => {
        if (loginUsado(estado(), login)) throw new LoginEmUsoError();
        const empresa: EmpresaParceira = { id: novoId(), login, senhaHash, ...dados };
        estado().empresas.push(empresa);
        return empresa;
      },
      buscarPorId: async (id) => estado().empresas.find((e) => e.id === id),
      buscarPorLogin: async (login) => estado().empresas.find((e) => e.login === login),
      atualizar: async (id, dados) => trocar(estado().empresas, id, (e) => ({ ...e, ...dados })),
      excluir: async (id) => {
        estado().empresas = estado().empresas.filter((e) => e.id !== id);
      },
    },
    vantagens: {
      criar: async (nova) => {
        const v: Vantagem = { ...nova, id: novoId() };
        estado().vantagens.push(v);
        return v;
      },
      listar: async () => estado().vantagens,
      listarPorEmpresa: async (id) => estado().vantagens.filter((v) => v.empresa.id === id),
      buscarPorId: async (id) => estado().vantagens.find((v) => v.id === id),
    },
    transacoes: {
      registrarEnvio: async (envio) => {
        const t = { ...envio, id: novoId() };
        estado().transacoes.push(t);
        return t;
      },
      registrarResgate: async (resgate) => {
        const t = { ...resgate, id: novoId() };
        estado().transacoes.push(t);
        return t;
      },
      listarPorAluno: async (id) => estado().transacoes.filter((t) => t.aluno.id === id),
      listarPorProfessor: async (id) =>
        estado().transacoes.filter((t): t is Extract<Transacao, { tipo: "ENVIO_MOEDAS" }> => t.tipo === "ENVIO_MOEDAS" && t.professor.id === id),
    },
  };
}

/** Unidade de trabalho fake: `executar` restaura o estado se a operação lançar (atomicidade). */
export function criarUnidadeEmMemoria(inicial: Partial<Estado> = {}): UnidadeDeTrabalho & { estado: () => Estado } {
  let atual: Estado = {
    instituicoes: [],
    alunos: [],
    professores: [],
    empresas: [],
    vantagens: [],
    transacoes: [],
    proximoId: 100,
    ...inicial,
  };
  const repositorios = montar(() => atual);
  return {
    repositorios,
    estado: () => atual,
    async executar(operacao) {
      const snapshot = copiar(atual);
      try {
        return await operacao(repositorios);
      } catch (erro) {
        atual = snapshot;
        throw erro;
      }
    },
  };
}
