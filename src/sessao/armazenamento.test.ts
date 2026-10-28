import { beforeEach, describe, expect, it, vi } from "vitest";

import { CHAVE_SESSAO, lerSessao } from "./armazenamento";

const disco = vi.hoisted(() => new Map<string, string>());

vi.mock("@react-native-async-storage/async-storage", () => ({
  default: {
    getItem: vi.fn(async (chave: string) => disco.get(chave) ?? null),
    setItem: vi.fn(async (chave: string, valor: string) => {
      disco.set(chave, valor);
    }),
    removeItem: vi.fn(async (chave: string) => {
      disco.delete(chave);
    }),
  },
}));

const SESSAO_V1 = {
  modo: "identificado",
  email: "usuario@raizes.com",
  nome: "Ana Silva",
  entradoEm: "2026-10-20T12:00:00.000Z",
};

beforeEach(() => {
  disco.clear();
});

describe("lerSessao", () => {
  it("preserva o usuarioId gravado", async () => {
    disco.set(CHAVE_SESSAO, JSON.stringify({ ...SESSAO_V1, usuarioId: "abc-123" }));

    await expect(lerSessao()).resolves.toMatchObject({ usuarioId: "abc-123" });
  });

  it("continua lendo a sessão antiga, sem usuarioId", async () => {
    disco.set(CHAVE_SESSAO, JSON.stringify(SESSAO_V1));

    const sessao = await lerSessao();

    expect(sessao).toMatchObject({ modo: "identificado", email: "usuario@raizes.com" });
    expect(sessao?.usuarioId).toBeUndefined();
  });

  it("descarta usuarioId vazio ou de tipo errado sem perder a sessão", async () => {
    disco.set(CHAVE_SESSAO, JSON.stringify({ ...SESSAO_V1, usuarioId: 42 }));
    expect((await lerSessao())?.usuarioId).toBeUndefined();

    disco.set(CHAVE_SESSAO, JSON.stringify({ ...SESSAO_V1, usuarioId: "" }));
    const sessao = await lerSessao();
    expect(sessao?.modo).toBe("identificado");
    expect(sessao?.usuarioId).toBeUndefined();
  });
});
