import { z } from "zod";

const esquema = z.object({
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(16, "JWT_SECRET deve ter ao menos 16 caracteres"),
  PORT: z.coerce.number().int().default(3000),
  SMTP_HOST: z.string().default("localhost"),
  SMTP_PORT: z.coerce.number().int().default(1025),
  EMAIL_REMETENTE: z.string().default("moeda-estudantil@localhost"),
});

export type Configuracao = z.infer<typeof esquema>;

export const carregarConfiguracao = (ambiente: Record<string, string | undefined> = process.env): Configuracao =>
  esquema.parse(ambiente);
