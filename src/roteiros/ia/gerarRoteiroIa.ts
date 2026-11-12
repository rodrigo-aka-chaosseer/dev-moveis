import { FunctionsFetchError, FunctionsHttpError } from "@supabase/supabase-js";

import { supabase } from "../../lib/supabase";
import type {
  PedidoRoteiroIa,
  RoteiroIa,
} from "../../../supabase/functions/_shared/roteiroIa";
import {
  LIMITES_RESPOSTA,
  maxParadasPara,
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
export const ERRO_RESPOSTA_INVALIDA =
  "A sugestão recebida não é segura para exibição. Tente gerar novamente.";
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
  if (!validarRoteiroRecebido(data, pedido)) {
    throw new ErroGerarRoteiro(ERRO_RESPOSTA_INVALIDA);
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

/**
 * Segunda barreira, no aparelho, para nunca renderizar diretamente uma
 * resposta corrompida ou adulterada. O servidor faz a validação principal;
 * aqui o resultado ainda precisa bater com o pedido e seus IDs candidatos.
 */
export function validarRoteiroRecebido(
  valor: unknown,
  pedido: PedidoRoteiroIa,
): valor is RoteiroIa {
  if (!ehObjeto(valor) || valor.geradoPorIa !== true) return false;
  if (!textoValido(valor.titulo, LIMITES_RESPOSTA.tituloMax)) return false;
  if (!textoValido(valor.descricao, LIMITES_RESPOSTA.descricaoMax)) return false;
  if (!Array.isArray(valor.paradas) || valor.paradas.length === 0) return false;

  const maximo = maxParadasPara(pedido.tempoDisponivelMin, pedido.ritmo ?? "moderado");
  if (valor.paradas.length > maximo) return false;

  const candidatos = new Set(pedido.candidatos.map(({ id }) => id));
  const vistos = new Set<string>();
  let somaDuracoes = 0;

  for (const [indice, parada] of valor.paradas.entries()) {
    if (!ehObjeto(parada) || typeof parada.localId !== "string") return false;
    if (!candidatos.has(parada.localId) || vistos.has(parada.localId)) return false;
    if (parada.ordem !== indice + 1) return false;
    if (
      !ehInteiro(parada.duracaoMin) ||
      parada.duracaoMin < LIMITES_RESPOSTA.duracaoParadaMin ||
      parada.duracaoMin > LIMITES_RESPOSTA.duracaoParadaMax
    ) {
      return false;
    }
    if (!textoValido(parada.justificativa, LIMITES_RESPOSTA.justificativaMax)) return false;
    if (typeof parada.acessibilidadeNaoConfirmada !== "boolean") return false;
    vistos.add(parada.localId);
    somaDuracoes += parada.duracaoMin;
  }

  if (!inteiroNaoNegativo(valor.duracaoMin)) return false;
  if (valor.duracaoMin < somaDuracoes || valor.duracaoMin > pedido.tempoDisponivelMin) return false;
  if (!inteiroNaoNegativo(valor.distanciaMetros)) return false;
  if (valor.custoCentavos !== null && !inteiroNaoNegativo(valor.custoCentavos)) return false;
  if (
    pedido.orcamentoCentavos !== null &&
    pedido.orcamentoCentavos !== undefined &&
    typeof valor.custoCentavos === "number" &&
    valor.custoCentavos > pedido.orcamentoCentavos
  ) {
    return false;
  }
  return (
    Array.isArray(valor.avisos) &&
    valor.avisos.every((aviso) => textoValido(aviso, LIMITES_RESPOSTA.avisoMax))
  );
}

function ehObjeto(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === "object" && valor !== null && !Array.isArray(valor);
}

function textoValido(valor: unknown, maximo: number): valor is string {
  return typeof valor === "string" && valor.trim().length > 0 && valor.trim().length <= maximo;
}

function inteiroNaoNegativo(valor: unknown): valor is number {
  return ehInteiro(valor) && valor >= 0;
}

function ehInteiro(valor: unknown): valor is number {
  return typeof valor === "number" && Number.isInteger(valor);
}
