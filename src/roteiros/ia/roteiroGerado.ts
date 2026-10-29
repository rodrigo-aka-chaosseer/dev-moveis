import type { LocalDetalhe } from "../../locais/listarLocais";
import { calcularParadas } from "../calculos";
import { OPCOES_ORCAMENTO } from "../formulario";
import type { NecessidadeAcessibilidade, RoteiroIa } from "./gerarRoteiroIa";
import { avaliarAcessibilidade, type PreferenciasRecomendacao } from "./prepararCandidatos";

/**
 * O roteiro da IA como a tela mostra e ajusta (RAÍZES-29 e 30): cada parada
 * com o lugar do catálogo resolvido e os totais recalculados no app. Nada
 * daqui é salvo; salvar é outra task.
 */
export type ParadaGerada = {
  local: LocalDetalhe;
  duracaoMin: number;
  /** Por que a parada está no roteiro: da IA, ou o "por que conhecer" numa troca. */
  motivo: string;
  /** Origem do motivo mostrado para a parada. */
  origem: "ia" | "demonstracao" | "troca";
  acessibilidadeNaoConfirmada: boolean;
  /** "HH:MM" de 5 em 5 min, a partir das 09:00, como nos roteiros temáticos. */
  horaSugerida: string;
};

export type RoteiroGerado = {
  titulo: string;
  descricao: string;
  paradas: ParadaGerada[];
  duracaoMin: number;
  distanciaMetros: number;
  custoCentavos: number | null;
  avisos: string[];
  origem: "ia" | "demonstracao";
  /** true depois de remover ou trocar uma parada à mão. */
  ajustado: boolean;
};

export class ErroAjusteRoteiro extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ErroAjusteRoteiro";
  }
}

export const ERRO_SEM_PARADAS_VALIDAS =
  "A sugestão não trouxe lugares do catálogo. Tente gerar outra.";
export const ERRO_ULTIMA_PARADA = "O roteiro precisa de pelo menos uma parada.";
export const ERRO_PARADA_REPETIDA = "Esse lugar já está no roteiro.";

type ParadaBase = Omit<ParadaGerada, "horaSugerida">;

/**
 * Junta a resposta da IA ao catálogo carregado. Parada com id que não está
 * no catálogo, ou repetida, fica de fora: o roteiro só mostra lugar
 * cadastrado e nunca o mesmo lugar duas vezes. O servidor já garante isso;
 * aqui é a segunda trava, do lado de quem mostra.
 */
type SugestaoRoteiro = Omit<RoteiroIa, "geradoPorIa"> & { geradoPorIa: boolean };

export function montarRoteiroGerado(
  ia: SugestaoRoteiro,
  catalogo: readonly LocalDetalhe[],
): RoteiroGerado {
  const origem = ia.geradoPorIa ? "ia" : "demonstracao";
  const porId = new Map(catalogo.map((local) => [local.id, local]));
  const vistos = new Set<string>();
  const paradas: ParadaBase[] = [];

  for (const parada of [...ia.paradas].sort((a, b) => a.ordem - b.ordem)) {
    const local = porId.get(parada.localId);
    if (!local || vistos.has(local.id)) continue;
    vistos.add(local.id);
    paradas.push({
      local,
      duracaoMin: parada.duracaoMin,
      motivo: parada.justificativa,
      origem,
      acessibilidadeNaoConfirmada: parada.acessibilidadeNaoConfirmada,
    });
  }

  if (paradas.length === 0) throw new ErroAjusteRoteiro(ERRO_SEM_PARADAS_VALIDAS);

  const descartadas = ia.paradas.length - paradas.length;
  // Se nada foi descartado, valem os totais e avisos do servidor (mesma conta).
  if (descartadas === 0) {
    return {
      titulo: ia.titulo,
      descricao: ia.descricao,
      paradas: comHorarios(paradas),
      duracaoMin: ia.duracaoMin,
      distanciaMetros: ia.distanciaMetros,
      custoCentavos: ia.custoCentavos,
      avisos: ia.avisos,
      origem,
      ajustado: false,
    };
  }
  return recalcular({ titulo: ia.titulo, descricao: ia.descricao, origem, ajustado: false }, paradas);
}

/** Tira uma parada. Não deixa o roteiro ficar vazio. */
export function removerParada(roteiro: RoteiroGerado, localId: string): RoteiroGerado {
  if (roteiro.paradas.length <= 1) throw new ErroAjusteRoteiro(ERRO_ULTIMA_PARADA);
  const paradas = roteiro.paradas.filter((parada) => parada.local.id !== localId);
  if (paradas.length === roteiro.paradas.length) return roteiro;
  return recalcular({ ...roteiro, ajustado: true }, paradas);
}

/**
 * Lugares que podem entrar no lugar de uma parada: do mesmo pedido (cidade,
 * interesses, orçamento e acessibilidade já filtrados), fora do roteiro,
 * primeiro os da mesma categoria.
 */
export function opcoesDeTroca(
  roteiro: RoteiroGerado,
  localId: string,
  candidatos: readonly LocalDetalhe[],
  limite = 3,
): LocalDetalhe[] {
  const atual = roteiro.paradas.find((parada) => parada.local.id === localId)?.local;
  if (!atual) return [];
  const noRoteiro = new Set(roteiro.paradas.map((parada) => parada.local.id));
  const livres = candidatos.filter((local) => !noRoteiro.has(local.id));
  const mesmaCategoria = livres.filter((local) => local.categoria === atual.categoria);
  const outras = livres.filter((local) => local.categoria !== atual.categoria);
  return [...mesmaCategoria, ...outras].slice(0, limite);
}

