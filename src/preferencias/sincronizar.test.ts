import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { Preferencias } from "./dados";
import {
  buscarPreferencias,
  criarSincronizador,
  enviarPreferencias,
  mesclarComServidor,
} from "./sincronizar";

type Resposta = { data: unknown; error: unknown };

const supabaseMock = vi.hoisted(() => ({
  cliente: null as { from: ReturnType<typeof vi.fn> } | null,
}));

vi.mock("../lib/supabase", () => ({
  get supabase() {
    return supabaseMock.cliente;
  },
}));

const ID_ANA = "11111111-1111-1111-1111-111111111111";
const ID_BIA = "22222222-2222-2222-2222-222222222222";

const COM_CIDADE: Preferencias = {
  interesses: ["musica"],
  cidadeId: "salvador",
  onboardingConcluido: true,
};

const SEM_CIDADE: Preferencias = {
  interesses: ["arte"],
  cidadeId: null,
  onboardingConcluido: false,
};

const LINHA_CONCLUIDA = {
  interesses: ["historia", "gastronomia"],
  onboarding_concluido: true,
};

/** Cliente falso: cada busca e cada envio devolvem o que o teste mandar. */
function clienteFalso() {
  const busca = vi.fn<() => Promise<Resposta>>(async () => ({ data: null, error: null }));
  const envio = vi.fn<(linha: unknown, opcoes: unknown) => Promise<{ error: unknown }>>(
    async () => ({ error: null }),
  );
  const builder = {
    select: vi.fn(() => builder),
    eq: vi.fn(() => builder),
    maybeSingle: vi.fn(() => busca()),
    upsert: vi.fn((linha: unknown, opcoes: unknown) => envio(linha, opcoes)),
  };
  const from = vi.fn(() => builder);
  supabaseMock.cliente = { from };
  return { from, builder, busca, envio };
}

function adiada<T>() {
  let resolver!: (valor: T) => void;
  const promessa = new Promise<T>((r) => {
    resolver = r;
  });
  return { promessa, resolver };
}

async function esperar() {
  await new Promise((r) => setTimeout(r, 0));
}

/** Simula o provider: memória local e o que o servidor aplicou nela. */
function montar(inicial: Preferencias) {
  const local = { atual: inicial };
  const aplicar = vi.fn((preferencias: Preferencias) => {
    local.atual = preferencias;
  });
  const sincronizador = criarSincronizador({ atual: () => local.atual, aplicar });
  return {
    local,
    aplicar,
    sincronizador,
    /** Mesmo caminho do provider: muda a memória e avisa. */
    alterar(novas: Partial<Preferencias>) {
      local.atual = { ...local.atual, ...novas };
      sincronizador.aoAlterar();
    },
  };
}

let aviso: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  supabaseMock.cliente = null;
  aviso = vi.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
  aviso.mockRestore();
});

describe("mesclarComServidor", () => {
  it("onboarding concluído no servidor: os interesses de lá substituem os locais", () => {
    const resultado = mesclarComServidor(COM_CIDADE, {
      interesses: ["historia"],
      onboardingConcluido: true,
    });

    expect(resultado).toEqual({
      preferencias: { interesses: ["historia"], cidadeId: "salvador", onboardingConcluido: true },
      enviar: false,
    });
  });

  it("aparelho sem cidade: interesses do servidor, onboarding local continua false", () => {
    const resultado = mesclarComServidor(SEM_CIDADE, {
      interesses: ["historia"],
      onboardingConcluido: true,
    });

    expect(resultado.preferencias).toEqual({
      interesses: ["historia"],
      cidadeId: null,
      onboardingConcluido: false,
    });
    expect(resultado.enviar).toBe(false);
  });

  it("sem linha no servidor: o local sobe", () => {
    expect(mesclarComServidor(COM_CIDADE, null)).toEqual({
      preferencias: COM_CIDADE,
      enviar: true,
    });
  });

  it("linha sem onboarding concluído: o local sobe", () => {
    expect(
      mesclarComServidor(COM_CIDADE, { interesses: ["arte"], onboardingConcluido: false }),
    ).toEqual({ preferencias: COM_CIDADE, enviar: true });
  });
});

