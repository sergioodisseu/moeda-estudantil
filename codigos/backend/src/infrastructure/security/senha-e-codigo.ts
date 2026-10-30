import type { VerificarSenha } from "@/models/entities/usuario.ts";

const TAMANHO_CODIGO = 8;

export const gerarHashSenha = (senha: string): Promise<string> => Bun.password.hash(senha, { algorithm: "argon2id" });

export const verificarSenha: VerificarSenha = (senha, senhaHash) => Bun.password.verify(senha, senhaHash);

export const gerarCodigo = (): string => crypto.randomUUID().replaceAll("-", "").slice(0, TAMANHO_CODIGO).toUpperCase();
