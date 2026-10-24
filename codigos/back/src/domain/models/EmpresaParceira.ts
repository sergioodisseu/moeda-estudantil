import { Usuario } from "./Usuario";
import { Vantagem } from "./Vantagem";
import { Result, ok, fail } from "../shared/Result";

export interface DadosEmpresaParceira {
  id: number;
  login: string;
  senhaHash: string;
  nome: string;
  email: string;
}

export class EmpresaParceira extends Usuario {
  private readonly nome: string;
  private readonly email: string;

  constructor(dados: DadosEmpresaParceira) {
    super(dados.id, dados.login, dados.senhaHash);
    if (!dados.nome || dados.nome.trim() === "") throw new Error("O nome da empresa parceira é obrigatório.");
    if (!dados.email || !dados.email.includes("@")) throw new Error("O email da empresa parceira é inválido.");
    this.nome = dados.nome.trim();
    this.email = dados.email.trim();
  }

  public cadastrarVantagem(descricao: string, foto: string, custo: number): Result<Vantagem> {
    if (!descricao || descricao.trim() === "") return fail("A descrição da vantagem é obrigatória.");
    if (!foto || foto.trim() === "") return fail("A foto do produto é obrigatória.");
    if (custo <= 0) return fail("O custo em moedas deve ser maior que zero.");
    return ok(new Vantagem(0, descricao, foto, custo, this));
  }

  public exportarDados() {
    return Object.freeze({
      ...this.exportarCredencial(),
      nome: this.nome,
      email: this.email,
    });
  }
}