describe("buscarPreferencias e enviarPreferencias", () => {
  it("busca a linha da conta e descarta interesse desconhecido", async () => {
    const { from, builder, busca } = clienteFalso();
    busca.mockResolvedValueOnce({
      data: { interesses: ["historia", "inventado", 3, "historia"], onboarding_concluido: true },
      error: null,
    });

    await expect(buscarPreferencias(ID_ANA)).resolves.toEqual({
      interesses: ["historia"],
      onboardingConcluido: true,
    });
    expect(from).toHaveBeenCalledWith("preferencias");
    expect(builder.select).toHaveBeenCalledWith("interesses, onboarding_concluido");
    expect(builder.eq).toHaveBeenCalledWith("usuario_id", ID_ANA);
    expect(builder.maybeSingle).toHaveBeenCalled();
  });

  it("devolve null quando a conta ainda não tem linha", async () => {
    clienteFalso();

    await expect(buscarPreferencias(ID_ANA)).resolves.toBeNull();
  });

  it("propaga o error da busca", async () => {
    const { busca } = clienteFalso();
    busca.mockResolvedValueOnce({ data: null, error: { message: "boom" } });

    await expect(buscarPreferencias(ID_ANA)).rejects.toEqual({ message: "boom" });
  });

  it("faz upsert por usuario_id com temas e acessibilidade vazios", async () => {
    const { from, builder } = clienteFalso();

    await enviarPreferencias(ID_ANA, { interesses: ["musica"], onboardingConcluido: true });

    expect(from).toHaveBeenCalledWith("preferencias");
    expect(builder.upsert).toHaveBeenCalledWith(
      {
        usuario_id: ID_ANA,
        interesses: ["musica"],
        onboarding_concluido: true,
        temas_diversidade: [],
        necessidades_acessibilidade: [],
      },
      { onConflict: "usuario_id" },
    );
  });

  it("propaga o error do upsert", async () => {
    const { envio } = clienteFalso();
    envio.mockResolvedValueOnce({ error: { message: "boom" } });

    await expect(
      enviarPreferencias(ID_ANA, { interesses: [], onboardingConcluido: false }),
    ).rejects.toEqual({ message: "boom" });
  });

  it("sem Supabase configurado, recusa sem chamar nada", async () => {
    await expect(buscarPreferencias(ID_ANA)).rejects.toBeTruthy();
    await expect(
      enviarPreferencias(ID_ANA, { interesses: [], onboardingConcluido: false }),
    ).rejects.toBeTruthy();
  });
});

