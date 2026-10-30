import type {
  Aluno,
  AlunoResumo,
  CadastroAluno,
  CadastroEmpresa,
  DadosAluno,
  DadosEmpresa,
  DadosVantagem,
  Empresa,
  EntradaEnvio,
  EnvioRealizado,
  Extrato,
  Instituicao,
  ResgateRealizado,
  Sessao,
  Vantagem,
} from "../dominio/tipos.ts";

/** Falha esperada de negócio ou de comunicação, com mensagem pronta para o usuário. */
export class ErroApi extends Error {}

/** Porta da View para o backend: as telas dependem desta interface, não do transporte. */
export interface ClienteApi {
  definirToken(token: string | undefined): void;
  entrar(login: string, senha: string): Promise<Sessao & Readonly<{ token: string }>>;
  listarInstituicoes(): Promise<readonly Instituicao[]>;

  cadastrarAluno(dados: CadastroAluno): Promise<void>;
  consultarAluno(): Promise<Aluno>;
  atualizarAluno(dados: DadosAluno): Promise<Aluno>;
  excluirAluno(): Promise<void>;
  consultarExtratoAluno(): Promise<Extrato>;
  listarVantagens(): Promise<readonly Vantagem[]>;
  trocarPorVantagem(vantagemId: number): Promise<ResgateRealizado>;

  listarAlunosDoProfessor(): Promise<readonly AlunoResumo[]>;
  enviarMoedas(entrada: EntradaEnvio): Promise<EnvioRealizado>;
  consultarExtratoProfessor(): Promise<Extrato>;

  cadastrarEmpresa(dados: CadastroEmpresa): Promise<void>;
  consultarEmpresa(): Promise<Empresa>;
  atualizarEmpresa(dados: DadosEmpresa): Promise<Empresa>;
  excluirEmpresa(): Promise<void>;
  listarVantagensDaEmpresa(): Promise<readonly Vantagem[]>;
  cadastrarVantagem(dados: DadosVantagem): Promise<Vantagem>;
}
