import type { LocalDetalhe } from "../../locais/listarLocais";
import { listarLocaisDetalhados } from "../../locais/listarLocais";
import type { LocalLista } from "../../mocks/locais";
import { formatarCusto, formatarDuracao } from "../../formatos/formatos";
import { interessesQueCombinam } from "../../preferencias/afinidade";
import {
  CIDADES,
  filtrarInteresses,
  INTERESSES,
  nomeCidade,
  type CidadeId,
  type InteresseId,
} from "../../preferencias/dados";
import {
  LIMITES_PEDIDO,
  minimoCandidatos,
  NECESSIDADES_ACESSIBILIDADE,
  RITMOS,
  type NecessidadeAcessibilidade,
  type Ritmo,
} from "../../../supabase/functions/_shared/roteiroIa";

type Categoria = LocalLista["categoria"];

export type PreferenciasRecomendacao = {
  cidadeId: CidadeId;
  interesses: InteresseId[];
  tempoDisponivelMin: number;
  orcamentoCentavos?: number | null;
  ritmo?: Ritmo;
  acessibilidade?: NecessidadeAcessibilidade[];
};

/** Dados que o app usa para auditar por que um local entrou na seleção. */
export type CandidatoLocal = {
  id: string;
  nome: string;
  categoria: Categoria;
  duracaoMin: number;
  custoCentavos: number | null;
  restricoes: string[];
} & Record<string, unknown>;

type PedidoSemCandidatos = {
  cidadeId: CidadeId;
  interesses: InteresseId[];
  tempoDisponivelMin: number;
  orcamentoCentavos: number | null;
  ritmo: Ritmo;
  acessibilidade: NecessidadeAcessibilidade[];
};

export type PedidoRoteiroPadronizado = PedidoSemCandidatos & {
  candidatos: CandidatoLocal[];
};

export class ErroPreferenciasRecomendacao extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ErroPreferenciasRecomendacao";
  }
}

/**
 * Preferências da tela viram o contrato fechado que a recomendação entende:
 * ids conhecidos, listas sem repetição e valores padrão explícitos.
 */
export function padronizarPreferencias(
  preferencias: PreferenciasRecomendacao,
): PedidoSemCandidatos {
  if (!CIDADES.some((cidade) => cidade.id === preferencias.cidadeId)) {
    throw new ErroPreferenciasRecomendacao("Escolha uma cidade disponível.");
  }

  const interesses = filtrarInteresses(preferencias.interesses);
  if (interesses.length === 0 || interesses.length > LIMITES_PEDIDO.maxInteresses) {
    throw new ErroPreferenciasRecomendacao("Escolha pelo menos um interesse.");
  }

  const tempo = preferencias.tempoDisponivelMin;
  if (
    !Number.isInteger(tempo) ||
    tempo < LIMITES_PEDIDO.tempoMinimoMin ||
    tempo > LIMITES_PEDIDO.tempoMaximoMin
  ) {
    throw new ErroPreferenciasRecomendacao("O tempo disponível precisa ficar entre 1 e 12 horas.");
  }

  const orcamento = preferencias.orcamentoCentavos ?? null;
  if (orcamento !== null && (!Number.isInteger(orcamento) || orcamento < 0)) {
    throw new ErroPreferenciasRecomendacao("Orçamento inválido.");
  }

  const ritmo = preferencias.ritmo ?? "moderado";
  if (!(RITMOS as readonly string[]).includes(ritmo)) {
    throw new ErroPreferenciasRecomendacao("Ritmo inválido.");
  }

  const acessibilidade = semRepetir(preferencias.acessibilidade ?? []).filter((item) =>
    (NECESSIDADES_ACESSIBILIDADE as readonly string[]).includes(item),
  );

  return {
    cidadeId: preferencias.cidadeId,
    interesses,
    tempoDisponivelMin: tempo,
    orcamentoCentavos: orcamento,
    ritmo,
    acessibilidade,
  };
}

/**
 * Monta o pedido usando exclusivamente o catálogo público do Raízes. A lista
 * detalhada já vem de `locais` com `arquivado_em is null` e filtrada por cidade.
 */
export async function montarPedidoRoteiro(
  preferencias: PreferenciasRecomendacao,
): Promise<PedidoRoteiroPadronizado> {
  const pedido = padronizarPreferencias(preferencias);
  const locaisPublicados = await listarLocaisDetalhados(pedido.cidadeId);
  return {
    ...pedido,
    candidatos: selecionarCandidatosLocais(locaisPublicados, pedido),
  };
}

/** Regras puras e testáveis; preserva a ordem editorial do catálogo. */
export function selecionarCandidatosLocais(
  locais: readonly LocalDetalhe[],
  pedido: PedidoSemCandidatos,
): CandidatoLocal[] {
  const candidatos: CandidatoLocal[] = [];

  for (const local of locais) {
    if (local.cidadeId !== pedido.cidadeId) continue;
    if (!combinaComInteresses(local, pedido.interesses)) continue;
    if (local.tempoMedioMin > pedido.tempoDisponivelMin) continue;

    const custoCentavos = local.gratuito ? 0 : local.precoCentavos;
    if (
      pedido.orcamentoCentavos !== null &&
      custoCentavos !== null &&
      custoCentavos > pedido.orcamentoCentavos
    ) {
      continue;
    }

    const acessibilidade = avaliarAcessibilidade(local, pedido.acessibilidade ?? []);
    if (!acessibilidade.podeEntrar) continue;

    const restricoes = [
      ...(local.avisoVisitacao ? [local.avisoVisitacao] : []),
      ...(!local.gratuito && custoCentavos === null ? ["Preço não informado."] : []),
      ...acessibilidade.avisos,
    ];
    candidatos.push({
      id: local.id,
      nome: local.nome,
      categoria: local.categoria,
      duracaoMin: local.tempoMedioMin,
      custoCentavos,
      restricoes,
    });

    if (candidatos.length === LIMITES_PEDIDO.maxCandidatos) break;
  }

  return candidatos;
}

