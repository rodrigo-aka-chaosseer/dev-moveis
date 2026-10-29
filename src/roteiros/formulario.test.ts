import { describe, expect, it } from "vitest";

import { formularioRoteiroValido, type FormularioRoteiro } from "./formulario";

const PREENCHIDO: FormularioRoteiro = {
  cidadeId: "salvador",
  interesses: ["cultura"],
  tempoDisponivelMin: 240,
  orcamentoCentavos: null,
  ritmo: "moderado",
  acessibilidade: [],
};

describe("formularioRoteiroValido", () => {
  it("aceita um pedido com cidade e pelo menos um interesse", () => {
    expect(formularioRoteiroValido(PREENCHIDO)).toBe(true);
  });

  it("exige cidade", () => {
    expect(formularioRoteiroValido({ ...PREENCHIDO, cidadeId: null })).toBe(false);
  });

  it("exige pelo menos um interesse", () => {
    expect(formularioRoteiroValido({ ...PREENCHIDO, interesses: [] })).toBe(false);
  });

  it("recusa tempo e orçamento fora dos limites", () => {
    expect(formularioRoteiroValido({ ...PREENCHIDO, tempoDisponivelMin: 30 })).toBe(false);
    expect(formularioRoteiroValido({ ...PREENCHIDO, tempoDisponivelMin: 721 })).toBe(false);
    expect(formularioRoteiroValido({ ...PREENCHIDO, orcamentoCentavos: -1 })).toBe(false);
  });
});
