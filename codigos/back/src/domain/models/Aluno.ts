import { randomUUID } from "node:crypto";
import { Usuario } from "./Usuario";
import { InstituicaoEnsino } from "./InstituicaoEnsino";
import { Vantagem } from "./Vantagem";
import { Transacao, Resgate } from "./Transacao";
import { Result, ok, fail } from "../shared/Result";

const TAMANHO_CODIGO = 8;

export interface DadosAluno {
  id: number;
  login: string;
  senhaHash: string;
  nome: string;
  email: string;
  cpf: string;
  rg: string;
  endereco: string;
  curso: string;
  instituicao: InstituicaoEnsino;
  saldo?: number;
  historico?: Transacao[];
}

export class Aluno extends Usuario {
  private readonly nome: string;
  private readonly email: string;
  private readonly cpf: string;
  private readonly rg: string;
  private readonly endereco: string;
  private readonly curso: string;
  private readonly instituicao: InstituicaoEnsino;
  private saldo: number;
  private readonly historico: Transacao[];

  constructor(dados: DadosAluno) {
    super(dados.id, dados.login, dados.senhaHash);
    const cpfLimpo = dados.cpf.replace(/\D/g, "");
    if (!dados.nome.trim() || !dados.email.includes("@") || cpfLimpo.length !== 11 || !dados.rg.trim() || !dados.endereco.trim() || !dados.curso.trim()) {
      throw new Error("Todos os dados do aluno (nome, email, CPF de 11 dígitos, RG, endereço e curso) são obrigatórios.");
    }
    if ((dados.saldo ?? 0) < 0) throw new Error("O saldo do aluno não pode ser negativo.");
    this.nome = dados.nome.trim();
    this.email = dados.email.trim();
    this.cpf = cpfLimpo;
    this.rg = dados.rg.trim();
    this.endereco = dados.endereco.trim();
    this.curso = dados.curso.trim();
    this.instituicao = dados.instituicao;
    this.saldo = dados.saldo ?? 0;
    this.historico = [...(dados.historico ?? [])];
  }

  public receberMoedas(valor: number): void {
    if (valor <= 0) throw new Error("O valor recebido deve ser positivo.");
    this.saldo += valor;
  }

  public resgatarVantagem(vantagem: Vantagem): Result<Resgate> {
    const { custoEmMoedas } = vantagem.exportarDados();
    if (this.saldo < custoEmMoedas) {
      return fail("Saldo insuficiente para realizar a troca pela vantagem selecionada.");
    }
    this.saldo -= custoEmMoedas;
    const codigo = randomUUID().slice(0, TAMANHO_CODIGO).toUpperCase();
    const resgate = new Resgate(0, new Date(), custoEmMoedas, codigo, this, vantagem);
    this.historico.push(resgate);
    return ok(resgate);
  }

  public consultarExtrato(): Transacao[] {
    return [...this.historico];
  }

  public exportarDados() {
    return Object.freeze({
      ...this.exportarCredencial(),
      nome: this.nome,
      email: this.email,
      cpf: this.cpf,
      rg: this.rg,
      endereco: this.endereco,
      curso: this.curso,
      saldo: this.saldo,
      instituicao: this.instituicao.exportarDados(),
    });
  }
}