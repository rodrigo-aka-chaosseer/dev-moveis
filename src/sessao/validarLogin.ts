/**
 * Validação local do formulário de login. Primeiro confere o formato dos
 * campos e, enquanto o backend não existe, compara com uma credencial de
 * demonstração para que o fluxo completo possa ser testado.
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

/**
 * Credencial temporária usada somente no protótipo.
 *
 * BACKEND: remover esta constante quando a autenticação real estiver pronta.
 */
export const CREDENCIAL_DEMONSTRACAO: DadosLogin = {
  email: "usuario@raizes.com",
  senha: "123456",
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

/** Compara as credenciais já preenchidas com o acesso local do protótipo. */
export function credenciaisSaoValidas(dados: DadosLogin): boolean {
  return (
    normalizarEmail(dados.email) === CREDENCIAL_DEMONSTRACAO.email &&
    dados.senha === CREDENCIAL_DEMONSTRACAO.senha
  );
}
