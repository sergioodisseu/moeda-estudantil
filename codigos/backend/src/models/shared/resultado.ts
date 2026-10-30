export type TipoErro =
  | "VALIDACAO"
  | "NAO_ENCONTRADO"
  | "SALDO_INSUFICIENTE"
  | "CREDENCIAIS_INVALIDAS"
  | "CONFLITO";

export type ErroDominio = Readonly<{ tipo: TipoErro; mensagem: string }>;

export type Resultado<T> =
  | Readonly<{ ok: true; valor: T }>
  | Readonly<{ ok: false; erro: ErroDominio }>;

export const sucesso = <T>(valor: T): Resultado<T> => ({ ok: true, valor });

export const falha = (tipo: TipoErro, mensagem: string): Resultado<never> => ({
  ok: false,
  erro: { tipo, mensagem },
});
