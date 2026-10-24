import { PrismaClient } from "@prisma/client";
import { InstituicaoEnsino } from "../../model/dominio/InstituicaoEnsino";
import { Aluno } from "../../model/dominio/Aluno";
import { Professor } from "../../model/dominio/Professor";
import { EmpresaParceira } from "../../model/dominio/EmpresaParceira";
import { Vantagem } from "../../model/dominio/Vantagem";
import { Transacao, EnvioMoedas, Resgate } from "../../model/dominio/Transacao";
import {
  InstituicaoEnsinoRepository,
  AlunoRepository,
  ProfessorRepository,
  EmpresaParceiraRepository,
  VantagemRepository,
  TransacaoRepository,
} from "../../model/interfaces/InterfacesSaida";

const hidratarEmpresa = (r: { id: number; nome: string; email: string; credencial: { login: string; senhaHash: string } }) =>
  new EmpresaParceira({ id: r.id, login: r.credencial.login, senhaHash: r.credencial.senhaHash, nome: r.nome, email: r.email });

const hidratarVantagem = (r: {
  id: number;
  descricao: string;
  foto: string;
  custoEmMoedas: number;
  empresa: { id: number; nome: string; email: string; credencial: { login: string; senhaHash: string } };
}) => new Vantagem(r.id, r.descricao, r.foto, r.custoEmMoedas, hidratarEmpresa(r.empresa));

const hidratarAlunoSimples = (r: {
  id: number;
  nome: string;
  email: string;
  cpf: string;
  rg: string;
  endereco: string;
  curso: string;
  saldo: number;
  credencial: { login: string; senhaHash: string };
  instituicao: { id: number; nome: string };
}) =>
  new Aluno({
    ...r,
    login: r.credencial.login,
    senhaHash: r.credencial.senhaHash,
    instituicao: new InstituicaoEnsino(r.instituicao.id, r.instituicao.nome),
  });

const hidratarProfSimples = (r: {
  id: number;
  nome: string;
  cpf: string;
  departamento: string;
  saldo: number;
  credencial: { login: string; senhaHash: string };
  instituicao: { id: number; nome: string };
}) =>
  new Professor({
    ...r,
    login: r.credencial.login,
    senhaHash: r.credencial.senhaHash,
    instituicao: new InstituicaoEnsino(r.instituicao.id, r.instituicao.nome),
  });

export class PrismaInstituicaoEnsinoRepository implements InstituicaoEnsinoRepository {
  constructor(private readonly prisma: PrismaClient) {}

  public async buscarPorId(id: number): Promise<InstituicaoEnsino | null> {
    const r = await this.prisma.instituicaoEnsino.findUnique({ where: { id } });
    return r ? new InstituicaoEnsino(r.id, r.nome) : null;
  }

  public async listarTodas(): Promise<InstituicaoEnsino[]> {
    const lista = await this.prisma.instituicaoEnsino.findMany({ orderBy: { id: "asc" } });
    return lista.map((r) => new InstituicaoEnsino(r.id, r.nome));
  }
}

export class PrismaEmpresaParceiraRepository implements EmpresaParceiraRepository {
  constructor(private readonly prisma: PrismaClient) {}

  public async criar(empresa: EmpresaParceira): Promise<EmpresaParceira> {
    const d = empresa.exportarDados();
    const r = await this.prisma.empresaParceira.create({
      data: { nome: d.nome, email: d.email, credencial: { create: { login: d.login, senhaHash: d.senhaHash } } },
      include: { credencial: true },
    });
    return hidratarEmpresa(r);
  }

  public async buscarPorId(id: number): Promise<EmpresaParceira | null> {
    const r = await this.prisma.empresaParceira.findUnique({ where: { id }, include: { credencial: true } });
    return r ? hidratarEmpresa(r) : null;
  }

  public async buscarPorLogin(login: string): Promise<EmpresaParceira | null> {
    const c = await this.prisma.credencial.findUnique({ where: { login }, include: { empresaParceira: true } });
    if (!c || !c.empresaParceira) return null;
    return hidratarEmpresa({ ...c.empresaParceira, credencial: c });
  }

  public async atualizar(empresa: EmpresaParceira): Promise<EmpresaParceira> {
    const d = empresa.exportarDados();
    const r = await this.prisma.empresaParceira.update({
      where: { id: d.id },
      data: { nome: d.nome, email: d.email, credencial: { update: { login: d.login, senhaHash: d.senhaHash } } },
      include: { credencial: true },
    });
    return hidratarEmpresa(r);
  }

