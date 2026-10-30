import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { api } from "../api/index.ts";
import type { Sessao } from "../dominio/tipos.ts";
import { mensagemDe } from "../util/formatacao.ts";

const DURACAO_AVISO_MS = 3500;

type Aviso = Readonly<{ texto: string; erro: boolean }>;

type ContextoAviso = Readonly<{ informar: (texto: string) => void; falhar: (erro: unknown) => void; atual?: Aviso }>;

const Avisos = createContext<ContextoAviso | undefined>(undefined);

export function ProvedorAvisos({ children }: Readonly<{ children: ReactNode }>) {
  const [atual, definir] = useState<Aviso>();
  useEffect(() => {
    if (!atual) return;
    const temporizador = setTimeout(() => definir(undefined), DURACAO_AVISO_MS);
    return () => clearTimeout(temporizador);
  }, [atual]);
  const valor = useMemo<ContextoAviso>(
    () => ({
      atual,
      informar: (texto) => definir({ texto, erro: false }),
      falhar: (erro) => definir({ texto: mensagemDe(erro), erro: true }),
    }),
    [atual],
  );
  return <Avisos.Provider value={valor}>{children}</Avisos.Provider>;
}

export function useAvisos(): ContextoAviso {
  const contexto = useContext(Avisos);
  if (!contexto) throw new Error("useAvisos fora do ProvedorAvisos");
  return contexto;
}

type ContextoSessao = Readonly<{ sessao?: Sessao; entrar: (login: string, senha: string) => Promise<void>; sair: () => void }>;

const Sessoes = createContext<ContextoSessao | undefined>(undefined);

export function ProvedorSessao({ children }: Readonly<{ children: ReactNode }>) {
  const [sessao, definir] = useState<Sessao>();
  const entrar = useCallback(async (login: string, senha: string) => {
    const { token, ...dados } = await api.entrar(login, senha);
    api.definirToken(token);
    definir(dados);
  }, []);
  const sair = useCallback(() => {
    api.definirToken(undefined);
    definir(undefined);
  }, []);
  const valor = useMemo(() => ({ sessao, entrar, sair }), [sessao, entrar, sair]);
  return <Sessoes.Provider value={valor}>{children}</Sessoes.Provider>;
}

export function useSessao(): ContextoSessao {
  const contexto = useContext(Sessoes);
  if (!contexto) throw new Error("useSessao fora do ProvedorSessao");
  return contexto;
}
