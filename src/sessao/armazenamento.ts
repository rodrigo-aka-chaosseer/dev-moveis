/**
 * Guarda no aparelho quem entrou. Só metadado que não é segredo: e-mail,
 * modo (visitante ou identificado) e quando entrou. A senha nunca passa por
 * aqui.
 *
 * BACKEND: quando existir servidor, o token de acesso NÃO entra neste
 * arquivo. Ele vai para `expo-secure-store` (Keychain no iOS, Keystore no
 * Android), porque AsyncStorage é arquivo em texto no sandbox do app. Este
 * registro passa a ter `usuarioId`, a chave sobe para `raizes.sessao.v2`, e
 * `lerSessao` precisa continuar lendo a v1 para quem já tinha entrado.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";

export type ModoSessao = "visitante" | "identificado";

export type Sessao = {
  modo: ModoSessao;
  /** Só existe quando `modo` é "identificado". */
  email?: string;
  /** ISO 8601. */
  entradoEm: string;
};

export const CHAVE_SESSAO = "raizes.sessao.v1";

// Storage quebrado não pode segurar a splash nem travar o botão de entrar
// para sempre. Leitura que passa do limite vira "ninguém entrou"; gravação
// que passa do limite vira erro, e a tela avisa.
const LIMITE_LEITURA_MS = 3000;
const LIMITE_GRAVACAO_MS = 4000;

function comLimite<T>(promessa: Promise<T>, ms: number, aoEstourar: () => T): Promise<T> {
  let temporizador: ReturnType<typeof setTimeout> | undefined;
  const limite = new Promise<T>((resolve) => {
    temporizador = setTimeout(() => resolve(aoEstourar()), ms);
  });
  return Promise.race([promessa, limite]).finally(() => clearTimeout(temporizador));
}

function ehHoje(iso: string): boolean {
  const data = new Date(iso);
  const hoje = new Date();
  return (
    data.getFullYear() === hoje.getFullYear() &&
    data.getMonth() === hoje.getMonth() &&
    data.getDate() === hoje.getDate()
  );
}

function ehSessaoValida(valor: unknown): valor is Sessao {
  if (typeof valor !== "object" || valor === null) return false;

  const registro = valor as Record<string, unknown>;
  const modoOk =
    registro.modo === "visitante" || registro.modo === "identificado";
  const dataOk = typeof registro.entradoEm === "string";
  const emailOk =
    registro.modo !== "identificado" ||
    (typeof registro.email === "string" && registro.email.length > 0);

  return modoOk && dataOk && emailOk;
}

/**
 * Nunca lança: registro ausente, corrompido ou storage lento viram `null`,
 * e o app segue como primeira abertura.
 */
export async function lerSessao(): Promise<Sessao | null> {
  try {
    const bruto = await comLimite(
      AsyncStorage.getItem(CHAVE_SESSAO),
      LIMITE_LEITURA_MS,
      () => null,
    );
    if (bruto === null) return null;

    const registro: unknown = JSON.parse(bruto);
    if (!ehSessaoValida(registro)) {
      console.warn("Sessão gravada em formato inesperado; ignorando.");
      return null;
    }

    // "Só dar uma olhada por hoje" vale o que diz: no dia seguinte a pessoa
    // vê a abertura de novo e pode entrar com conta.
    if (registro.modo === "visitante" && !ehHoje(registro.entradoEm)) {
      return null;
    }

    // Reconstrói o objeto para não carregar chave extra que alguém tenha
    // gravado no disco.
    return registro.modo === "identificado"
      ? { modo: "identificado", email: registro.email, entradoEm: registro.entradoEm }
      : { modo: "visitante", entradoEm: registro.entradoEm };
  } catch (erro) {
    console.warn("Não foi possível ler a sessão gravada.", erro);
    return null;
  }
}

function estourou(): never {
  throw new Error("O armazenamento do aparelho demorou demais para responder.");
}

/** Lança se a gravação falhar ou demorar demais. Quem chama decide o que mostrar. */
export async function gravarSessao(sessao: Sessao): Promise<void> {
  await comLimite(
    AsyncStorage.setItem(CHAVE_SESSAO, JSON.stringify(sessao)),
    LIMITE_GRAVACAO_MS,
    estourou,
  );
}

/** Lança se não conseguir apagar: sessão que fica no disco volta na próxima abertura. */
export async function apagarSessao(): Promise<void> {
  await comLimite(
    AsyncStorage.removeItem(CHAVE_SESSAO),
    LIMITE_GRAVACAO_MS,
    estourou,
  );
}
