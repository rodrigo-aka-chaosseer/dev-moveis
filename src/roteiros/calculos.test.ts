import { describe, expect, it } from "vitest";

import { locais } from "../mocks/locais";
import { roteiros } from "../mocks/roteiros";
import { calcularRoteiro, rotuloCusto, rotuloDistanciaMetros, rotuloDuracao } from "./calculos";

const porId = (id: string) => locais.find((local) => local.id === id)!;

describe("calcularRoteiro", () => {
  it("soma visita e caminhada e marca o horário de cada parada", () => {
    const resultado = calcularRoteiro([porId("paco-frevo"), porId("cais-sertao")], "09:00");

    expect(resultado.paradas.map((parada) => parada.horaSugerida)[0]).toBe("09:00");
    // 90 min de visita no Paço + caminhada curta até o Cais.
    expect(resultado.paradas[1].horaSugerida > "10:30").toBe(true);
    expect(resultado.duracaoMin).toBeGreaterThanOrEqual(180);
    expect(resultado.duracaoMin % 5).toBe(0);
    expect(resultado.paradas.every((parada) => Number(parada.horaSugerida.slice(3)) % 5 === 0)).toBe(true);
    expect(resultado.distanciaMetros).toBeGreaterThan(0);
  });

  it("só fecha o custo quando todo preço é conhecido", () => {
    expect(calcularRoteiro([porId("casa-benin"), porId("igreja-rosario-pretos")]).custoCentavos).toBe(0);
    expect(calcularRoteiro([porId("paco-frevo"), porId("cais-sertao")]).custoCentavos).toBeNull();
  });

  it("um lugar só não tem deslocamento", () => {
    const resultado = calcularRoteiro([porId("casa-benin")]);
    expect(resultado.distanciaMetros).toBe(0);
    expect(resultado.duracaoMin).toBe(60);
  });
});

describe("roteiros do catálogo local", () => {
  it("toda parada existe e o roteiro fica numa cidade só", () => {
    for (const roteiro of roteiros) {
      const cidades = new Set(
        roteiro.paradas.map((parada) => porId(parada.localId).cidadeId),
      );
      expect(cidades.size).toBe(1);
      expect(roteiro.paradas.map((parada) => parada.ordem)).toEqual(
        roteiro.paradas.map((_, indice) => indice + 1),
      );
    }
  });
});

describe("rótulos", () => {
  it("formata duração, custo e distância", () => {
    expect(rotuloDuracao(45)).toBe("45 min");
    expect(rotuloDuracao(120)).toBe("2h");
    expect(rotuloDuracao(255)).toBe("4h15");
    expect(rotuloCusto(0)).toBe("Gratuito");
    expect(rotuloCusto(3000)).toBe("R$ 30");
    expect(rotuloCusto(null)).toBe("—");
    expect(rotuloDistanciaMetros(450)).toBe("450 m");
    expect(rotuloDistanciaMetros(3800)).toBe("3,8 km");
  });
});
