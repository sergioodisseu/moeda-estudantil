import { useState } from "react";
import { AvisoGlobal } from "./componentes/AvisoGlobal.tsx";
import { Cabecalho } from "./componentes/Cabecalho.tsx";
import type { Perfil } from "./dominio/tipos.ts";
import { CadastroPage } from "./paginas/CadastroPage.tsx";
import { LoginPage } from "./paginas/LoginPage.tsx";
import { PainelAlunoPage } from "./paginas/PainelAlunoPage.tsx";
import { PainelEmpresaPage } from "./paginas/PainelEmpresaPage.tsx";
import { PainelProfessorPage } from "./paginas/PainelProfessorPage.tsx";
import { ProvedorAvisos, ProvedorSessao, useSessao } from "./sessao/contextos.tsx";

const PAINEIS: Readonly<Record<Perfil, () => React.ReactElement>> = {
  ALUNO: PainelAlunoPage,
  PROFESSOR: PainelProfessorPage,
  EMPRESA_PARCEIRA: PainelEmpresaPage,
};

function Rotas() {
  const { sessao } = useSessao();
  const [cadastrando, definirCadastrando] = useState(false);

  if (sessao) {
    const Painel = PAINEIS[sessao.perfil];
    return (
      <>
        <Cabecalho />
        <main className="max-w-5xl mx-auto px-4 py-8">
          <Painel key={sessao.perfil} />
        </main>
      </>
    );
  }
  return cadastrando ? (
    <CadastroPage aoVoltar={() => definirCadastrando(false)} />
  ) : (
    <LoginPage aoCadastrar={() => definirCadastrando(true)} />
  );
}

export function App() {
  return (
    <ProvedorAvisos>
      <ProvedorSessao>
        <AvisoGlobal />
        <Rotas />
      </ProvedorSessao>
    </ProvedorAvisos>
  );
}
