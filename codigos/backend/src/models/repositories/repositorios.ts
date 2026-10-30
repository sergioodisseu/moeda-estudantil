import type { Aluno, DadosAluno } from "@/models/entities/aluno.ts";
import type { DadosEmpresaParceira, EmpresaParceira } from "@/models/entities/empresa-parceira.ts";
import type { InstituicaoEnsino } from "@/models/entities/instituicao-ensino.ts";
import type { Professor } from "@/models/entities/professor.ts";
import type { NovoEnvioMoedas, NovoResgate, EnvioMoedas, Resgate, Transacao } from "@/models/entities/transacao.ts";
import type { NovaVantagem, Vantagem } from "@/models/entities/vantagem.ts";

export type Credenciais = Readonly<{ login: string; senhaHash: string }>;

/** Lançado pela persistência quando o login já existe (login é único entre os três perfis). */
export class LoginEmUsoError extends Error {
  constructor() {
    super("Login já está em uso.");
  }
}

/** Lançado pela persistência quando o CPF já está cadastrado (cpf é único). */
export class CpfEmUsoError extends Error {
  constructor() {
    super("CPF já está cadastrado.");
  }
}

/** Lançado quando um texto excede o tamanho da coluna definido no modelo ER. */
export class ValorExcedeLimiteError extends Error {
  constructor() {
    super("Um dos campos excede o tamanho máximo permitido.");
  }
}

/** Lançado quando o saldo mudou entre a leitura e a escrita (concorrência otimista). */
export class SaldoDesatualizadoError extends Error {
  constructor() {
    super("O saldo foi alterado por outra operação. Tente novamente.");
  }
}

export interface AlunoRepository {
  criar(dados: DadosAluno & Credenciais): Promise<Aluno>;
  buscarPorId(id: number): Promise<Aluno | undefined>;
  buscarPorLogin(login: string): Promise<Aluno | undefined>;
  listarPorInstituicao(instituicaoId: number): Promise<readonly Aluno[]>;
  atualizar(id: number, dados: DadosAluno): Promise<Aluno>;
  atualizarSaldo(id: number, saldoAnterior: number, novoSaldo: number): Promise<void>;
  excluir(id: number): Promise<void>;
}

export interface ProfessorRepository {
  buscarPorId(id: number): Promise<Professor | undefined>;
  buscarPorLogin(login: string): Promise<Professor | undefined>;
  listar(): Promise<readonly Professor[]>;
  atualizarSaldo(id: number, saldoAnterior: number, novoSaldo: number): Promise<void>;
}

export interface EmpresaParceiraRepository {
  criar(dados: DadosEmpresaParceira & Credenciais): Promise<EmpresaParceira>;
  buscarPorId(id: number): Promise<EmpresaParceira | undefined>;
  buscarPorLogin(login: string): Promise<EmpresaParceira | undefined>;
  atualizar(id: number, dados: DadosEmpresaParceira): Promise<EmpresaParceira>;
  excluir(id: number): Promise<void>;
}

export interface InstituicaoEnsinoRepository {
  listar(): Promise<readonly InstituicaoEnsino[]>;
  buscarPorId(id: number): Promise<InstituicaoEnsino | undefined>;
}

export interface VantagemRepository {
  criar(vantagem: NovaVantagem): Promise<Vantagem>;
  listar(): Promise<readonly Vantagem[]>;
  listarPorEmpresa(empresaId: number): Promise<readonly Vantagem[]>;
  buscarPorId(id: number): Promise<Vantagem | undefined>;
}

export interface TransacaoRepository {
  registrarEnvio(envio: NovoEnvioMoedas): Promise<EnvioMoedas>;
  registrarResgate(resgate: NovoResgate): Promise<Resgate>;
  /** Recebimentos (EnvioMoedas) e trocas (Resgate) do aluno, da mais recente para a mais antiga. */
  listarPorAluno(alunoId: number): Promise<readonly Transacao[]>;
  /** Envios (EnvioMoedas) feitos pelo professor, do mais recente para o mais antigo. */
  listarPorProfessor(professorId: number): Promise<readonly EnvioMoedas[]>;
}

export type Repositorios = Readonly<{
  alunos: AlunoRepository;
  professores: ProfessorRepository;
  empresas: EmpresaParceiraRepository;
  instituicoes: InstituicaoEnsinoRepository;
  vantagens: VantagemRepository;
  transacoes: TransacaoRepository;
}>;

/** Várias escritas num único `executar` são atômicas: se algo lançar, tudo reverte. */
export interface UnidadeDeTrabalho {
  readonly repositorios: Repositorios;
  executar<T>(operacao: (repositorios: Repositorios) => Promise<T>): Promise<T>;
}
