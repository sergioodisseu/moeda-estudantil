import type { ReactNode } from "react";
import type { Vantagem } from "../dominio/tipos.ts";
import { formatarMoedas } from "../util/formatacao.ts";

export const Cartao = ({ children, className = "" }: Readonly<{ children: ReactNode; className?: string }>) => (
  <div className={`bg-white border border-slate-200 rounded-xl shadow-sm ${className}`}>{children}</div>
);

export const TituloCartao = ({ children }: Readonly<{ children: ReactNode }>) => (
  <h3 className="text-base font-semibold text-slate-900 border-b border-slate-100 pb-3">{children}</h3>
);

export const Logotipo = ({ tamanho = "w-8 h-8" }: Readonly<{ tamanho?: string }>) => (
  <div className={`${tamanho} rounded-lg bg-blue-600 text-white font-bold flex items-center justify-center`}>M</div>
);

export const PainelSaldo = ({ rotulo, saldo }: Readonly<{ rotulo: string; saldo: number }>) => (
  <div className="bg-slate-50 border border-slate-200 px-4 py-2 rounded-lg text-right">
    <span className="block text-xs font-medium text-slate-500 uppercase">{rotulo}</span>
    <span className="text-xl font-bold text-blue-600">{formatarMoedas(saldo)}</span>
  </div>
);

type PropsCartaoVantagem = Readonly<{ vantagem: Vantagem; acao?: ReactNode }>;

/** Cartão de vantagem; `acao` (botão de resgate) só aparece para o aluno. */
export function CartaoVantagem({ vantagem, acao }: PropsCartaoVantagem) {
  return (
    <Cartao className="overflow-hidden flex flex-col">
      <img src={vantagem.foto} alt={vantagem.descricao} className="h-44 w-full object-cover bg-slate-100" />
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <span className="text-xs font-medium text-slate-500">{vantagem.empresa.nome}</span>
          <h3 className="text-base font-semibold text-slate-900 mt-1">{vantagem.descricao}</h3>
        </div>
        <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
          <span className="text-base font-bold text-slate-900">{formatarMoedas(vantagem.custoEmMoedas)}</span>
          {acao}
        </div>
      </div>
    </Cartao>
  );
}

export const TabelaExtrato = ({ colunas, children }: Readonly<{ colunas: readonly string[]; children: ReactNode }>) => (
  <table className="w-full text-left border-collapse text-sm">
    <thead>
      <tr className="bg-slate-50 border-b border-slate-200 text-xs text-slate-500 uppercase">
        {colunas.map((coluna, i) => (
          <th key={coluna} className={`py-3 px-4 ${i === colunas.length - 1 ? "text-right" : ""}`}>
            {coluna}
          </th>
        ))}
      </tr>
    </thead>
    <tbody className="divide-y divide-slate-100">{children}</tbody>
  </table>
);
