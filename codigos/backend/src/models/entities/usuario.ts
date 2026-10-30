export type Usuario = Readonly<{ id: number; login: string; senhaHash: string }>;

export type VerificarSenha = (senha: string, senhaHash: string) => Promise<boolean>;

/** Usuario.autenticar(login, senha): boolean — a verificação do hash é injetada (I/O fica fora do domínio). */
export async function autenticar(
  usuario: Usuario,
  login: string,
  senha: string,
  verificarSenha: VerificarSenha,
): Promise<boolean> {
  return usuario.login === login && (await verificarSenha(senha, usuario.senhaHash));
}
