/**
 * Edge Function `gerar-roteiro` (RAÍZES-26).
 *
 * Recebe as preferências e os ids dos lugares candidatos, relê esses lugares
 * no banco, pede à Claude API um roteiro só com eles e devolve o roteiro já
 * validado. A chave da IA fica no secret ANTHROPIC_API_KEY desta função e
 * nunca vai para o app. Não grava nada: salvar e ajustar é das tasks #51/#52.
 *
 * As regras (validação, filtros, prompt, conferência da resposta) estão em
 * ../_shared/roteiroIa.ts, testadas no Vitest. Aqui fica só o encanamento.
 */
import Anthropic from "npm:@anthropic-ai/sdk@1.3.0";
import { createClient } from "npm:@supabase/supabase-js@2.117.3";
import { corsHeaders } from "npm:@supabase/supabase-js@2.117.3/cors";

import {
  ERROS,
  erroDaFalhaIa,
  idsConsultaveis,
  interpretarMensagem,
  LIMITES_PEDIDO,
  montarRequisicaoClaude,
  prepararCandidatos,
  SELECT_CANDIDATO,
  validarPedido,
  validarRespostaIa,
  type RoteiroIa,
  type TipoErro,
} from "../_shared/roteiroIa.ts";

/** Cada tentativa; o SDK refaz uma vez em timeout, 429 e 5xx. */
const TIMEOUT_TENTATIVA_MS = 25_000;
const MAX_RETRIES = 1;
/** Teto das duas tentativas somadas, para a tela não ficar presa. */
const PRAZO_TOTAL_MS = 45_000;

/** Só tipos, números e contagens: nunca corpo, coordenada, usuário ou acessibilidade. */
type Registro = {
  resultado: "ok" | TipoErro;
  status: number;
  duracaoMs: number;
  detalhe?: string;
  candidatos?: number;
  paradas?: number;
  modelo?: string;
};

type Desfecho = { resposta: Response; registro: Omit<Registro, "duracaoMs"> };

const chaveIa = Deno.env.get("ANTHROPIC_API_KEY") ?? "";
const anthropic = chaveIa
  ? new Anthropic({ apiKey: chaveIa, timeout: TIMEOUT_TENTATIVA_MS, maxRetries: MAX_RETRIES })
  : null;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const inicio = Date.now();
  let desfecho: Desfecho;
  try {
    desfecho = await atender(req);
  } catch (erro) {
    // Só o nome da classe: a mensagem de um erro inesperado pode carregar dado.
    desfecho = falhar("interno", erro instanceof Error ? erro.name : "desconhecido");
  }
  console.log(
    JSON.stringify({ funcao: "gerar-roteiro", ...desfecho.registro, duracaoMs: Date.now() - inicio }),
  );
  return desfecho.resposta;
});

async function atender(req: Request): Promise<Desfecho> {
  if (req.method !== "POST") return falhar("metodo");

  const autorizacao = req.headers.get("Authorization") ?? "";
  const token = autorizacao.replace(/^Bearer\s+/i, "");
  if (!token) return falhar("nao_autenticado");

  const url = Deno.env.get("SUPABASE_URL");
  const chavePublica = Deno.env.get("SUPABASE_ANON_KEY");
  if (!url || !chavePublica || !anthropic) return falhar("configuracao", "variavel_ausente");

  // Cliente com o token da própria pessoa: o banco aplica o RLS dela.
  // Nunca service_role aqui.
  const supabase = createClient(url, chavePublica, {
    global: { headers: { Authorization: autorizacao } },
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  const { data: usuario, error: erroUsuario } = await supabase.auth.getUser(token);
  if (erroUsuario || !usuario.user) return falhar("nao_autenticado");

  const texto = await req.text();
  if (texto.length > LIMITES_PEDIDO.maxBytesCorpo) return falhar("pedido_invalido", "corpo_grande");
  let corpo: unknown;
  try {
    corpo = JSON.parse(texto);
  } catch {
    return falhar("pedido_invalido", "json");
  }
  const validado = validarPedido(corpo);
  if (!validado.ok) return falhar("pedido_invalido", undefined, validado.erro);
  const pedido = validado.valor;

  // O texto dos lugares vem do banco, não do app: só publicado (arquivado_em
  // nulo, explícito porque curador enxerga arquivado pelo RLS).
  const ids = idsConsultaveis(pedido.candidatoIds);
  let linhas: unknown[] = [];
  if (ids.length > 0) {
    const { data, error } = await supabase
      .from("locais")
      .select(SELECT_CANDIDATO)
      .in("id", ids)
      .is("arquivado_em", null);
    if (error) return falhar("banco");
    linhas = Array.isArray(data) ? data : [];
  }
  const candidatos = prepararCandidatos(linhas, pedido);
  if (candidatos.length === 0) return falhar("sem_candidatos");

  let mensagem: Anthropic.Beta.BetaMessage;
  try {
    mensagem = await anthropic.beta.messages.create(montarRequisicaoClaude(pedido, candidatos), {
      signal: AbortSignal.timeout(PRAZO_TOTAL_MS),
    });
  } catch (erro) {
    return falharChamadaIa(erro);
  }

  const lida = interpretarMensagem(mensagem);
  if (!lida.ok) return falhar(erroDaFalhaIa(lida.motivo), lida.motivo);
  const validada = validarRespostaIa(lida.json, candidatos, pedido);
  if (!validada.ok) return falhar(erroDaFalhaIa(validada.motivo), validada.motivo);

  const roteiro: RoteiroIa = validada.roteiro;
  return {
    resposta: json(200, roteiro),
    registro: {
      resultado: "ok",
      status: 200,
      candidatos: candidatos.length,
      paradas: roteiro.paradas.length,
      // Mostra quando o fallback serviu a resposta.
      modelo: mensagem.model,
    },
  };
}

/** Erro da SDK → erro amigável. Do mais específico para o mais geral. */
function falharChamadaIa(erro: unknown): Desfecho {
  if (erro instanceof Anthropic.APIConnectionTimeoutError) return falhar("timeout", "ia_timeout");
  if (erro instanceof Anthropic.APIUserAbortError) return falhar("timeout", "ia_prazo_total");
  if (erro instanceof Anthropic.RateLimitError) return falhar("ocupado", "ia_429");
  if (erro instanceof Anthropic.AuthenticationError || erro instanceof Anthropic.PermissionDeniedError) {
    return falhar("configuracao", `ia_${erro.status}`);
  }
  if (erro instanceof Anthropic.BadRequestError) return falhar("interno", "ia_400");
  if (erro instanceof Anthropic.APIConnectionError) return falhar("indisponivel", "ia_conexao");
  if (erro instanceof Anthropic.APIError) {
    return falhar(typeof erro.status === "number" && erro.status >= 500 ? "indisponivel" : "interno", `ia_${erro.status}`);
  }
  return falhar("interno", erro instanceof Error ? erro.name : "desconhecido");
}

function falhar(tipo: TipoErro, detalhe?: string, mensagem?: string): Desfecho {
  const { status, mensagem: padrao } = ERROS[tipo];
  return {
    resposta: json(status, { erro: mensagem ?? padrao }),
    registro: { resultado: tipo, status, detalhe },
  };
}

function json(status: number, corpo: unknown): Response {
  return new Response(JSON.stringify(corpo), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" },
  });
}
