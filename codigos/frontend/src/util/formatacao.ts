const FORMATO_DATA_HORA = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" });

export const formatarDataHora = (iso: string): string => FORMATO_DATA_HORA.format(new Date(iso));

export const formatarMoedas = (quantidade: number): string => `${quantidade} ${quantidade === 1 ? "moeda" : "moedas"}`;

export const formatarMovimento = (valor: number, sinal: "+" | "-"): string => `${sinal}${valor}`;

export const mensagemDe = (erro: unknown): string => (erro instanceof Error ? erro.message : "Erro inesperado.");
