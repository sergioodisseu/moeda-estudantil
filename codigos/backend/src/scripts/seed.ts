import { carregarConfiguracao } from "@/config/config.ts";
import { criarServicos } from "@/config/composicao.ts";
import { criarClientePrisma } from "@/infrastructure/persistence/prisma/cliente-prisma.ts";
import { criarUnidadeDeTrabalhoPrisma } from "@/infrastructure/persistence/prisma/unidade-de-trabalho-prisma.ts";
import { gerarCodigo, gerarHashSenha, verificarSenha } from "@/infrastructure/security/senha-e-codigo.ts";
import type { Resultado } from "@/models/shared/resultado.ts";
import type { ServicoEmail } from "@/models/gateways/servico-email.ts";

/**
 * Dados de demonstração. Instituições e professores são pré-cadastrados (enunciado);
 * o restante passa pelos mesmos casos de uso da API, sem disparar emails.
 * Idempotente: se já houver instituições, não faz nada.
 */
const SENHA_DEMO = "123456";
const FOTO_ALMOCO = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80";
const FOTO_LIVROS = "https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?auto=format&fit=crop&w=600&q=80";
const FOTO_SOBREMESA = "https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=600&q=80";

const semEmail: ServicoEmail = {
  notificarRecebimentoMoedas: async () => undefined,
  enviarCupom: async () => undefined,
  enviarConferencia: async () => undefined,
};

function exigir<T>(resultado: Resultado<T>): T {
  if (!resultado.ok) throw new Error(`Seed falhou: ${resultado.erro.mensagem}`);
  return resultado.valor;
}

const config = carregarConfiguracao();
const prisma = criarClientePrisma(config.DATABASE_URL);

if ((await prisma.instituicaoEnsino.count()) > 0) {
  console.log("Seed ignorado: o banco já possui dados.");
} else {
  const senhaHash = await gerarHashSenha(SENHA_DEMO);
  const [puc, ufmg, cefet] = await Promise.all(
    ["PUC Minas", "UFMG", "CEFET-MG"].map((nome) => prisma.instituicaoEnsino.create({ data: { nome } })),
  );

  const professores = [
    { login: "professor", nome: "Milena Menezes Adão", cpf: "11122233344", departamento: "Engenharia de Software", instituicaoId: puc!.id },
    { login: "professor2", nome: "Carlos Andrade", cpf: "55566677788", departamento: "Ciência da Computação", instituicaoId: ufmg!.id },
  ];
  for (const { login, ...dados } of professores) {
    await prisma.credencial.create({ data: { login, senhaHash, professor: { create: dados } } });
  }

  const servicos = criarServicos({
    persistencia: criarUnidadeDeTrabalhoPrisma(prisma),
    email: semEmail,
    registro: { erro: (mensagem, causa) => console.error(mensagem, causa) },
    segredoJwt: config.JWT_SECRET,
    verificarSenha,
    gerarHashSenha,
    gerarCodigo,
    agora: () => new Date(),
  });

  const aluno = (login: string, nome: string, email: string, cpf: string, rg: string, instituicaoId: number) =>
    servicos.aluno.cadastrar({
      login, senha: SENHA_DEMO, nome, email, cpf, rg, instituicaoId,
      endereco: "Av. Dom José Gaspar, 500 - Belo Horizonte",
      curso: "Engenharia de Software",
    });

  const sergio = exigir(await aluno("aluno", "Sérgio Izaías Parreiras Junior", "sergio@pucminas.br", "12345678901", "MG1234567", puc!.id));
  const ana = exigir(await aluno("aluno2", "Ana Beatriz Souza", "ana@pucminas.br", "23456789012", "MG2345678", puc!.id));
  exigir(await aluno("aluno3", "Bruno Lima", "bruno@ufmg.br", "34567890123", "MG3456789", ufmg!.id));

  const restaurante = exigir(await servicos.empresa.cadastrar({ login: "empresa", senha: SENHA_DEMO, nome: "Restaurante Universitário", email: "contato@ru.com.br" }));
  const livraria = exigir(await servicos.empresa.cadastrar({ login: "empresa2", senha: SENHA_DEMO, nome: "Livraria Campus", email: "contato@livrariacampus.com.br" }));
  const almoco = exigir(await servicos.vantagem.cadastrar(restaurante.id, { descricao: "Desconto de 50% no almoço executivo", foto: FOTO_ALMOCO, custoEmMoedas: 100 }));
  exigir(await servicos.vantagem.cadastrar(restaurante.id, { descricao: "Sobremesa grátis no almoço", foto: FOTO_SOBREMESA, custoEmMoedas: 40 }));
  exigir(await servicos.vantagem.cadastrar(livraria.id, { descricao: "Vale-compra em materiais técnicos", foto: FOTO_LIVROS, custoEmMoedas: 200 }));

  await servicos.creditoSemestral.creditar();
  const milena = (await prisma.professor.findFirstOrThrow({ where: { credencial: { login: "professor" } } })).id;
  exigir(await servicos.envioMoedas.enviar({ professorId: milena, alunoId: sergio.id, valor: 350, motivo: "Participação exemplar nas aulas de arquitetura" }));
  exigir(await servicos.envioMoedas.enviar({ professorId: milena, alunoId: ana.id, valor: 150, motivo: "Bom comportamento e colaboração em sala" }));
  exigir(await servicos.resgate.trocar(ana.id, almoco.id));

  console.log("Seed concluído. Logins: aluno, aluno2, aluno3, professor, professor2, empresa, empresa2 (senha 123456).");
}

await prisma.$disconnect();
