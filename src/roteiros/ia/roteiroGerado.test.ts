import { describe, expect, it, vi } from "vitest";

import { ACESSIBILIDADE_DESCONHECIDA } from "../../locais/acessibilidade";
import type { LocalDetalhe } from "../../locais/listarLocais";
import type { RoteiroIa } from "./gerarRoteiroIa";
import type { PreferenciasRecomendacao } from "./prepararCandidatos";
import {
  ErroAjusteRoteiro,
  montarRoteiroGerado,
  opcoesDeTroca,
  pedidoComAcessibilidade,
  pedidoMaisCurto,
  pedidoMaisEconomico,
  priorizarOutrosLugares,
  removerParada,
  trocarParada,
} from "./roteiroGerado";

// O módulo de candidatos importa o catálogo, que importa o cliente Supabase.
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
    gratuito: false,
    precoCentavos: 2_000,
    tempoMedioMin: 60,
    porQueConhecer: `Por que conhecer ${id}.`,
    historia: "História curada.",
    avisoVisitacao: null,
    fonte: "Fonte pública",
    atualizadoEm: new Date("2026-10-01T12:00:00Z"),
    imagemUrl: null,
    audioUrl: null,
    tags: [],
    distancia: "Centro",
    acessibilidade: ACESSIBILIDADE_DESCONHECIDA,
    ambienteSensorial: null,
    ...alteracoes,
  };
}

const CATALOGO = [
  local("a"),
  local("b", { latitude: -12.975, categoria: "historia" }),
  local("c", { latitude: -12.98, gratuito: true, precoCentavos: 0 }),
  local("d", { latitude: -12.985 }),
  local("e", { latitude: -12.99, categoria: "historia" }),
];

const IA: RoteiroIa = {
  titulo: "Centro em três tempos",
  descricao: "Uma volta pelo centro.",
  paradas: [
    { localId: "a", ordem: 1, duracaoMin: 60, justificativa: "Motivo A.", acessibilidadeNaoConfirmada: false },
    { localId: "b", ordem: 2, duracaoMin: 45, justificativa: "Motivo B.", acessibilidadeNaoConfirmada: false },
    { localId: "c", ordem: 3, duracaoMin: 30, justificativa: "Motivo C.", acessibilidadeNaoConfirmada: false },
  ],
  duracaoMin: 160,
  distanciaMetros: 1110,
  custoCentavos: 4_000,
  avisos: [],
  geradoPorIa: true,
};

const PREFERENCIAS: PreferenciasRecomendacao = {
  cidadeId: "salvador",
  interesses: ["cultura", "historia"],
  tempoDisponivelMin: 240,
  orcamentoCentavos: 10_000,
  ritmo: "moderado",
  acessibilidade: [],
};

describe("montarRoteiroGerado", () => {
  it("resolve cada parada no catálogo, com motivo e horário", () => {
    const roteiro = montarRoteiroGerado(IA, CATALOGO);

    expect(roteiro.paradas.map((parada) => parada.local.id)).toEqual(["a", "b", "c"]);
    expect(roteiro.paradas[0]).toMatchObject({ motivo: "Motivo A.", origem: "ia", horaSugerida: "09:00" });
    expect(roteiro.duracaoMin).toBe(160);
  });

  it("descarta lugar fora do catálogo e repetido, e recalcula", () => {
    const roteiro = montarRoteiroGerado(
      {
        ...IA,
        paradas: [
          ...IA.paradas,
          { localId: "inventado", ordem: 4, duracaoMin: 30, justificativa: "x", acessibilidadeNaoConfirmada: false },
          { localId: "a", ordem: 5, duracaoMin: 30, justificativa: "x", acessibilidadeNaoConfirmada: false },
        ],
      },
      CATALOGO,
    );

    expect(roteiro.paradas.map((parada) => parada.local.id)).toEqual(["a", "b", "c"]);
    expect(roteiro.custoCentavos).toBe(4_000);
  });

  it("recusa sugestão sem nenhum lugar do catálogo", () => {
    expect(() =>
      montarRoteiroGerado({ ...IA, paradas: [{ ...IA.paradas[0], localId: "x" }] }, CATALOGO),
    ).toThrow(ErroAjusteRoteiro);
  });
});

