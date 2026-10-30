import { useCallback, useEffect, useState } from "react";
import { useAvisos } from "./contextos.tsx";

/** Carrega um recurso ao montar; `carregar` precisa ser estável (ex.: `api.consultarAluno`). `recarregar` refaz a consulta. */
export function useRecurso<T>(carregar: () => Promise<T>): Readonly<{ dados?: T; recarregar: () => Promise<void> }> {
  const [dados, definir] = useState<T>();
  const { falhar } = useAvisos();
  const recarregar = useCallback(() => carregar().then(definir, falhar), [carregar, falhar]);
  useEffect(() => {
    void recarregar();
  }, [recarregar]);
  return { dados, recarregar };
}
