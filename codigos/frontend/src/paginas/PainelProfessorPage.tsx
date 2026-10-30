import { useState, type FormEvent } from "react";
import { api } from "../api/index.ts";
import { BotaoPrimario } from "../componentes/botoes.tsx";
import { CampoAreaTexto, CampoSelecao, CampoTexto } from "../componentes/campos.tsx";
import { Cartao, PainelSaldo, TabelaExtrato, TituloCartao } from "../componentes/cartoes.tsx";
import type { EnvioMoedas, Transacao } from "../dominio/tipos.ts";
import { useAvisos } from "../sessao/contextos.tsx";
import { useRecurso } from "../sessao/useRecurso.ts";
import { formatarDataHora, formatarMovimento } from "../util/formatacao.ts";

const ehEnvio = (transacao: Transacao): transacao is EnvioMoedas => transacao.tipo === "ENVIO_MOEDAS";

export function PainelProfessorPage() {
  const { dados: extrato, recarregar } = useRecurso(api.consultarExtratoProfessor);
  return (
    <section className="space-y-6">
      <Cartao className="p-6 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Área do Professor</h2>
          <p className="text-sm text-slate-500">Distribua moedas de reconhecimento e acompanhe seu histórico de envios</p>
        </div>
        <PainelSaldo rotulo="Saldo para Distribuição" saldo={extrato?.saldo ?? 0} />
      </Cartao>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <FormularioEnvio aoEnviar={recarregar} />
        <Cartao className="lg:col-span-2 overflow-hidden">
          <div className="p-5 border-b border-slate-200">
            <h3 className="text-base font-semibold text-slate-900">Extrato de Envios</h3>
          </div>
          <TabelaExtrato colunas={["Data", "Aluno", "Motivo", "Valor"]}>
            {extrato?.transacoes.filter(ehEnvio).map((envio) => (
              <tr key={envio.id}>
                <td className="py-3 px-4 text-slate-500">{formatarDataHora(envio.dataHora)}</td>
                <td className="py-3 px-4 font-medium text-slate-900">{envio.aluno.nome}</td>
                <td className="py-3 px-4 text-slate-600">{envio.motivo}</td>
                <td className="py-3 px-4 text-right font-semibold text-slate-900">{formatarMovimento(envio.valor, "-")}</td>
              </tr>
            ))}
          </TabelaExtrato>
        </Cartao>
      </div>
    </section>
  );
}

/** UC11 Enviar moedas a aluno. */
function FormularioEnvio({ aoEnviar }: Readonly<{ aoEnviar: () => Promise<void> }>) {
  const { dados: alunos } = useRecurso(api.listarAlunosDoProfessor);
  const { informar, falhar } = useAvisos();
  const [motivo, definirMotivo] = useState("");

  const enviar = (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault();
    const campos = new FormData(evento.currentTarget);
    api
      .enviarMoedas({ alunoId: Number(campos.get("alunoId")), valor: Number(campos.get("valor")), motivo })
      .then(async () => {
        definirMotivo("");
        await aoEnviar();
        informar("Moedas enviadas com sucesso!");
      }, falhar);
  };

  return (
    <form onSubmit={enviar} className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4 h-fit">
      <TituloCartao>Enviar Moedas</TituloCartao>
      <CampoSelecao rotulo="Aluno" name="alunoId" required defaultValue="">
        <option value="" disabled>
          Selecione...
        </option>
        {alunos?.map((aluno) => (
          <option key={aluno.id} value={aluno.id}>
            {aluno.nome} — {aluno.curso}
          </option>
        ))}
      </CampoSelecao>
      <CampoTexto rotulo="Quantidade de moedas" name="valor" type="number" min={1} step={1} required />
      <CampoAreaTexto
        rotulo="Motivo do reconhecimento"
        required
        rows={3}
        value={motivo}
        onChange={(e) => definirMotivo(e.target.value)}
        placeholder="Descreva o motivo desta premiação..."
      />
      <BotaoPrimario type="submit" className="w-full py-2.5">
        Enviar Moedas
      </BotaoPrimario>
    </form>
  );
}
