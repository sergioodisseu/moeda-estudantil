import type { Aluno } from "@/models/entities/aluno.ts";
import type { Professor } from "@/models/entities/professor.ts";
import type { Vantagem } from "@/models/entities/vantagem.ts";

type TransacaoBase = Readonly<{ id: number; dataHora: Date; valor: number }>;

export type EnvioMoedas = TransacaoBase &
  Readonly<{ tipo: "ENVIO_MOEDAS"; motivo: string; professor: Professor; aluno: Aluno }>;

export type Resgate = TransacaoBase &
  Readonly<{ tipo: "RESGATE"; codigo: string; aluno: Aluno; vantagem: Vantagem }>;

/** União discriminada: representa Transacao (abstrata) generalizada por EnvioMoedas e Resgate. */
export type Transacao = EnvioMoedas | Resgate;

export type NovoEnvioMoedas = Omit<EnvioMoedas, "id">;
export type NovoResgate = Omit<Resgate, "id">;
