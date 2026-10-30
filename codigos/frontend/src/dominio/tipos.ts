/** Tipos da View: espelham o contrato JSON dos Controllers do backend. */
export type Perfil = "ALUNO" | "PROFESSOR" | "EMPRESA_PARCEIRA";

export type Sessao = Readonly<{ perfil: Perfil; nome: string }>;

export type Instituicao = Readonly<{ id: number; nome: string }>;

export type DadosAluno = Readonly<{
  nome: string;
  email: string;
  cpf: string;
  rg: string;
  endereco: string;
  curso: string;
  instituicaoId: number;
}>;

export type CadastroAluno = DadosAluno & Readonly<{ login: string; senha: string }>;

export type Aluno = Omit<DadosAluno, "instituicaoId"> &
  Readonly<{ id: number; login: string; saldo: number; instituicao: Instituicao }>;

export type AlunoResumo = Readonly<{ id: number; nome: string; curso: string }>;

export type DadosEmpresa = Readonly<{ nome: string; email: string }>;

export type CadastroEmpresa = DadosEmpresa & Readonly<{ login: string; senha: string }>;

export type Empresa = DadosEmpresa & Readonly<{ id: number; login: string }>;

export type DadosVantagem = Readonly<{ descricao: string; foto: string; custoEmMoedas: number }>;

export type Vantagem = DadosVantagem & Readonly<{ id: number; empresa: Readonly<{ id: number; nome: string }> }>;

type TransacaoBase = Readonly<{ id: number; dataHora: string; valor: number }>;

export type EnvioMoedas = TransacaoBase &
  Readonly<{
    tipo: "ENVIO_MOEDAS";
    motivo: string;
    professor: Readonly<{ id: number; nome: string }>;
    aluno: Readonly<{ id: number; nome: string }>;
  }>;

export type Resgate = TransacaoBase & Readonly<{ tipo: "RESGATE"; codigo: string; vantagem: Vantagem }>;

/** União discriminada: Transacao generalizada por EnvioMoedas e Resgate. */
export type Transacao = EnvioMoedas | Resgate;

export type Extrato = Readonly<{ saldo: number; transacoes: readonly Transacao[] }>;

export type EntradaEnvio = Readonly<{ alunoId: number; valor: number; motivo: string }>;

export type ResgateRealizado = Readonly<{ id: number; codigo: string; valor: number; saldo: number; vantagem: Vantagem }>;

export type EnvioRealizado = EnvioMoedas & Readonly<{ saldo: number }>;
