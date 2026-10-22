import { describe, expect, it } from "vitest";
import { locais } from "../mocks/locais";
import { CIDADES } from "../preferencias/dados";
import { distanciaKm } from "./distancia";
import { ordenarPorProximidade } from "./proximidade";

const cidade = CIDADES[0];
const base = locais[0];
const perto = { ...base, id: "perto", latitude: 0, longitude: 0.001 };
const longe = { ...base, id: "longe", latitude: 0, longitude: 0.01 };
const origem = { latitude: 0, longitude: 0 };

describe("distância em linha reta", () => {
  it("retorna zero na mesma posição", () => {
    expect(distanciaKm(-12.97, -38.5, -12.97, -38.5)).toBe(0);
  });

  it("calcula uma distância conhecida em quilômetros", () => {
    expect(distanciaKm(0, 0, 0, 1)).toBeCloseTo(111.195, 2);
    expect(distanciaKm(0, 1, 0, 0)).toBeCloseTo(111.195, 2);
  });

  it("mantém o cálculo finito para pontos antípodas", () => {
    expect(distanciaKm(0, 0, 0, 180)).toBeCloseTo(Math.PI * 6371, 5);
  });
});

describe("ordenarPorProximidade", () => {
  it("usa a posição do usuário, formata metros e quilômetros e ordena numericamente", () => {
    const entrada = [longe, perto];
    const resultado = ordenarPorProximidade(entrada, cidade.id, origem);
    expect(resultado.map((local) => local.id)).toEqual(["perto", "longe"]);
    expect(resultado[0].distancia).toBe("111 m");
    expect(resultado[1].distancia).toBe("1,1 km");
    expect(resultado[0].distanciaKm).toBeCloseTo(0.111195, 5);
    expect(entrada).toEqual([longe, perto]);
    expect(perto.distancia).toBe(base.distancia);
  });

  it("reordena quando a posição muda", () => {
    const resultado = ordenarPorProximidade([perto, longe], cidade.id, longe);
    expect(resultado.map((local) => local.id)).toEqual(["longe", "perto"]);
    expect(resultado[0].distancia).toBe("0 m");
  });

  it.each(["permissão negada", "GPS desligado", "localização ainda não obtida"])(
    "usa o centro da cidade e identifica a aproximação com %s", () => {
      const noCentro = { ...base, id: "centro", latitude: cidade.latitude, longitude: cidade.longitude };
      const afastado = { ...noCentro, id: "afastado", latitude: cidade.latitude + 0.01 };
      const resultado = ordenarPorProximidade([afastado, noCentro], cidade.id, null);
      expect(resultado.map((local) => local.id)).toEqual(["centro", "afastado"]);
      expect(resultado[0].distancia).toBe("0 m (aprox. pelo centro da cidade)");
      expect(resultado[1].distanciaKm).toBeCloseTo(1.11195, 4);
    },
  );

  it("usa o centro da cidade selecionada ao trocar de cidade", () => {
    const recife = CIDADES[1];
    const local = { ...base, latitude: recife.latitude, longitude: recife.longitude };
    expect(ordenarPorProximidade([local], recife.id, null)[0].distanciaKm).toBe(0);
    expect(ordenarPorProximidade([local], cidade.id, null)[0].distanciaKm).toBeGreaterThan(100);
  });

  it("recalcula e ordena o catálogo mock sem depender do texto de distância", () => {
    const lista = locais.filter((local) => local.cidadeId === cidade.id);
    const resultado = ordenarPorProximidade(lista, cidade.id, lista[lista.length - 1]);
    expect(resultado[0].id).toBe(lista[lista.length - 1].id);
    expect(resultado[0].distancia).toBe("0 m");
    expect(resultado).toHaveLength(lista.length);
  });

  it("aceita lista vazia com ou sem localização", () => {
    expect(ordenarPorProximidade([], cidade.id, origem)).toEqual([]);
    expect(ordenarPorProximidade([], cidade.id, null)).toEqual([]);
  });
});