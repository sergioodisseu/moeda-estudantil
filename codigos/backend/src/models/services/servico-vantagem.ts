import { cadastrarVantagem, type DadosVantagem, type Vantagem } from "@/models/entities/vantagem.ts";
import { sucesso, type Resultado } from "@/models/shared/resultado.ts";
import type { UnidadeDeTrabalho } from "@/models/repositories/repositorios.ts";
import { comoResultado, naoEncontrado } from "@/models/services/apoio.ts";

/** UC10 Cadastrar vantagem + consultas do catálogo que sustentam a seleção do UC14. */
export function criarServicoVantagem({ persistencia }: Readonly<{ persistencia: UnidadeDeTrabalho }>) {
  const { empresas, vantagens } = persistencia.repositorios;

  const cadastrar = (empresaId: number, dados: DadosVantagem): Promise<Resultado<Vantagem>> =>
    comoResultado(async () => {
      const empresa = await empresas.buscarPorId(empresaId);
      if (!empresa) return naoEncontrado("Empresa parceira");
      const nova = cadastrarVantagem(empresa, dados);
      return nova.ok ? sucesso(await vantagens.criar(nova.valor)) : nova;
    });

  const listarCatalogo = (): Promise<readonly Vantagem[]> => vantagens.listar();

  const listarDaEmpresa = (empresaId: number): Promise<readonly Vantagem[]> => vantagens.listarPorEmpresa(empresaId);

  return { cadastrar, listarCatalogo, listarDaEmpresa };
}

export type ServicoVantagem = ReturnType<typeof criarServicoVantagem>;
