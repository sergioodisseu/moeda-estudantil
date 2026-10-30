import { useSessao } from "../sessao/contextos.tsx";
import { Logotipo } from "./cartoes.tsx";

export function Cabecalho() {
  const { sessao, sair } = useSessao();
  return (
    <header className="bg-white border-b border-slate-200">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Logotipo />
          <span className="font-bold text-slate-900">Moeda Estudantil</span>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-slate-600">
            Olá, <strong className="text-slate-900">{sessao?.nome}</strong>
          </span>
          <button onClick={sair} className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-medium">
            Sair
          </button>
        </div>
      </div>
    </header>
  );
}
