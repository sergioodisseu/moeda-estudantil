import type { ClienteApi } from "./cliente-api.ts";
import { ErroApi } from "./cliente-api.ts";

const BASE = "/api";
const MENSAGEM_REDE = "Não foi possível se comunicar com o servidor.";

type Metodo = "GET" | "POST" | "PUT" | "DELETE";

export function criarClienteHttp(): ClienteApi {
  let token: string | undefined;

  async function requisitar<T>(metodo: Metodo, caminho: string, corpo?: unknown): Promise<T> {
    const resposta = await fetch(`${BASE}${caminho}`, {
      method: metodo,
      headers: {
        ...(corpo === undefined ? {} : { "Content-Type": "application/json" }),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: corpo === undefined ? undefined : JSON.stringify(corpo),
    }).catch(() => {
      throw new ErroApi(MENSAGEM_REDE);
    });
    if (!resposta.ok) {
      const erro = (await resposta.json().catch(() => undefined)) as { mensagem?: string } | undefined;
      throw new ErroApi(erro?.mensagem ?? MENSAGEM_REDE);
    }
    return resposta.status === 204 ? (undefined as T) : ((await resposta.json()) as T);
  }

  const semResposta = (metodo: Metodo, caminho: string, corpo?: unknown) =>
    requisitar<unknown>(metodo, caminho, corpo).then(() => undefined);

  return {
    definirToken: (novo) => {
      token = novo;
    },
    entrar: (login, senha) => requisitar("POST", "/auth/login", { login, senha }),
    listarInstituicoes: () => requisitar("GET", "/instituicoes"),

    cadastrarAluno: (dados) => semResposta("POST", "/alunos", dados),
    consultarAluno: () => requisitar("GET", "/aluno"),
    atualizarAluno: (dados) => requisitar("PUT", "/aluno", dados),
    excluirAluno: () => semResposta("DELETE", "/aluno"),
    consultarExtratoAluno: () => requisitar("GET", "/aluno/extrato"),
    listarVantagens: () => requisitar("GET", "/aluno/vantagens"),
    trocarPorVantagem: (vantagemId) => requisitar("POST", "/aluno/resgates", { vantagemId }),

    listarAlunosDoProfessor: () => requisitar("GET", "/professor/alunos"),
    enviarMoedas: (entrada) => requisitar("POST", "/professor/envios", entrada),
    consultarExtratoProfessor: () => requisitar("GET", "/professor/extrato"),

    cadastrarEmpresa: (dados) => semResposta("POST", "/empresas", dados),
    consultarEmpresa: () => requisitar("GET", "/empresa"),
    atualizarEmpresa: (dados) => requisitar("PUT", "/empresa", dados),
    excluirEmpresa: () => semResposta("DELETE", "/empresa"),
    listarVantagensDaEmpresa: () => requisitar("GET", "/empresa/vantagens"),
    cadastrarVantagem: (dados) => requisitar("POST", "/empresa/vantagens", dados),
  };
}
