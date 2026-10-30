import type { ButtonHTMLAttributes } from "react";

const BASE = "text-sm font-medium rounded-lg transition disabled:opacity-60";

export const BotaoPrimario = ({ className = "", ...props }: ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button className={`${BASE} px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white ${className}`} {...props} />
);

export const BotaoPerigo = ({ className = "", ...props }: ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button className={`${BASE} px-4 py-2 text-red-600 hover:bg-red-50 border border-red-200 ${className}`} {...props} />
);

type Aba<T extends string> = Readonly<{ id: T; titulo: string }>;

type PropsAbas<T extends string> = Readonly<{ abas: readonly Aba<T>[]; ativa: T; aoSelecionar: (id: T) => void }>;

export function Abas<T extends string>({ abas, ativa, aoSelecionar }: PropsAbas<T>) {
  return (
    <div className="flex gap-2">
      {abas.map(({ id, titulo }) => (
        <button
          key={id}
          onClick={() => aoSelecionar(id)}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${id === ativa ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-100"}`}
        >
          {titulo}
        </button>
      ))}
    </div>
  );
}
