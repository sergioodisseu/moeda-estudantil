import type { Prisma } from "@/infrastructure/persistence/prisma/gerado/client.ts";
import type { Aluno } from "@/models/entities/aluno.ts";
import type { EmpresaParceira } from "@/models/entities/empresa-parceira.ts";
import type { Professor } from "@/models/entities/professor.ts";
import type { EnvioMoedas, Resgate, Transacao } from "@/models/entities/transacao.ts";
import type { Vantagem } from "@/models/entities/vantagem.ts";

export const incluirAluno = { credencial: true, instituicao: true } satisfies Prisma.AlunoInclude;
export const incluirProfessor = { credencial: true, instituicao: true } satisfies Prisma.ProfessorInclude;
export const incluirEmpresa = { credencial: true } satisfies Prisma.EmpresaParceiraInclude;
export const incluirVantagem = { empresa: { include: incluirEmpresa } } satisfies Prisma.VantagemInclude;
export const incluirEnvio = {
  transacao: true,
  professor: { include: incluirProfessor },
  aluno: { include: incluirAluno },
} satisfies Prisma.EnvioMoedasInclude;
export const incluirResgate = {
  transacao: true,
  aluno: { include: incluirAluno },
  vantagem: { include: incluirVantagem },
} satisfies Prisma.ResgateInclude;

type AlunoRow = Prisma.AlunoGetPayload<{ include: typeof incluirAluno }>;
type ProfessorRow = Prisma.ProfessorGetPayload<{ include: typeof incluirProfessor }>;
type EmpresaRow = Prisma.EmpresaParceiraGetPayload<{ include: typeof incluirEmpresa }>;
type VantagemRow = Prisma.VantagemGetPayload<{ include: typeof incluirVantagem }>;
type EnvioRow = Prisma.EnvioMoedasGetPayload<{ include: typeof incluirEnvio }>;
type ResgateRow = Prisma.ResgateGetPayload<{ include: typeof incluirResgate }>;

export const paraAluno = ({ credencial, credencialId: _credencial, instituicaoId: _instituicao, ...linha }: AlunoRow): Aluno => ({
  ...linha,
  login: credencial.login,
  senhaHash: credencial.senhaHash,
});

export const paraProfessor = ({ credencial, credencialId: _credencial, instituicaoId: _instituicao, ...linha }: ProfessorRow): Professor => ({
  ...linha,
  login: credencial.login,
  senhaHash: credencial.senhaHash,
});

export const paraEmpresa = ({ credencial, credencialId: _credencial, ...linha }: EmpresaRow): EmpresaParceira => ({
  ...linha,
  login: credencial.login,
  senhaHash: credencial.senhaHash,
});

export const paraVantagem = ({ empresa, empresaId: _, ...linha }: VantagemRow): Vantagem => ({
  ...linha,
  empresa: paraEmpresa(empresa),
});

export const paraEnvio = (linha: EnvioRow): EnvioMoedas => ({
  tipo: "ENVIO_MOEDAS",
  id: linha.transacaoId,
  dataHora: linha.transacao.dataHora,
  valor: linha.transacao.valor,
  motivo: linha.motivo,
  professor: paraProfessor(linha.professor),
  aluno: paraAluno(linha.aluno),
});

export const paraResgate = (linha: ResgateRow): Resgate => ({
  tipo: "RESGATE",
  id: linha.transacaoId,
  dataHora: linha.transacao.dataHora,
  valor: linha.transacao.valor,
  codigo: linha.codigo,
  aluno: paraAluno(linha.aluno),
  vantagem: paraVantagem(linha.vantagem),
});

export const maisRecentePrimeiro = (a: Transacao, b: Transacao): number => b.dataHora.getTime() - a.dataHora.getTime();
