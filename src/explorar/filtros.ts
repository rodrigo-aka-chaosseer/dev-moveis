import type { LocalLista } from "../mocks/locais";
import { acessibilidadeDesconhecida, type Acessibilidade } from "../locais/acessibilidade";
import { combinaComInteresse } from "../preferencias/afinidade";
import { INTERESSES, type InteresseId } from "../preferencias/dados";

export type FiltrosExplorar = {
  /** Etiqueta de interesse escolhida no Explorar; null = "Tudo". */
  interesse: InteresseId | null;
  busca: string;
  gratuito: boolean;
  acessivel: boolean;
};

export const SEM_FILTROS: FiltrosExplorar = {
  interesse: null,
  busca: "",
  gratuito: false,
  acessivel: false,
};

export function normalizar(texto: string): string {
  return texto.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

/** Mesma regra que o Explorar já usava: interesse pela categoria e busca sem acento. */
export function filtrarExplorar<T extends LocalLista>(locais: readonly T[], filtros: FiltrosExplorar): T[] {
  const termo = normalizar(filtros.busca.trim());
  return locais.filter((local) => {
    const interesse = filtros.interesse;
    const combinaInteresse = !interesse || combinaComInteresse(local, interesse);
    if (!combinaInteresse) return false;
    if (filtros.gratuito && !local.gratuito) return false;
    if (filtros.acessivel && !temAcessibilidadeConfirmada(local.acessibilidade)) return false;
    if (!termo) return true;
    return normalizar(`${local.nome} ${local.tags.join(" ")} ${local.categoria}`).includes(termo);
  });
}

export function temFiltro(filtros: FiltrosExplorar): boolean {
  return filtros.interesse !== null || filtros.busca.trim() !== "" || filtros.gratuito || filtros.acessivel;
}

/**
 * Os filtros em palavras, para o topo da lista e para o vazio (H1):
 * ["Arte", "“benin”"]. Vazio quando nada filtra além da cidade.
 */
export function descreverFiltros(filtros: FiltrosExplorar): string[] {
  const partes: string[] = [];
  if (filtros.interesse) {
    const nome = INTERESSES.find((item) => item.id === filtros.interesse)?.nome;
    if (nome) partes.push(nome);
  }
  if (filtros.gratuito) partes.push("entrada gratuita");
  if (filtros.acessivel) partes.push("acessibilidade informada");
  const busca = filtros.busca.trim();
  if (busca) partes.push(`“${busca}”`);
  return partes;
}

function temAcessibilidadeConfirmada(acessibilidade: Acessibilidade | undefined): boolean {
  if (!acessibilidade || acessibilidadeDesconhecida(acessibilidade)) return false;
  return Object.values(acessibilidade).some((nivel) => nivel === "sim" || nivel === "parcial");
}
