export const INTERESSES = [
  { id: "gastronomia", nome: "Gastronomia", icone: "🍴" },
  { id: "historia", nome: "História", icone: "▤" },
  { id: "cultura", nome: "Cultura", icone: "✦" },
  { id: "musica", nome: "Música", icone: "♫" },
  { id: "arte", nome: "Arte", icone: "◉" },
  { id: "eventos", nome: "Eventos", icone: "□" },
  { id: "natureza", nome: "Natureza", icone: "♧" },
] as const;

export type InteresseId = (typeof INTERESSES)[number]["id"];

// Cidades disponíveis no catálogo de demonstração. Mais cidades poderão ser
// oferecidas quando a fonte de locais estiver conectada ao backend.
export const CIDADES = [
  { id: "salvador", nome: "Salvador", uf: "BA", latitude: -12.9714, longitude: -38.5014 },
  { id: "recife", nome: "Recife", uf: "PE", latitude: -8.0476, longitude: -34.8770 },
] as const;

export type CidadeId = (typeof CIDADES)[number]["id"];

export function nomeCidade(id: CidadeId | null): string | null {
  const cidade = CIDADES.find((item) => item.id === id);
  return cidade ? `${cidade.nome}, ${cidade.uf}` : null;
}
