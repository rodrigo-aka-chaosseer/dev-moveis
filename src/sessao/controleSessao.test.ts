import { AuthRetryableFetchError } from "@supabase/supabase-js";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Sessao } from "./armazenamento";
import { criarControleSessao } from "./controleSessao";

const supabaseMock = vi.hoisted(() => ({
  cliente: null as null | {
    auth: {
      getSession: ReturnType<typeof vi.fn>;
      onAuthStateChange: ReturnType<typeof vi.fn>;
      signOut: ReturnType<typeof vi.fn>;
    };
  },
}));

vi.mock("../lib/supabase", () => ({
  get supabase() {
    return supabaseMock.cliente;
  },
}));

const disco = vi.hoisted(() => ({
  ordem: [] as string[],
  gravarSessao: vi.fn(),
  apagarSessao: vi.fn(),
}));

vi.mock("./armazenamento", () => ({
  gravarSessao: disco.gravarSessao,
  apagarSessao: disco.apagarSessao,
}));

const ID_USUARIO = "11111111-1111-1111-1111-111111111111";

const IDENTIFICADA: Sessao = {
  modo: "identificado",
  email: "usuario@raizes.com",
  nome: "Ana Silva",
  entradoEm: "2026-10-20T12:00:00.000Z",
};

const VISITANTE: Sessao = {
  modo: "visitante",
  entradoEm: "2026-10-20T12:00:00.000Z",
};

function sessaoServidor(id = ID_USUARIO, email = "usuario@raizes.com") {
  return {
    access_token: "token-de-teste",
    user: { id, email, user_metadata: { nome: "Outra Pessoa" } },
  };
}

type Ouvinte = (evento: string, sessao: unknown) => void;

function clienteFalso(getSession: () => Promise<unknown>) {
  const estado = { ouvinte: null as Ouvinte | null, cancelar: vi.fn() };
  const cliente = {
    auth: {
      getSession: vi.fn(getSession),
      onAuthStateChange: vi.fn((ouvinte: Ouvinte) => {
        estado.ouvinte = ouvinte;
        return { data: { subscription: { unsubscribe: estado.cancelar } } };
      }),
      signOut: vi.fn(async () => {
        disco.ordem.push("signOut");
        return { error: null };
      }),
    },
  };
  supabaseMock.cliente = cliente;
  return { cliente, estado };
}

function iniciarControle(inicial: Sessao | null) {
  const anuncios: (Sessao | null)[] = [];
  const controle = criarControleSessao(inicial, (sessao) => anuncios.push(sessao));
  const desligar = controle.iniciar();
  return { controle, anuncios, desligar };
}

// Deixa as promessas pendentes (getSession, gravação) terminarem.
const esvaziarFila = () => new Promise((resolve) => setTimeout(resolve, 0));

