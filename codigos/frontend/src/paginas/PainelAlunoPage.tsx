import { useState, type FormEvent } from "react";
import { api } from "../api/index.ts";
import { Abas, BotaoPerigo, BotaoPrimario } from "../componentes/botoes.tsx";
import { CampoSelecao, CampoTexto } from "../componentes/campos.tsx";
import { Cartao, CartaoVantagem, TabelaExtrato, TituloCartao } from "../componentes/cartoes.tsx";
import type { Aluno, DadosAluno, ResgateRealizado, Transacao } from "../dominio/tipos.ts";
import { useAvisos, useSessao } from "../sessao/contextos.tsx";
import { useRecurso } from "../sessao/useRecurso.ts";
import { formatarDataHora, formatarMoedas, formatarMovimento } from "../util/formatacao.ts";

type Aba = "VANTAGENS" | "EXTRATO" | "PERFIL";

const ABAS = [
  { id: "VANTAGENS", titulo: "Vantagens Disponíveis" },
  { id: "EXTRATO", titulo: "Extrato da Conta" },
  { id: "PERFIL", titulo: "Meus Dados" },
] as const;

export function PainelAlunoPage() {
  const [aba, definirAba] = useState<Aba>("VANTAGENS");
  const [cupom, definirCupom] = useState<ResgateRealizado>();
  const { dados: aluno, recarregar: recarregarAluno } = useRecurso(api.consultarAluno);
  const { dados: extrato, recarregar: recarregarExtrato } = useRecurso(api.consultarExtratoAluno);
  const { falhar } = useAvisos();

  const resgatar = (vantagemId: number) =>
    api.trocarPorVantagem(vantagemId).then(async (resgate) => {
      definirCupom(resgate);
      await Promise.all([recarregarAluno(), recarregarExtrato()]);
    }, falhar);

  return (
    <section className="space-y-6">
      <Cartao className="p-5 flex flex-wrap items-center justify-between gap-4">
        <Abas abas={ABAS} ativa={aba} aoSelecionar={definirAba} />
        <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 px-4 py-2 rounded-lg">
          <span className="text-xs font-medium text-slate-500 uppercase">Meu Saldo:</span>
          <span className="text-lg font-bold text-blue-600">{formatarMoedas(aluno?.saldo ?? 0)}</span>
        </div>
      </Cartao>
      {cupom && <AvisoCupom resgate={cupom} aoFechar={() => definirCupom(undefined)} />}
      {aba === "VANTAGENS" && <Vantagens aoResgatar={resgatar} />}
      {aba === "EXTRATO" && <ExtratoAluno transacoes={extrato?.transacoes ?? []} />}
      {aba === "PERFIL" && aluno && <DadosDoAluno aluno={aluno} aoSalvar={recarregarAluno} />}
    </section>
  );
}

function AvisoCupom({ resgate, aoFechar }: Readonly<{ resgate: ResgateRealizado; aoFechar: () => void }>) {
  return (
    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 flex items-center justify-between">
      <div>
        <h4 className="text-sm font-bold text-emerald-900">Resgate confirmado: {resgate.vantagem.descricao}</h4>
        <p className="text-xs text-emerald-700 mt-1">
          Enviamos o cupom para o seu e-mail e para a empresa parceira. Código para conferência presencial:{" "}
          <strong className="font-mono text-sm bg-white px-2 py-0.5 rounded border border-emerald-300">{resgate.codigo}</strong>
        </p>
      </div>
      <button onClick={aoFechar} className="text-xs font-semibold text-emerald-800 hover:underline">
        Fechar
      </button>
    </div>
  );
}

function Vantagens({ aoResgatar }: Readonly<{ aoResgatar: (vantagemId: number) => Promise<void> }>) {
  const { dados: vantagens } = useRecurso(api.listarVantagens);
  if (vantagens?.length === 0) return <p className="text-sm text-slate-500">Nenhuma vantagem cadastrada.</p>;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {vantagens?.map((vantagem) => (
        <CartaoVantagem
          key={vantagem.id}
          vantagem={vantagem}
          acao={<BotaoPrimario className="px-4 text-xs font-semibold" onClick={() => void aoResgatar(vantagem.id)}>Resgatar</BotaoPrimario>}
        />
      ))}
    </div>
  );
}

