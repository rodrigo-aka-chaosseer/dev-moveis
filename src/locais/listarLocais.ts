import { supabase } from "../lib/supabase";
import { locais, type LocalLista } from "../mocks/locais";
import { CIDADES, type CidadeId } from "../preferencias/dados";

const ATRASO_MS = 250;
const RAIO_CIDADE_KM = 30;
const SELECT_LOCAL = "*, locais_tags(tags_diversidade(nome))";

const ROTULOS_CATEGORIA: Record<LocalLista["categoria"], string> = {
  gastronomia: "Gastronomia",
  historia: "História",
  cultura: "Cultura",
  arte: "Arte",
  musica: "Música",
  religiao: "Religião",
  patrimonio: "Patrimônio",
  comunidade: "Comunidade",
  natureza: "Natureza",
  evento: "Evento",
};

function esperar(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export async function listarLocais(cidadeId: CidadeId): Promise<LocalLista[]> {
  if (!supabaseUrlDefinida()) {
    return listarDoMock(cidadeId);
  }

  const { data, error } = await consultaPublica();
  if (error) throw error;

  return (Array.isArray(data) ? data : [])
    .filter((linha): linha is LinhaLocal => naCidade(linha, cidadeId))
    .map((linha) => mapearLocal(linha, cidadeId));
}

export async function buscarLocalPorId(id: string): Promise<LocalLista | null> {
  if (!supabaseUrlDefinida()) {
    return buscarDoMock(id);
  }

  const { data, error } = await consultaPublica().eq("id", id).maybeSingle();
  if (error) throw error;
  if (!data || !ehLinhaLocal(data)) return null;
  return mapearLocal(data, cidadeDoLocal(data));
}

async function listarDoMock(cidadeId: CidadeId): Promise<LocalLista[]> {
  if (!process.env.VITEST) await esperar(ATRASO_MS);
  return locais.filter((local) => local.cidadeId === cidadeId);
}

async function buscarDoMock(id: string): Promise<LocalLista | null> {
  if (!process.env.VITEST) await esperar(ATRASO_MS);
  return locais.find((local) => local.id === id) ?? null;
}

function supabaseUrlDefinida(): boolean {
  return Boolean(process.env.EXPO_PUBLIC_SUPABASE_URL?.trim());
}

function consultaPublica() {
  if (!supabase) {
    throw new Error("Supabase não configurado.");
  }
  return supabase.from("locais").select(SELECT_LOCAL).is("arquivado_em", null);
}

type LinhaLocal = {
  id: string;
  nome: string;
  categoria: LocalLista["categoria"];
  latitude: number;
  longitude: number;
  endereco: string;
  horarios?: LocalLista["horarios"] | null;
  gratuito: boolean;
  preco_centavos?: number | null;
  tempo_medio_min: number;
  por_que_conhecer: string;
  historia: string;
  aviso_visitacao?: string | null;
  fonte: string;
  atualizado_em: string | Date;
  imagem_url?: string | null;
  audio_url?: string | null;
  cidade_id?: string | null;
  locais_tags?: unknown;
};

function ehLinhaLocal(valor: unknown): valor is LinhaLocal {
  if (!valor || typeof valor !== "object") return false;
  const linha = valor as Partial<LinhaLocal>;
  return typeof linha.id === "string" && typeof linha.nome === "string";
}

function naCidade(linha: unknown, cidadeId: CidadeId): boolean {
  if (!ehLinhaLocal(linha)) return false;
  if (typeof linha.cidade_id === "string" && linha.cidade_id.length > 0) {
    return linha.cidade_id === cidadeId;
  }
  const cidade = CIDADES.find((item) => item.id === cidadeId);
  if (!cidade) return false;
  return (
    distanciaKm(cidade.latitude, cidade.longitude, linha.latitude, linha.longitude) <=
    RAIO_CIDADE_KM
  );
}

function cidadeDoLocal(linha: LinhaLocal): CidadeId {
  if (ehCidadeId(linha.cidade_id)) return linha.cidade_id;
  return cidadeMaisProxima(linha.latitude, linha.longitude)?.id ?? CIDADES[0].id;
}

function ehCidadeId(valor: string | null | undefined): valor is CidadeId {
  return CIDADES.some((cidade) => cidade.id === valor);
}

function mapearLocal(linha: LinhaLocal, cidadeId: CidadeId): LocalLista {
  const cidade = CIDADES.find((item) => item.id === cidadeId) ?? CIDADES[0];
  const km = distanciaKm(
    cidade.latitude,
    cidade.longitude,
    linha.latitude,
    linha.longitude,
  );
  return {
    id: linha.id,
    cidadeId,
    nome: linha.nome,
    categoria: linha.categoria,
    latitude: linha.latitude,
    longitude: linha.longitude,
    endereco: linha.endereco,
    horarios: linha.horarios ?? null,
    gratuito: Boolean(linha.gratuito),
    precoCentavos: linha.preco_centavos ?? null,
    tempoMedioMin: linha.tempo_medio_min,
    porQueConhecer: linha.por_que_conhecer,
    historia: linha.historia,
    avisoVisitacao: linha.aviso_visitacao ?? null,
    fonte: linha.fonte,
    atualizadoEm: new Date(linha.atualizado_em),
    imagemUrl: linha.imagem_url ?? null,
    audioUrl: linha.audio_url ?? null,
    tags: nomesDasTags(linha.locais_tags),
    distancia: formatarDistancia(km),
  };
}

function nomesDasTags(locaisTags: unknown): string[] {
  if (!Array.isArray(locaisTags)) return [];
  return locaisTags.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const rel = (item as { tags_diversidade?: unknown }).tags_diversidade;
    if (Array.isArray(rel)) {
      return rel.flatMap((tag) => nomeTag(tag));
    }
    return nomeTag(rel);
  });
}

