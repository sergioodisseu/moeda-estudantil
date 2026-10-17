import { Usuario } from "./Usuario";
import { Vantagem } from "./Vantagem";
import { Transacao } from ";/Transacao";

export class Aluno extends Usuario{

    private nome: string;
    private email: string;
    private cpf: string;
    private rg: string;
    private endereco: string;
    private curso: string;
    private saldo: number;

    /**
     * 
     * @param id 
     * @param login 
     * @param senha 
     * @param email 
     * @param cpf 
     * @param rg 
     * @param endereco 
     * @param curso 
     * @param saldo 
     */
    constructor(id: number, login: string, senha: string, nome: string, email: string, 
               cpf: string, rg: string, endereco: string, curso: string, saldo: number = 0 ){
        super(id, login, senha);

        if(saldo < 0)
            throw new Error("O saldo inicial não pode ser negativo.");

        this.nome = nome;
        this.email = email;
        this.cpf = cpf;
        this.rg = rg;
        this.endereco = endereco;
        this.curso = curso;
        this.saldo = saldo;
        
    }

    public receberMoedas(valor: number): void {
        if(valor <= 0)
            throw new Error("Valor de recebimento inválido.");
        this.saldo += valor;
    }

    public resgatarVantagem(vantagem: Vantagem): void {
        if(this.saldo < vantagem.getCustoEmMoedas());
    }

}