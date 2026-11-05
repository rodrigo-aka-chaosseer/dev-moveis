import type { LocalLista } from "../mocks/locais";
import { INTERESSES, type InteresseId } from "./dados";

const CATEGORIAS_POR_INTERESSE: Record<InteresseId, readonly LocalLista["categoria"][]> = {
  gastronomia: ["gastronomia"],
  historia: ["historia", "patrimonio"],
  cultura: ["cultura", "comunidade", "patrimonio", "religiao"],
  musica: ["musica", "evento"],
  arte: ["arte", "cultura", "evento"],
  eventos: ["evento"],
  natureza: ["natureza"],
};

function normalizar(texto: string): string {
  return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

export function interessesQueCombinam(
  local: Pick<LocalLista, "categoria" | "tags">,
  interesses: readonly InteresseId[],
): InteresseId[] {
  const tags = local.tags.map(normalizar);
  return interesses.filter((interesse) => {
    if (CATEGORIAS_POR_INTERESSE[interesse].includes(local.categoria)) return true;
    const nome = INTERESSES.find((item) => item.id === interesse)?.nome ?? interesse;
    const termos = [normalizar(interesse === "eventos" ? "evento" : interesse), normalizar(nome)];
    return tags.some((tag) => termos.some((termo) => tag.includes(termo)));
  });
}

export function combinaComInteresse(
  local: Pick<LocalLista, "categoria" | "tags">,
  interesse: InteresseId,
): boolean {
  return interessesQueCombinam(local, [interesse]).length > 0;
}

