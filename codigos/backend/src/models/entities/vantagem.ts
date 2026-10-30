import type { EmpresaParceira } from "@/models/entities/empresa-parceira.ts";
import { falha, sucesso, type Resultado } from "@/models/shared/resultado.ts";
import { exigirTextos, inteiroPositivo } from "@/models/shared/validacao.ts";

export type DadosVantagem = Readonly<{ descricao: string; foto: string; custoEmMoedas: number }>;

export type NovaVantagem = DadosVantagem & Readonly<{ empresa: EmpresaParceira }>;

export type Vantagem = NovaVantagem & Readonly<{ id: number }>;

/** EmpresaParceira.cadastrarVantagem(descricao, foto, custo) */
export function cadastrarVantagem(empresa: EmpresaParceira, dados: DadosVantagem): Resultado<NovaVantagem> {
  const { custoEmMoedas, ...textuais } = dados;
  const validados = exigirTextos(textuais, { descricao: "Descrição", foto: "Foto" });
  if (!validados.ok) return validados;
  if (!inteiroPositivo(custoEmMoedas)) return falha("VALIDACAO", "O custo em moedas deve ser um inteiro positivo.");
  return sucesso({ ...validados.valor, custoEmMoedas, empresa });
}
