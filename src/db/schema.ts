import { sqliteTable, text, integer, real, primaryKey } from "drizzle-orm/sqlite-core";

/**
 * Modelo de dados do Raízes — turismo, cultura e diversidade.
 *
 * Duas decisões estruturais que valem a pena entender antes de mexer:
 *
 * 1. O contexto cultural NÃO é um campo opcional. `porQueConhecer`, `historia`
 *    e `fonte` são obrigatórios em `locais` porque são o diferencial do produto:
 *    sem eles isto vira mais um app de mapas.
 *
 * 2. `avisoVisitacao` existe desde a primeira versão (Segurança Cultural, seção 22
 *    do escopo). Espaços religiosos em atividade e comunidades tradicionais não
 *    são "atrações". Retrofit disso depois é caro; agora custa um campo.
 */

/* ─────────────── Locais ─────────────── */

export const locais = sqliteTable("locais", {
  id: text("id").primaryKey(),
  nome: text("nome").notNull(),
  categoria: text("categoria", {
    enum: [
      "gastronomia", "historia", "cultura", "arte", "musica",
      "religiao", "patrimonio", "comunidade", "natureza", "evento",
    ],
  }).notNull(),

  latitude: real("latitude").notNull(),
  longitude: real("longitude").notNull(),
  endereco: text("endereco").notNull(),

  horarios: text("horarios", { mode: "json" }).$type<
    Record<string, { abre: string; fecha: string } | null>
  >(),
  gratuito: integer("gratuito", { mode: "boolean" }).notNull().default(false),
  precoCentavos: integer("preco_centavos"),
  tempoMedioMin: integer("tempo_medio_min").notNull(),

  /* o que diferencia este app de um guia turístico comum */
  porQueConhecer: text("por_que_conhecer").notNull(),
  historia: text("historia").notNull(),

  /* Segurança Cultural — null significa "visitação livre" */
  avisoVisitacao: text("aviso_visitacao"),

  /* Curadoria e confiabilidade (seção 20 do escopo) */
  fonte: text("fonte").notNull(),
  atualizadoEm: integer("atualizado_em", { mode: "timestamp" }).notNull(),

  imagemUrl: text("imagem_url"),
  audioUrl: text("audio_url"),
});

/* ─────────────── Diversidade ─────────────── */

export const tagsDiversidade = sqliteTable("tags_diversidade", {
  id: text("id").primaryKey(),
  nome: text("nome").notNull(),
  dimensao: text("dimensao", {
    enum: [
      "etnica_racial", "indigena", "afro_brasileira", "genero_sexualidade",
      "religiosa", "geracional", "acessibilidade", "neurodiversidade",
    ],
  }).notNull(),
});

export const locaisTags = sqliteTable(
  "locais_tags",
  {
    localId: text("local_id").notNull().references(() => locais.id),
    tagId: text("tag_id").notNull().references(() => tagsDiversidade.id),
  },
  (t) => [primaryKey({ columns: [t.localId, t.tagId] })],
);

/* ─────────────── Acessibilidade estrutural ─────────────── */

export const acessibilidade = sqliteTable("acessibilidade", {
  localId: text("local_id").primaryKey().references(() => locais.id),
  rampa: text("rampa", { enum: ["sim", "parcial", "nao", "desconhecido"] }).notNull().default("desconhecido"),
  elevador: text("elevador", { enum: ["sim", "parcial", "nao", "desconhecido"] }).notNull().default("desconhecido"),
  banheiroAcessivel: text("banheiro_acessivel", { enum: ["sim", "parcial", "nao", "desconhecido"] }).notNull().default("desconhecido"),
  pisoTatil: text("piso_tatil", { enum: ["sim", "parcial", "nao", "desconhecido"] }).notNull().default("desconhecido"),
  estacionamentoAcessivel: text("estacionamento_acessivel", { enum: ["sim", "parcial", "nao", "desconhecido"] }).notNull().default("desconhecido"),
  audiodescricao: text("audiodescricao", { enum: ["sim", "parcial", "nao", "desconhecido"] }).notNull().default("desconhecido"),
  libras: text("libras", { enum: ["sim", "parcial", "nao", "desconhecido"] }).notNull().default("desconhecido"),
  braille: text("braille", { enum: ["sim", "parcial", "nao", "desconhecido"] }).notNull().default("desconhecido"),
});

