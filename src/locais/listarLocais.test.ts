import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { buscarLocalPorId, listarLocais } from "./listarLocais";

const supabaseMock = vi.hoisted(() => ({
  cliente: null as { from: ReturnType<typeof vi.fn> } | null,
}));

vi.mock("../lib/supabase", () => ({
  get supabase() {
    return supabaseMock.cliente;
  },
}));

const LINHA_SALVADOR = {
  id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
  nome: "Mercado Modelo",
  categoria: "cultura" as const,
  latitude: -12.9737,
  longitude: -38.5138,
  endereco: "Cidade Baixa, Salvador",
  horarios: { terca: { abre: "09:00", fecha: "18:00" } },
  gratuito: true,
  preco_centavos: null,
  tempo_medio_min: 45,
  por_que_conhecer: "Ponto de cultura popular no Comércio.",
  historia: "O mercado reúne artesanato e memória do porto.",
  aviso_visitacao: null,
  fonte: "IPHAN",
  atualizado_em: "2026-03-01T12:00:00.000Z",
  imagem_url: "https://example.com/mercado.jpg",
  audio_url: null,
  locais_tags: [{ tags_diversidade: { nome: "Afro-brasileira" } }],
};

const LINHA_RECIFE = {
  ...LINHA_SALVADOR,
  id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
  nome: "Paço do Frevo",
  latitude: -8.0631,
  longitude: -34.8711,
  endereco: "Recife Antigo, Recife",
  locais_tags: [{ tags_diversidade: { nome: "Cultura popular" } }],
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
  return {
    from: vi.fn(() => builder),
    builder,
  };
}

describe("listarLocais", () => {
  const urlAntes = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const chaveAntes = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

  beforeEach(() => {
    delete process.env.EXPO_PUBLIC_SUPABASE_URL;
    delete process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
    supabaseMock.cliente = null;
  });

  afterEach(() => {
    if (urlAntes === undefined) delete process.env.EXPO_PUBLIC_SUPABASE_URL;
    else process.env.EXPO_PUBLIC_SUPABASE_URL = urlAntes;
    if (chaveAntes === undefined) delete process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
    else process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = chaveAntes;
  });

  it("cai no mock quando a URL do Supabase não está definida", async () => {
    const lista = await listarLocais("salvador");

    expect(lista.map((local) => local.id)).toContain("casa-carnaval-bahia");
    expect(lista.every((local) => local.cidadeId === "salvador")).toBe(true);
  });

  it("no mock filtra pela cidade escolhida", async () => {
    const recife = await listarLocais("recife");

    expect(recife.map((local) => local.id)).toContain("paco-frevo");
    expect(recife.every((local) => local.cidadeId === "recife")).toBe(true);
  });

  it("lê do banco, monta tags e ignora lugar de outra cidade", async () => {
    process.env.EXPO_PUBLIC_SUPABASE_URL = "https://exemplo.supabase.co";
    const { from, builder } = consultaFalsa({
      data: [LINHA_SALVADOR, LINHA_RECIFE],
      error: null,
    });
    supabaseMock.cliente = { from };

    const lista = await listarLocais("salvador");

    expect(from).toHaveBeenCalledWith("locais");
    expect(builder.is).toHaveBeenCalledWith("arquivado_em", null);
    expect(lista).toHaveLength(1);
    expect(lista[0]).toMatchObject({
      id: LINHA_SALVADOR.id,
      nome: "Mercado Modelo",
      cidadeId: "salvador",
      porQueConhecer: LINHA_SALVADOR.por_que_conhecer,
      precoCentavos: null,
      tags: ["Afro-brasileira"],
    });
    expect(lista[0].atualizadoEm).toEqual(new Date(LINHA_SALVADOR.atualizado_em));
  });

  it("filtra por cidade_id quando o painel envia essa coluna", async () => {
    process.env.EXPO_PUBLIC_SUPABASE_URL = "https://exemplo.supabase.co";
    const { from } = consultaFalsa({
      data: [
        { ...LINHA_SALVADOR, cidade_id: "recife", latitude: -12.9737, longitude: -38.5138 },
      ],
      error: null,
    });
    supabaseMock.cliente = { from };

    const lista = await listarLocais("salvador");

    expect(lista).toEqual([]);
  });

  it("devolve lista vazia quando o banco não tem lugares publicados", async () => {
    process.env.EXPO_PUBLIC_SUPABASE_URL = "https://exemplo.supabase.co";
    const { from } = consultaFalsa({ data: [], error: null });
    supabaseMock.cliente = { from };

    await expect(listarLocais("salvador")).resolves.toEqual([]);
  });

  it("propaga erro do banco para a tela mostrar ERRO_LISTA", async () => {
    process.env.EXPO_PUBLIC_SUPABASE_URL = "https://exemplo.supabase.co";
    const { from } = consultaFalsa({ data: null, error: { message: "boom" } });
    supabaseMock.cliente = { from };

    await expect(listarLocais("salvador")).rejects.toBeTruthy();
  });

  it("não usa mock se a URL existe sem cliente", async () => {
    process.env.EXPO_PUBLIC_SUPABASE_URL = "https://exemplo.supabase.co";

    await expect(listarLocais("salvador")).rejects.toBeTruthy();
  });
});

describe("buscarLocalPorId", () => {
  beforeEach(() => {
    delete process.env.EXPO_PUBLIC_SUPABASE_URL;
    supabaseMock.cliente = null;
  });

  it("cai no mock quando a URL não está definida", async () => {
    const local = await buscarLocalPorId("casa-carnaval-bahia");

    expect(local?.nome).toBe("Casa do Carnaval da Bahia");
  });

  it("devolve null no mock quando o id não existe", async () => {
    await expect(buscarLocalPorId("nao-existe")).resolves.toBeNull();
  });

  it("lê um lugar publicado pelo id, com tags", async () => {
    process.env.EXPO_PUBLIC_SUPABASE_URL = "https://exemplo.supabase.co";
    const { from, builder } = consultaFalsa({ data: LINHA_SALVADOR, error: null });
    supabaseMock.cliente = { from };

    const local = await buscarLocalPorId(LINHA_SALVADOR.id);

    expect(builder.eq).toHaveBeenCalledWith("id", LINHA_SALVADOR.id);
    expect(builder.is).toHaveBeenCalledWith("arquivado_em", null);
    expect(builder.maybeSingle).toHaveBeenCalled();
    expect(local).toMatchObject({
      id: LINHA_SALVADOR.id,
      nome: "Mercado Modelo",
      cidadeId: "salvador",
      tags: ["Afro-brasileira"],
    });
  });

  it("devolve null quando o lugar não existe ou está arquivado", async () => {
    process.env.EXPO_PUBLIC_SUPABASE_URL = "https://exemplo.supabase.co";
    const { from } = consultaFalsa({ data: null, error: null });
    supabaseMock.cliente = { from };

    await expect(buscarLocalPorId("sumiu")).resolves.toBeNull();
  });

  it("propaga erro do banco para a tela mostrar ERRO_UM", async () => {
    process.env.EXPO_PUBLIC_SUPABASE_URL = "https://exemplo.supabase.co";
    const { from } = consultaFalsa({ data: null, error: { message: "boom" } });
    supabaseMock.cliente = { from };

    await expect(buscarLocalPorId("x")).rejects.toBeTruthy();
  });
});
