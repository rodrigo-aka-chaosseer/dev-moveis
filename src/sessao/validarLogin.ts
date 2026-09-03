/**
 * Validação de formato do formulário de login. Só formato: confere se o
 * e-mail tem cara de e-mail e se a senha foi preenchida. Não confere se a
 * senha está certa, porque sem servidor não existe "certa".
 *
 * BACKEND: continua igual. Quem diz se a credencial confere é o servidor.
 */

export type DadosLogin = {
  email: string;
  senha: string;
};

export type ErrosLogin = {
  email?: string;
  senha?: string;
};

// Regex de propósito simples: "alguma coisa @ alguma coisa . alguma coisa".
// Quem valida e-mail de verdade é o servidor mandando o link.
const FORMATO_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizarEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** Devolve objeto vazio quando está tudo certo. */
export function validarLogin(dados: DadosLogin): ErrosLogin {
  const erros: ErrosLogin = {};

  if (!FORMATO_EMAIL.test(normalizarEmail(dados.email))) {
    erros.email = "Esse e-mail não está certo.";
  }

  if (dados.senha.length === 0) {
    erros.senha = "Falta a senha.";
  }

  return erros;
}
