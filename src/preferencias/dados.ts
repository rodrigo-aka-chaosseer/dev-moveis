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

// O piloto do Raízes acontece exclusivamente em Palmas. Novas cidades só
// entram quando tiverem catálogo curado e validado pela equipe.
export const CIDADES = [
  { id: "palmas", nome: "Palmas", uf: "TO", latitude: -10.184, longitude: -48.3336 },
] as const;

export type CidadeId = (typeof CIDADES)[number]["id"];

export function nomeCidade(id: CidadeId | null): string | null {
  const cidade = CIDADES.find((item) => item.id === id);
  return cidade ? `${cidade.nome}, ${cidade.uf}` : null;
}

/** O que a pessoa escolheu. Fica no aparelho; parte sobe para a conta. */
export type Preferencias = {
  interesses: InteresseId[];
  cidadeId: CidadeId | null;
  /** Só vira true quando a pessoa termina as duas etapas do onboarding. */
  onboardingConcluido: boolean;
};

/**
 * Fica só com ids conhecidos, sem repetição. Vale para o que vem do disco e
 * para o que vem do servidor: um id que saiu do catálogo some.
 */
export function filtrarInteresses(valor: unknown): InteresseId[] {
  if (!Array.isArray(valor)) return [];
  const ids = new Set<string>(INTERESSES.map((item) => item.id));
  const validos = valor.filter(
    (id): id is InteresseId => typeof id === "string" && ids.has(id),
  );
  return [...new Set(validos)];
}