  public async excluir(id: number): Promise<void> {
    const emp = await this.prisma.empresaParceira.findUnique({ where: { id } });
    if (emp) await this.prisma.credencial.delete({ where: { id: emp.credencialId } });
  }
}

export class PrismaVantagemRepository implements VantagemRepository {
  constructor(private readonly prisma: PrismaClient) {}

  public async criar(vantagem: Vantagem, empresaId: number): Promise<Vantagem> {
    const d = vantagem.exportarDados();
    const r = await this.prisma.vantagem.create({
      data: { descricao: d.descricao, foto: d.foto, custoEmMoedas: d.custoEmMoedas, empresaId },
      include: { empresa: { include: { credencial: true } } },
    });
    return hidratarVantagem(r);
  }

  public async buscarPorId(id: number): Promise<Vantagem | null> {
    const r = await this.prisma.vantagem.findUnique({ where: { id }, include: { empresa: { include: { credencial: true } } } });
    return r ? hidratarVantagem(r) : null;
  }

  public async listarTodas(): Promise<Vantagem[]> {
    const lista = await this.prisma.vantagem.findMany({ include: { empresa: { include: { credencial: true } } }, orderBy: { id: "asc" } });
    return lista.map(hidratarVantagem);
  }
}

export class PrismaTransacaoRepository implements TransacaoRepository {
  constructor(private readonly prisma: PrismaClient) {}

  public async registrarEnvioAtomico(professor: Professor, aluno: Aluno, envio: EnvioMoedas): Promise<EnvioMoedas> {
    const dp = professor.exportarDados();
    const da = aluno.exportarDados();
    const de = envio.exportarDados();

    const salvo = await this.prisma.$transaction(async (tx) => {
      await tx.professor.update({ where: { id: dp.id }, data: { saldo: dp.saldo } });
      await tx.aluno.update({ where: { id: da.id }, data: { saldo: da.saldo } });
      const base = await tx.transacao.create({ data: { valor: de.valor as number } });
      await tx.envioMoedas.create({
        data: { transacaoId: base.id, professorId: dp.id, alunoId: da.id, motivo: de.motivo as string },
      });
      return base;
    });
    return new EnvioMoedas(salvo.id, salvo.dataHora, salvo.valor, de.motivo as string, professor, aluno);
  }

  public async registrarResgateAtomico(aluno: Aluno, vantagemId: number, resgate: Resgate): Promise<Resgate> {
    const da = aluno.exportarDados();
    const dr = resgate.exportarDados();

    const { base, vant } = await this.prisma.$transaction(async (tx) => {
      await tx.aluno.update({ where: { id: da.id }, data: { saldo: da.saldo } });
      const b = await tx.transacao.create({ data: { valor: dr.valor as number } });
      const r = await tx.resgate.create({
        data: { transacaoId: b.id, alunoId: da.id, vantagemId, codigo: dr.codigo as string },
        include: { vantagem: { include: { empresa: { include: { credencial: true } } } } },
      });
      return { base: b, vant: r.vantagem };
    });
    return new Resgate(base.id, base.dataHora, base.valor, dr.codigo as string, aluno, hidratarVantagem(vant));
  }

  public async listarPorAluno(alunoId: number): Promise<Transacao[]> {
    const envios = await this.prisma.envioMoedas.findMany({
      where: { alunoId },
      include: {
        transacao: true,
        professor: { include: { credencial: true, instituicao: true } },
        aluno: { include: { credencial: true, instituicao: true } },
      },
    });
    const resgates = await this.prisma.resgate.findMany({
      where: { alunoId },
      include: {
        transacao: true,
        aluno: { include: { credencial: true, instituicao: true } },
        vantagem: { include: { empresa: { include: { credencial: true } } } },
      },
    });
    const eList: Transacao[] = envios.map(
      (e) => new EnvioMoedas(e.transacaoId, e.transacao.dataHora, e.transacao.valor, e.motivo, hidratarProfSimples(e.professor), hidratarAlunoSimples(e.aluno))
    );
    const rList: Transacao[] = resgates.map(
      (r) => new Resgate(r.transacaoId, r.transacao.dataHora, r.transacao.valor, r.codigo, hidratarAlunoSimples(r.aluno), hidratarVantagem(r.vantagem))
    );
    return [...eList, ...rList].sort(
      (a, b) => new Date(b.exportarDados().dataHora as Date).getTime() - new Date(a.exportarDados().dataHora as Date).getTime()
    );
  }

