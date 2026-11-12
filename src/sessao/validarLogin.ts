/**
 * Validação local do formulário de login. Primeiro confere o formato dos
 * campos. A confirmação das credenciais pertence exclusivamente ao
 * Supabase Auth; não existe conta fixa ou senha de demonstração no app.
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
