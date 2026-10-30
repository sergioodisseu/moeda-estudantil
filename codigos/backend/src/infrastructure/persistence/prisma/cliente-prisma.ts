import { PrismaPg } from "@prisma/adapter-pg";
import { Prisma, PrismaClient } from "@/infrastructure/persistence/prisma/gerado/client.ts";

export type ClientePrisma = PrismaClient;
export type ClienteTransacional = Prisma.TransactionClient;

export const criarClientePrisma = (databaseUrl: string): ClientePrisma =>
  new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl }) });

const erroConhecido = (erro: unknown, codigo: string): erro is Prisma.PrismaClientKnownRequestError =>
  erro instanceof Prisma.PrismaClientKnownRequestError && erro.code === codigo;

/** Nome do índice único violado (ex.: "credencial_login_key", "aluno_cpf_key"). */
export function indiceUnicoViolado(erro: unknown): string | undefined {
  if (!erroConhecido(erro, "P2002")) return undefined;
  const meta = erro.meta as { driverAdapterError?: { cause?: { constraint?: { index?: string } } } } | undefined;
  return meta?.driverAdapterError?.cause?.constraint?.index ?? "";
}

export const excedeuTamanhoDaColuna = (erro: unknown): boolean => erroConhecido(erro, "P2000");
