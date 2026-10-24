import { Usuario } from "./Usuario";
import { InstituicaoEnsino } from "./InstituicaoEnsino";
import { Aluno } from "./Aluno";
import { Transacao, EnvioMoedas } from "./Transacao";
import { Result, ok, fail } from "../shared/Result";

export interface DadosProfessor {
  id: number;
  login: string;
  senhaHash: string;
  nome: string;
  cpf: string;
  departamento: string;
  instituicao: InstituicaoEnsino;
  saldo?: number;
  historico?: Transacao[];
}

export class Professor extends Usuario {
  private static readonly CREDITO_SEMESTRAL: number = 1000;
  private readonly nome: string;
  private readonly cpf: string;
  private readonly departamento: string;
  private readonly instituicao: InstituicaoEnsino;
  private saldo: number;
  private readonly historico: Transacao[];

  constructor(dados: DadosProfessor) {
    super(dados.id, dados.login, dados.senhaHash);
    const cpfLimpo = dados.cpf.replace(/\D/g, "");
    if (!dados.nome.trim() || cpfLimpo.length !== 11 || !dados.departamento.trim()) {
      throw new Error("Nome, CPF (11 dígitos) e departamento do professor são obrigatórios.");
    }
    if ((dados.saldo ?? 0) < 0) throw new Error("O saldo do professor não pode ser negativo.");
    this.nome = dados.nome.trim();
    this.cpf = cpfLimpo;
    this.departamento = dados.departamento.trim();
    this.instituicao = dados.instituicao;
    this.saldo = dados.saldo ?? 0;
    this.historico = [...(dados.historico ?? [])];
  }

  public enviarMoedas(aluno: Aluno, valor: number, motivo: string): Result<EnvioMoedas> {
    if (valor <= 0) return fail("A quantidade de moedas deve ser positiva.");
    if (!motivo || motivo.trim() === "") return fail("O motivo pelo qual o aluno está sendo reconhecido é obrigatório.");
    if (this.saldo < valor) return fail("Saldo insuficiente para enviar moedas.");
    this.saldo -= valor;
    aluno.receberMoedas(valor);
    const envio = new EnvioMoedas(0, new Date(), valor, motivo, this, aluno);
    this.historico.push(envio);
    return ok(envio);
  }

  public consultarExtrato(): Transacao[] {
    return [...this.historico];
  }

  public creditarMoedasSemestrais(): void {
    this.saldo += Professor.CREDITO_SEMESTRAL;
  }

  public exportarDados() {
    return Object.freeze({
      ...this.exportarCredencial(),
      nome: this.nome,
      cpf: this.cpf,
      departamento: this.departamento,
      saldo: this.saldo,
      instituicao: this.instituicao.exportarDados(),
    });
  }
}