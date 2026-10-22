import { supabase } from "../lib/supabase";
import { linhaParaLocal, SELECT_LOCAL, supabaseUrlDefinida } from "../locais/listarLocais";
import { locais } from "../mocks/locais";
import type { LocalLista } from "../mocks/locais";
import { roteiros as roteirosMock, type RoteiroMock } from "../mocks/roteiros";
import type { CidadeId } from "../preferencias/dados";

const ATRASO_MS = 250;
const SELECT_ROTEIRO = `id, titulo, descricao, duracao_min, distancia_metros, custo_centavos, imagem_url, roteiro_paradas(ordem, hora_sugerida, duracao_min, local_id, locais(${SELECT_LOCAL}))`;

export type ParadaRoteiro = {
  ordem: number;
  localId: string;
  duracaoMin: number;
  /** "HH:MM" ou null quando o roteiro não sugere horário. */
  horaSugerida: string | null;
  /** null quando o lugar foi arquivado e não está mais publicado. */
  local: LocalLista | null;
};

export type Roteiro = {
  id: string;
  titulo: string;
  descricao: string | null;
  duracaoMin: number;
  distanciaMetros: number;
  custoCentavos: number | null;
  imagemUrl: string | null;
  /** Cidade da primeira parada publicada; null se nenhuma está publicada. */
  cidadeId: CidadeId | null;
  paradas: ParadaRoteiro[];
};

/** Roteiros temáticos (curados, sem dono) da cidade, com as paradas em ordem. */
export async function listarRoteiros(cidadeId: CidadeId): Promise<Roteiro[]> {
  if (!supabaseUrlDefinida()) {
    if (!process.env.VITEST) await esperar(ATRASO_MS);
    return roteirosMock.map(doMock).filter((roteiro) => roteiro.cidadeId === cidadeId);
  }

  const { data, error } = await consultaTematicos();
  if (error) throw error;

  return (Array.isArray(data) ? data : [])
    .flatMap((linha) => {
      const roteiro = doBanco(linha);
      return roteiro ? [roteiro] : [];
    })
    .filter((roteiro) => roteiro.cidadeId === cidadeId)
    .sort((a, b) => a.titulo.localeCompare(b.titulo, "pt-BR"));
}

export async function buscarRoteiroPorId(id: string): Promise<Roteiro | null> {
  if (!supabaseUrlDefinida()) {
    if (!process.env.VITEST) await esperar(ATRASO_MS);
    const roteiro = roteirosMock.find((item) => item.id === id);
    return roteiro ? doMock(roteiro) : null;
  }

  const { data, error } = await consultaTematicos().eq("id", id).maybeSingle();
  if (error) throw error;
  return data ? doBanco(data) : null;
}

/** Paradas cujo lugar ainda está publicado. */
export function paradasDisponiveis(roteiro: Roteiro): (ParadaRoteiro & { local: LocalLista })[] {
  return roteiro.paradas.filter(
    (parada): parada is ParadaRoteiro & { local: LocalLista } => parada.local !== null,
  );
}

function consultaTematicos() {
  if (!supabase) {
    throw new Error("Supabase não configurado.");
  }
  // O RLS já esconde roteiro gerado de outra pessoa; o filtro deixa explícito
  // que esta tela só lista o catálogo público.
  return supabase
    .from("roteiros")
    .select(SELECT_ROTEIRO)
    .eq("tipo", "tematico")
    .is("usuario_id", null);
}

type LinhaRoteiro = {
  id: string;
  titulo: string;
  descricao?: string | null;
  duracao_min: number;
  distancia_metros: number;
  custo_centavos?: number | null;
  imagem_url?: string | null;
  roteiro_paradas?: unknown;
};

function ehLinhaRoteiro(valor: unknown): valor is LinhaRoteiro {
  if (!valor || typeof valor !== "object") return false;
  const linha = valor as Partial<LinhaRoteiro>;
  return typeof linha.id === "string" && typeof linha.titulo === "string";
}

function doBanco(valor: unknown): Roteiro | null {
  if (!ehLinhaRoteiro(valor)) return null;

  const paradas: ParadaRoteiro[] = (Array.isArray(valor.roteiro_paradas)
    ? valor.roteiro_paradas
    : []
  )
    .flatMap((item: unknown) => {
      if (!item || typeof item !== "object") return [];
      const parada = item as {
        ordem?: number;
        local_id?: string;
        duracao_min?: number;
        hora_sugerida?: string | null;
        locais?: unknown;
      };
      if (typeof parada.ordem !== "number" || typeof parada.local_id !== "string") return [];
      return [
        {
          ordem: parada.ordem,
          localId: parada.local_id,
          duracaoMin: parada.duracao_min ?? 0,
          horaSugerida: parada.hora_sugerida ? parada.hora_sugerida.slice(0, 5) : null,
          local: linhaParaLocal(Array.isArray(parada.locais) ? parada.locais[0] : parada.locais),
        },
      ];
    })
    .sort((a, b) => a.ordem - b.ordem);

  return montar(
    {
      id: valor.id,
      titulo: valor.titulo,
      descricao: valor.descricao ?? null,
      duracaoMin: valor.duracao_min,
      distanciaMetros: valor.distancia_metros,
      custoCentavos: valor.custo_centavos ?? null,
      imagemUrl: valor.imagem_url ?? null,
    },
    paradas,
  );
}

function doMock(roteiro: RoteiroMock): Roteiro {
  return montar(
    {
      id: roteiro.id,
      titulo: roteiro.titulo,
      descricao: roteiro.descricao,
      duracaoMin: roteiro.duracaoMin,
      distanciaMetros: roteiro.distanciaMetros,
      custoCentavos: roteiro.custoCentavos,
      imagemUrl: null,
    },
    roteiro.paradas.map((parada) => ({
      ...parada,
      local: locais.find((local) => local.id === parada.localId) ?? null,
    })),
  );
}

function montar(
  base: Omit<Roteiro, "cidadeId" | "paradas">,
  paradas: ParadaRoteiro[],
): Roteiro {
  const primeira = paradas.find((parada) => parada.local !== null);
  return { ...base, cidadeId: primeira?.local?.cidadeId ?? null, paradas };
}

function esperar(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
