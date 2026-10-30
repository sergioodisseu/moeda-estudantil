import { createTransport } from "nodemailer";
import type { EnvioMoedas, Resgate } from "@/models/entities/transacao.ts";
import type { ServicoEmail } from "@/models/gateways/servico-email.ts";

export type ConfiguracaoSmtp = Readonly<{ host: string; porta: number; remetente: string }>;

/** Adaptador de Email: implementa ServicoEmail usando o Provedor de Email (SMTP). */
export function criarAdaptadorEmail(configuracao: ConfiguracaoSmtp): ServicoEmail {
  const transporte = createTransport({ host: configuracao.host, port: configuracao.porta, secure: false });
  const enviar = (para: string, assunto: string, texto: string) =>
    transporte.sendMail({ from: configuracao.remetente, to: para, subject: assunto, text: texto }).then(() => undefined);

  return {
    notificarRecebimentoMoedas: (envio: EnvioMoedas) =>
      enviar(
        envio.aluno.email,
        "Você recebeu moedas!",
        `Olá, ${envio.aluno.nome}!\n\nO professor ${envio.professor.nome} enviou ${envio.valor} moedas para você.\nMotivo: ${envio.motivo}\nSeu saldo atual: ${envio.aluno.saldo} moedas.`,
      ),
    enviarCupom: (resgate: Resgate) =>
      enviar(
        resgate.aluno.email,
        "Seu cupom de resgate",
        `Olá, ${resgate.aluno.nome}!\n\nVocê resgatou: ${resgate.vantagem.descricao} (${resgate.vantagem.empresa.nome}).\nApresente este código na troca presencial: ${resgate.codigo}`,
      ),
    enviarConferencia: (resgate: Resgate) =>
      enviar(
        resgate.vantagem.empresa.email,
        "Resgate de vantagem para conferência",
        `O aluno ${resgate.aluno.nome} resgatou: ${resgate.vantagem.descricao}.\nCódigo para conferência: ${resgate.codigo}`,
      ),
  };
}
