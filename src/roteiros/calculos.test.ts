import { describe, expect, it } from "vitest";

import { locais } from "../mocks/locais";
import { roteiros } from "../mocks/roteiros";
import { calcularRoteiro, rotuloCusto, rotuloDistanciaMetros, rotuloDuracao } from "./calculos";

const porId = (id: string) => locais.find((local) => local.id === id)!;

describe("calcularRoteiro", () => {
  it("soma visita e caminhada e marca o horário de cada parada", () => {
    const resultado = calcularRoteiro([porId("memorial-coluna-prestes"), porId("praca-dos-girassois")], "09:00");

    expect(resultado.paradas.map((parada) => parada.horaSugerida)[0]).toBe("09:00");
    expect(resultado.paradas[1].horaSugerida >= "10:00").toBe(true);
    expect(resultado.duracaoMin).toBeGreaterThanOrEqual(150);
    expect(resultado.duracaoMin % 5).toBe(0);
    expect(resultado.paradas.every((parada) => Number(parada.horaSugerida.slice(3)) % 5 === 0)).toBe(true);
    expect(resultado.distanciaMetros).toBeGreaterThan(0);
  });

  it("só fecha o custo quando todo preço é conhecido", () => {
    expect(calcularRoteiro([porId("palacinho"), porId("praca-dos-girassois")]).custoCentavos).toBe(0);
  });

  it("um lugar só não tem deslocamento", () => {
    const resultado = calcularRoteiro([porId("palacinho")]);
    expect(resultado.distanciaMetros).toBe(0);
    expect(resultado.duracaoMin).toBe(60);
  });
});

describe("roteiros do catálogo local", () => {
  it("toda parada existe e o roteiro fica numa cidade só", () => {
    for (const roteiro of roteiros.filter((item) => item.id !== "demonstracao-parada-indisponivel")) {
      const cidades = new Set(
        roteiro.paradas.map((parada) => porId(parada.localId).cidadeId),
      );
      expect(cidades.size).toBe(1);
      expect(roteiro.paradas.map((parada) => parada.ordem)).toEqual(
        roteiro.paradas.map((_, indice) => indice + 1),
      );
    }
  });

  it("mantém um cenário de demonstração com parada arquivada", () => {
    const roteiro = roteiros.find((item) => item.id === "demonstracao-parada-indisponivel");
    expect(roteiro?.paradas.some((parada) => !locais.some((local) => local.id === parada.localId))).toBe(true);
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
