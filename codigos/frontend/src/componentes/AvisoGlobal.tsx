import { useAvisos } from "../sessao/contextos.tsx";

export function AvisoGlobal() {
  const { atual } = useAvisos();
  if (!atual) return null;
  const cor = atual.erro ? "bg-red-50 border-red-200 text-red-800" : "bg-emerald-50 border-emerald-200 text-emerald-800";
  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-10 w-full max-w-md px-4" role="status">
      <div className={`p-3 rounded-lg border text-sm font-medium shadow-sm ${cor}`}>{atual.texto}</div>
    </div>
  );
}
