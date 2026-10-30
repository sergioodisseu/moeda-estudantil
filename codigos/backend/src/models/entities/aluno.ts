import type { InstituicaoEnsino } from "@/models/entities/instituicao-ensino.ts";
import { falha, sucesso, type Resultado } from "@/models/shared/resultado.ts";
import type { Usuario } from "@/models/entities/usuario.ts";
import { cpfValido, exigirTextos } from "@/models/shared/validacao.ts";
import type { Vantagem } from "@/models/entities/vantagem.ts";

export type DadosTextuaisAluno = Readonly<{
  nome: string;
  email: string;
  cpf: string;
  rg: string;
  endereco: string;
  curso: string;
}>;

export type DadosAluno = DadosTextuaisAluno & Readonly<{ instituicao: InstituicaoEnsino }>;

export type Aluno = Usuario & DadosAluno & Readonly<{ saldo: number }>;

const ROTULOS: Readonly<Record<keyof DadosTextuaisAluno, string>> = {
  nome: "Nome",
  email: "Email",
  cpf: "CPF",
  rg: "RG",
  endereco: "Endereço",
  curso: "Curso",
};

export function validarDadosAluno(dados: DadosAluno): Resultado<DadosAluno> {
  const { instituicao, ...textuais } = dados;
  const validados = exigirTextos(textuais, ROTULOS);
  if (!validados.ok) return validados;
  if (!cpfValido(validados.valor.cpf)) return falha("VALIDACAO", "CPF deve ter 11 dígitos.");
  return sucesso({ ...validados.valor, instituicao });
}

export const receberMoedas = (aluno: Aluno, valor: number): Aluno => ({ ...aluno, saldo: aluno.saldo + valor });

export function resgatarVantagem(aluno: Aluno, vantagem: Vantagem): Resultado<Aluno> {
  if (aluno.saldo < vantagem.custoEmMoedas) return falha("SALDO_INSUFICIENTE", "Saldo insuficiente para resgatar esta vantagem.");
  return sucesso({ ...aluno, saldo: aluno.saldo - vantagem.custoEmMoedas });
}
