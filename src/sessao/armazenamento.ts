/**
 * Guarda no aparelho quem entrou. Só metadado que não é segredo: nome,
 * e-mail, modo (visitante ou identificado) e quando entrou. A senha nunca
 * passa por aqui.
 *
 * Com Supabase configurado, este registro é só um espelho da sessão do
 * `supabase.auth`, que guarda o token por conta própria. Aqui fica apenas o
 * `usuarioId` (o `user.id`), para as telas saberem de quem é a conta sem
 * consultar o servidor. O campo é opcional: registros antigos, gravados antes
 * dele, continuam válidos com a mesma chave.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";

export type ModoSessao = "visitante" | "identificado";

export type Sessao = {
  modo: ModoSessao;
  /** Só existe quando `modo` é "identificado". */
  email?: string;
  /** Nome retornado pela autenticação; opcional para sessões v1 antigas. */
  nome?: string;
  /** `user.id` do Supabase. Só existe para conta identificada com Supabase. */
  usuarioId?: string;
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
  const nomeOk =
    registro.nome === undefined ||
    (typeof registro.nome === "string" && registro.nome.trim().length > 0);

  return modoOk && dataOk && emailOk && nomeOk;
}

// Um id ruim não invalida a sessão inteira: ele só é descartado, e a
// conferência com o Supabase na abertura grava o certo de novo.
function lerUsuarioId(registro: Sessao): string | undefined {
  const valor: unknown = registro.usuarioId;
  return typeof valor === "string" && valor.length > 0 ? valor : undefined;
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
      ? {
          modo: "identificado",
          email: registro.email,
          nome: registro.nome,
          usuarioId: lerUsuarioId(registro),
          entradoEm: registro.entradoEm,
        }
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
