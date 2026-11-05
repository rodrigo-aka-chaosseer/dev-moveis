import type { Acessibilidade, AmbienteSensorial } from "../locais/acessibilidade";

/**
 * Dados sintéticos exclusivamente para demonstração sem Supabase.
 * Não representam uma auditoria oficial dos locais e nunca são usados quando
 * o backend está configurado.
 */
export const detalhesLocaisDemonstracao: Record<
  string,
  { acessibilidade: Acessibilidade; ambienteSensorial: AmbienteSensorial | null }
> = {
  "casa-benin": {
    acessibilidade: {
      rampa: "sim",
      elevador: "parcial",
      banheiroAcessivel: "sim",
      libras: "desconhecido",
      braille: "nao",
      audiodescricao: "sim",
    },
    ambienteSensorial: {
      ruido: "baixo",
      iluminacao: "media",
      movimentacao: "baixa",
      temFila: false,
      espacoDescanso: true,
    },
  },
  "mafro-ufba": {
    acessibilidade: {
      rampa: "parcial",
      elevador: "sim",
      banheiroAcessivel: "sim",
      libras: "nao",
      braille: "desconhecido",
      audiodescricao: "desconhecido",
    },
    ambienteSensorial: null,
  },
  "paco-frevo": {
    acessibilidade: {
      rampa: "sim",
      elevador: "sim",
      banheiroAcessivel: "sim",
      libras: "parcial",
      braille: "desconhecido",
      audiodescricao: "parcial",
    },
    ambienteSensorial: {
      ruido: "alto",
      iluminacao: "alta",
      movimentacao: "alta",
      temFila: true,
      espacoDescanso: true,
    },
  },
};