/** Mesma regra do Explorar e do detalhe (afinidade.ts): o que a pessoa vê e o que a IA recebe batem. */
function combinaComInteresses(local: LocalDetalhe, interesses: readonly InteresseId[]): boolean {
  return interessesQueCombinam(local, interesses).length > 0;
}

/** Exportada para a troca de parada (#51) usar a mesma régua da seleção. */
export function avaliarAcessibilidade(
  local: LocalDetalhe,
  necessidades: readonly NecessidadeAcessibilidade[],
): { podeEntrar: boolean; avisos: string[] } {
  const avisos: string[] = [];

  for (const necessidade of necessidades) {
    if (necessidade === "cadeira_de_rodas") {
      if (local.acessibilidade.rampa === "nao") return { podeEntrar: false, avisos: [] };
      if (!["sim", "parcial"].includes(local.acessibilidade.rampa)) {
        avisos.push("Acesso para cadeira de rodas não confirmado.");
      }
    }

    if (necessidade === "baixa_visao") {
      const recursos = [
        local.acessibilidade.audiodescricao,
        local.acessibilidade.braille,
      ];
      if (!recursos.some((nivel) => nivel === "sim" || nivel === "parcial")) {
        avisos.push("Recursos para baixa visão não confirmados.");
      }
    }

    if (necessidade === "sensibilidade_sensorial") {
      if (local.ambienteSensorial?.ruido === "alto") {
        return { podeEntrar: false, avisos: [] };
      }
      if (!local.ambienteSensorial) {
        avisos.push("Nível de ruído não informado.");
      }
    }
  }

  return { podeEntrar: true, avisos };
}

function semRepetir<T>(itens: readonly T[]): T[] {
  return [...new Set(itens)];
}


// ────────────────────────────────────────────────────────────────────────
// RAÍZES-36: bloquear a geração sem candidatos suficientes e dizer por quê
// ────────────────────────────────────────────────────────────────────────

export type ResultadoSelecao = {
  candidatos: CandidatoLocal[];
  /** Mensagem para a tela quando não há candidatos suficientes; null quando dá para gerar. */
  bloqueio: string | null;
};

/**
 * Seleciona os candidatos e, se não bastarem para um roteiro, aponta o
 * primeiro filtro que esvaziou a lista, para a mensagem sugerir o que mudar
 * em vez de um "tente de novo" genérico.
 */
export function avaliarSelecao(
  locais: readonly LocalDetalhe[],
  pedido: PedidoSemCandidatos,
): ResultadoSelecao {
  const candidatos = selecionarCandidatosLocais(locais, pedido);
  const minimo = minimoCandidatos(pedido.tempoDisponivelMin, pedido.ritmo);
  if (candidatos.length >= minimo) return { candidatos, bloqueio: null };
  return { candidatos, bloqueio: motivoDoBloqueio(locais, pedido, minimo) };
}

function motivoDoBloqueio(
  locais: readonly LocalDetalhe[],
  pedido: PedidoSemCandidatos,
  minimo: number,
): string {
  const cidade = nomeCidade(pedido.cidadeId)?.split(",")[0] ?? "esta cidade";
  const nomes = pedido.interesses
    .map((id) => INTERESSES.find((item) => item.id === id)?.nome ?? id)
    .join(", ");

  const naCidade = locais.filter((local) => local.cidadeId === pedido.cidadeId);
  if (naCidade.length < minimo) {
    return `Ainda não há lugares suficientes publicados em ${cidade} para montar um roteiro.`;
  }
  const comInteresse = naCidade.filter((local) => combinaComInteresses(local, pedido.interesses));
  if (comInteresse.length < minimo) {
    return comInteresse.length === 0
      ? `Nenhum lugar de ${cidade} combina com ${nomes}. Escolha outros interesses.`
      : `Só 1 lugar de ${cidade} combina com ${nomes}. Escolha mais interesses para montar um roteiro.`;
  }
  const cabemNoTempo = comInteresse.filter((local) => local.tempoMedioMin <= pedido.tempoDisponivelMin);
  if (cabemNoTempo.length < minimo) {
    return `Os lugares de ${nomes} pedem mais de ${formatarDuracao(pedido.tempoDisponivelMin)} de visita. Escolha mais tempo.`;
  }
  const cabemNoOrcamento = cabemNoTempo.filter((local) => {
    const custo = local.gratuito ? 0 : local.precoCentavos;
    return pedido.orcamentoCentavos === null || custo === null || custo <= pedido.orcamentoCentavos;
  });
  if (cabemNoOrcamento.length < minimo) {
    const teto = pedido.orcamentoCentavos === 0 ? "só lugares gratuitos" : `até ${formatarCusto(pedido.orcamentoCentavos)}`;
    return `Poucos lugares de ${nomes} cabem no orçamento (${teto}). Aumente o orçamento ou escolha outros interesses.`;
  }
  return "Poucos lugares atendem à acessibilidade escolhida com esses interesses. Revise as opções de acessibilidade ou escolha mais interesses.";
}
