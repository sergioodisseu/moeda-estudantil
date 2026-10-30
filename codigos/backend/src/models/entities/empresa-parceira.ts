import type { Resultado } from "@/models/shared/resultado.ts";
import type { Usuario } from "@/models/entities/usuario.ts";
import { exigirTextos } from "@/models/shared/validacao.ts";

export type DadosEmpresaParceira = Readonly<{ nome: string; email: string }>;

export type EmpresaParceira = Usuario & DadosEmpresaParceira;

export const validarDadosEmpresa = (dados: DadosEmpresaParceira): Resultado<DadosEmpresaParceira> =>
  exigirTextos(dados, { nome: "Nome", email: "Email" });

