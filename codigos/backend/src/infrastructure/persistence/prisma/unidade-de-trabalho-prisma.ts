import type { Repositorios, UnidadeDeTrabalho } from "@/models/repositories/repositorios.ts";
import type { ClientePrisma, ClienteTransacional } from "@/infrastructure/persistence/prisma/cliente-prisma.ts";
import {
  criarAlunoRepository,
  criarEmpresaParceiraRepository,
  criarInstituicaoEnsinoRepository,
  criarProfessorRepository,
  criarTransacaoRepository,
  criarVantagemRepository,
} from "@/infrastructure/persistence/prisma/repositorios-prisma.ts";

const montarRepositorios = (db: ClienteTransacional): Repositorios => ({
  alunos: criarAlunoRepository(db),
  professores: criarProfessorRepository(db),
  empresas: criarEmpresaParceiraRepository(db),
  instituicoes: criarInstituicaoEnsinoRepository(db),
  vantagens: criarVantagemRepository(db),
  transacoes: criarTransacaoRepository(db),
});

export const criarUnidadeDeTrabalhoPrisma = (prisma: ClientePrisma): UnidadeDeTrabalho => ({
  repositorios: montarRepositorios(prisma),
  executar: (operacao) => prisma.$transaction((tx) => operacao(montarRepositorios(tx))),
});
