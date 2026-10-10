import { locais, type LocalLista } from "../mocks/locais";
import type { CidadeId } from "../preferencias/dados";

const ATRASO_MS = 250;

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

/** BACKEND: trocar o mock por uma leitura no Supabase filtrada pela cidade. */
export async function listarLocais(cidadeId: CidadeId): Promise<LocalLista[]> {
  await esperar(ATRASO_MS);
  return locais.filter((local) => local.cidadeId === cidadeId);
}

/** BACKEND: trocar o mock por `select` no id. */
export async function buscarLocalPorId(id: string): Promise<LocalLista | null> {
  await esperar(ATRASO_MS);
  return locais.find((local) => local.id === id) ?? null;
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
