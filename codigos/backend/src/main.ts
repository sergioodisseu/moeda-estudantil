import { carregarConfiguracao } from "@/config/config.ts";
import { criarApp, criarServicos } from "@/config/composicao.ts";
import { criarAdaptadorEmail } from "@/infrastructure/email/adaptador-email.ts";
import { criarClientePrisma } from "@/infrastructure/persistence/prisma/cliente-prisma.ts";
import { criarUnidadeDeTrabalhoPrisma } from "@/infrastructure/persistence/prisma/unidade-de-trabalho-prisma.ts";
import { gerarCodigo, gerarHashSenha, verificarSenha } from "@/infrastructure/security/senha-e-codigo.ts";

const config = carregarConfiguracao();

const servicos = criarServicos({
  persistencia: criarUnidadeDeTrabalhoPrisma(criarClientePrisma(config.DATABASE_URL)),
  email: criarAdaptadorEmail({ host: config.SMTP_HOST, porta: config.SMTP_PORT, remetente: config.EMAIL_REMETENTE }),
  registro: { erro: (mensagem, causa) => console.error(mensagem, causa instanceof Error ? causa.message : causa) },
  segredoJwt: config.JWT_SECRET,
  verificarSenha,
  gerarHashSenha,
  gerarCodigo,
  agora: () => new Date(),
});

const app = criarApp(servicos, config.JWT_SECRET);

Bun.serve({ port: config.PORT, fetch: app.fetch });
console.log(`API ouvindo na porta ${config.PORT}`);
