/**
 * Quem está usando o app agora. As telas leem com `useSessao()`; a raiz
 * carrega a sessão gravada com `useSessaoInicial()` antes de soltar a splash,
 * então nenhuma tela chega a ver um estado "carregando".
 *
 * Para o dono das abas: `estado === "visitante"` é quem entrou sem conta e
 * deve ver só a aba Explorar. Para a tela de perfil: `sair()`.
 *
 * BACKEND: `entrar` passa a receber o resultado da autenticação (usuário e
 * token) em vez de só o e-mail, e `sair` também revoga o token no servidor.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  apagarSessao,
  gravarSessao,
  lerSessao,
  type Sessao,
} from "./armazenamento";

export type EstadoSessao = "nenhuma" | "visitante" | "identificado";

export type ContextoSessao = {
  estado: EstadoSessao;
  /** Só existe quando `estado` é "identificado". */
  email?: string;
  /** Verdadeiro para visitante e identificado. */
  temSessao: boolean;
  /** Grava antes de mudar o estado. Lança se a gravação falhar. */
  entrar(email: string): Promise<void>;
  /** Muda o estado primeiro; se a gravação falhar, segue sem lançar. */
  entrarComoVisitante(): Promise<void>;
  sair(): Promise<void>;
};

const Contexto = createContext<ContextoSessao | null>(null);

/**
 * Para a raiz: lê a sessão gravada uma vez. `pronta` vira verdadeiro mesmo
 * quando não há sessão ou a leitura falha.
 */
export function useSessaoInicial() {
  const [pronta, setPronta] = useState(false);
  const [sessaoInicial, setSessaoInicial] = useState<Sessao | null>(null);

  useEffect(() => {
    let ativo = true;

    lerSessao().then((sessao) => {
      if (!ativo) return;
      setSessaoInicial(sessao);
      setPronta(true);
    });

    return () => {
      ativo = false;
    };
  }, []);

  return { pronta, sessaoInicial };
}

type Props = {
  sessaoInicial: Sessao | null;
  children: ReactNode;
};

export function SessaoProvider({ sessaoInicial, children }: Props) {
  const [sessao, setSessao] = useState<Sessao | null>(sessaoInicial);

  const entrar = useCallback(async (email: string) => {
    const nova: Sessao = {
      modo: "identificado",
      email,
      entradoEm: new Date().toISOString(),
    };
    await gravarSessao(nova);
    setSessao(nova);
  }, []);

  const entrarComoVisitante = useCallback(async () => {
    const nova: Sessao = {
      modo: "visitante",
      entradoEm: new Date().toISOString(),
    };
    setSessao(nova);

    // Perder a sessão de visitante só faz a abertura aparecer de novo na
    // próxima vez. Não vale bloquear quem só quer olhar.
    try {
      await gravarSessao(nova);
    } catch (erro) {
      console.warn("Não foi possível gravar a sessão de visitante.", erro);
    }
  }, []);

  const sair = useCallback(async () => {
    setSessao(null);
    try {
      await apagarSessao();
    } catch (erro) {
      console.warn("Não foi possível apagar a sessão gravada.", erro);
    }
  }, []);

  const valor = useMemo<ContextoSessao>(
    () => ({
      estado: sessao?.modo ?? "nenhuma",
      email: sessao?.modo === "identificado" ? sessao.email : undefined,
      temSessao: sessao !== null,
      entrar,
      entrarComoVisitante,
      sair,
    }),
    [sessao, entrar, entrarComoVisitante, sair],
  );

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function useSessao(): ContextoSessao {
  const contexto = useContext(Contexto);

  if (contexto === null) {
    throw new Error(
      "useSessao() precisa estar dentro de <SessaoProvider>. Ele fica em app/_layout.tsx.",
    );
  }

  return contexto;
}
