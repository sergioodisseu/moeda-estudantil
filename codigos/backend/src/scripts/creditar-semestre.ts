import { carregarConfiguracao } from "@/config/config.ts";
import { criarClientePrisma } from "@/infrastructure/persistence/prisma/cliente-prisma.ts";
import { criarUnidadeDeTrabalhoPrisma } from "@/infrastructure/persistence/prisma/unidade-de-trabalho-prisma.ts";
import { criarServicoCreditoSemestral } from "@/models/services/servico-credito-semestral.ts";

/** Ator "Sistema" (UC17): execute uma vez no início de cada semestre. */
const config = carregarConfiguracao();
const prisma = criarClientePrisma(config.DATABASE_URL);
const creditados = await criarServicoCreditoSemestral({ persistencia: criarUnidadeDeTrabalhoPrisma(prisma) }).creditar();
console.log(`${creditados} professor(es) receberam o crédito semestral.`);
await prisma.$disconnect();
