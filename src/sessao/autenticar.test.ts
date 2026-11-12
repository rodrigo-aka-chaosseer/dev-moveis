import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  autenticar,
  cadastrar,
  encerrarAutenticacao,
  MENSAGEM_SUPABASE_NAO_CONFIGURADO,
} from "./autenticar";

const supabaseMock = vi.hoisted(() => ({
  cliente: null as null | {
    auth: {
      signInWithPassword: ReturnType<typeof vi.fn>;
      signUp: ReturnType<typeof vi.fn>;
      signOut: ReturnType<typeof vi.fn>;
    };
  },
}));

vi.mock("../lib/supabase", () => ({
  get supabase() {
    return supabaseMock.cliente;
  },
}));

const USUARIO = {
  id: "11111111-1111-4111-8111-111111111111",
  email: "maria@exemplo.com",
  user_metadata: { nome: "Maria Clara" },
};

function cliente() {
  const auth = {
    signInWithPassword: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(async () => ({ error: null })),
  };
  supabaseMock.cliente = { auth };
  return auth;
}

beforeEach(() => {
  supabaseMock.cliente = null;
  vi.restoreAllMocks();
});

describe("autenticação real", () => {
  it("não aceita uma conta fixa quando o Supabase não está configurado", async () => {
    await expect(
      autenticar({ email: "usuario@raizes.com", senha: "123456" }),
    ).resolves.toEqual({ ok: false, mensagem: MENSAGEM_SUPABASE_NAO_CONFIGURADO });
  });

  it("entra com o usuário retornado pelo Supabase", async () => {
    const auth = cliente();
    auth.signInWithPassword.mockResolvedValue({ data: { user: USUARIO }, error: null });

    await expect(
      autenticar({ email: "  MARIA@EXEMPLO.COM ", senha: "segredo123" }),
    ).resolves.toEqual({
      ok: true,
      email: USUARIO.email,
      nome: "Maria Clara",
      usuarioId: USUARIO.id,
    });
    expect(auth.signInWithPassword).toHaveBeenCalledWith({
      email: "maria@exemplo.com",
      password: "segredo123",
    });
  });

  it.each([
    ["Invalid login credentials", 400, "E-mail ou senha incorretos."],
    ["Email not confirmed", 400, "Confirme seu e-mail antes de entrar."],
  ])("traduz %s para uma mensagem amigável", async (message, status, mensagem) => {
    const auth = cliente();
    auth.signInWithPassword.mockResolvedValue({
      data: { user: null },
      error: { message, status },
    });

    await expect(
      autenticar({ email: "maria@exemplo.com", senha: "errada" }),
    ).resolves.toEqual({ ok: false, mensagem });
  });

  it("cadastra a conta com o nome nos metadados do Auth", async () => {
    const auth = cliente();
    auth.signUp.mockResolvedValue({
      data: { user: USUARIO, session: null },
      error: null,
    });

    await expect(
      cadastrar({ nome: " Maria Clara ", email: "MARIA@EXEMPLO.COM", senha: "segredo123" }),
    ).resolves.toMatchObject({
      ok: true,
      usuarioId: USUARIO.id,
      precisaConfirmarEmail: true,
    });
    expect(auth.signUp).toHaveBeenCalledWith({
      email: "maria@exemplo.com",
      password: "segredo123",
      options: { data: { nome: "Maria Clara" } },
    });
  });

  it("encerra somente a sessão local do aparelho", async () => {
    const auth = cliente();

    await encerrarAutenticacao();

    expect(auth.signOut).toHaveBeenCalledWith({ scope: "local" });
  });
});

