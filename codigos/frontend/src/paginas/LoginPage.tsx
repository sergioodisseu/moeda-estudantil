import { useState, type FormEvent } from "react";
import { BotaoPrimario } from "../componentes/botoes.tsx";
import { CampoTexto } from "../componentes/campos.tsx";
import { Cartao, Logotipo } from "../componentes/cartoes.tsx";
import { useAvisos, useSessao } from "../sessao/contextos.tsx";

export function LoginPage({ aoCadastrar }: Readonly<{ aoCadastrar: () => void }>) {
  const { entrar } = useSessao();
  const { falhar } = useAvisos();
  const [login, definirLogin] = useState("");
  const [senha, definirSenha] = useState("");

  const enviar = (evento: FormEvent) => {
    evento.preventDefault();
    entrar(login.trim(), senha).catch(falhar);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <Cartao className="max-w-md w-full p-8">
        <div className="text-center mb-6 flex flex-col items-center">
          <Logotipo tamanho="w-10 h-10 mb-3" />
          <h1 className="text-xl font-bold text-slate-900">Moeda Estudantil</h1>
          <p className="text-sm text-slate-500 mt-1">Entre com suas credenciais para acessar sua conta</p>
        </div>
        <form onSubmit={enviar} className="space-y-4">
          <CampoTexto rotulo="Usuário / Login" required value={login} onChange={(e) => definirLogin(e.target.value)} />
          <CampoTexto rotulo="Senha" type="password" required value={senha} onChange={(e) => definirSenha(e.target.value)} />
          <BotaoPrimario type="submit" className="w-full py-2.5">
            Entrar
          </BotaoPrimario>
        </form>
        <div className="mt-6 pt-6 border-t border-slate-100 text-center text-sm text-slate-600">
          Não tem uma conta?{" "}
          <button onClick={aoCadastrar} className="text-blue-600 font-semibold hover:underline">
            Cadastre-se
          </button>
        </div>
      </Cartao>
    </div>
  );
}
