import { PrismaClient } from "@prisma/client";
import { gerarSenhaHash } from "../src/model/shared/SenhaHasher";

const prisma = new PrismaClient();

async function executarSeed() {
  const jaPopulado = await prisma.instituicaoEnsino.count();
  if (jaPopulado > 0) {
    console.info("Banco já populado. Pulando seed inicial.");
    return;
  }

  console.info("Populando banco de dados com dados iniciais...");

  // 1. Instituições de Ensino Pré-cadastradas (RF02)
  const puc = await prisma.instituicaoEnsino.create({ data: { nome: "PUC Minas" } });
  const ufmg = await prisma.instituicaoEnsino.create({ data: { nome: "UFMG" } });
  await prisma.instituicaoEnsino.create({ data: { nome: "CEFET-MG" } });

  // 2. Professores Pré-cadastrados com 1.000 moedas iniciais (RF03, RF04)
  const credProf1 = await prisma.credencial.create({
    data: { login: "professor", senhaHash: gerarSenhaHash("123456") },
  });
  const profMilena = await prisma.professor.create({
    data: {
      credencialId: credProf1.id,
      instituicaoId: puc.id,
      nome: "Milena Menezes Adão",
      cpf: "11122233344",
      departamento: "Engenharia de Software",
      saldo: 1000,
    },
  });

  const credProf2 = await prisma.credencial.create({
    data: { login: "prof.ufmg", senhaHash: gerarSenhaHash("123456") },
  });
  await prisma.professor.create({
    data: {
      credencialId: credProf2.id,
      instituicaoId: ufmg.id,
      nome: "Carlos Eduardo Rocha",
      cpf: "55566677788",
      departamento: "Ciência da Computação",
      saldo: 1000,
    },
  });

  // 3. Aluno inicial para testes imediatos (RF01)
  const credAluno = await prisma.credencial.create({
    data: { login: "aluno", senhaHash: gerarSenhaHash("123456") },
  });
  const alunoSergio = await prisma.aluno.create({
    data: {
      credencialId: credAluno.id,
      instituicaoId: puc.id,
      nome: "Sérgio Izaías Parreiras Junior",
      email: "sergio@pucminas.br",
      cpf: "99988877766",
      rg: "MG1234567",
      endereco: "Av. Dom José Gaspar, 500 - Belo Horizonte",
      curso: "Engenharia de Software",
      saldo: 350,
    },
  });

  // 4. Transação inicial de envio para constar no extrato (RF05, RF07)
  const txInicial = await prisma.transacao.create({ data: { valor: 350 } });
  await prisma.envioMoedas.create({
    data: {
      transacaoId: txInicial.id,
      professorId: profMilena.id,
      alunoId: alunoSergio.id,
      motivo: "Excelente modelagem arquitetural e participação nas aulas.",
    },
  });

  // 5. Empresa Parceira e Vantagens iniciais (RF09, RF10)
  const credEmp = await prisma.credencial.create({
    data: { login: "empresa", senhaHash: gerarSenhaHash("123456") },
  });
  await prisma.empresaParceira.create({
    data: {
      credencialId: credEmp.id,
      nome: "Restaurante Universitário PUC",
      email: "contato@ru.pucminas.br",
      vantagens: {
        create: [
          {
            descricao: "Desconto de 50% no almoço executivo",
            foto: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80",
            custoEmMoedas: 100,
          },
          {
            descricao: "Compra de materiais específicos (Kit Laboratório)",
            foto: "https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?auto=format&fit=crop&w=600&q=80",
            custoEmMoedas: 200,
          },
          {
            descricao: "Desconto de mensalidade (Bolsa Mérito 15%)",
            foto: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=600&q=80",
            custoEmMoedas: 500,
          },
        ],
      },
    },
  });

  console.info("Seed concluído! Logins de teste (senha: 123456): 'aluno', 'professor', 'empresa'");
}

executarSeed()
  .catch((e) => {
    console.error("Erro no seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });