import { falha, sucesso, type Resultado } from "@/models/shared/resultado.ts";

export const textoPreenchido = (valor: string): boolean => valor.trim().length > 0;

/** CPF armazenado como CHAR(11) no modelo ER: exatamente 11 dígitos. */
export const cpfValido = (valor: string): boolean => /^\d{11}$/.test(valor.trim());

export const inteiroPositivo = (valor: number): boolean => Number.isInteger(valor) && valor > 0;

/** Valida que todos os campos listados estão preenchidos e devolve a cópia sem espaços nas pontas. */
export function exigirTextos<T extends Readonly<Record<string, string>>>(
  dados: T,
  rotulos: Readonly<Record<keyof T, string>>,
): Resultado<T> {
  const ausente = (Object.keys(rotulos) as Array<keyof T>).find((campo) => !textoPreenchido(dados[campo]));
  if (ausente !== undefined) return falha("VALIDACAO", `${rotulos[ausente]} é obrigatório.`);
  const aparados = Object.fromEntries(Object.entries(dados).map(([k, v]) => [k, v.trim()]));
  return sucesso(aparados as T);
}
