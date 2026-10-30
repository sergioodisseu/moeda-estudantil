import { useState, type FormEvent } from "react";
import { api } from "../api/index.ts";
import { Abas, BotaoPrimario } from "../componentes/botoes.tsx";
import { CampoSelecao, CampoTexto } from "../componentes/campos.tsx";
import { Cartao } from "../componentes/cartoes.tsx";
import { useRecurso } from "../sessao/useRecurso.ts";
import { useAvisos } from "../sessao/contextos.tsx";
import type { CadastroAluno, CadastroEmpresa } from "../dominio/tipos.ts";

type Tipo = "ALUNO" | "EMPRESA";

const ABAS = [
  { id: "ALUNO", titulo: "Sou Aluno" },
  { id: "EMPRESA", titulo: "Sou Empresa Parceira" },
] as const;

const lerCampos = (evento: FormEvent<HTMLFormElement>): Record<string, string> => {
  evento.preventDefault();
  return Object.fromEntries([...new FormData(evento.currentTarget)].map(([chave, valor]) => [chave, String(valor)]));
};

/** UC01 Cadastrar aluno / UC05 Cadastrar empresa parceira. */
export function CadastroPage({ aoVoltar }: Readonly<{ aoVoltar: () => void }>) {
  const [tipo, definirTipo] = useState<Tipo>("ALUNO");
  const { informar, falhar } = useAvisos();

  const concluir = (cadastro: Promise<void>) =>
    cadastro.then(() => {
      informar("Cadastro realizado com sucesso! Faça login para acessar.");
      aoVoltar();
    }, falhar);

  return (
    <div className="min-h-screen flex items-center justify-center py-10 px-4">
      <Cartao className="max-w-xl w-full p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Criar nova conta</h1>
            <p className="text-sm text-slate-500">Selecione o seu perfil de acesso</p>
          </div>
          <button onClick={aoVoltar} className="text-sm text-slate-600 hover:text-slate-900 font-medium">
            ← Voltar ao login
          </button>
        </div>
        <div className="mb-6">
          <Abas abas={ABAS} ativa={tipo} aoSelecionar={definirTipo} />
        </div>
        {tipo === "ALUNO" ? (
          <FormularioAluno aoEnviar={(dados) => concluir(api.cadastrarAluno(dados))} />
        ) : (
          <FormularioEmpresa aoEnviar={(dados) => concluir(api.cadastrarEmpresa(dados))} />
        )}
      </Cartao>
    </div>
  );
}

function FormularioAluno({ aoEnviar }: Readonly<{ aoEnviar: (dados: CadastroAluno) => void }>) {
  const { dados: instituicoes } = useRecurso(api.listarInstituicoes);
  const enviar = (evento: FormEvent<HTMLFormElement>) => {
    const { instituicaoId, ...campos } = lerCampos(evento);
    aoEnviar({ ...(campos as Omit<CadastroAluno, "instituicaoId">), instituicaoId: Number(instituicaoId) });
  };
  return (
    <form onSubmit={enviar} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <CampoTexto rotulo="Nome completo" name="nome" required larga />
      <CampoTexto rotulo="E-mail" name="email" type="email" required />
      <CampoTexto rotulo="CPF" name="cpf" required maxLength={11} />
      <CampoTexto rotulo="RG" name="rg" required />
      <CampoSelecao rotulo="Instituição de Ensino" name="instituicaoId" required defaultValue="">
        <option value="" disabled>
          Selecione...
        </option>
        {instituicoes?.map((i) => (
          <option key={i.id} value={i.id}>
            {i.nome}
          </option>
        ))}
      </CampoSelecao>
      <CampoTexto rotulo="Curso" name="curso" required />
      <CampoTexto rotulo="Endereço completo" name="endereco" required larga />
      <CampoTexto rotulo="Login de acesso" name="login" required />
      <CampoTexto rotulo="Senha" name="senha" type="password" required />
      <BotaoPrimario type="submit" className="sm:col-span-2 w-full py-2.5">
        Finalizar Cadastro
      </BotaoPrimario>
    </form>
  );
}

function FormularioEmpresa({ aoEnviar }: Readonly<{ aoEnviar: (dados: CadastroEmpresa) => void }>) {
  return (
    <form onSubmit={(evento) => aoEnviar(lerCampos(evento) as CadastroEmpresa)} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <CampoTexto rotulo="Nome da Empresa" name="nome" required larga />
      <CampoTexto rotulo="E-mail corporativo" name="email" type="email" required larga />
      <CampoTexto rotulo="Login de acesso" name="login" required />
      <CampoTexto rotulo="Senha" name="senha" type="password" required />
      <BotaoPrimario type="submit" className="sm:col-span-2 w-full py-2.5">
        Finalizar Cadastro
      </BotaoPrimario>
    </form>
  );
}
