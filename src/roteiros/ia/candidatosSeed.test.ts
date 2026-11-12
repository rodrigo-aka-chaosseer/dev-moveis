import { describe, expect, it, vi } from "vitest";

import { linhaParaDetalhe, type LocalDetalhe } from "../../locais/listarLocais";
import type { CidadeId } from "../../preferencias/dados";
import { linhasDoSeed } from "../../testes/seedSupabase";
import {
  minimoCandidatos,
  montarRequisicaoClaude,
  prepararCandidatos,
  validarPedido,
  type PedidoNormalizado,
} from "../../../supabase/functions/_shared/roteiroIa";
import { avaliarSelecao, padronizarPreferencias, type PreferenciasRecomendacao } from "./prepararCandidatos";

// O catálogo importa o cliente Supabase, que puxa o React Native.
vi.mock("../../lib/supabase", () => ({ supabase: null }));

/**
 * RAÍZES-36 com os dados reais do piloto: os 9 lugares de Palmas do
 * supabase/seed.sql, com tags, acessibilidade e ambiente sensorial.
 */
const LINHAS = linhasDoSeed();
const CATALOGO = LINHAS.map((linha) => linhaParaDetalhe(linha)).filter(
  (local): local is LocalDetalhe => local !== null,
);
const ID = {
  praca: "30000000-0000-4000-8000-000000000001",
  memorial: "30000000-0000-4000-8000-000000000002",
  palacinho: "30000000-0000-4000-8000-000000000003",
  cesamar: "30000000-0000-4000-8000-000000000004",
  espacoCultural: "30000000-0000-4000-8000-000000000005",
  graciosa: "30000000-0000-4000-8000-000000000006",
  feira: "30000000-0000-4000-8000-000000000007",
  povosIndigenas: "30000000-0000-4000-8000-000000000008",
  roncadeira: "30000000-0000-4000-8000-000000000009",
};

function avaliar(preferencias: Partial<PreferenciasRecomendacao>, catalogo = CATALOGO) {
  const pedido = padronizarPreferencias({
    cidadeId: "palmas",
    interesses: ["historia"],
    tempoDisponivelMin: 240,
    orcamentoCentavos: null,
    ritmo: "moderado",
    acessibilidade: [],
    ...preferencias,
  });
  return avaliarSelecao(catalogo, pedido);
}

function pedidoServidor(alteracoes: Record<string, unknown> = {}): PedidoNormalizado {
  const validado = validarPedido({
    cidadeId: "palmas",
    interesses: ["historia"],
    tempoDisponivelMin: 240,
    candidatos: LINHAS.map((linha) => ({ id: linha.id })),
    ...alteracoes,
  });
  if (!validado.ok) throw new Error(validado.erro);
  return validado.valor;
}

describe("seed do piloto", () => {
  it("tem os 9 lugares publicados de Palmas, gratuitos e pagos", () => {
    expect(CATALOGO).toHaveLength(9);
    expect(CATALOGO.every((local) => local.cidadeId === "palmas")).toBe(true);
    expect(LINHAS.every((linha) => linha.arquivado_em === null)).toBe(true);
    expect(CATALOGO.some((local) => local.gratuito)).toBe(true);
    expect(CATALOGO.some((local) => !local.gratuito && local.precoCentavos === 3000)).toBe(true);
  });
});

describe("seleção no app (o que a pessoa escolheu)", () => {
  it("cada candidato tem id, nome, categoria, duração e custo", () => {
    const { candidatos } = avaliar({ interesses: ["historia", "natureza"] });

    expect(candidatos.length).toBeGreaterThan(0);
    for (const candidato of candidatos) {
      expect(Object.keys(candidato).sort()).toEqual(
        ["categoria", "custoCentavos", "duracaoMin", "id", "nome", "restricoes"],
      );
      expect(candidato.nome).toBeTruthy();
    }
  });

  it("aplica os interesses com a mesma regra do Explorar", () => {
    const { candidatos, bloqueio } = avaliar({ interesses: ["historia"] });

    expect(bloqueio).toBeNull();
    expect(candidatos.map((candidato) => candidato.id)).toEqual([ID.praca, ID.memorial, ID.palacinho]);
  });

  it("deixa de fora lugar de outra cidade, mesmo com o interesse certo", () => {
    const deOutraCidade = { ...CATALOGO[1], id: "fora", cidadeId: "salvador" as CidadeId };
    const { candidatos } = avaliar({}, [...CATALOGO, deOutraCidade]);

    expect(candidatos.map((candidato) => candidato.id)).not.toContain("fora");
  });

  it("aplica o tempo: em 1 hora só entram visitas de até 1 hora", () => {
    const { candidatos } = avaliar({ interesses: ["historia"], tempoDisponivelMin: 60 });

    expect(candidatos.map((candidato) => candidato.id)).toEqual([ID.memorial, ID.palacinho]);
  });

  it("aplica o orçamento: lugar pago acima do teto sai", () => {
    const catalogo = CATALOGO.map((local) =>
      local.id === ID.memorial ? { ...local, gratuito: false, precoCentavos: 3000 } : local,
    );
    const { candidatos } = avaliar({ orcamentoCentavos: 2000 }, catalogo);

    expect(candidatos.map((candidato) => candidato.id)).toEqual([ID.praca, ID.palacinho]);
  });

  it("aplica a acessibilidade: rampa confirmada entra limpa, sem dado entra com aviso", () => {
    const { candidatos } = avaliar({ acessibilidade: ["cadeira_de_rodas"] });
    const porId = new Map(candidatos.map((candidato) => [candidato.id, candidato]));

    expect(porId.get(ID.palacinho)?.restricoes).not.toContain("Acesso para cadeira de rodas não confirmado.");
    expect(porId.get(ID.memorial)?.restricoes).toContain("Acesso para cadeira de rodas não confirmado.");
  });
});

