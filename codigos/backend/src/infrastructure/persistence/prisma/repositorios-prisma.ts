import { CpfEmUsoError, LoginEmUsoError, SaldoDesatualizadoError, ValorExcedeLimiteError } from "@/models/repositories/repositorios.ts";
import type {
  AlunoRepository,
  EmpresaParceiraRepository,
  InstituicaoEnsinoRepository,
  ProfessorRepository,
  TransacaoRepository,
  VantagemRepository,
} from "@/models/repositories/repositorios.ts";
import { excedeuTamanhoDaColuna, indiceUnicoViolado, type ClienteTransacional } from "@/infrastructure/persistence/prisma/cliente-prisma.ts";
import {
  incluirAluno,
  incluirEmpresa,
  incluirEnvio,
  incluirProfessor,
  incluirResgate,
  incluirVantagem,
  maisRecentePrimeiro,
  paraAluno,
  paraEmpresa,
  paraEnvio,
  paraProfessor,
  paraResgate,
  paraVantagem,
} from "@/infrastructure/persistence/prisma/mapeadores.ts";

/** Traduz violações do modelo ER (login/cpf únicos, tamanho das colunas) em erros do Model. */
async function traduzindoErrosDeEscrita<T>(operacao: () => Promise<T>): Promise<T> {
  try {
    return await operacao();
  } catch (erro) {
    const indice = indiceUnicoViolado(erro);
    if (indice?.includes("login")) throw new LoginEmUsoError();
    if (indice?.includes("cpf")) throw new CpfEmUsoError();
    if (excedeuTamanhoDaColuna(erro)) throw new ValorExcedeLimiteError();
    throw erro;
  }
}

/** Atualização condicionada ao saldo lido (controle otimista de concorrência). */
async function atualizarSaldoSeInalterado(
  atualizar: (saldoAnterior: number, novoSaldo: number) => Promise<{ count: number }>,
  saldoAnterior: number,
  novoSaldo: number,
): Promise<void> {
  const { count } = await atualizar(saldoAnterior, novoSaldo);
  if (count === 0) throw new SaldoDesatualizadoError();
}

export const criarAlunoRepository = (db: ClienteTransacional): AlunoRepository => ({
  criar: ({ login, senhaHash, instituicao, ...dados }) =>
    traduzindoErrosDeEscrita(async () => {
      const criado = await db.credencial.create({
        data: { login, senhaHash, aluno: { create: { ...dados, instituicaoId: instituicao.id } } },
        include: { aluno: { include: incluirAluno } },
      });
      return paraAluno(criado.aluno!);
    }),
  buscarPorId: async (id) => {
    const linha = await db.aluno.findUnique({ where: { id }, include: incluirAluno });
    return linha ? paraAluno(linha) : undefined;
  },
  buscarPorLogin: async (login) => {
    const linha = await db.aluno.findFirst({ where: { credencial: { login } }, include: incluirAluno });
    return linha ? paraAluno(linha) : undefined;
  },
  listarPorInstituicao: async (instituicaoId) =>
    (await db.aluno.findMany({ where: { instituicaoId }, include: incluirAluno, orderBy: { nome: "asc" } })).map(paraAluno),
  atualizar: (id, { instituicao, ...dados }) =>
    traduzindoErrosDeEscrita(async () =>
      paraAluno(await db.aluno.update({ where: { id }, data: { ...dados, instituicaoId: instituicao.id }, include: incluirAluno })),
    ),
  atualizarSaldo: (id, saldoAnterior, novoSaldo) =>
    atualizarSaldoSeInalterado(
      (anterior, novo) => db.aluno.updateMany({ where: { id, saldo: anterior }, data: { saldo: novo } }),
      saldoAnterior,
      novoSaldo,
    ),
  excluir: async (id) => {
    await db.transacao.deleteMany({ where: { OR: [{ envio: { alunoId: id } }, { resgate: { alunoId: id } }] } });
    await db.credencial.deleteMany({ where: { aluno: { id } } });
  },
});

export const criarProfessorRepository = (db: ClienteTransacional): ProfessorRepository => ({
  buscarPorId: async (id) => {
    const linha = await db.professor.findUnique({ where: { id }, include: incluirProfessor });
    return linha ? paraProfessor(linha) : undefined;
  },
  buscarPorLogin: async (login) => {
    const linha = await db.professor.findFirst({ where: { credencial: { login } }, include: incluirProfessor });
    return linha ? paraProfessor(linha) : undefined;
  },
  listar: async () => (await db.professor.findMany({ include: incluirProfessor, orderBy: { id: "asc" } })).map(paraProfessor),
  atualizarSaldo: (id, saldoAnterior, novoSaldo) =>
    atualizarSaldoSeInalterado(
      (anterior, novo) => db.professor.updateMany({ where: { id, saldo: anterior }, data: { saldo: novo } }),
      saldoAnterior,
      novoSaldo,
    ),
});

