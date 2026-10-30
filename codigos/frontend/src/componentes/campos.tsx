import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

const ESTILO_CAMPO = "w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white disabled:bg-slate-50 disabled:text-slate-500";

type Rotulo = Readonly<{ rotulo: string; larga?: boolean }>;

function Moldura({ rotulo, larga, children }: Rotulo & Readonly<{ children: ReactNode }>) {
  return (
    <label className={`block ${larga ? "sm:col-span-2" : ""}`}>
      <span className="block text-xs font-medium text-slate-700 mb-1">{rotulo}</span>
      {children}
    </label>
  );
}

export const CampoTexto = ({ rotulo, larga, ...props }: Rotulo & InputHTMLAttributes<HTMLInputElement>) => (
  <Moldura rotulo={rotulo} larga={larga}>
    <input className={ESTILO_CAMPO} {...props} />
  </Moldura>
);

export const CampoAreaTexto = ({ rotulo, larga, ...props }: Rotulo & TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <Moldura rotulo={rotulo} larga={larga}>
    <textarea className={ESTILO_CAMPO} {...props} />
  </Moldura>
);

export const CampoSelecao = ({ rotulo, larga, children, ...props }: Rotulo & SelectHTMLAttributes<HTMLSelectElement>) => (
  <Moldura rotulo={rotulo} larga={larga}>
    <select className={ESTILO_CAMPO} {...props}>
      {children}
    </select>
  </Moldura>
);
