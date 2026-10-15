import { normalizarEmail, validarLogin } from "./validarLogin";

export type DadosCadastro = {
  nome: string;
  email: string;
  senha: string;
  confirmarSenha: string;
};

export type ErrosCadastro = Partial<Record<keyof DadosCadastro, string>>;

export function validarCadastro(dados: DadosCadastro): ErrosCadastro {
  const erros: ErrosCadastro = {};
  const login = validarLogin({ email: dados.email, senha: dados.senha });

  if (dados.nome.trim().length < 2) {
    erros.nome = "Digite seu nome.";
  }
  if (login.email) erros.email = login.email;
  if (dados.senha.length < 8) {
    erros.senha = "Use pelo menos 8 caracteres.";
  }
  if (dados.confirmarSenha !== dados.senha) {
    erros.confirmarSenha = "As senhas não são iguais.";
  }
  return erros;
}

export function normalizarCadastro(dados: DadosCadastro) {
  return {
    nome: dados.nome.trim(),
    email: normalizarEmail(dados.email),
    senha: dados.senha,
  };
}
