import type { Aluno } from "@/models/entities/aluno.ts";
import type { EmpresaParceira } from "@/models/entities/empresa-parceira.ts";
import type { Professor } from "@/models/entities/professor.ts";
import type { Vantagem } from "@/models/entities/vantagem.ts";
import type { ServicoEmail } from "@/models/gateways/servico-email.ts";
import { criarUnidadeEmMemoria } from "./repositorios-em-memoria.ts";

export const puc = { id: 1, nome: "PUC Minas" };
export const ufmg = { id: 2, nome: "UFMG" };

export const aluno: Aluno = {
  id: 10, login: "aluno", senhaHash: "h:123", nome: "Ana", email: "ana@x.com", cpf: "11111111111", rg: "2",
  endereco: "Rua A", curso: "ES", instituicao: puc, saldo: 0,
};
export const professor: Professor = {
  id: 20, login: "prof", senhaHash: "h:123", nome: "Milena", cpf: "33333333333", departamento: "ES", saldo: 1000, instituicao: puc,
};
export const empresa: EmpresaParceira = { id: 30, login: "emp", senhaHash: "h:123", nome: "RU", email: "ru@x.com" };
export const vantagem: Vantagem = { id: 40, descricao: "Almoço", foto: "f.png", custoEmMoedas: 100, empresa };

export const criarCenario = (parcial: { aluno?: Partial<Aluno>; professor?: Partial<Professor> } = {}) =>
  criarUnidadeEmMemoria({
    instituicoes: [puc, ufmg],
    alunos: [{ ...aluno, ...parcial.aluno }],
    professores: [{ ...professor, ...parcial.professor }],
    empresas: [empresa],
    vantagens: [vantagem],
  });

export function criarEmailEspiao(falhar = false) {
  const chamadas: string[] = [];
  const registrar = (nome: string) => async () => {
    chamadas.push(nome);
    if (falhar) throw new Error("smtp fora");
  };
  const email: ServicoEmail = {
    notificarRecebimentoMoedas: registrar("notificarRecebimentoMoedas"),
    enviarCupom: registrar("enviarCupom"),
    enviarConferencia: registrar("enviarConferencia"),
  };
  return { email, chamadas };
}

export const criarRegistroEspiao = () => {
  const erros: string[] = [];
  return { registro: { erro: (m: string) => void erros.push(m) }, erros };
};

export const hashFalso = async (s: string) => `h:${s}`;
export const verificarFalso = async (s: string, h: string) => h === `h:${s}`;