describe("bloqueio sem candidatos suficientes, com orientação", () => {
  it("interesse sem nenhum lugar: pede outros interesses", () => {
    const { candidatos, bloqueio } = avaliar({ interesses: ["musica"] });

    expect(candidatos).toEqual([]);
    expect(bloqueio).toBe("Nenhum lugar de Palmas combina com Música. Escolha outros interesses.");
  });

  it("um lugar só não vira roteiro: pede mais interesses", () => {
    const { bloqueio } = avaliar({ interesses: ["gastronomia"] });

    expect(bloqueio).toBe("Só 1 lugar de Palmas combina com Gastronomia. Escolha mais interesses para montar um roteiro.");
  });

  it("lugares que não cabem no tempo: pede mais tempo", () => {
    const { bloqueio } = avaliar({ interesses: ["natureza"], tempoDisponivelMin: 60 });

    expect(bloqueio).toBe("Os lugares de Natureza pedem mais de 1h de visita. Escolha mais tempo.");
  });

  it("lugares acima do orçamento: pede para aumentar o orçamento", () => {
    const catalogo = CATALOGO.map((local) => ({ ...local, gratuito: false, precoCentavos: 3000 }));
    const { bloqueio } = avaliar({ orcamentoCentavos: 0 }, catalogo);

    expect(bloqueio).toBe(
      "Poucos lugares de História cabem no orçamento (só lugares gratuitos). Aumente o orçamento ou escolha outros interesses.",
    );
  });

  it("com tempo para uma parada só, um candidato basta", () => {
    expect(minimoCandidatos(60, "tranquilo")).toBe(1);
    expect(minimoCandidatos(240, "moderado")).toBe(2);
    expect(avaliar({ interesses: ["gastronomia"], tempoDisponivelMin: 90, ritmo: "tranquilo" }).bloqueio).toBeNull();
  });
});

describe("servidor (o que a IA recebe)", () => {
  it("relê no banco só lugares da cidade escolhida", () => {
    const emSalvador = { ...LINHAS[0], id: "fora", latitude: -12.9714, longitude: -38.5014 };
    const pedido = pedidoServidor({ candidatos: [{ id: "fora" }, { id: ID.praca }] });

    expect(prepararCandidatos([emSalvador, LINHAS[0]], pedido).map((local) => local.id)).toEqual([ID.praca]);
  });

  it("repete o filtro de tempo", () => {
    const candidatos = prepararCandidatos(LINHAS, pedidoServidor({ tempoDisponivelMin: 60 }));

    expect(candidatos.every((local) => local.tempoMedioMin <= 60)).toBe(true);
    expect(candidatos.map((local) => local.id)).toContain(ID.memorial);
    expect(candidatos.map((local) => local.id)).not.toContain(ID.graciosa);
  });

  it("manda ao modelo só os campos necessários de cada lugar", () => {
    const pedido = pedidoServidor({ acessibilidade: ["cadeira_de_rodas"] });
    const requisicao = montarRequisicaoClaude(pedido, prepararCandidatos(LINHAS, pedido));
    const conteudo = requisicao.messages[0].content as string;
    const lugares = JSON.parse(conteudo.split("<lugares>\n")[1].split("\n</lugares>")[0].replace(/\\u003c/g, "<"));

    expect(Object.keys(lugares[0]).sort()).toEqual(
      ["avisoVisitacao", "categoria", "gratuito", "id", "latitude", "longitude", "nome", "porQueConhecer", "precoCentavos", "tags", "tempoMedioMin"],
    );
    expect(conteudo).not.toMatch(/acessibilidade|ambienteSensorial|\bcadeira\b|\brampa\b/i);
  });
});
