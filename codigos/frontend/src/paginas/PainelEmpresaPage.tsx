import { useState, type FormEvent } from "react";
import { api } from "../api/index.ts";
import { Abas, BotaoPerigo, BotaoPrimario } from "../componentes/botoes.tsx";
import { CampoTexto } from "../componentes/campos.tsx";
import { Cartao, CartaoVantagem, TituloCartao } from "../componentes/cartoes.tsx";
import type { Empresa } from "../dominio/tipos.ts";
import { useAvisos, useSessao } from "../sessao/contextos.tsx";
import { useRecurso } from "../sessao/useRecurso.ts";

type Aba = "VANTAGENS" | "PERFIL";

const ABAS = [
  { id: "VANTAGENS", titulo: "Gerenciar Vantagens" },
  { id: "PERFIL", titulo: "Dados da Empresa" },
] as const;

export function PainelEmpresaPage() {
  const [aba, definirAba] = useState<Aba>("VANTAGENS");
  const { dados: empresa, recarregar } = useRecurso(api.consultarEmpresa);
  return (
    <section className="space-y-6">
      <Cartao className="p-5">
        <Abas abas={ABAS} ativa={aba} aoSelecionar={definirAba} />
      </Cartao>
      {aba === "VANTAGENS" && <GerenciarVantagens />}
      {aba === "PERFIL" && empresa && <DadosDaEmpresa empresa={empresa} aoSalvar={recarregar} />}
    </section>
  );
}

/** UC10 Cadastrar vantagem. */
function GerenciarVantagens() {
  const { dados: vantagens, recarregar } = useRecurso(api.listarVantagensDaEmpresa);
  const { informar, falhar } = useAvisos();

  const cadastrar = (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault();
    const formulario = evento.currentTarget;
    const campos = new FormData(formulario);
    api
      .cadastrarVantagem({
        descricao: String(campos.get("descricao")),
        foto: String(campos.get("foto")),
        custoEmMoedas: Number(campos.get("custoEmMoedas")),
      })
      .then(async () => {
        formulario.reset();
        await recarregar();
        informar("Vantagem adicionada ao catálogo!");
      }, falhar);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <form onSubmit={cadastrar} className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4 h-fit">
        <TituloCartao>Nova Vantagem</TituloCartao>
        <CampoTexto rotulo="Descrição do produto ou desconto" name="descricao" required placeholder="Ex: Desconto de 30% no almoço" />
        <CampoTexto rotulo="URL da foto do produto" name="foto" required />
        <CampoTexto rotulo="Custo em moedas" name="custoEmMoedas" type="number" min={1} step={1} required placeholder="Ex: 150" />
        <BotaoPrimario type="submit" className="w-full py-2.5">
          Adicionar Vantagem
        </BotaoPrimario>
      </form>
      <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4 content-start">
        {vantagens?.map((vantagem) => (
          <CartaoVantagem key={vantagem.id} vantagem={vantagem} />
        ))}
      </div>
    </div>
  );
}

/** UC06 Consultar, UC07 Atualizar e UC08 Excluir empresa parceira. */
function DadosDaEmpresa({ empresa, aoSalvar }: Readonly<{ empresa: Empresa; aoSalvar: () => Promise<void> }>) {
  const { informar, falhar } = useAvisos();
  const { sair } = useSessao();

  const salvar = (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault();
    const campos = new FormData(evento.currentTarget);
    api.atualizarEmpresa({ nome: String(campos.get("nome")), email: String(campos.get("email")) }).then(async () => {
      await aoSalvar();
      informar("Dados da empresa atualizados.");
    }, falhar);
  };

  const excluir = () => {
    if (confirm("Excluir a empresa e suas vantagens? Esta ação não pode ser desfeita.")) api.excluirEmpresa().then(sair, falhar);
  };

  return (
    <form onSubmit={salvar} className="max-w-xl bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
      <TituloCartao>Dados da Empresa</TituloCartao>
      <CampoTexto rotulo="Nome da Empresa" name="nome" defaultValue={empresa.nome} required />
      <CampoTexto rotulo="E-mail para recebimento de cupons" name="email" type="email" defaultValue={empresa.email} required />
      <CampoTexto rotulo="Login" value={empresa.login} disabled readOnly />
      <div className="flex justify-between pt-3 border-t border-slate-100">
        <BotaoPrimario type="submit">Salvar Alterações</BotaoPrimario>
        <BotaoPerigo type="button" onClick={excluir}>
          Excluir Empresa
        </BotaoPerigo>
      </div>
    </form>
  );
}
