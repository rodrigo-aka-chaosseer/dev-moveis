import { describe, expect, it } from "vitest";

import { locais } from "../mocks/locais";
import { descreverFiltros, filtrarExplorar, SEM_FILTROS, temFiltro } from "./filtros";

const palmas = locais.filter((local) => local.cidadeId === "palmas");

describe("filtros do Explorar", () => {
  it("sem filtro devolve a cidade inteira", () => {
    expect(filtrarExplorar(palmas, SEM_FILTROS)).toHaveLength(palmas.length);
    expect(temFiltro(SEM_FILTROS)).toBe(false);
    expect(descreverFiltros(SEM_FILTROS)).toEqual([]);
  });

  it("interesse e busca sem acento se somam", () => {
    const filtros = { ...SEM_FILTROS, interesse: "historia" as const, busca: "memorial" };
    expect(filtrarExplorar(palmas, filtros).map((local) => local.id)).toEqual(["memorial-coluna-prestes"]);
    expect(temFiltro(filtros)).toBe(true);
    expect(descreverFiltros(filtros)).toEqual(["História", "“memorial”"]);
  });

  it("filtro sem resultado devolve lista vazia", () => {
    expect(filtrarExplorar(palmas, { ...SEM_FILTROS, interesse: "musica" })).toEqual([]);
  });

  it("busca só com espaços não conta como filtro", () => {
    expect(temFiltro({ ...SEM_FILTROS, busca: "   " })).toBe(false);
  });

  it("combina gratuidade e acessibilidade", () => {
    const acessivel = {
      ...palmas[0],
      gratuito: true,
      acessibilidade: {
        rampa: "sim" as const,
        elevador: "desconhecido" as const,
        banheiroAcessivel: "desconhecido" as const,
        libras: "desconhecido" as const,
        braille: "desconhecido" as const,
        audiodescricao: "desconhecido" as const,
      },
    };
    expect(filtrarExplorar([acessivel, palmas[1]], {
      ...SEM_FILTROS,
      gratuito: true,
      acessivel: true,
    })).toEqual([acessivel]);
    expect(descreverFiltros({ ...SEM_FILTROS, gratuito: true, acessivel: true }))
      .toEqual(["entrada gratuita", "acessibilidade informada"]);
  });
});

