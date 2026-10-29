import type { LocalDetalhe } from "../../locais/listarLocais";
import { listarLocaisDetalhados } from "../../locais/listarLocais";
import type { LocalLista } from "../../mocks/locais";
import {
  CIDADES,
  filtrarInteresses,
  type CidadeId,
  type InteresseId,
} from "../../preferencias/dados";
import {
  LIMITES_PEDIDO,
  NECESSIDADES_ACESSIBILIDADE,
  RITMOS,
  type NecessidadeAcessibilidade,
  type Ritmo,
} from "../../../supabase/functions/_shared/roteiroIa";

type Categoria = LocalLista["categoria"];

const CATEGORIAS_POR_INTERESSE: Record<InteresseId, readonly Categoria[]> = {
  gastronomia: ["gastronomia"],
  historia: ["historia", "patrimonio"],
  cultura: ["cultura", "religiao", "comunidade"],
  musica: ["musica"],
  arte: ["arte"],
  eventos: ["evento"],
  natureza: ["natureza"],
};

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
      categoria: local.categoria,
      duracaoMin: local.tempoMedioMin,
      custoCentavos,
      restricoes,
    });

    if (candidatos.length === LIMITES_PEDIDO.maxCandidatos) break;
  }

  return candidatos;
}

function combinaComInteresses(local: LocalDetalhe, interesses: readonly InteresseId[]): boolean {
  const tags = new Set(local.tags.map(normalizarTag));
  return interesses.some((interesse) => {
    const porCategoria = CATEGORIAS_POR_INTERESSE[interesse].includes(local.categoria);
    const slug = interesse === "eventos" ? "evento" : interesse;
    return porCategoria || tags.has(slug);
  });
}

function avaliarAcessibilidade(
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

function normalizarTag(tag: string): string {
  return tag.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase();
}
