import { createElement } from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ACESSIBILIDADE_DESCONHECIDA } from "../../locais/acessibilidade";
import { SecaoAcessibilidade, SecaoAmbienteSensorial } from "./SecoesAcessibilidade";

vi.mock("react-native", () => ({
  Text: "Text",
  View: "View",
  Pressable: "Pressable",
  StyleSheet: { create: (styles: unknown) => styles },
}));
vi.mock("@expo/vector-icons", () => ({ Ionicons: "Ionicons" }));

let tela: ReactTestRenderer;
const tipo = (nome: string) => nome as unknown as Parameters<ReactTestRenderer["root"]["findByType"]>[0];
const rotulosAcessiveis = () =>
  tela.root
    .findAllByType(tipo("View"))
    .filter((item) => item.props.accessible)
    .map((item) => item.props.accessibilityLabel);

async function montar(elemento: ReturnType<typeof createElement>) {
  await act(async () => {
    tela = create(elemento);
  });
}

beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
});
afterEach(async () => {
  if (tela) await act(async () => tela.unmount());
});

describe("SecaoAcessibilidade", () => {
  it("lê cada recurso como uma frase só, com o ícone escondido do leitor", async () => {
    await montar(
      createElement(SecaoAcessibilidade, {
        acessibilidade: { ...ACESSIBILIDADE_DESCONHECIDA, rampa: "sim", elevador: "nao" },
      }),
    );

    expect(rotulosAcessiveis()).toEqual([
      "Rampa: disponível",
      "Elevador: não disponível",
    ]);
    const iconesDosRecursos = tela.root.findAllByType(tipo("Ionicons")).filter((icone) => icone.props.accessibilityElementsHidden);
    expect(iconesDosRecursos).toHaveLength(2);
    for (const icone of iconesDosRecursos) {
      expect(icone.props.accessibilityElementsHidden).toBe(true);
      expect(icone.props.importantForAccessibility).toBe("no-hide-descendants");
    }
    expect(tela.root.findByProps({ accessibilityRole: "header" }).props.children).toBe(
      "Acessibilidade",
    );
  });

  it("sem nenhuma informação não mostra uma seção vazia", async () => {
    await montar(
      createElement(SecaoAcessibilidade, { acessibilidade: ACESSIBILIDADE_DESCONHECIDA }),
    );

    expect(tela.toJSON()).toBeNull();
  });
});

describe("SecaoAmbienteSensorial", () => {
  it("lê ruído, iluminação, movimento, fila e descanso", async () => {
    await montar(
      createElement(SecaoAmbienteSensorial, {
        ambiente: {
          ruido: "baixo",
          iluminacao: "media",
          movimentacao: "baixa",
          temFila: false,
          espacoDescanso: true,
        },
      }),
    );

    expect(rotulosAcessiveis()).toEqual([
      "Ruído: baixo",
      "Iluminação: média",
      "Movimento de pessoas: baixa",
      "Fila: não costuma ter",
      "Espaço de descanso: tem",
    ]);
  });

  it("sem informação não mostra uma seção vazia", async () => {
    await montar(createElement(SecaoAmbienteSensorial, { ambiente: null }));

    expect(tela.toJSON()).toBeNull();
  });
});
