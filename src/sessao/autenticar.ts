import { supabase } from "../lib/supabase";
import {
  normalizarEmail,
  type DadosLogin,
} from "./validarLogin";

type SucessoLogin = {
  ok: true;
  email: string;
  nome?: string;
  /** `user.id` do Supabase. Não existe no modo mock, sem `.env`. */
  usuarioId?: string;
};

export type ResultadoAutenticacao =
  | SucessoLogin
  | { ok: false; mensagem: string };

export type ResultadoCadastro =
  | (SucessoLogin & { precisaConfirmarEmail: boolean })
  | { ok: false; mensagem: string };

const MENSAGEM_CREDENCIAL = "E-mail ou senha incorretos.";
const MENSAGEM_REDE = "Sem conexão com o servidor. Tente novamente em instantes.";
export const MENSAGEM_SUPABASE_NAO_CONFIGURADO =
  "Não foi possível acessar sua conta agora. Use o modo visitante ou tente novamente mais tarde.";

export async function autenticar(
  dados: DadosLogin,
): Promise<ResultadoAutenticacao> {
  const email = normalizarEmail(dados.email);

  if (!supabase) {
    return { ok: false, mensagem: MENSAGEM_SUPABASE_NAO_CONFIGURADO };
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: dados.senha,
    });
    if (error) {
      return { ok: false, mensagem: traduzirErroLogin(error.message, error.status) };
    }
    if (!data.user) return { ok: false, mensagem: MENSAGEM_CREDENCIAL };
    const nome = lerNome(data.user.user_metadata);
    return {
      ok: true,
      email: data.user.email ?? email,
      nome,
      usuarioId: data.user.id,
    };
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
      mensagem: MENSAGEM_SUPABASE_NAO_CONFIGURADO,
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
    if (!data.user) {
      return { ok: false, mensagem: "Não foi possível criar a conta. Tente novamente." };
    }
    return {
      ok: true,
      email: data.user.email ?? email,
      nome,
      usuarioId: data.user.id,
      precisaConfirmarEmail: data.session === null,
    };
  } catch {
    return { ok: false, mensagem: MENSAGEM_REDE };
  }
}

export async function encerrarAutenticacao(): Promise<void> {
  if (!supabase) return;
  try {
    const { error } = await supabase.auth.signOut({ scope: "local" });
    if (error) console.warn("Não foi possível encerrar a sessão no servidor.", error);
  } catch (erro) {
    console.warn("Não foi possível encerrar a sessão no servidor.", erro);
  }
}

export function lerNome(metadados: unknown): string | undefined {
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
