import { describe, expect, it } from "vitest";

import {
  formatarCusto,
  formatarDistanciaKm,
  formatarDistanciaMetros,
  formatarDuracao,
} from "./formatos";

describe("formatos em linguagem do usuário", () => {
  it("distância em metros abaixo de 1 km e em km com vírgula acima", () => {
    expect(formatarDistanciaKm(0.8)).toBe("800 m");
    expect(formatarDistanciaKm(2.34)).toBe("2,3 km");
    expect(formatarDistanciaMetros(450)).toBe("450 m");
    expect(formatarDistanciaMetros(3800)).toBe("3,8 km");
  });

  it("duração em minutos e em horas", () => {
    expect(formatarDuracao(45)).toBe("45 min");
    expect(formatarDuracao(60)).toBe("1h");
    expect(formatarDuracao(90)).toBe("1h30");
    expect(formatarDuracao(255)).toBe("4h15");
  });

  it("custo: zero é gratuito e o resto em reais", () => {
    expect(formatarCusto(0)).toBe("Gratuito");
    expect(formatarCusto(2500)).toBe("R$ 25");
    expect(formatarCusto(1250)).toBe("R$ 12,50");
  });

  it("valor ausente ou inválido nunca vira número cru nem null", () => {
    expect(formatarCusto(null)).toBe("Preço não informado");
    expect(formatarCusto(undefined, "—")).toBe("—");
    expect(formatarDistanciaKm(Number.NaN)).toBe("—");
    expect(formatarDuracao(0)).toBe("—");
  });
});