beforeEach(() => {
  supabaseMock.cliente = null;
  disco.ordem = [];
  disco.gravarSessao.mockReset().mockImplementation(async () => {
    disco.ordem.push("gravarSessao");
  });
  disco.apagarSessao.mockReset().mockImplementation(async () => {
    disco.ordem.push("apagarSessao");
  });
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

describe("restauração na abertura", () => {
  it("expõe o id do Supabase quando a sessão do servidor é válida", async () => {
    const { cliente } = clienteFalso(async () => ({
      data: { session: sessaoServidor() },
      error: null,
    }));

    const { controle } = iniciarControle(IDENTIFICADA);
    await esvaziarFila();

    expect(cliente.auth.getSession).toHaveBeenCalledTimes(1);
    expect(controle.atual()).toMatchObject({
      modo: "identificado",
      email: "usuario@raizes.com",
      nome: "Ana Silva",
      usuarioId: ID_USUARIO,
    });
    expect(disco.gravarSessao).toHaveBeenCalledWith(
      expect.objectContaining({ usuarioId: ID_USUARIO }),
    );
  });

  it("não regrava quando o id local já confere", async () => {
    clienteFalso(async () => ({ data: { session: sessaoServidor() }, error: null }));

    const { anuncios } = iniciarControle({ ...IDENTIFICADA, usuarioId: ID_USUARIO });
    await esvaziarFila();

    expect(anuncios).toEqual([]);
    expect(disco.gravarSessao).not.toHaveBeenCalled();
  });

  it("confere uma vez só, mesmo montando de novo", async () => {
    const { cliente } = clienteFalso(async () => ({
      data: { session: sessaoServidor() },
      error: null,
    }));

    const { controle, desligar } = iniciarControle(IDENTIFICADA);
    desligar();
    controle.iniciar();
    await esvaziarFila();

    expect(cliente.auth.getSession).toHaveBeenCalledTimes(1);
  });

  it("mantém a conta aberta quando o servidor não responde", async () => {
    clienteFalso(async () => ({
      data: { session: null },
      error: new AuthRetryableFetchError("Failed to fetch", 0),
    }));

    const { controle } = iniciarControle(IDENTIFICADA);
    await esvaziarFila();

    expect(controle.atual()).toEqual(IDENTIFICADA);
    expect(disco.apagarSessao).not.toHaveBeenCalled();
  });
});

describe("expiração", () => {
  it("apaga o espelho local quando o servidor não tem mais sessão", async () => {
    clienteFalso(async () => ({ data: { session: null }, error: null }));

    const { controle, anuncios } = iniciarControle(IDENTIFICADA);
    await esvaziarFila();

    expect(controle.atual()).toBeNull();
    expect(anuncios).toEqual([null]);
    expect(disco.apagarSessao).toHaveBeenCalledTimes(1);
  });

  it("apaga quando o refresh token foi recusado", async () => {
    clienteFalso(async () => ({
      data: { session: null },
      error: { name: "AuthApiError", status: 400, message: "Invalid Refresh Token" },
    }));

    const { controle } = iniciarControle(IDENTIFICADA);
    await esvaziarFila();

    expect(controle.atual()).toBeNull();
    expect(disco.apagarSessao).toHaveBeenCalledTimes(1);
  });

  it("encerra a conta quando o Supabase avisa SIGNED_OUT", async () => {
    const { estado } = clienteFalso(async () => ({
      data: { session: sessaoServidor() },
      error: null,
    }));
    const { controle } = iniciarControle({ ...IDENTIFICADA, usuarioId: ID_USUARIO });
    await esvaziarFila();

    estado.ouvinte?.("SIGNED_OUT", null);
    await esvaziarFila();

    expect(controle.atual()).toBeNull();
    expect(disco.apagarSessao).toHaveBeenCalledTimes(1);
  });

  it("atualiza o id em TOKEN_REFRESHED", async () => {
    const { estado } = clienteFalso(async () => ({
      data: { session: sessaoServidor() },
      error: null,
    }));
    const { controle } = iniciarControle({ ...IDENTIFICADA, usuarioId: ID_USUARIO });
    await esvaziarFila();

    const outroId = "22222222-2222-2222-2222-222222222222";
    estado.ouvinte?.("TOKEN_REFRESHED", sessaoServidor(outroId, "outra@raizes.com"));

    expect(controle.atual()).toMatchObject({
      usuarioId: outroId,
      email: "outra@raizes.com",
      nome: "Outra Pessoa",
    });
  });

  it("cancela a assinatura ao desmontar", () => {
    const { estado } = clienteFalso(async () => ({ data: { session: null }, error: null }));

    const { desligar } = iniciarControle(null);
    desligar();

    expect(estado.cancelar).toHaveBeenCalledTimes(1);
  });
});

describe("logout", () => {
  it("apaga a sessão local antes de chamar signOut", async () => {
    const { cliente } = clienteFalso(async () => ({
      data: { session: sessaoServidor() },
      error: null,
    }));
    const { controle } = iniciarControle({ ...IDENTIFICADA, usuarioId: ID_USUARIO });
    await esvaziarFila();

    await controle.sair();

    expect(controle.atual()).toBeNull();
    expect(cliente.auth.signOut).toHaveBeenCalledTimes(1);
    expect(disco.ordem).toEqual(["apagarSessao", "signOut"]);
  });

  it("signOut rejeitando não prende a pessoa na conta", async () => {
    const { cliente } = clienteFalso(async () => ({
      data: { session: sessaoServidor() },
      error: null,
    }));
    cliente.auth.signOut.mockRejectedValueOnce(new Error("sem rede"));
    const { controle, anuncios } = iniciarControle({ ...IDENTIFICADA, usuarioId: ID_USUARIO });
    await esvaziarFila();

    await expect(controle.sair()).resolves.toBeUndefined();

    expect(controle.atual()).toBeNull();
    expect(anuncios.at(-1)).toBeNull();
  });

  it("não loga de novo com SIGNED_IN que não veio da tela de login", async () => {
    const { cliente, estado } = clienteFalso(async () => ({
      data: { session: sessaoServidor() },
      error: null,
    }));
    const { controle } = iniciarControle({ ...IDENTIFICADA, usuarioId: ID_USUARIO });
    await esvaziarFila();
    await controle.sair();

    estado.ouvinte?.("SIGNED_IN", sessaoServidor());
    estado.ouvinte?.("TOKEN_REFRESHED", sessaoServidor());
    controle.iniciar();
    await esvaziarFila();

    expect(controle.atual()).toBeNull();
    expect(cliente.auth.getSession).toHaveBeenCalledTimes(1);
    expect(disco.gravarSessao).not.toHaveBeenCalled();
  });

  it("descarta a conferência da abertura que chega depois do logout", async () => {
    let responder: (valor: unknown) => void = () => {};
    clienteFalso(() => new Promise((resolve) => (responder = resolve)));
    const { controle } = iniciarControle(IDENTIFICADA);

    await controle.sair();
    responder({ data: { session: sessaoServidor() }, error: null });
    await esvaziarFila();

    expect(controle.atual()).toBeNull();
    expect(disco.gravarSessao).not.toHaveBeenCalled();
  });

  it("resposta antiga da abertura não derruba um login feito depois", async () => {
    let responder: (valor: unknown) => void = () => {};
    clienteFalso(() => new Promise((resolve) => (responder = resolve)));
    const { controle } = iniciarControle(IDENTIFICADA);

    await controle.sair();
    await controle.entrar("usuario@raizes.com", "Ana Silva", ID_USUARIO);
    responder({ data: { session: null }, error: null });
    await esvaziarFila();

    expect(controle.atual()).toMatchObject({ modo: "identificado", usuarioId: ID_USUARIO });
    expect(disco.apagarSessao).toHaveBeenCalledTimes(1);
  });

  it("lança e mantém a conta se não conseguir apagar do disco", async () => {
    const { cliente } = clienteFalso(async () => ({
      data: { session: sessaoServidor() },
      error: null,
    }));
    const { controle } = iniciarControle({ ...IDENTIFICADA, usuarioId: ID_USUARIO });
    await esvaziarFila();
    disco.apagarSessao.mockRejectedValueOnce(new Error("disco cheio"));

    await expect(controle.sair()).rejects.toThrow("disco cheio");

    expect(controle.atual()).toMatchObject({ modo: "identificado" });
    expect(cliente.auth.signOut).not.toHaveBeenCalled();
  });
});

describe("visitante", () => {
  it("não consulta nem encerra nada no Supabase", async () => {
    const { cliente, estado } = clienteFalso(async () => ({
      data: { session: sessaoServidor() },
      error: null,
    }));

    const { controle } = iniciarControle(VISITANTE);
    await esvaziarFila();
    estado.ouvinte?.("SIGNED_OUT", null);
    estado.ouvinte?.("SIGNED_IN", sessaoServidor());
    expect(controle.atual()).toEqual(VISITANTE);

    await controle.sair();

    expect(cliente.auth.getSession).not.toHaveBeenCalled();
    expect(cliente.auth.signOut).not.toHaveBeenCalled();
    expect(controle.atual()).toBeNull();
  });

  it("entra como visitante sem Supabase configurado", async () => {
    const { controle } = iniciarControle(null);

    await controle.entrarComoVisitante();
    await controle.sair();

    expect(disco.ordem).toEqual(["gravarSessao", "apagarSessao"]);
    expect(controle.atual()).toBeNull();
  });
});

describe("login", () => {
  it("grava o id recebido da autenticação", async () => {
    clienteFalso(async () => ({ data: { session: null }, error: null }));
    const { controle } = iniciarControle(null);

    await controle.entrar("usuario@raizes.com", "Ana Silva", ID_USUARIO);

    expect(disco.gravarSessao).toHaveBeenCalledWith(
      expect.objectContaining({ modo: "identificado", usuarioId: ID_USUARIO }),
    );
    expect(controle.atual()).toMatchObject({ usuarioId: ID_USUARIO });
  });

  it("no modo mock, sem Supabase, entra sem id e não confere nada", async () => {
    const { controle } = iniciarControle(IDENTIFICADA);
    await esvaziarFila();

    expect(controle.atual()).toEqual(IDENTIFICADA);
    await controle.sair();
    expect(controle.atual()).toBeNull();
  });
});
