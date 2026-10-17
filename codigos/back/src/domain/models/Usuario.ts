export abstract class Usuario{
    private id: number;
    private login: string;
    private senha: string;

    constructor(id: number, login: string, senha: string){

        if(id <= 0) 
            throw new Error("Usuário: ID deve ser maior que zero.");
        
        if(!login || login.trim().length == 0)
            throw Error("Usuário: Login é obrigatório");

        if(!senha || senha.trim().length == 0)
            throw Error("Usuário: Senha não pode ser vazia ou menor que 6 caracteres.");

        this.id = id;
        this.login = login;
        this.senha = senha;
    }
    public autenticar(loginDigital: string, senhaDigitada: string): boolean{
        if(!loginDigital || !senhaDigitada) return false;
        return this.login === loginDigital && this.senha === senhaDigitada;
    }

    public getId(): number { return this.id; } 

}