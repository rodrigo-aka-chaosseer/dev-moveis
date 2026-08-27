/**
 * Dados de demonstração da RAÍZES-04.
 *
 * Nada aqui persiste e nada aqui vem do banco. Quando a task que liga o
 * Drizzle às telas entrar, isto some e vira consulta em `src/db`.
 */

/**
 * Subconjunto proposital das dimensões de `src/db/schema.ts`.
 *
 * Acessibilidade e neurodiversidade ficam de fora dos carimbos por decisão de
 * produto, não por esquecimento: conhecer cultura indígena é aprendizado,
 * visitar um lugar com rampa não é conquista. As duas vivem nas preferências.
 */
export type DimensaoCarimbo =
  | "etnica_racial"
  | "indigena"
  | "afro_brasileira"
  | "genero_sexualidade"
  | "religiosa"
  | "geracional";

export type Carimbo = {
  dimensao: DimensaoCarimbo;
  rotulo: string;
  /** Mês e ano em que a dimensão foi conhecida. Null quando ainda não foi. */
  carimbadoEm: string | null;
};

export type GrupoFavoritos = {
  cidade: string;
  uf: string;
  quantidade: number;
};

export type PerfilFicticio = {
  nome: string;
  iniciais: string;
  numeroSerie: string;
  origem: string;
  membroDesde: string;
  preferencias: string[];
  carimbos: Carimbo[];
  favoritos: GrupoFavoritos[];
};

/**
 * Interesses e necessidades de acessibilidade aparecem na MESMA lista, sem
 * separação e sem destaque. É decisão de design: necessidade é preferência,
 * não diagnóstico.
 */
export const PERFIL_FICTICIO: PerfilFicticio = {
  nome: "Ana Silva",
  iniciais: "AS",
  numeroSerie: "RZ · 2026 · 000001",
  origem: "Palmas, Tocantins",
  membroDesde: "Agosto de 2026",
  preferencias: [
    "Gastronomia",
    "História",
    "Ruído baixo",
    "Rotas acessíveis",
    "Artesanato",
    "Pouco estímulo visual",
  ],
  carimbos: [
    { dimensao: "etnica_racial", rotulo: "Étnica e racial", carimbadoEm: "Ago 2026" },
    { dimensao: "indigena", rotulo: "Indígena", carimbadoEm: "Jul 2026" },
    { dimensao: "afro_brasileira", rotulo: "Afro-brasileira", carimbadoEm: null },
    { dimensao: "genero_sexualidade", rotulo: "Gênero e sexualidade", carimbadoEm: null },
    { dimensao: "religiosa", rotulo: "Religiosa", carimbadoEm: null },
    { dimensao: "geracional", rotulo: "Geracional", carimbadoEm: null },
  ],
  favoritos: [
    { cidade: "Palmas", uf: "TO", quantidade: 12 },
    { cidade: "Taquaruçu", uf: "TO", quantidade: 4 },
  ],
};
