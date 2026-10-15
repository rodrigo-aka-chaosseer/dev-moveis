import { supabase } from "../lib/supabase";
import {
  credenciaisSaoValidas,
  normalizarEmail,
  type DadosLogin,
} from "./validarLogin";

type SucessoLogin = {
  ok: true;
  email: string;
  nome?: string;
};

export type ResultadoAutenticacao =
  | SucessoLogin
  | { ok: false; mensagem: string };

export type ResultadoCadastro =
  | (SucessoLogin & { precisaConfirmarEmail: boolean })
  | { ok: false; mensagem: string };

const MENSAGEM_CREDENCIAL = "E-mail ou senha incorretos.";
const MENSAGEM_REDE = "Sem conexão com o servidor. Tente novamente em instantes.";

export async function autenticar(
  dados: DadosLogin,
): Promise<ResultadoAutenticacao> {
  const email = normalizarEmail(dados.email);

  if (!supabase) {
    return credenciaisSaoValidas(dados)
      ? { ok: true, email, nome: "Ana Silva" }
      : { ok: false, mensagem: MENSAGEM_CREDENCIAL };
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: dados.senha,
    });
    if (error) {
      return { ok: false, mensagem: traduzirErroLogin(error.message, error.status) };
    }
    const nome = lerNome(data.user?.user_metadata);
    return { ok: true, email: data.user?.email ?? email, nome };
  } catch {
    return { ok: false, mensagem: MENSAGEM_REDE };
  }
}

export async function cadastrar(dados: {
  nome: string;
  email: string;
  senha: string;
}): Promise<ResultadoCadastro> {
  if (!supabase) {
    return {
      ok: false,
      mensagem:
        "O cadastro precisa do Supabase configurado. Adicione as variáveis do arquivo .env.example.",
    };
  }

  const email = normalizarEmail(dados.email);
  const nome = dados.nome.trim();

  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password: dados.senha,
      options: { data: { nome } },
    });
    if (error) {
      return { ok: false, mensagem: traduzirErroCadastro(error.message) };
    }
    return {
      ok: true,
      email: data.user?.email ?? email,
      nome,
      precisaConfirmarEmail: data.session === null,
    };
  } catch {
    return { ok: false, mensagem: MENSAGEM_REDE };
  }
}

export async function encerrarAutenticacao(): Promise<void> {
  if (!supabase) return;
  try {
    await supabase.auth.signOut();
  } catch (erro) {
    console.warn("Não foi possível encerrar a sessão no servidor.", erro);
  }
}

function lerNome(metadados: unknown): string | undefined {
  if (typeof metadados !== "object" || metadados === null) return undefined;
  const nome = (metadados as Record<string, unknown>).nome;
  return typeof nome === "string" && nome.trim() ? nome.trim() : undefined;
}

function traduzirErroLogin(mensagem: string, status?: number): string {
  const texto = mensagem.toLowerCase();
  if (texto.includes("email not confirmed")) {
    return "Confirme seu e-mail antes de entrar.";
  }
  if (texto.includes("invalid login credentials")) return MENSAGEM_CREDENCIAL;
  if (status === undefined || status >= 500) return MENSAGEM_REDE;
  return MENSAGEM_CREDENCIAL;
}

function traduzirErroCadastro(mensagem: string): string {
  const texto = mensagem.toLowerCase();
  if (texto.includes("already registered") || texto.includes("already been registered")) {
    return "Já existe uma conta com este e-mail.";
  }
  if (texto.includes("password")) {
    return "A senha não atende aos requisitos de segurança.";
  }
  if (texto.includes("email")) return "Esse e-mail não pôde ser cadastrado.";
  return "Não foi possível criar a conta. Tente novamente.";
}