describe("criarSincronizador", () => {
  it("ao entrar, servidor com onboarding concluído substitui o local", async () => {
    const { busca, builder } = clienteFalso();
    busca.mockResolvedValueOnce({ data: LINHA_CONCLUIDA, error: null });
    const { local, aplicar, sincronizador } = montar(COM_CIDADE);

    sincronizador.entrar(ID_ANA);
    await esperar();

    expect(builder.eq).toHaveBeenCalledWith("usuario_id", ID_ANA);
    expect(aplicar).toHaveBeenCalledTimes(1);
    expect(local.atual).toEqual({
      interesses: ["historia", "gastronomia"],
      cidadeId: "salvador",
      onboardingConcluido: true,
    });
    expect(builder.upsert).not.toHaveBeenCalled();
  });

  it("aparelho sem cidade: recebe os interesses, mas o onboarding local fica false", async () => {
    const { busca, builder } = clienteFalso();
    busca.mockResolvedValueOnce({ data: LINHA_CONCLUIDA, error: null });
    const { local, sincronizador, alterar } = montar(SEM_CIDADE);

    sincronizador.entrar(ID_ANA);
    await esperar();

    expect(local.atual).toEqual({
      interesses: ["historia", "gastronomia"],
      cidadeId: null,
      onboardingConcluido: false,
    });

    // Mexer nos interesses antes de escolher a cidade não desfaz o
    // onboarding que a conta já concluiu em outro aparelho.
    alterar({ interesses: ["historia"] });
    await esperar();

    expect(builder.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ interesses: ["historia"], onboarding_concluido: true }),
      { onConflict: "usuario_id" },
    );
  });

  it("sem linha no servidor, sobe as preferências locais", async () => {
    const { builder } = clienteFalso();
    const { aplicar, sincronizador } = montar(COM_CIDADE);

    sincronizador.entrar(ID_ANA);
    await esperar();

    expect(aplicar).not.toHaveBeenCalled();
    expect(builder.upsert).toHaveBeenCalledWith(
      {
        usuario_id: ID_ANA,
        interesses: ["musica"],
        onboarding_concluido: true,
        temas_diversidade: [],
        necessidades_acessibilidade: [],
      },
      { onConflict: "usuario_id" },
    );
  });

  it("depois de mesclar, cada alteração faz upsert com o estado mais novo", async () => {
    const { builder } = clienteFalso();
    const { sincronizador, alterar } = montar(SEM_CIDADE);

    sincronizador.entrar(ID_ANA);
    await esperar();
    builder.upsert.mockClear();

    alterar({ interesses: ["arte", "musica"] });
    alterar({ interesses: ["arte", "musica", "eventos"] });
    await esperar();

    // Os dois toques viram um envio só, com a escolha mais recente.
    expect(builder.upsert).toHaveBeenCalledTimes(1);
    expect(builder.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        interesses: ["arte", "musica", "eventos"],
        onboarding_concluido: false,
      }),
      { onConflict: "usuario_id" },
    );
  });

  it("um envio antigo que demora não passa na frente do mais novo", async () => {
    const { builder, envio } = clienteFalso();
    const { sincronizador, alterar } = montar(SEM_CIDADE);
    sincronizador.entrar(ID_ANA);
    await esperar();
    builder.upsert.mockClear();

    const lento = adiada<{ error: unknown }>();
    envio.mockReturnValueOnce(lento.promessa);
    alterar({ interesses: ["arte", "musica"] });
    await esperar();
    alterar({ interesses: ["natureza"] });
    await esperar();

    // O segundo espera o primeiro terminar.
    expect(builder.upsert).toHaveBeenCalledTimes(1);
    lento.resolver({ error: null });
    await esperar();

    expect(builder.upsert).toHaveBeenCalledTimes(2);
    expect(builder.upsert).toHaveBeenLastCalledWith(
      expect.objectContaining({ interesses: ["natureza"] }),
      { onConflict: "usuario_id" },
    );
  });

  it("alteração feita enquanto a busca não volta ganha do servidor", async () => {
    const { busca, builder } = clienteFalso();
    const resposta = adiada<Resposta>();
    busca.mockReturnValueOnce(resposta.promessa);
    const { local, aplicar, sincronizador, alterar } = montar(COM_CIDADE);

    sincronizador.entrar(ID_ANA);
    alterar({ interesses: ["natureza"] });
    await esperar();
    expect(builder.upsert).not.toHaveBeenCalled();

    resposta.resolver({ data: LINHA_CONCLUIDA, error: null });
    await esperar();

    expect(aplicar).not.toHaveBeenCalled();
    expect(local.atual.interesses).toEqual(["natureza"]);
    expect(builder.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ interesses: ["natureza"], onboarding_concluido: true }),
      { onConflict: "usuario_id" },
    );
  });

  describe("sem chamada ao Supabase", () => {
    it("modo mock: entrar e alterar não chamam nada", async () => {
      const { from } = clienteFalso();
      supabaseMock.cliente = null;
      const { aplicar, sincronizador, alterar } = montar(COM_CIDADE);

      sincronizador.entrar(ID_ANA);
      alterar({ interesses: ["arte"] });
      await esperar();

      expect(from).not.toHaveBeenCalled();
      expect(aplicar).not.toHaveBeenCalled();
      expect(aviso).not.toHaveBeenCalled();
    });

    it("visitante (sem conta) só altera o local", async () => {
      const { from } = clienteFalso();
      const { local, alterar } = montar(COM_CIDADE);

      alterar({ interesses: ["arte"] });
      await esperar();

      expect(from).not.toHaveBeenCalled();
      expect(local.atual.interesses).toEqual(["arte"]);
    });
  });

  describe("falha de rede", () => {
    it("busca rejeitada: mantém o local, avisa no console e tenta de novo na próxima alteração", async () => {
      const { busca, builder } = clienteFalso();
      busca.mockRejectedValueOnce(new TypeError("Network request failed"));
      const { local, aplicar, sincronizador, alterar } = montar(COM_CIDADE);

      sincronizador.entrar(ID_ANA);
      await esperar();

      expect(aplicar).not.toHaveBeenCalled();
      expect(local.atual).toEqual(COM_CIDADE);
      expect(builder.upsert).not.toHaveBeenCalled();
      expect(aviso).toHaveBeenCalledTimes(1);

      busca.mockResolvedValueOnce({ data: LINHA_CONCLUIDA, error: null });
      alterar({ interesses: ["arte"] });
      await esperar();

      // A escolha feita depois de entrar é a mais nova: sobe por cima.
      expect(builder.maybeSingle).toHaveBeenCalledTimes(2);
      expect(local.atual.interesses).toEqual(["arte"]);
      expect(builder.upsert).toHaveBeenCalledWith(
        expect.objectContaining({ interesses: ["arte"], onboarding_concluido: true }),
        { onConflict: "usuario_id" },
      );
    });

    it("busca com error: mantém o local", async () => {
      const { busca } = clienteFalso();
      busca.mockResolvedValueOnce({ data: null, error: { message: "timeout" } });
      const { local, aplicar, sincronizador } = montar(SEM_CIDADE);

      sincronizador.entrar(ID_ANA);
      await esperar();

      expect(aplicar).not.toHaveBeenCalled();
      expect(local.atual).toEqual(SEM_CIDADE);
      expect(aviso).toHaveBeenCalledTimes(1);
    });

    it("upsert rejeitado ou com error: mantém o local e a próxima alteração envia de novo", async () => {
      const { builder, envio } = clienteFalso();
      envio.mockRejectedValueOnce(new TypeError("Network request failed"));
      const { local, sincronizador, alterar } = montar(COM_CIDADE);

      sincronizador.entrar(ID_ANA);
      await esperar();
      expect(builder.upsert).toHaveBeenCalledTimes(1);
      expect(aviso).toHaveBeenCalledTimes(1);

      envio.mockResolvedValueOnce({ error: { message: "boom" } });
      alterar({ interesses: ["arte"] });
      await esperar();
      expect(builder.upsert).toHaveBeenCalledTimes(2);
      expect(aviso).toHaveBeenCalledTimes(2);
      expect(local.atual.interesses).toEqual(["arte"]);

      alterar({ interesses: ["arte", "eventos"] });
      await esperar();
      expect(builder.upsert).toHaveBeenCalledTimes(3);
      expect(builder.upsert).toHaveBeenLastCalledWith(
        expect.objectContaining({ interesses: ["arte", "eventos"] }),
        { onConflict: "usuario_id" },
      );
    });
  });

  describe("logout e troca de conta", () => {
    it("resposta que chega depois do logout é descartada", async () => {
      const { busca, builder } = clienteFalso();
      const resposta = adiada<Resposta>();
      busca.mockReturnValueOnce(resposta.promessa);
      const { local, aplicar, sincronizador } = montar(COM_CIDADE);

      const sair = sincronizador.entrar(ID_ANA);
      sair();
      resposta.resolver({ data: LINHA_CONCLUIDA, error: null });
      await esperar();

      expect(aplicar).not.toHaveBeenCalled();
      expect(local.atual).toEqual(COM_CIDADE);
      expect(builder.upsert).not.toHaveBeenCalled();
    });

    it("depois de sair, alterar não sincroniza mais", async () => {
      const { builder } = clienteFalso();
      const { local, sincronizador, alterar } = montar(COM_CIDADE);

      const sair = sincronizador.entrar(ID_ANA);
      await esperar();
      builder.upsert.mockClear();
      builder.maybeSingle.mockClear();
      sair();

      alterar({ interesses: ["arte"] });
      await esperar();

      expect(builder.upsert).not.toHaveBeenCalled();
      expect(builder.maybeSingle).not.toHaveBeenCalled();
      // Sair não apaga as preferências locais.
      expect(local.atual.interesses).toEqual(["arte"]);
    });

    it("envio enfileirado da conta anterior não sai depois do logout", async () => {
      const { builder, envio } = clienteFalso();
      const { sincronizador, alterar } = montar(COM_CIDADE);
      const sair = sincronizador.entrar(ID_ANA);
      await esperar();
      builder.upsert.mockClear();

      const lento = adiada<{ error: unknown }>();
      envio.mockReturnValueOnce(lento.promessa);
      alterar({ interesses: ["arte"] });
      await esperar();
      alterar({ interesses: ["arte", "eventos"] });
      sair();
      lento.resolver({ error: null });
      await esperar();

      expect(builder.upsert).toHaveBeenCalledTimes(1);
    });

    it("troca de conta: a resposta atrasada da primeira não vale para a segunda", async () => {
      const { busca, builder } = clienteFalso();
      const daAna = adiada<Resposta>();
      busca.mockReturnValueOnce(daAna.promessa);
      busca.mockResolvedValueOnce({
        data: { interesses: ["eventos"], onboarding_concluido: true },
        error: null,
      });
      const { local, aplicar, sincronizador } = montar(COM_CIDADE);

      const sairAna = sincronizador.entrar(ID_ANA);
      sairAna();
      sincronizador.entrar(ID_BIA);
      await esperar();
      daAna.resolver({ data: LINHA_CONCLUIDA, error: null });
      await esperar();

      expect(builder.eq).toHaveBeenLastCalledWith("usuario_id", ID_BIA);
      expect(aplicar).toHaveBeenCalledTimes(1);
      expect(local.atual.interesses).toEqual(["eventos"]);
      expect(builder.upsert).not.toHaveBeenCalled();
    });

    it("encerrar uma conta antiga não derruba a conta que entrou depois", async () => {
      const { builder } = clienteFalso();
      const { sincronizador, alterar } = montar(COM_CIDADE);

      const sairAna = sincronizador.entrar(ID_ANA);
      sincronizador.entrar(ID_BIA);
      sairAna();
      await esperar();
      builder.upsert.mockClear();

      alterar({ interesses: ["arte"] });
      await esperar();

      expect(builder.upsert).toHaveBeenCalledWith(
        expect.objectContaining({ usuario_id: ID_BIA, interesses: ["arte"] }),
        { onConflict: "usuario_id" },
      );
    });
  });
});