  public async listarPorProfessor(professorId: number): Promise<EnvioMoedas[]> {
    const envios = await this.prisma.envioMoedas.findMany({
      where: { professorId },
      include: {
        transacao: true,
        professor: { include: { credencial: true, instituicao: true } },
        aluno: { include: { credencial: true, instituicao: true } },
      },
      orderBy: { transacao: { dataHora: "desc" } },
    });
    return envios.map(
      (e) => new EnvioMoedas(e.transacaoId, e.transacao.dataHora, e.transacao.valor, e.motivo, hidratarProfSimples(e.professor), hidratarAlunoSimples(e.aluno))
    );
  }
}

export class PrismaAlunoRepository implements AlunoRepository {
  constructor(private readonly prisma: PrismaClient, private readonly txRepo: TransacaoRepository) {}

  public async criar(aluno: Aluno): Promise<Aluno> {
    const d = aluno.exportarDados();
    const r = await this.prisma.aluno.create({
      data: {
        nome: d.nome,
        email: d.email,
        cpf: d.cpf,
        rg: d.rg,
        endereco: d.endereco,
        curso: d.curso,
        saldo: d.saldo,
        instituicao: { connect: { id: d.instituicao.id } },
        credencial: { create: { login: d.login, senhaHash: d.senhaHash } },
      },
      include: { credencial: true, instituicao: true },
    });
    return hidratarAlunoSimples(r);
  }

  public async buscarPorId(id: number): Promise<Aluno | null> {
    const r = await this.prisma.aluno.findUnique({ where: { id }, include: { credencial: true, instituicao: true } });
    if (!r) return null;
    const historico = await this.txRepo.listarPorAluno(id);
    return new Aluno({
      ...r,
      login: r.credencial.login,
      senhaHash: r.credencial.senhaHash,
      instituicao: new InstituicaoEnsino(r.instituicao.id, r.instituicao.nome),
      historico,
    });
  }

  public async buscarPorLogin(login: string): Promise<Aluno | null> {
    const c = await this.prisma.credencial.findUnique({ where: { login }, include: { aluno: { include: { instituicao: true } } } });
    if (!c || !c.aluno) return null;
    return hidratarAlunoSimples({ ...c.aluno, credencial: c });
  }

  public async listarTodos(): Promise<Aluno[]> {
    const lista = await this.prisma.aluno.findMany({ include: { credencial: true, instituicao: true }, orderBy: { nome: "asc" } });
    return lista.map(hidratarAlunoSimples);
  }

  public async atualizar(aluno: Aluno): Promise<Aluno> {
    const d = aluno.exportarDados();
    const r = await this.prisma.aluno.update({
      where: { id: d.id },
      data: {
        nome: d.nome,
        email: d.email,
        cpf: d.cpf,
        rg: d.rg,
        endereco: d.endereco,
        curso: d.curso,
        instituicao: { connect: { id: d.instituicao.id } },
        credencial: { update: { login: d.login, senhaHash: d.senhaHash } },
      },
      include: { credencial: true, instituicao: true },
    });
    return hidratarAlunoSimples(r);
  }

  public async excluir(id: number): Promise<void> {
    const a = await this.prisma.aluno.findUnique({ where: { id } });
    if (a) await this.prisma.credencial.delete({ where: { id: a.credencialId } });
  }
}

export class PrismaProfessorRepository implements ProfessorRepository {
  constructor(private readonly prisma: PrismaClient, private readonly txRepo: TransacaoRepository) {}

  public async buscarPorId(id: number): Promise<Professor | null> {
    const r = await this.prisma.professor.findUnique({ where: { id }, include: { credencial: true, instituicao: true } });
    if (!r) return null;
    const historico = await this.txRepo.listarPorProfessor(id);
    return new Professor({
      ...r,
      login: r.credencial.login,
      senhaHash: r.credencial.senhaHash,
      instituicao: new InstituicaoEnsino(r.instituicao.id, r.instituicao.nome),
      historico,
    });
  }

  public async buscarPorLogin(login: string): Promise<Professor | null> {
    const c = await this.prisma.credencial.findUnique({ where: { login }, include: { professor: { include: { instituicao: true } } } });
    if (!c || !c.professor) return null;
    return hidratarProfSimples({ ...c.professor, credencial: c });
  }

  public async listarTodos(): Promise<Professor[]> {
    const lista = await this.prisma.professor.findMany({ include: { credencial: true, instituicao: true } });
    return lista.map(hidratarProfSimples);
  }

  public async atualizarSaldosEmLote(professores: Professor[]): Promise<void> {
    await this.prisma.$transaction(
      professores.map((p) => {
        const d = p.exportarDados();
        return this.prisma.professor.update({ where: { id: d.id }, data: { saldo: d.saldo } });
      })
    );
  }
}