/** Troca uma parada por outro lugar, na mesma posição. */
export function trocarParada(
  roteiro: RoteiroGerado,
  localId: string,
  novo: LocalDetalhe,
  necessidades: readonly NecessidadeAcessibilidade[],
): RoteiroGerado {
  if (roteiro.paradas.some((parada) => parada.local.id === novo.id)) {
    throw new ErroAjusteRoteiro(ERRO_PARADA_REPETIDA);
  }
  const indice = roteiro.paradas.findIndex((parada) => parada.local.id === localId);
  if (indice < 0) return roteiro;

  const acessibilidade = avaliarAcessibilidade(novo, necessidades);
  const paradas: ParadaBase[] = roteiro.paradas.map((parada, posicao) =>
    posicao === indice
      ? {
          local: novo,
          duracaoMin: novo.tempoMedioMin,
          motivo: novo.porQueConhecer,
          origem: "troca",
          acessibilidadeNaoConfirmada: acessibilidade.avisos.length > 0,
        }
      : parada,
  );
  return recalcular({ ...roteiro, ajustado: true }, paradas);
}

/**
 * Coloca no fim da lista os lugares do roteiro atual, para a próxima
 * sugestão começar pelos outros. Não tira ninguém: se só houver esses
 * lugares, a IA ainda consegue montar um roteiro.
 */
export function priorizarOutrosLugares<T extends { id: string }>(
  candidatos: readonly T[],
  roteiro: RoteiroGerado,
): T[] {
  const atuais = new Set(roteiro.paradas.map((parada) => parada.local.id));
  return [
    ...candidatos.filter((candidato) => !atuais.has(candidato.id)),
    ...candidatos.filter((candidato) => atuais.has(candidato.id)),
  ];
}

// ────────────────────────────────────────────────────────────────────────
// Ajustes que pedem uma nova sugestão. Mudam só o campo do ajuste: cidade,
// interesses e o resto das preferências seguem iguais.
// ────────────────────────────────────────────────────────────────────────

const TEMPO_MINIMO_MIN = 60;

/** Tempo menor que o do roteiro atual, de 30 em 30 min. null se já é o mínimo. */
export function pedidoMaisCurto(
  preferencias: PreferenciasRecomendacao,
  roteiro: RoteiroGerado,
): PreferenciasRecomendacao | null {
  const base = Math.min(preferencias.tempoDisponivelMin, roteiro.duracaoMin);
  const tempo = Math.max(TEMPO_MINIMO_MIN, Math.floor((base - 30) / 30) * 30);
  if (tempo >= preferencias.tempoDisponivelMin || base <= TEMPO_MINIMO_MIN) return null;
  return { ...preferencias, tempoDisponivelMin: tempo };
}

/**
 * Próxima faixa de orçamento do formulário abaixo do custo atual. null
 * quando o roteiro já é gratuito ou o teto já é "Só gratuitos".
 */
export function pedidoMaisEconomico(
  preferencias: PreferenciasRecomendacao,
  roteiro: RoteiroGerado,
): PreferenciasRecomendacao | null {
  if (roteiro.custoCentavos === 0 || preferencias.orcamentoCentavos === 0) return null;
  const referencia = Math.min(
    roteiro.custoCentavos ?? Number.POSITIVE_INFINITY,
    preferencias.orcamentoCentavos ?? Number.POSITIVE_INFINITY,
  );
  const faixas = OPCOES_ORCAMENTO.flatMap((opcao): number[] =>
    opcao.centavos === null ? [] : [opcao.centavos],
  ).sort((a, b) => b - a);
  const proxima = faixas.find((centavos) => centavos < referencia) ?? 0;
  return { ...preferencias, orcamentoCentavos: proxima };
}

/** Acrescenta uma necessidade de acessibilidade. null se ela já estava no pedido. */
export function pedidoComAcessibilidade(
  preferencias: PreferenciasRecomendacao,
  necessidade: NecessidadeAcessibilidade,
): PreferenciasRecomendacao | null {
  const atuais = preferencias.acessibilidade ?? [];
  if (atuais.includes(necessidade)) return null;
  return { ...preferencias, acessibilidade: [...atuais, necessidade] };
}

// ────────────────────────────────────────────────────────────────────────

function recalcular(
  base: Pick<RoteiroGerado, "titulo" | "descricao" | "origem" | "ajustado">,
  paradas: ParadaBase[],
): RoteiroGerado {
  const totais = calcularParadas(paradas);
  return {
    ...base,
    paradas: comHorarios(paradas),
    duracaoMin: totais.duracaoMin,
    distanciaMetros: totais.distanciaMetros,
    custoCentavos: totais.custoCentavos,
    avisos: avisosDe(paradas),
  };
}

function comHorarios(paradas: ParadaBase[]): ParadaGerada[] {
  const horarios = calcularParadas(paradas).paradas;
  return paradas.map((parada, indice) => ({ ...parada, horaSugerida: horarios[indice].horaSugerida }));
}

/**
 * Depois de um ajuste, os avisos de corte da IA ("encurtado para caber no
 * tempo") deixam de valer. Ficam os que dependem das paradas atuais.
 */
function avisosDe(paradas: ParadaBase[]): string[] {
  const avisos: string[] = [];
  const semAcessibilidade = paradas.filter((parada) => parada.acessibilidadeNaoConfirmada).length;
  if (semAcessibilidade > 0) {
    avisos.push(`Acessibilidade não confirmada em ${rotuloParadas(semAcessibilidade)}.`);
  }
  const semPreco = paradas.filter((parada) => !parada.local.gratuito && parada.local.precoCentavos === null).length;
  if (semPreco > 0) avisos.push(`Preço não informado em ${rotuloParadas(semPreco)}.`);
  return avisos;
}

function rotuloParadas(quantidade: number): string {
  return quantidade === 1 ? "1 parada" : `${quantidade} paradas`;
}
