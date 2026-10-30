import type { Aluno } from "@/models/entities/aluno.ts";
import { validarDadosAluno } from "@/models/entities/aluno.ts";
import type { InstituicaoEnsino } from "@/models/entities/instituicao-ensino.ts";
import { falha, sucesso, type Resultado } from "@/models/shared/resultado.ts";
import type { UnidadeDeTrabalho } from "@/models/repositories/repositorios.ts";
import { comoResultado, naoEncontrado } from "@/models/services/apoio.ts";

export type EntradaAluno = Readonly<{
  nome: string;
  email: string;
  cpf: string;
  rg: string;
  endereco: string;
  curso: string;
  instituicaoId: number;
}>;

export type EntradaCadastroAluno = EntradaAluno & Readonly<{ login: string; senha: string }>;

type Dependencias = Readonly<{ persistencia: UnidadeDeTrabalho; gerarHashSenha: (senha: string) => Promise<string> }>;

/** CRUD de aluno (UC01–UC04) e listagem de instituições pré-cadastradas para a seleção do UC01. */
export function criarServicoAluno({ persistencia, gerarHashSenha }: Dependencias) {
  const { alunos, instituicoes } = persistencia.repositorios;

  async function validarEntrada(entrada: EntradaAluno) {
    const instituicao = await instituicoes.buscarPorId(entrada.instituicaoId);
    if (!instituicao) return falha("VALIDACAO", "Instituição de ensino inexistente.");
    const { instituicaoId: _, ...textuais } = entrada;
    return validarDadosAluno({ ...textuais, instituicao });
  }

  const cadastrar = (entrada: EntradaCadastroAluno): Promise<Resultado<Aluno>> =>
    comoResultado(async () => {
      const { login, senha, ...dadosEntrada } = entrada;
      const dados = await validarEntrada(dadosEntrada);
      if (!dados.ok) return dados;
      if (login.trim() === "" || senha === "") return falha("VALIDACAO", "Login e senha são obrigatórios.");
      const senhaHash = await gerarHashSenha(senha);
      return sucesso(await alunos.criar({ ...dados.valor, login: login.trim(), senhaHash }));
    });

  async function consultar(id: number): Promise<Resultado<Aluno>> {
    const aluno = await alunos.buscarPorId(id);
    return aluno ? sucesso(aluno) : naoEncontrado("Aluno");
  }

  const atualizar = (id: number, entrada: EntradaAluno): Promise<Resultado<Aluno>> =>
    comoResultado(async () => {
      if (!(await alunos.buscarPorId(id))) return naoEncontrado("Aluno");
      const dados = await validarEntrada(entrada);
      return dados.ok ? sucesso(await alunos.atualizar(id, dados.valor)) : dados;
    });

  async function excluir(id: number): Promise<Resultado<null>> {
    if (!(await alunos.buscarPorId(id))) return naoEncontrado("Aluno");
    await alunos.excluir(id);
    return sucesso(null);
  }

  const listarInstituicoes = (): Promise<readonly InstituicaoEnsino[]> => instituicoes.listar();

  return { cadastrar, consultar, atualizar, excluir, listarInstituicoes };
}

export type ServicoAluno = ReturnType<typeof criarServicoAluno>;