describe("removerParada", () => {
  it("tira a parada e recalcula duração, distância e custo", () => {
    const antes = montarRoteiroGerado(IA, CATALOGO);
    const depois = removerParada(antes, "b");

    expect(depois.paradas.map((parada) => parada.local.id)).toEqual(["a", "c"]);
    expect(depois.custoCentavos).toBe(2_000);
    expect(depois.duracaoMin).toBeLessThan(antes.duracaoMin);
    expect(depois.ajustado).toBe(true);
  });

  it("não deixa o roteiro sem nenhuma parada", () => {
    const umaParada = removerParada(removerParada(montarRoteiroGerado(IA, CATALOGO), "b"), "c");
    expect(() => removerParada(umaParada, "a")).toThrow("pelo menos uma parada");
  });
});

describe("troca de parada", () => {
  it("oferece lugares fora do roteiro, primeiro os da mesma categoria", () => {
    const roteiro = montarRoteiroGerado(IA, CATALOGO);
    const opcoes = opcoesDeTroca(roteiro, "b", CATALOGO);

    expect(opcoes.map((opcao) => opcao.id)).toEqual(["e", "d"]);
  });

  it("troca na mesma posição, usa o por que conhecer e recalcula", () => {
    const roteiro = trocarParada(montarRoteiroGerado(IA, CATALOGO), "b", CATALOGO[4], []);

    expect(roteiro.paradas.map((parada) => parada.local.id)).toEqual(["a", "e", "c"]);
    expect(roteiro.paradas[1]).toMatchObject({ origem: "troca", motivo: "Por que conhecer e." });
    expect(new Set(roteiro.paradas.map((parada) => parada.local.id)).size).toBe(3);
  });

  it("não aceita lugar que já está no roteiro", () => {
    expect(() => trocarParada(montarRoteiroGerado(IA, CATALOGO), "b", CATALOGO[0], [])).toThrow(
      "já está no roteiro",
    );
  });

  it("marca acessibilidade não confirmada quando a pessoa pediu", () => {
    const roteiro = trocarParada(montarRoteiroGerado(IA, CATALOGO), "b", CATALOGO[4], ["cadeira_de_rodas"]);

    expect(roteiro.paradas[1].acessibilidadeNaoConfirmada).toBe(true);
    expect(roteiro.avisos).toContain("Acessibilidade não confirmada em 1 parada.");
  });
});

describe("novas sugestões preservam as preferências", () => {
  const roteiro = montarRoteiroGerado(IA, CATALOGO);

  it("mais curto só reduz o tempo", () => {
    const pedido = pedidoMaisCurto(PREFERENCIAS, roteiro);

    expect(pedido).toEqual({ ...PREFERENCIAS, tempoDisponivelMin: 120 });
  });

  it("mais curto não passa do mínimo de 1 hora", () => {
    expect(pedidoMaisCurto({ ...PREFERENCIAS, tempoDisponivelMin: 60 }, roteiro)).toBeNull();
  });

  it("mais econômico desce para a faixa abaixo do custo atual", () => {
    expect(pedidoMaisEconomico(PREFERENCIAS, roteiro)).toEqual({ ...PREFERENCIAS, orcamentoCentavos: 0 });
    expect(
      pedidoMaisEconomico(PREFERENCIAS, { ...roteiro, custoCentavos: 8_000 }),
    ).toEqual({ ...PREFERENCIAS, orcamentoCentavos: 5_000 });
  });

  it("mais econômico não se aplica a roteiro gratuito", () => {
    expect(pedidoMaisEconomico(PREFERENCIAS, { ...roteiro, custoCentavos: 0 })).toBeNull();
  });

  it("priorizar acessibilidade acrescenta só a necessidade escolhida", () => {
    const pedido = pedidoComAcessibilidade(PREFERENCIAS, "baixa_visao");

    expect(pedido).toEqual({ ...PREFERENCIAS, acessibilidade: ["baixa_visao"] });
    expect(pedidoComAcessibilidade(pedido!, "baixa_visao")).toBeNull();
  });

  it("outra sugestão manda os lugares atuais para o fim, sem tirar nenhum", () => {
    const candidatos = CATALOGO.map(({ id }) => ({ id }));

    expect(priorizarOutrosLugares(candidatos, roteiro).map((item) => item.id)).toEqual([
      "d",
      "e",
      "a",
      "b",
      "c",
    ]);
  });
});
