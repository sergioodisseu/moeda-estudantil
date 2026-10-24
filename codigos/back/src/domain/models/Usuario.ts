import { verificarSenhaHash } from "../shared/SenhaHasher";

export abstract class Usuario {
  private readonly id: number;
  private readonly login: string;
  private readonly senhaHash: string;

  constructor(id: number, login: string, senhaHash: string) {
    if (!login || login.trim() === "") throw new Error("O login é obrigatório.");
    if (!senhaHash || !senhaHash.includes(":")) throw new Error("O hash da senha é inválido.");
    this.id = id;
    this.login = login.trim();
    this.senhaHash = senhaHash;
  }

  public autenticar(login: string, senha: string): boolean {
    if (this.login !== login) return false;
    return verificarSenhaHash(senha, this.senhaHash);
  }

  protected exportarCredencial() {
    return { id: this.id, login: this.login, senhaHash: this.senhaHash };
  }
}