function nomeTag(valor: unknown): string[] {
  if (valor && typeof valor === "object" && "nome" in valor) {
    const nome = (valor as { nome: unknown }).nome;
    return typeof nome === "string" && nome.length > 0 ? [nome] : [];
  }
  return [];
}

function cidadeMaisProxima(latitude: number, longitude: number) {
  let melhor: { id: CidadeId; km: number } | null = null;
  for (const cidade of CIDADES) {
    const km = distanciaKm(cidade.latitude, cidade.longitude, latitude, longitude);
    if (!melhor || km < melhor.km) {
      melhor = { id: cidade.id, km };
    }
  }
  return melhor;
}

function distanciaKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const radianos = Math.PI / 180;
  const dLat = (lat2 - lat1) * radianos;
  const dLon = (lon2 - lon1) * radianos;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * radianos) * Math.cos(lat2 * radianos) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatarDistancia(km: number): string {
  if (km < 1) {
    return `${Math.round(km * 1000)} m`;
  }
  return `${km.toFixed(1).replace(".", ",")} km`;
}

export function rotuloCategoria(categoria: LocalLista["categoria"]) {
  return ROTULOS_CATEGORIA[categoria];
}

export function linhaResumo(local: LocalLista) {
  return `${rotuloCategoria(local.categoria)} · ${local.distancia} · ${resumoTerceiro(local)}`;
}

export function rotuloPreco(local: LocalLista) {
  if (local.gratuito) {
    return "Gratuito";
  }
  if (local.precoCentavos == null) {
    return "";
  }
  return `R$ ${(local.precoCentavos / 100).toFixed(0)}`;
}

export function rotuloTempo(local: LocalLista) {
  return `~${local.tempoMedioMin} min`;
}

export function rotuloHorarios(local: LocalLista) {
  const faixas = Object.entries(local.horarios ?? {}).filter(
    (entrada): entrada is [string, { abre: string; fecha: string }] =>
      entrada[1] != null,
  );
  if (faixas.length === 0) {
    return "";
  }
  if (faixas.length === 1 && faixas[0][0] === "sabado") {
    return "Aberto sábados";
  }
  const primeira = faixas[0][1];
  const ultimoDia = faixas[faixas.length - 1][0];
  return `${rotuloDia(faixas[0][0])}–${rotuloDia(ultimoDia)} ${horaCurta(primeira.abre)}–${horaCurta(primeira.fecha)}`;
}

export function rotuloFonte(local: LocalLista) {
  const data = local.atualizadoEm.toLocaleDateString("pt-BR", {
    month: "short",
    year: "numeric",
  });
  return `Fonte: ${local.fonte} · Atualizado em ${data}`;
}

function resumoTerceiro(local: LocalLista) {
  if (local.gratuito) {
    return "Gratuito";
  }
  if (local.categoria === "gastronomia") {
    return "$$";
  }
  const horarios = rotuloHorarios(local);
  return horarios || rotuloPreco(local);
}

function rotuloDia(dia: string) {
  const mapa: Record<string, string> = {
    domingo: "Dom",
    segunda: "Seg",
    terca: "Ter",
    quarta: "Qua",
    quinta: "Qui",
    sexta: "Sex",
    sabado: "Sáb",
  };
  return mapa[dia] ?? dia;
}

function horaCurta(hora: string) {
  return hora.replace(":00", "h").replace(":", "h");
}
