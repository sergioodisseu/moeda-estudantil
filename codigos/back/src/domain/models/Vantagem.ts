import type { EmpresaParceira } from "./EmpresaParceira";

export class Vantagem {
  private readonly id: number;
  private readonly descricao: string;
  private readonly foto: string;
  private readonly custoEmMoedas: number;
  private readonly empresa: EmpresaParceira;

  constructor(
    id: number,
    descricao: string,
    foto: string,
    custoEmMoedas: number,
    empresa: EmpresaParceira
  ) {
    if (!descricao || descricao.trim() === "") throw new Error("A descrição da vantagem é obrigatória.");
    if (!foto || foto.trim() === "") throw new Error("A foto do produto é obrigatória.");
    if (custoEmMoedas <= 0) throw new Error("O custo em moedas deve ser positivo.");
    this.id = id;
    this.descricao = descricao.trim();
    this.foto = foto.trim();
    this.custoEmMoedas = custoEmMoedas;
    this.empresa = empresa;
  }

  public exportarDados() {
    const dadosEmpresa = this.empresa.exportarDados();
    return Object.freeze({
      id: this.id,
      descricao: this.descricao,
      foto: this.foto,
      custoEmMoedas: this.custoEmMoedas,
      empresaId: dadosEmpresa.id,
      empresaNome: dadosEmpresa.nome,
      empresaEmail: dadosEmpresa.email,
    });
  }
}