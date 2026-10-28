import { FunctionsFetchError, FunctionsHttpError } from "@supabase/supabase-js";

import { supabase } from "../../lib/supabase";
import type {
  PedidoRoteiroIa,
  RoteiroIa,
} from "../../../supabase/functions/_shared/roteiroIa";

// O contrato mora num só lugar (o _shared da Edge Function); o app só
// reexporta para o formulário (#53) e as telas (#51/#52) importarem daqui.
export {
  LIMITES_PEDIDO,
  NECESSIDADES_ACESSIBILIDADE,
  RITMOS,
} from "../../../supabase/functions/_shared/roteiroIa";
export type {
  CidadeRoteiro,
  NecessidadeAcessibilidade,
  ParadaRoteiroIa,
  PedidoRoteiroIa,
  Ritmo,
  RoteiroIa,
} from "../../../supabase/functions/_shared/roteiroIa";

export const ERRO_SEM_SUPABASE =
  "A geração de roteiro precisa do Supabase configurado. Sem ele, use os roteiros temáticos.";
export const ERRO_CONEXAO = "Sem conexão com o servidor. Confira a internet e tente de novo.";
export const ERRO_GENERICO = "Não foi possível gerar o roteiro agora. Tente de novo.";
export const ERRO_LOGIN = "Entre na sua conta para gerar um roteiro.";

/** Acima do pior caso da função (duas tentativas de 25 s, com teto de 45 s). */
const TIMEOUT_MS = 60_000;

/** Erro com mensagem pronta para a tela. `status` é o HTTP da função, quando houve. */
export class ErroGerarRoteiro extends Error {
  constructor(
    message: string,
    readonly status: number | null = null,
  ) {
    super(message);
    this.name = "ErroGerarRoteiro";
  }
}

/**
 * Pede um roteiro à Edge Function `gerar-roteiro`. Precisa de pessoa logada
 * (a função responde 401 com mensagem própria). Não salva o roteiro.
 */
export async function gerarRoteiroIa(pedido: PedidoRoteiroIa): Promise<RoteiroIa> {
  if (!supabase) {
    throw new ErroGerarRoteiro(ERRO_SEM_SUPABASE);
  }

  // O servidor só usa o id e relê o resto no banco: não há por que mandar
  // nome, coordenada ou outro dado do lugar.
  const body: PedidoRoteiroIa = {
    ...pedido,
    candidatos: pedido.candidatos.map(({ id }) => ({ id })),
  };

  const { data, error } = await supabase.functions.invoke<RoteiroIa>("gerar-roteiro", {
    body,
    timeout: TIMEOUT_MS,
  });
  if (error) {
    throw await paraErroAmigavel(error);
  }
  if (!ehRoteiro(data)) {
    throw new ErroGerarRoteiro(ERRO_GENERICO);
  }
  return data;
}

async function paraErroAmigavel(error: unknown): Promise<ErroGerarRoteiro> {
  if (error instanceof FunctionsHttpError) {
    const resposta: unknown = error.context;
    const status = resposta instanceof Response ? resposta.status : null;
    const mensagem = resposta instanceof Response ? await mensagemDoCorpo(resposta) : null;
    // 401 do gateway (antes da função rodar) vem sem `{ erro }`.
    const padrao = status === 401 ? ERRO_LOGIN : ERRO_GENERICO;
    return new ErroGerarRoteiro(mensagem ?? padrao, status);
  }
  if (error instanceof FunctionsFetchError) {
    return new ErroGerarRoteiro(ERRO_CONEXAO);
  }
  return new ErroGerarRoteiro(ERRO_GENERICO);
}

/** A função sempre responde `{ erro }` em português; qualquer outra coisa vira null. */
async function mensagemDoCorpo(resposta: Response): Promise<string | null> {
  try {
    const corpo: unknown = await resposta.json();
    if (corpo && typeof corpo === "object" && "erro" in corpo) {
      const erro = (corpo as { erro: unknown }).erro;
      return typeof erro === "string" && erro.trim() ? erro : null;
    }
  } catch {
    // Corpo vazio ou HTML do gateway: fica a mensagem genérica.
  }
  return null;
}

function ehRoteiro(valor: unknown): valor is RoteiroIa {
  if (!valor || typeof valor !== "object") return false;
  const roteiro = valor as Partial<RoteiroIa>;
  return (
    roteiro.geradoPorIa === true &&
    typeof roteiro.titulo === "string" &&
    Array.isArray(roteiro.paradas) &&
    roteiro.paradas.length > 0
  );
}
