import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const COMPRIMENTO_CHAVE = 64;
const COMPRIMENTO_SALT = 16;

export const gerarSenhaHash = (senhaPura: string): string => {
  if (!senhaPura || senhaPura.trim() === "") {
    throw new Error("A senha não pode ser vazia.");
  }
  const salt = randomBytes(COMPRIMENTO_SALT).toString("hex");
  const hash = scryptSync(senhaPura, salt, COMPRIMENTO_CHAVE).toString("hex");
  return `${salt}:${hash}`;
};

export const verificarSenhaHash = (senhaPura: string, senhaHash: string): boolean => {
  const [salt, hashOriginal] = senhaHash.split(":");
  if (!salt || !hashOriginal || !senhaPura) return false;
  const bufferTentativa = scryptSync(senhaPura, salt, COMPRIMENTO_CHAVE);
  const bufferOriginal = Buffer.from(hashOriginal, "hex");
  return bufferTentativa.length === bufferOriginal.length && timingSafeEqual(bufferTentativa, bufferOriginal);
};