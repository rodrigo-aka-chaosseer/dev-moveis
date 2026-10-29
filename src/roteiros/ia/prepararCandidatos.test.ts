import { beforeEach, describe, expect, it, vi } from "vitest";

import { ACESSIBILIDADE_DESCONHECIDA, type Acessibilidade } from "../../locais/acessibilidade";
import type { LocalDetalhe } from "../../locais/listarLocais";
import {
  ErroPreferenciasRecomendacao,
  montarPedidoRoteiro,
  padronizarPreferencias,
  selecionarCandidatosLocais,
  type PreferenciasRecomendacao,
} from "./prepararCandidatos";

const listarLocaisDetalhados = vi.hoisted(() => vi.fn());

vi.mock("../../locais/listarLocais", () => ({ listarLocaisDetalhados }));

const PREFERENCIAS: PreferenciasRecomendacao = {
  cidadeId: "salvador",
  interesses: ["cultura"],
  tempoDisponivelMin: 180,
  orcamentoCentavos: 5_000,
  ritmo: "moderado",
  acessibilidade: [],
};

function local(
  id: string,
  alteracoes: Partial<LocalDetalhe> = {},
): LocalDetalhe {
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
    porQueConhecer: "Conteúdo curado.",
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

function selecionar(
  locais: LocalDetalhe[],
  alteracoes: Partial<PreferenciasRecomendacao> = {},
) {
  return selecionarCandidatosLocais(
    locais,
    padronizarPreferencias({ ...PREFERENCIAS, ...alteracoes }),
  );
}

describe("padronizarPreferencias", () => {
  it("remove repetições e explicita os valores padrão", () => {
    expect(
      padronizarPreferencias({
        cidadeId: "salvador",
        interesses: ["cultura", "cultura"],
        tempoDisponivelMin: 180,
        acessibilidade: ["baixa_visao", "baixa_visao"],
      }),
    ).toEqual({
      cidadeId: "salvador",
      interesses: ["cultura"],
      tempoDisponivelMin: 180,
      orcamentoCentavos: null,
      ritmo: "moderado",
      acessibilidade: ["baixa_visao"],
    });
  });

  it("rejeita preferências que não formam um pedido válido", () => {
    expect(() => padronizarPreferencias({ ...PREFERENCIAS, interesses: [] })).toThrow(
      ErroPreferenciasRecomendacao,
    );
    expect(() => padronizarPreferencias({ ...PREFERENCIAS, tempoDisponivelMin: 30 })).toThrow(
      "entre 1 e 12 horas",
    );
    expect(() => padronizarPreferencias({ ...PREFERENCIAS, orcamentoCentavos: -1 })).toThrow(
      "Orçamento inválido",
    );
  });
});

describe("selecionarCandidatosLocais", () => {
  it("mantém só a cidade e as categorias ligadas aos interesses", () => {
    const candidatos = selecionar([
      local("cultura-salvador"),
      local("outra-cidade", { cidadeId: "recife" }),
      local("outra-categoria", { categoria: "natureza" }),
      local("patrimonio", { categoria: "patrimonio" }),
    ], { interesses: ["cultura", "historia"] });

    expect(candidatos.map((item) => item.id)).toEqual(["cultura-salvador", "patrimonio"]);
  });

  it("também reconhece um interesse nas tags editoriais", () => {
    const candidatos = selecionar([
      local("cultura-com-musica", { categoria: "cultura", tags: ["Música"] }),
      local("cultura-sem-musica", { categoria: "cultura", tags: ["Memória"] }),
    ], { interesses: ["musica"] });

    expect(candidatos.map((item) => item.id)).toEqual(["cultura-com-musica"]);
  });

  it("filtra duração e custo conhecidos, mas preserva preço desconhecido com aviso", () => {
    const candidatos = selecionar([
      local("cabe-no-pedido"),
      local("demorado", { tempoMedioMin: 240 }),
      local("caro", { precoCentavos: 8_000 }),
      local("sem-preco", { precoCentavos: null }),
      local("gratuito", { gratuito: true, precoCentavos: null }),
    ]);

    expect(candidatos.map((item) => item.id)).toEqual([
      "cabe-no-pedido",
      "sem-preco",
      "gratuito",
    ]);
    expect(candidatos[1].restricoes).toContain("Preço não informado.");
    expect(candidatos[2].custoCentavos).toBe(0);
  });

  it("exclui barreiras confirmadas e sinaliza acessibilidade não informada", () => {
    const semRampa: Acessibilidade = { ...ACESSIBILIDADE_DESCONHECIDA, rampa: "nao" };
    const comRampa: Acessibilidade = { ...ACESSIBILIDADE_DESCONHECIDA, rampa: "sim" };
    const candidatos = selecionar([
      local("sem-rampa", { acessibilidade: semRampa }),
      local("com-rampa", { acessibilidade: comRampa }),
      local("rampa-desconhecida"),
      local("ruido-alto", {
        ambienteSensorial: {
          ruido: "alto",
          iluminacao: "media",
          movimentacao: "alta",
          temFila: true,
          espacoDescanso: false,
        },
      }),
    ], { acessibilidade: ["cadeira_de_rodas", "sensibilidade_sensorial"] });

    expect(candidatos.map((item) => item.id)).toEqual(["com-rampa", "rampa-desconhecida"]);
    expect(candidatos[0].restricoes).toContain("Nível de ruído não informado.");
    expect(candidatos[1].restricoes).toEqual(expect.arrayContaining([
      "Acesso para cadeira de rodas não confirmado.",
      "Nível de ruído não informado.",
    ]));
  });

  it("mantém baixa visão com aviso quando os recursos não estão confirmados", () => {
    const candidatos = selecionar([
      local("sem-recursos"),
      local("com-audiodescricao", {
        acessibilidade: {
          ...ACESSIBILIDADE_DESCONHECIDA,
          audiodescricao: "parcial",
        },
      }),
    ], { acessibilidade: ["baixa_visao"] });

    expect(candidatos.map((item) => item.id)).toEqual([
      "sem-recursos",
      "com-audiodescricao",
    ]);
    expect(candidatos[0].restricoes).toContain("Recursos para baixa visão não confirmados.");
    expect(candidatos[1].restricoes).not.toContain("Recursos para baixa visão não confirmados.");
  });

  it("entrega os campos auditáveis e limita a lista a 40 locais", () => {
    const candidatos = selecionar(
      Array.from({ length: 45 }, (_, indice) =>
        local(`local-${indice}`, { avisoVisitacao: indice === 0 ? "Agende a visita." : null }),
      ),
    );

    expect(candidatos).toHaveLength(40);
    expect(candidatos[0]).toEqual({
      id: "local-0",
      categoria: "cultura",
      duracaoMin: 60,
      custoCentavos: 2_000,
      restricoes: ["Agende a visita."],
    });
  });
});

describe("montarPedidoRoteiro", () => {
  beforeEach(() => listarLocaisDetalhados.mockReset());

  it("carrega somente o catálogo publicado da cidade e monta o pedido", async () => {
    listarLocaisDetalhados.mockResolvedValue([local("publicado")]);

    const pedido = await montarPedidoRoteiro(PREFERENCIAS);

    expect(listarLocaisDetalhados).toHaveBeenCalledWith("salvador");
    expect(pedido).toMatchObject({
      cidadeId: "salvador",
      interesses: ["cultura"],
      candidatos: [{ id: "publicado", categoria: "cultura", duracaoMin: 60 }],
    });
  });
});