function LinhaExtrato({ transacao }: Readonly<{ transacao: Transacao }>) {
  const recebimento = transacao.tipo === "ENVIO_MOEDAS";
  return (
    <tr>
      <td className="py-3 px-4 text-slate-500">{formatarDataHora(transacao.dataHora)}</td>
      <td className="py-3 px-4">
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${recebimento ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
          {recebimento ? "Recebimento" : "Resgate"}
        </span>
      </td>
      <td className="py-3 px-4 text-slate-800">
        {transacao.tipo === "ENVIO_MOEDAS"
          ? `${transacao.professor.nome} — "${transacao.motivo}"`
          : `${transacao.vantagem.descricao} (Cupom: ${transacao.codigo})`}
      </td>
      <td className={`py-3 px-4 text-right font-semibold ${recebimento ? "text-emerald-600" : "text-slate-900"}`}>
        {formatarMovimento(transacao.valor, recebimento ? "+" : "-")}
      </td>
    </tr>
  );
}

function ExtratoAluno({ transacoes }: Readonly<{ transacoes: readonly Transacao[] }>) {
  return (
    <Cartao className="overflow-hidden">
      <div className="p-5 border-b border-slate-200">
        <h3 className="text-base font-semibold text-slate-900">Histórico de Movimentações</h3>
      </div>
      <TabelaExtrato colunas={["Data", "Tipo", "Descrição", "Valor"]}>
        {transacoes.map((t) => (
          <LinhaExtrato key={`${t.tipo}-${t.id}`} transacao={t} />
        ))}
      </TabelaExtrato>
    </Cartao>
  );
}

const lerDadosAluno = (formulario: HTMLFormElement): DadosAluno => {
  const campos = Object.fromEntries(new FormData(formulario)) as Record<keyof DadosAluno, string>;
  return { ...campos, instituicaoId: Number(campos.instituicaoId) };
};

/** UC02 Consultar, UC03 Atualizar e UC04 Excluir aluno. */
function DadosDoAluno({ aluno, aoSalvar }: Readonly<{ aluno: Aluno; aoSalvar: () => Promise<void> }>) {
  const { dados: instituicoes } = useRecurso(api.listarInstituicoes);
  const { informar, falhar } = useAvisos();
  const { sair } = useSessao();

  const salvar = (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault();
    api.atualizarAluno(lerDadosAluno(evento.currentTarget)).then(async () => {
      await aoSalvar();
      informar("Seus dados cadastrais foram atualizados.");
    }, falhar);
  };

  const excluir = () => {
    if (confirm("Excluir sua conta? Esta ação não pode ser desfeita.")) api.excluirAluno().then(sair, falhar);
  };

  if (!instituicoes) return null;

  return (
    <form onSubmit={salvar} className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-5">
      <TituloCartao>Editar Dados Cadastrais</TituloCartao>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <CampoTexto rotulo="Nome completo" name="nome" defaultValue={aluno.nome} required />
        <CampoTexto rotulo="E-mail" name="email" type="email" defaultValue={aluno.email} required />
        <CampoTexto rotulo="CPF" name="cpf" defaultValue={aluno.cpf} required />
        <CampoTexto rotulo="RG" name="rg" defaultValue={aluno.rg} required />
        <CampoSelecao rotulo="Instituição de Ensino" name="instituicaoId" defaultValue={aluno.instituicao.id}>
          {instituicoes?.map((i) => (
            <option key={i.id} value={i.id}>
              {i.nome}
            </option>
          ))}
        </CampoSelecao>
        <CampoTexto rotulo="Curso" name="curso" defaultValue={aluno.curso} required />
        <CampoTexto rotulo="Endereço" name="endereco" defaultValue={aluno.endereco} required larga />
      </div>
      <div className="flex justify-between pt-4 border-t border-slate-100">
        <BotaoPrimario type="submit">Salvar Alterações</BotaoPrimario>
        <BotaoPerigo type="button" onClick={excluir}>
          Excluir Conta
        </BotaoPerigo>
      </div>
    </form>
  );
}
