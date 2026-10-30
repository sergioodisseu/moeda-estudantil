import type { EnvioMoedas, Resgate } from "@/models/entities/transacao.ts";

/** Porta de saída do Model; implementada pelo Adaptador de Email (Infraestrutura). */
export interface ServicoEmail {
  notificarRecebimentoMoedas(envio: EnvioMoedas): Promise<void>;
  enviarCupom(resgate: Resgate): Promise<void>;
  enviarConferencia(resgate: Resgate): Promise<void>;
}

export interface Registro {
  erro(mensagem: string, causa: unknown): void;
}
