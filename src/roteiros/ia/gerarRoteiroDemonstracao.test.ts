import { describe, expect, it, vi } from "vitest";

import { ACESSIBILIDADE_DESCONHECIDA } from "../../locais/acessibilidade";
import type { LocalDetalhe } from "../../locais/listarLocais";
import type { PedidoRoteiroIa } from "./gerarRoteiroIa";
import { gerarRoteiroDemonstracao } from "./gerarRoteiroDemonstracao";

vi.mock("../../lib/supabase", () => ({ supabase: null }));

function local(id: string, alteracoes: Partial<LocalDetalhe> = {}): LocalDetalhe {
  return {
    id,
    cidadeId: "salvador",
    nome: `Local ${id}`,
    categoria: "cultura",
    latitude: -12.97,
    longitude: -38.5,
    endereco: "Salvador",
    horarios: null,
    gratuito: true,
    precoCentavos: 0,
    tempoMedioMin: 60,
    porQueConhecer: `Motivo curado para visitar ${id}.`,
    historia: "História curada.",
    avisoVisitacao: null,
    fonte: "Fonte pública",
    atualizadoEm: new Date("2026-10-01T12:00:00Z"),
    imagemUrl: null,
    audioUrl: null,
    tags: ["cultura"],
    distancia: "Centro",
    acessibilidade: ACESSIBILIDADE_DESCONHECIDA,
    ambienteSensorial: null,
    ...alteracoes,
  };
}

const CATALOGO = [
  local("a"),
  local("b", { latitude: -12.975 }),
  local("c", { latitude: -12.98 }),
  local("fora"),
];

const PEDIDO: PedidoRoteiroIa = {
  cidadeId: "salvador",
  interesses: ["cultura"],
  tempoDisponivelMin: 180,
  orcamentoCentavos: 0,
  ritmo: "moderado",
  acessibilidade: [],
  candidatos: [{ id: "a" }, { id: "b" }, { id: "c" }],
};

describe("gerarRoteiroDemonstracao", () => {
  it("monta o roteiro só com os candidatos e respeita o tempo", () => {
    const roteiro = gerarRoteiroDemonstracao(PEDIDO, CATALOGO);

    expect(roteiro.geradoPorIa).toBe(false);
    expect(roteiro.paradas.map((parada) => parada.localId)).toEqual(["a", "b"]);
    expect(roteiro.paradas.some((parada) => parada.localId === "fora")).toBe(false);
    expect(roteiro.duracaoMin).toBeLessThanOrEqual(PEDIDO.tempoDisponivelMin);
    expect(roteiro.avisos[0]).toContain("demonstração");
  });

  it("preserva a ordem recebida para permitir outra sugestão", () => {
    const roteiro = gerarRoteiroDemonstracao(
      { ...PEDIDO, candidatos: [{ id: "c" }, { id: "b" }, { id: "a" }] },
      CATALOGO,
    );

    expect(roteiro.paradas.map((parada) => parada.localId)).toEqual(["c", "b"]);
  });

  it("avisa quando a acessibilidade pedida não está confirmada", () => {
    const roteiro = gerarRoteiroDemonstracao(
      { ...PEDIDO, acessibilidade: ["cadeira_de_rodas"] },
      CATALOGO,
    );

    expect(roteiro.paradas.every((parada) => parada.acessibilidadeNaoConfirmada)).toBe(true);
    expect(roteiro.avisos).toContain("Acessibilidade não confirmada em 2 paradas.");
  });

  it("não ultrapassa o orçamento total conhecido", () => {
    const catalogo = [
      local("a", { gratuito: false, precoCentavos: 3_000 }),
      local("b", { gratuito: false, precoCentavos: 3_000 }),
    ];
    const roteiro = gerarRoteiroDemonstracao(
      {
        ...PEDIDO,
        orcamentoCentavos: 5_000,
        candidatos: [{ id: "a" }, { id: "b" }],
      },
      catalogo,
    );

    expect(roteiro.paradas.map((parada) => parada.localId)).toEqual(["a"]);
    expect(roteiro.custoCentavos).toBe(3_000);
  });
});
