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

// Storage quebrado não pode segurar a splash para sempre. Passou disso, o
// app abre como se ninguém tivesse entrado.
const LIMITE_LEITURA_MS = 1500;

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
  const limite = new Promise<null>((resolve) =>
    setTimeout(() => resolve(null), LIMITE_LEITURA_MS),
  );

  try {
    const bruto = await Promise.race([AsyncStorage.getItem(CHAVE_SESSAO), limite]);
    if (bruto === null) return null;

    const registro: unknown = JSON.parse(bruto);
    if (!ehSessaoValida(registro)) {
      console.warn("Sessão gravada em formato inesperado; ignorando.");
      return null;
    }

    return registro;
  } catch (erro) {
    console.warn("Não foi possível ler a sessão gravada.", erro);
    return null;
  }
}

/** Lança se a gravação falhar. Quem chama decide o que mostrar. */
export async function gravarSessao(sessao: Sessao): Promise<void> {
  await AsyncStorage.setItem(CHAVE_SESSAO, JSON.stringify(sessao));
}

export async function apagarSessao(): Promise<void> {
  await AsyncStorage.removeItem(CHAVE_SESSAO);
}
