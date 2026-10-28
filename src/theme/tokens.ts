/**
 * Cores e medidas do protótipo. Fonte única de verdade: se precisar de uma
 * cor nova, coloca aqui antes de usar na tela.
 */
export const colors = {
  accent: "#c75926",
  userLocation: "#2563eb",
  accentDark: "#8f3f1b",
  earth: "#5c3d2e",
  bg: "#12100e",

  onDark: "#ffffff",
  onDarkMuted: "rgba(255, 255, 255, 0.7)",
  onDarkSoft: "rgba(255, 255, 255, 0.85)",
  borderOnDark: "rgba(255, 255, 255, 0.2)",

  surface: "#ffffff",
  surface2: "#faf7f4",
  surface3: "#e7e1dc",
  accentSoft: "#fbf0e9",
  accentTint: "#f5dfcf",
  text: "#1c1917",
  textMuted: "#78716c",
  tabInactive: "#a8a29e",
  tabBorder: "#eee9e5",

  /* Superfície clara do passaporte cultural. Mantida separada da paleta
     geral para a metáfora de documento poder evoluir sem alterar o app. */
  paper: "#f4ede3",
  profileBackground: "#eee5da",
  documentPaper: "#fbf7f1",
  documentInk: "#5c3d2e",
  inkMuted: "rgba(92, 61, 46, 0.66)",
  stampEmpty: "rgba(92, 61, 46, 0.34)",

  /** Campos de formulário. A borda de foco repete o accent de propósito:
   *  se um dia o foco mudar de cor, muda aqui e não em cada tela. */
  inputBorder: "#e7e1dc",
  inputBorderFocus: "#c75926",

  /** Erro de formulário. Vermelho terroso, não o vermelho puro do sistema. */
  error: "#b91c1c",
  errorSoft: "#fef2f2",
} as const;

export const radius = {
  document: 3,
  button: 18,
  input: 16,
  card: 24,
  large: 28,
  /** Cantos de cima da folha que sobe sobre o bloco terracota. */
  sheet: 32,
} as const;

export const spacing = {
  pageX: 24,
  stackSm: 8,
  stackMd: 12,
  stackLg: 16,
} as const;

/** Altura mínima de alvo de toque exigida pelo Android e pelo iOS. */
export const MIN_TOUCH = 44;

export const fonts = {
  regular: "PlusJakartaSans_400Regular",
  semibold: "PlusJakartaSans_600SemiBold",
  extrabold: "PlusJakartaSans_800ExtraBold",
} as const;

/** Gradientes da tela de abertura, sobrepostos à foto de fundo. */
export const gradients = {
  screenTop: {
    colors: ["rgba(18, 16, 14, 0.72)", "rgba(18, 16, 14, 0.28)", "transparent"],
    locations: [0, 0.18, 0.34],
  },
  screenBottom: {
    colors: ["transparent", "rgba(92, 61, 46, 0.55)", "rgba(18, 16, 14, 0.95)"],
    locations: [0.28, 0.58, 1],
  },
  /** Véu terracota sobre a mesma foto, no login. Escurece para o pé, onde
   *  ficam marca e frase em branco: sobre o accentDark o contraste passa AA. */
  loginVeil: {
    colors: ["rgba(199, 89, 38, 0.88)", "rgba(143, 63, 27, 0.94)", "rgba(92, 61, 46, 0.96)"],
    locations: [0, 0.55, 1],
  },
} as const;
