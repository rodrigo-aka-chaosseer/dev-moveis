import type { Acessibilidade, AmbienteSensorial } from "../locais/acessibilidade";

/** Dados sintéticos de demonstração; não representam auditoria oficial. */
export const detalhesLocaisDemonstracao: Record<string, { acessibilidade: Acessibilidade; ambienteSensorial: AmbienteSensorial | null }> = {
  palacinho: {
    acessibilidade: { rampa: "sim", elevador: "desconhecido", banheiroAcessivel: "desconhecido", libras: "desconhecido", braille: "desconhecido", audiodescricao: "desconhecido" },
    ambienteSensorial: { ruido: "baixo", iluminacao: "media", movimentacao: "baixa", temFila: false, espacoDescanso: true },
  },
  "espaco-cultural-jose-gomes-sobrinho": {
    acessibilidade: { rampa: "sim", elevador: "desconhecido", banheiroAcessivel: "sim", libras: "desconhecido", braille: "desconhecido", audiodescricao: "desconhecido" },
    ambienteSensorial: null,
  },
  "praia-da-graciosa": {
    acessibilidade: { rampa: "parcial", elevador: "desconhecido", banheiroAcessivel: "desconhecido", libras: "desconhecido", braille: "desconhecido", audiodescricao: "desconhecido" },
    ambienteSensorial: { ruido: "medio", iluminacao: "alta", movimentacao: "media", temFila: false, espacoDescanso: true },
  },
};
