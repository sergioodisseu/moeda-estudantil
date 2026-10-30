import type { ClienteApi } from "./cliente-api.ts";
import { criarClienteDemonstracao } from "./cliente-demonstracao.ts";
import { criarClienteHttp } from "./cliente-http.ts";

/** Em produção usa HTTP; o build de visualização (VITE_MODO_DEMO) usa a API em memória. */
export const api: ClienteApi = import.meta.env.VITE_MODO_DEMO === "true" ? criarClienteDemonstracao() : criarClienteHttp();
