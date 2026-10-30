import type { Aluno, Empresa, EnvioMoedas, Instituicao, Resgate, Transacao, Vantagem } from "../dominio/tipos.ts";
import type { ClienteApi } from "./cliente-api.ts";
import { ErroApi } from "./cliente-api.ts";

/**
 * API em memória usada apenas para gerar o HTML de visualização.
 * Reproduz as regras do backend (saldo, motivo obrigatório, login único) sem rede nem banco.
 */
const FOTO_ALMOCO = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80";
const FOTO_LIVROS = "https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?auto=format&fit=crop&w=600&q=80";
const CREDITO_INICIAL_PROFESSOR = 650;

type Papel = "ALUNO" | "PROFESSOR" | "EMPRESA_PARCEIRA";
type Conta = { login: string; papel: Papel };

const falhar = (mensagem: string): never => {
  throw new ErroApi(mensagem);
};

const codigoAleatorio = (): string => Math.random().toString(36).slice(2, 10).toUpperCase();

export function criarClienteDemonstracao(): ClienteApi {
  const instituicoes: Instituicao[] = [
    { id: 1, nome: "PUC Minas" },
    { id: 2, nome: "UFMG" },
    { id: 3, nome: "CEFET-MG" },
  ];
  let proximoId = 100;
  const novoId = () => proximoId++;

  const contas: Conta[] = [
    { login: "aluno", papel: "ALUNO" },
    { login: "professor", papel: "PROFESSOR" },
    { login: "empresa", papel: "EMPRESA_PARCEIRA" },
  ];
  let alunos: Aluno[] = [
    {
      id: 1, login: "aluno", nome: "Sérgio Izaías Parreiras Junior", email: "sergio@pucminas.br", cpf: "12345678901",
      rg: "MG1234567", endereco: "Av. Dom José Gaspar, 500 - Belo Horizonte", curso: "Engenharia de Software",
      saldo: 350, instituicao: instituicoes[0]!,
    },
  ];
  const professor = { id: 2, nome: "Milena Menezes Adão", saldo: CREDITO_INICIAL_PROFESSOR, instituicaoId: 1 };
  let empresas: Empresa[] = [{ id: 3, login: "empresa", nome: "Restaurante Universitário", email: "contato@ru.com.br" }];
  let vantagens: Vantagem[] = [
    { id: 1, descricao: "Desconto de 50% no almoço executivo", foto: FOTO_ALMOCO, custoEmMoedas: 100, empresa: { id: 3, nome: "Restaurante Universitário" } },
    { id: 2, descricao: "Vale-compra em materiais técnicos", foto: FOTO_LIVROS, custoEmMoedas: 200, empresa: { id: 3, nome: "Restaurante Universitário" } },
  ];
  const transacoes: Transacao[] = [
    {
      tipo: "ENVIO_MOEDAS", id: 1, dataHora: new Date().toISOString(), valor: 350,
      motivo: "Participação exemplar nas aulas de arquitetura",
      professor: { id: 2, nome: professor.nome }, aluno: { id: 1, nome: alunos[0]!.nome },
    },
  ];
  const alunoDoResgate = new Map<number, number>();
  let atual: Conta | undefined;

  const alunoAtual = (): Aluno => alunos.find((a) => a.login === atual?.login) ?? falhar("Aluno não encontrado(a).");
  const empresaAtual = (): Empresa => empresas.find((e) => e.login === atual?.login) ?? falhar("Empresa parceira não encontrado(a).");
  const exigirTexto = (valor: string, rotulo: string) => valor.trim() === "" && falhar(`${rotulo} é obrigatório.`);
  const garantirLoginLivre = (login: string) => contas.some((c) => c.login === login) && falhar("Login já está em uso.");
  const instituicaoDe = (id: number): Instituicao => instituicoes.find((i) => i.id === id) ?? falhar("Instituição de ensino inexistente.");
  const extratoDe = (saldo: number, lista: Transacao[]) => ({ saldo, transacoes: lista });

  return {
    definirToken: () => undefined,
    entrar: async (login) => {
      const conta = contas.find((c) => c.login === login.trim().toLowerCase()) ?? falhar("Login ou senha inválidos.");
      atual = conta;
      const nome = { ALUNO: alunoAtual, PROFESSOR: () => professor, EMPRESA_PARCEIRA: empresaAtual }[conta.papel]().nome;
      return { token: "demo", perfil: conta.papel, nome };
    },
    listarInstituicoes: async () => instituicoes,

    cadastrarAluno: async ({ login, senha, instituicaoId, ...dados }) => {
      Object.entries({ ...dados, login, senha }).forEach(([campo, valor]) => exigirTexto(String(valor), campo));
      garantirLoginLivre(login);
      contas.push({ login, papel: "ALUNO" });
      alunos = [...alunos, { ...dados, id: novoId(), login, saldo: 0, instituicao: instituicaoDe(instituicaoId) }];
    },
    consultarAluno: async () => alunoAtual(),
    atualizarAluno: async ({ instituicaoId, ...dados }) => {
      const atualizado = { ...alunoAtual(), ...dados, instituicao: instituicaoDe(instituicaoId) };
      alunos = alunos.map((a) => (a.id === atualizado.id ? atualizado : a));
      return atualizado;
    },
    excluirAluno: async () => {
      const { id, login } = alunoAtual();
      alunos = alunos.filter((a) => a.id !== id);
      contas.splice(contas.findIndex((c) => c.login === login), 1);
    },
    consultarExtratoAluno: async () => {
      const { id, saldo } = alunoAtual();
      const dele = transacoes.filter((t) => (t.tipo === "ENVIO_MOEDAS" ? t.aluno.id === id : alunoDoResgate.get(t.id) === id));
      return extratoDe(saldo, [...dele].reverse());
    },
    listarVantagens: async () => vantagens,
    trocarPorVantagem: async (vantagemId) => {
      const aluno = alunoAtual();
      const vantagem = vantagens.find((v) => v.id === vantagemId) ?? falhar("Vantagem não encontrado(a).");
      if (aluno.saldo < vantagem.custoEmMoedas) falhar("Saldo insuficiente para resgatar esta vantagem.");
      const atualizado = { ...aluno, saldo: aluno.saldo - vantagem.custoEmMoedas };
      alunos = alunos.map((a) => (a.id === aluno.id ? atualizado : a));
      const resgate: Resgate = { tipo: "RESGATE", id: novoId(), dataHora: new Date().toISOString(), valor: vantagem.custoEmMoedas, codigo: codigoAleatorio(), vantagem };
      alunoDoResgate.set(resgate.id, aluno.id);
      transacoes.push(resgate);
      return { id: resgate.id, codigo: resgate.codigo, valor: resgate.valor, saldo: atualizado.saldo, vantagem };
    },

    listarAlunosDoProfessor: async () =>
      alunos.filter((a) => a.instituicao.id === professor.instituicaoId).map(({ id, nome, curso }) => ({ id, nome, curso })),
    enviarMoedas: async ({ alunoId, valor, motivo }) => {
      const aluno = alunos.find((a) => a.id === alunoId) ?? falhar("Aluno não encontrado(a).");
      if (!Number.isInteger(valor) || valor <= 0) falhar("A quantidade de moedas deve ser um inteiro positivo.");
      exigirTexto(motivo, "O motivo do reconhecimento");
      if (professor.saldo < valor) falhar("Saldo insuficiente para enviar esta quantidade de moedas.");
      professor.saldo -= valor;
      alunos = alunos.map((a) => (a.id === alunoId ? { ...a, saldo: a.saldo + valor } : a));
      const envio: EnvioMoedas = {
        tipo: "ENVIO_MOEDAS", id: novoId(), dataHora: new Date().toISOString(), valor, motivo: motivo.trim(),
        professor: { id: professor.id, nome: professor.nome }, aluno: { id: aluno.id, nome: aluno.nome },
      };
      transacoes.push(envio);
      return { ...envio, saldo: professor.saldo };
    },
    consultarExtratoProfessor: async () =>
      extratoDe(professor.saldo, transacoes.filter((t) => t.tipo === "ENVIO_MOEDAS").reverse()),

    cadastrarEmpresa: async ({ login, senha, ...dados }) => {
      Object.entries({ ...dados, login, senha }).forEach(([campo, valor]) => exigirTexto(valor, campo));
      garantirLoginLivre(login);
      contas.push({ login, papel: "EMPRESA_PARCEIRA" });
      empresas = [...empresas, { ...dados, id: novoId(), login }];
    },
    consultarEmpresa: async () => empresaAtual(),
    atualizarEmpresa: async (dados) => {
      const atualizada = { ...empresaAtual(), ...dados };
      empresas = empresas.map((e) => (e.id === atualizada.id ? atualizada : e));
      return atualizada;
    },
    excluirEmpresa: async () => {
      const { id, login } = empresaAtual();
      empresas = empresas.filter((e) => e.id !== id);
      vantagens = vantagens.filter((v) => v.empresa.id !== id);
      contas.splice(contas.findIndex((c) => c.login === login), 1);
    },
    listarVantagensDaEmpresa: async () => vantagens.filter((v) => v.empresa.id === empresaAtual().id),
    cadastrarVantagem: async (dados) => {
      exigirTexto(dados.descricao, "Descrição");
      exigirTexto(dados.foto, "Foto");
      if (!Number.isInteger(dados.custoEmMoedas) || dados.custoEmMoedas <= 0) falhar("O custo em moedas deve ser um inteiro positivo.");
      const { id, nome } = empresaAtual();
      const nova = { ...dados, id: novoId(), empresa: { id, nome } };
      vantagens = [...vantagens, nova];
      return nova;
    },
  };
}
