import { FunctionsFetchError, FunctionsHttpError } from "@supabase/supabase-js";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  ERRO_CONEXAO,
  ERRO_GENERICO,
  ERRO_LOGIN,
  ERRO_RESPOSTA_INVALIDA,
  ERRO_SEM_SUPABASE,
  gerarRoteiroIa,
  validarRoteiroRecebido,
  type PedidoRoteiroIa,
  type RoteiroIa,
} from "./gerarRoteiroIa";

const supabaseMock = vi.hoisted(() => ({
  cliente: null as { functions: { invoke: ReturnType<typeof vi.fn> } } | null,
}));

vi.mock("../../lib/supabase", () => ({
  get supabase() {
    return supabaseMock.cliente;
  },
}));

const ID = "11111111-1111-4111-8111-111111111111";

const PEDIDO: PedidoRoteiroIa = {
  cidadeId: "palmas",
  interesses: ["cultura"],
  tempoDisponivelMin: 180,
  acessibilidade: ["cadeira_de_rodas"],
  candidatos: [{ id: ID, nome: "Casa do Carnaval", latitude: -12.97, longitude: -38.5 }],
};

const ROTEIRO: RoteiroIa = {
  titulo: "Pelourinho a pé",
  descricao: "Cultura afro-brasileira no centro histórico.",
  paradas: [
    {
      localId: ID,
      ordem: 1,
      duracaoMin: 60,
      justificativa: "Conta a história do carnaval de rua.",
      acessibilidadeNaoConfirmada: false,
    },
  ],
  duracaoMin: 60,
  distanciaMetros: 0,
  custoCentavos: 2000,
  avisos: [],
  geradoPorIa: true,
};

function clienteCom(resultado: { data: unknown; error: unknown }) {
  const invoke = vi.fn(async () => resultado);
  supabaseMock.cliente = { functions: { invoke } };
  return invoke;
}

describe("gerarRoteiroIa", () => {
  beforeEach(() => {
    supabaseMock.cliente = null;
  });

  it("sem Supabase avisa que a geração precisa dele", async () => {
    await expect(gerarRoteiroIa(PEDIDO)).rejects.toThrow(ERRO_SEM_SUPABASE);
  });

  it("chama a função e devolve o roteiro, mandando só o id dos candidatos", async () => {
    const invoke = clienteCom({ data: ROTEIRO, error: null });

    await expect(gerarRoteiroIa(PEDIDO)).resolves.toEqual(ROTEIRO);
    expect(invoke).toHaveBeenCalledWith(
      "gerar-roteiro",
      expect.objectContaining({
        body: { ...PEDIDO, candidatos: [{ id: ID }] },
      }),
    );
  });

  it("mostra a mensagem que a função devolveu, com o status", async () => {
    const resposta = new Response(
      JSON.stringify({ erro: "A sugestão demorou mais que o esperado. Tente de novo." }),
      { status: 504, headers: { "Content-Type": "application/json" } },
    );
    clienteCom({ data: null, error: new FunctionsHttpError(resposta) });

    await expect(gerarRoteiroIa(PEDIDO)).rejects.toMatchObject({
      message: "A sugestão demorou mais que o esperado. Tente de novo.",
      status: 504,
    });
  });

  it("usa a mensagem genérica quando o erro não tem corpo legível", async () => {
    clienteCom({ data: null, error: new FunctionsHttpError(new Response("<html>", { status: 502 })) });

    await expect(gerarRoteiroIa(PEDIDO)).rejects.toMatchObject({ message: ERRO_GENERICO, status: 502 });
  });

  it("401 do gateway sem corpo da função pede login", async () => {
    const resposta = new Response(JSON.stringify({ code: 401, message: "Invalid JWT" }), { status: 401 });
    clienteCom({ data: null, error: new FunctionsHttpError(resposta) });

    await expect(gerarRoteiroIa(PEDIDO)).rejects.toMatchObject({ message: ERRO_LOGIN, status: 401 });
  });

  it("falha de rede vira mensagem de conexão", async () => {
    clienteCom({ data: null, error: new FunctionsFetchError(new TypeError("fetch failed")) });

    await expect(gerarRoteiroIa(PEDIDO)).rejects.toThrow(ERRO_CONEXAO);
  });

  it("resposta fora do contrato vira erro amigável e específico", async () => {
    clienteCom({ data: { titulo: "sem paradas" }, error: null });

    await expect(gerarRoteiroIa(PEDIDO)).rejects.toThrow(ERRO_RESPOSTA_INVALIDA);
  });
});

describe("validarRoteiroRecebido", () => {
  it("aceita a resposta completa que corresponde ao pedido", () => {
    expect(validarRoteiroRecebido(ROTEIRO, PEDIDO)).toBe(true);
  });

  it.each([null, "{json quebrado", {}, { ...ROTEIRO, paradas: [] }])(
    "rejeita resposta vazia, quebrada ou sem paradas: %j",
    (resposta) => {
      expect(validarRoteiroRecebido(resposta, PEDIDO)).toBe(false);
    },
  );

  it("rejeita ID inventado ou fora da lista de candidatos", () => {
    const inventado = {
      ...ROTEIRO,
      paradas: [
        { ...ROTEIRO.paradas[0], localId: "99999999-9999-4999-8999-999999999999" },
      ],
    };

    expect(validarRoteiroRecebido(inventado, PEDIDO)).toBe(false);
  });

  it("rejeita paradas duplicadas", () => {
    const duplicado = {
      ...ROTEIRO,
      paradas: [
        ROTEIRO.paradas[0],
        { ...ROTEIRO.paradas[0], ordem: 2 },
      ],
      duracaoMin: 120,
    };

    expect(validarRoteiroRecebido(duplicado, PEDIDO)).toBe(false);
  });

  it("rejeita duração, custo, ordem e quantidade fora dos limites do pedido", () => {
    expect(
      validarRoteiroRecebido({ ...ROTEIRO, duracaoMin: 181 }, PEDIDO),
    ).toBe(false);
    expect(
      validarRoteiroRecebido(
        { ...ROTEIRO, custoCentavos: 2001 },
        { ...PEDIDO, orcamentoCentavos: 2000 },
      ),
    ).toBe(false);
    expect(
      validarRoteiroRecebido(
        { ...ROTEIRO, paradas: [{ ...ROTEIRO.paradas[0], ordem: 2 }] },
        PEDIDO,
      ),
    ).toBe(false);
  });
});


