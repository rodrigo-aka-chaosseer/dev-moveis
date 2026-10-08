/**
 * Autentica e-mail e senha. Com Supabase configurado, pergunta ao servidor
 * (`signInWithPassword`); sem, cai na credencial de demonstração do
 * protótipo, para o fluxo continuar testável em quem não tem `.env`.
 *
 * A senha vai na requisição e morre aqui: nada dela é gravado no aparelho.
 */
import { supabase } from "../lib/supabase";
import {
  credenciaisSaoValidas,
  normalizarEmail,
  type DadosLogin,
} from "./validarLogin";

export type ResultadoAutenticacao =
  | { ok: true; email: string; usuarioId?: string }
  | { ok: false; mensagem: string };

const MENSAGEM_CREDENCIAL = "E-mail ou senha incorretos.";
const MENSAGEM_REDE = "Sem conexão com o servidor. Tenta de novo em instantes.";
const MENSAGEM_NAO_CONFIRMADO = "Confirme seu e-mail antes de entrar.";

export async function autenticar(dados: DadosLogin): Promise<ResultadoAutenticacao> {
  const email = normalizarEmail(dados.email);

  if (!supabase) {
    return credenciaisSaoValidas(dados)
      ? { ok: true, email }
      : { ok: false, mensagem: MENSAGEM_CREDENCIAL };
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: dados.senha,
    });

    if (error) {
      return { ok: false, mensagem: traduzirErro(error.message, error.status) };
    }

    return {
      ok: true,
      email: data.user?.email ?? email,
      usuarioId: data.user?.id,
    };
  } catch {
    return { ok: false, mensagem: MENSAGEM_REDE };
  }
}

/** Encerra a sessão no servidor. Falha de rede não impede sair localmente. */
export async function encerrarAutenticacao(): Promise<void> {
  if (!supabase) return;
  try {
    await supabase.auth.signOut();
  } catch (erro) {
    console.warn("Não foi possível encerrar a sessão no servidor.", erro);
  }
}

function traduzirErro(mensagem: string, status?: number): string {
  const texto = mensagem.toLowerCase();
  if (texto.includes("invalid login credentials")) return MENSAGEM_CREDENCIAL;
  if (texto.includes("email not confirmed")) return MENSAGEM_NAO_CONFIRMADO;
  if (status === undefined || status >= 500) return MENSAGEM_REDE;
  return MENSAGEM_CREDENCIAL;
}
