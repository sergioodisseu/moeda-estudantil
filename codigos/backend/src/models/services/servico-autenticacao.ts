import { autenticar, type VerificarSenha } from "@/models/entities/usuario.ts";
import { falha, sucesso, type Resultado } from "@/models/shared/resultado.ts";
import type { UnidadeDeTrabalho } from "@/models/repositories/repositorios.ts";

export type Perfil = "ALUNO" | "PROFESSOR" | "EMPRESA_PARCEIRA";

export type Sessao = Readonly<{ id: number; perfil: Perfil; nome: string }>;

type Dependencias = Readonly<{ persistencia: UnidadeDeTrabalho; verificarSenha: VerificarSenha }>;

export function criarServicoAutenticacao({ persistencia, verificarSenha }: Dependencias) {
  const { alunos, professores, empresas } = persistencia.repositorios;

  async function localizar(login: string) {
    const aluno = await alunos.buscarPorLogin(login);
    if (aluno) return { perfil: "ALUNO" as const, usuario: aluno };
    const professor = await professores.buscarPorLogin(login);
    if (professor) return { perfil: "PROFESSOR" as const, usuario: professor };
    const empresa = await empresas.buscarPorLogin(login);
    return empresa ? { perfil: "EMPRESA_PARCEIRA" as const, usuario: empresa } : undefined;
  }

  async function autenticarUsuario(login: string, senha: string): Promise<Resultado<Sessao>> {
    const encontrado = await localizar(login);
    const credenciaisValidas = encontrado !== undefined && (await autenticar(encontrado.usuario, login, senha, verificarSenha));
    if (!encontrado || !credenciaisValidas) return falha("CREDENCIAIS_INVALIDAS", "Login ou senha inválidos.");
    return sucesso({ id: encontrado.usuario.id, perfil: encontrado.perfil, nome: encontrado.usuario.nome });
  }

  return { autenticar: autenticarUsuario };
}

export type ServicoAutenticacao = ReturnType<typeof criarServicoAutenticacao>;