/* ─────────────── Ambiente sensorial (neurodiversidade) ─────────────── */

export const ambienteSensorial = sqliteTable("ambiente_sensorial", {
  localId: text("local_id").primaryKey().references(() => locais.id),
  ruido: text("ruido", { enum: ["baixo", "medio", "alto"] }).notNull(),
  iluminacao: text("iluminacao", { enum: ["baixa", "media", "alta"] }).notNull(),
  movimentacao: text("movimentacao", { enum: ["baixa", "media", "alta"] }).notNull(),
  temFila: integer("tem_fila", { mode: "boolean" }).notNull().default(false),
  espacoDescanso: integer("espaco_descanso", { mode: "boolean" }).notNull().default(false),
});

/* ─────────────── Eventos ─────────────── */

export const eventos = sqliteTable("eventos", {
  id: text("id").primaryKey(),
  localId: text("local_id").references(() => locais.id),
  titulo: text("titulo").notNull(),
  descricao: text("descricao").notNull(),
  inicioEm: integer("inicio_em", { mode: "timestamp" }).notNull(),
  fimEm: integer("fim_em", { mode: "timestamp" }),
  gratuito: integer("gratuito", { mode: "boolean" }).notNull().default(true),
  precoCentavos: integer("preco_centavos"),
  imagemUrl: text("imagem_url"),
  fonte: text("fonte").notNull(),
});

/* ─────────────── Roteiros ─────────────── */

export const roteiros = sqliteTable("roteiros", {
  id: text("id").primaryKey(),
  titulo: text("titulo").notNull(),
  descricao: text("descricao"),
  tipo: text("tipo", { enum: ["tematico", "gerado"] }).notNull(),
  duracaoMin: integer("duracao_min").notNull(),
  distanciaMetros: integer("distancia_metros").notNull(),
  custoCentavos: integer("custo_centavos"),
  imagemUrl: text("imagem_url"),
  criadoEm: integer("criado_em", { mode: "timestamp" }).notNull(),
});

export const roteiroParadas = sqliteTable(
  "roteiro_paradas",
  {
    roteiroId: text("roteiro_id").notNull().references(() => roteiros.id),
    localId: text("local_id").notNull().references(() => locais.id),
    ordem: integer("ordem").notNull(),
    horaSugerida: text("hora_sugerida"),
    duracaoMin: integer("duracao_min").notNull(),
  },
  (t) => [primaryKey({ columns: [t.roteiroId, t.ordem] })],
);

/* ─────────────── Usuário (local, sem servidor) ─────────────── */

export const preferencias = sqliteTable("preferencias", {
  id: integer("id").primaryKey().default(1),
  interesses: text("interesses", { mode: "json" }).$type<string[]>().notNull(),
  temasDiversidade: text("temas_diversidade", { mode: "json" }).$type<string[]>().notNull(),
  modoExploracao: text("modo_exploracao", {
    enum: ["caminhando", "transporte_publico", "carro", "bicicleta", "indiferente"],
  }).notNull().default("indiferente"),
  tempoDisponivelMin: integer("tempo_disponivel_min").notNull().default(240),
  distanciaMaxMetros: integer("distancia_max_metros").notNull().default(5000),
  necessidadesAcessibilidade: text("necessidades_acessibilidade", { mode: "json" })
    .$type<string[]>().notNull(),
  onboardingConcluido: integer("onboarding_concluido", { mode: "boolean" }).notNull().default(false),
});

export const favoritos = sqliteTable("favoritos", {
  localId: text("local_id").primaryKey().references(() => locais.id),
  criadoEm: integer("criado_em", { mode: "timestamp" }).notNull(),
});

/** Passaporte Cultural — registro de descoberta, nunca ranking entre pessoas. */
export const visitas = sqliteTable("visitas", {
  id: text("id").primaryKey(),
  localId: text("local_id").notNull().references(() => locais.id),
  visitadoEm: integer("visitado_em", { mode: "timestamp" }).notNull(),
  anotacao: text("anotacao"),
  fotoUri: text("foto_uri"),
});

/* ─────────────── Tipos ─────────────── */

export type Local = typeof locais.$inferSelect;
export type NovoLocal = typeof locais.$inferInsert;
export type Evento = typeof eventos.$inferSelect;
export type Roteiro = typeof roteiros.$inferSelect;
export type Preferencias = typeof preferencias.$inferSelect;