export const criarEmpresaParceiraRepository = (db: ClienteTransacional): EmpresaParceiraRepository => ({
  criar: ({ login, senhaHash, ...dados }) =>
    traduzindoErrosDeEscrita(async () => {
      const criado = await db.credencial.create({
        data: { login, senhaHash, empresa: { create: dados } },
        include: { empresa: { include: incluirEmpresa } },
      });
      return paraEmpresa(criado.empresa!);
    }),
  buscarPorId: async (id) => {
    const linha = await db.empresaParceira.findUnique({ where: { id }, include: incluirEmpresa });
    return linha ? paraEmpresa(linha) : undefined;
  },
  buscarPorLogin: async (login) => {
    const linha = await db.empresaParceira.findFirst({ where: { credencial: { login } }, include: incluirEmpresa });
    return linha ? paraEmpresa(linha) : undefined;
  },
  atualizar: (id, dados) =>
    traduzindoErrosDeEscrita(async () => paraEmpresa(await db.empresaParceira.update({ where: { id }, data: dados, include: incluirEmpresa }))),
  excluir: async (id) => {
    await db.transacao.deleteMany({ where: { resgate: { vantagem: { empresaId: id } } } });
    await db.credencial.deleteMany({ where: { empresa: { id } } });
  },
});

export const criarInstituicaoEnsinoRepository = (db: ClienteTransacional): InstituicaoEnsinoRepository => ({
  listar: () => db.instituicaoEnsino.findMany({ orderBy: { nome: "asc" } }),
  buscarPorId: async (id) => (await db.instituicaoEnsino.findUnique({ where: { id } })) ?? undefined,
});

export const criarVantagemRepository = (db: ClienteTransacional): VantagemRepository => ({
  criar: ({ empresa, ...dados }) =>
    traduzindoErrosDeEscrita(async () =>
      paraVantagem(await db.vantagem.create({ data: { ...dados, empresaId: empresa.id }, include: incluirVantagem })),
    ),
  listar: async () => (await db.vantagem.findMany({ include: incluirVantagem, orderBy: { id: "asc" } })).map(paraVantagem),
  listarPorEmpresa: async (empresaId) =>
    (await db.vantagem.findMany({ where: { empresaId }, include: incluirVantagem, orderBy: { id: "asc" } })).map(paraVantagem),
  buscarPorId: async (id) => {
    const linha = await db.vantagem.findUnique({ where: { id }, include: incluirVantagem });
    return linha ? paraVantagem(linha) : undefined;
  },
});

export const criarTransacaoRepository = (db: ClienteTransacional): TransacaoRepository => ({
  registrarEnvio: (envio) =>
    traduzindoErrosDeEscrita(async () => {
      const criado = await db.transacao.create({
        data: {
          dataHora: envio.dataHora,
          valor: envio.valor,
          envio: { create: { motivo: envio.motivo, professorId: envio.professor.id, alunoId: envio.aluno.id } },
        },
      });
      return { ...envio, id: criado.id };
    }),
  registrarResgate: async (resgate) => {
    const criado = await db.transacao.create({
      data: {
        dataHora: resgate.dataHora,
        valor: resgate.valor,
        resgate: { create: { codigo: resgate.codigo, alunoId: resgate.aluno.id, vantagemId: resgate.vantagem.id } },
      },
    });
    return { ...resgate, id: criado.id };
  },
  listarPorAluno: async (alunoId) => {
    const [envios, resgates] = await Promise.all([
      db.envioMoedas.findMany({ where: { alunoId }, include: incluirEnvio }),
      db.resgate.findMany({ where: { alunoId }, include: incluirResgate }),
    ]);
    return [...envios.map(paraEnvio), ...resgates.map(paraResgate)].sort(maisRecentePrimeiro);
  },
  listarPorProfessor: async (professorId) =>
    (await db.envioMoedas.findMany({ where: { professorId }, include: incluirEnvio, orderBy: { transacao: { dataHora: "desc" } } })).map(
      paraEnvio,
    ),
});
