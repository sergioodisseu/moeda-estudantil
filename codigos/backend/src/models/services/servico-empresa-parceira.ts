import { validarDadosEmpresa, type DadosEmpresaParceira, type EmpresaParceira } from "@/models/entities/empresa-parceira.ts";
import { falha, sucesso, type Resultado } from "@/models/shared/resultado.ts";
import type { UnidadeDeTrabalho } from "@/models/repositories/repositorios.ts";
import { comoResultado, naoEncontrado } from "@/models/services/apoio.ts";

export type EntradaCadastroEmpresa = DadosEmpresaParceira & Readonly<{ login: string; senha: string }>;

type Dependencias = Readonly<{ persistencia: UnidadeDeTrabalho; gerarHashSenha: (senha: string) => Promise<string> }>;

/** CRUD de empresa parceira (UC05–UC08). */
export function criarServicoEmpresaParceira({ persistencia, gerarHashSenha }: Dependencias) {
  const { empresas } = persistencia.repositorios;

  const cadastrar = (entrada: EntradaCadastroEmpresa): Promise<Resultado<EmpresaParceira>> =>
    comoResultado(async () => {
      const dados = validarDadosEmpresa({ nome: entrada.nome, email: entrada.email });
      if (!dados.ok) return dados;
      if (entrada.login.trim() === "" || entrada.senha === "") return falha("VALIDACAO", "Login e senha são obrigatórios.");
      const senhaHash = await gerarHashSenha(entrada.senha);
      return sucesso(await empresas.criar({ ...dados.valor, login: entrada.login.trim(), senhaHash }));
    });

  async function consultar(id: number): Promise<Resultado<EmpresaParceira>> {
    const empresa = await empresas.buscarPorId(id);
    return empresa ? sucesso(empresa) : naoEncontrado("Empresa parceira");
  }

  const atualizar = (id: number, entrada: DadosEmpresaParceira): Promise<Resultado<EmpresaParceira>> =>
    comoResultado(async () => {
      if (!(await empresas.buscarPorId(id))) return naoEncontrado("Empresa parceira");
      const dados = validarDadosEmpresa(entrada);
      return dados.ok ? sucesso(await empresas.atualizar(id, dados.valor)) : dados;
    });

  async function excluir(id: number): Promise<Resultado<null>> {
    if (!(await empresas.buscarPorId(id))) return naoEncontrado("Empresa parceira");
    await empresas.excluir(id);
    return sucesso(null);
  }

  return { cadastrar, consultar, atualizar, excluir };
}

export type ServicoEmpresaParceira = ReturnType<typeof criarServicoEmpresaParceira>;
