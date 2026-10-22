import { describe, expect, it } from "vitest";
import { CIDADES } from "../preferencias/dados";
import { regiaoDosLocais } from "./modelo";

describe("enquadramento do mapa", () => {
  it("centraliza a cidade escolhida quando não há lugares", () => {
    for (const cidade of CIDADES) {
      expect(regiaoDosLocais(cidade.id, [])).toMatchObject({ latitude: cidade.latitude, longitude: cidade.longitude });
    }
  });
  it("enquadra todos os marcadores com margem", () => {
    const pontos = [{ latitude: -8, longitude: -35 }, { latitude: -8.1, longitude: -34.8 }];
    const regiao = regiaoDosLocais("recife", pontos);
    for (const ponto of pontos) {
      expect(Math.abs(ponto.latitude - regiao.latitude)).toBeLessThan(regiao.latitudeDelta / 2);
      expect(Math.abs(ponto.longitude - regiao.longitude)).toBeLessThan(regiao.longitudeDelta / 2);
    }
  });
  it("mantém zoom utilizável com um marcador ou marcadores coincidentes", () => {
    const ponto = { latitude: -8, longitude: -35 };
    expect(regiaoDosLocais("recife", [ponto, ponto])).toEqual({ ...ponto, latitudeDelta: 0.02, longitudeDelta: 0.02 });
  });
});
