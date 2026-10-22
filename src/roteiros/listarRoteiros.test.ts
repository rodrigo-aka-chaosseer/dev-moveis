import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { buscarRoteiroPorId, listarRoteiros, paradasDisponiveis } from "./listarRoteiros";

const supabaseMock = vi.hoisted(() => ({
  cliente: null as { from: ReturnType<typeof vi.fn> } | null,
}));

vi.mock("../lib/supabase", () => ({
  get supabase() {
    return supabaseMock.cliente;
  },
}));

const LOCAL_SALVADOR = {
  id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
  nome: "Mercado Modelo",
  categoria: "cultura",
  latitude: -12.9737,
  longitude: -38.5138,
  endereco: "Cidade Baixa, Salvador",
  horarios: null,
  gratuito: true,
  preco_centavos: null,
  tempo_medio_min: 45,
  por_que_conhecer: "Ponto de cultura popular no Comércio.",
  historia: "O mercado reúne artesanato e memória do porto.",
  aviso_visitacao: null,
  fonte: "IPHAN",
  atualizado_em: "2026-03-01T12:00:00.000Z",
  locais_tags: [],
};

const ROTEIRO_SALVADOR = {
  id: "11111111-1111-1111-1111-111111111111",
  titulo: "Cidade Baixa",
  descricao: "Mercado e porto.",
  duracao_min: 120,
  distancia_metros: 1800,
  custo_centavos: 0,
  imagem_url: null,
  roteiro_paradas: [
    { ordem: 2, local_id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb", duracao_min: 30, hora_sugerida: "10:00:00", locais: null },
    { ordem: 1, local_id: LOCAL_SALVADOR.id, duracao_min: 45, hora_sugerida: "09:00:00", locais: LOCAL_SALVADOR },
  ],
};

const ROTEIRO_RECIFE = {
  ...ROTEIRO_SALVADOR,
  id: "22222222-2222-2222-2222-222222222222",
  titulo: "Recife Antigo",
  roteiro_paradas: [
    {
      ordem: 1,
      local_id: "cccccccc-cccc-cccc-cccc-cccccccccccc",
      duracao_min: 60,
      hora_sugerida: null,
      locais: { ...LOCAL_SALVADOR, id: "cccccccc-cccc-cccc-cccc-cccccccccccc", latitude: -8.0631, longitude: -34.8711 },
    },
  ],
};

function consultaFalsa(resultado: { data: unknown; error: unknown }) {
  const resposta = Promise.resolve(resultado);
  const builder = {
    select: vi.fn(() => builder),
    is: vi.fn(() => builder),
    eq: vi.fn(() => builder),
    maybeSingle: vi.fn(() => resposta),
    then: resposta.then.bind(resposta),
  };
  return { from: vi.fn(() => builder), builder };
}

const urlAntes = process.env.EXPO_PUBLIC_SUPABASE_URL;

beforeEach(() => {
  delete process.env.EXPO_PUBLIC_SUPABASE_URL;
  supabaseMock.cliente = null;
});

afterEach(() => {
  if (urlAntes === undefined) delete process.env.EXPO_PUBLIC_SUPABASE_URL;
  else process.env.EXPO_PUBLIC_SUPABASE_URL = urlAntes;
});

function comBanco(resultado: { data: unknown; error: unknown }) {
  process.env.EXPO_PUBLIC_SUPABASE_URL = "https://exemplo.supabase.co";
  const consulta = consultaFalsa(resultado);
  supabaseMock.cliente = { from: consulta.from };
  return consulta;
}

describe("listarRoteiros", () => {
  it("cai no catálogo local quando o Supabase não está configurado", async () => {
    const lista = await listarRoteiros("recife");

    expect(lista.map((roteiro) => roteiro.id)).toEqual(["frevo-sertao-recife"]);
    expect(lista[0].paradas.every((parada) => parada.local !== null)).toBe(true);
  });

  it("lê só temáticos públicos, ordena as paradas e separa por cidade", async () => {
    const { from, builder } = comBanco({ data: [ROTEIRO_SALVADOR, ROTEIRO_RECIFE], error: null });

    const lista = await listarRoteiros("salvador");

    expect(from).toHaveBeenCalledWith("roteiros");
    expect(builder.eq).toHaveBeenCalledWith("tipo", "tematico");
    expect(builder.is).toHaveBeenCalledWith("usuario_id", null);
    expect(lista).toHaveLength(1);
    expect(lista[0]).toMatchObject({
      titulo: "Cidade Baixa",
      duracaoMin: 120,
      distanciaMetros: 1800,
      custoCentavos: 0,
      cidadeId: "salvador",
    });
    expect(lista[0].paradas.map((parada) => parada.ordem)).toEqual([1, 2]);
    expect(lista[0].paradas[0].horaSugerida).toBe("09:00");
  });

  it("parada de lugar arquivado vem sem local e fica fora das disponíveis", async () => {
    comBanco({ data: [ROTEIRO_SALVADOR], error: null });

    const [roteiro] = await listarRoteiros("salvador");

    expect(roteiro.paradas[1].local).toBeNull();
    expect(paradasDisponiveis(roteiro).map((parada) => parada.ordem)).toEqual([1]);
  });

  it("roteiro sem nenhuma parada publicada não entra na lista da cidade", async () => {
    comBanco({ data: [{ ...ROTEIRO_SALVADOR, roteiro_paradas: [] }], error: null });

    expect(await listarRoteiros("salvador")).toEqual([]);
  });

  it("propaga o erro do banco", async () => {
    comBanco({ data: null, error: new Error("falhou") });

    await expect(listarRoteiros("salvador")).rejects.toThrow("falhou");
  });
});

describe("buscarRoteiroPorId", () => {
  it("acha no catálogo local", async () => {
    const roteiro = await buscarRoteiroPorId("caminhos-afro-salvador");
    expect(roteiro?.paradas).toHaveLength(3);
  });

  it("devolve null quando não existe", async () => {
    comBanco({ data: null, error: null });
    expect(await buscarRoteiroPorId("nao-existe")).toBeNull();
  });

  it("devolve roteiro vazio sem quebrar", async () => {
    comBanco({ data: { ...ROTEIRO_SALVADOR, roteiro_paradas: [] }, error: null });

    const roteiro = await buscarRoteiroPorId(ROTEIRO_SALVADOR.id);

    expect(roteiro?.paradas).toEqual([]);
    expect(roteiro?.cidadeId).toBeNull();
  });
});
