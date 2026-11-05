import { describe, expect, it } from "vitest";

import { locais } from "../mocks/locais";
import { descreverFiltros, filtrarExplorar, SEM_FILTROS, temFiltro } from "./filtros";

const salvador = locais.filter((local) => local.cidadeId === "salvador");

describe("filtros do Explorar", () => {
  it("sem filtro devolve a cidade inteira", () => {
    expect(filtrarExplorar(salvador, SEM_FILTROS)).toHaveLength(salvador.length);
    expect(temFiltro(SEM_FILTROS)).toBe(false);
    expect(descreverFiltros(SEM_FILTROS)).toEqual([]);
  });

  it("interesse e busca sem acento se somam", () => {
    const filtros = { ...SEM_FILTROS, interesse: "historia" as const, busca: "afro" };
    expect(filtrarExplorar(salvador, filtros).map((local) => local.id)).toEqual(["mafro-ufba"]);
    expect(temFiltro(filtros)).toBe(true);
    expect(descreverFiltros(filtros)).toEqual(["História", "“afro”"]);
  });

  it("filtro sem resultado devolve lista vazia", () => {
    expect(filtrarExplorar(salvador, { ...SEM_FILTROS, interesse: "natureza" })).toEqual([]);
  });

  it("busca só com espaços não conta como filtro", () => {
    expect(temFiltro({ ...SEM_FILTROS, busca: "   " })).toBe(false);
  });

  it("combina gratuidade e acessibilidade", () => {
    const acessivel = {
      ...salvador[0],
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
    expect(filtrarExplorar([acessivel, salvador[1]], {
      ...SEM_FILTROS,
      gratuito: true,
      acessivel: true,
    })).toEqual([acessivel]);
    expect(descreverFiltros({ ...SEM_FILTROS, gratuito: true, acessivel: true }))
      .toEqual(["entrada gratuita", "acessibilidade informada"]);
  });
});
