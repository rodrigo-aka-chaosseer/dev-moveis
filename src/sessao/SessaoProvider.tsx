/**
 * Quem está usando o app agora. As telas leem com `useSessao()`; a raiz
 * carrega a sessão gravada com `useSessaoInicial()` antes de soltar a splash,
 * então nenhuma tela chega a ver um estado "carregando".
 *
 * Para o dono das abas: `estado === "visitante"` é quem entrou sem conta e
 * deve ver só a aba Explorar. Para a tela de perfil: `sair()`. Para quem
 * grava no Supabase: `usuarioId`, que só existe para conta identificada com
 * Supabase configurado.
 *
 * As regras (conferência com o `supabase.auth`, logout) moram em
 * `controleSessao.ts`; este arquivo só liga o controle ao React.
 */
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { lerSessao, type Sessao } from "./armazenamento";
import { criarControleSessao } from "./controleSessao";

export type EstadoSessao = "nenhuma" | "visitante" | "identificado";

export type ContextoSessao = {
  estado: EstadoSessao;
  /** Só existe quando `estado` é "identificado". */
  email?: string;
  /** Pode não existir em sessões antigas, anteriores ao perfil. */
  nome?: string;
  /**
   * `user.id` do Supabase. Só existe quando `estado` é "identificado" e o
   * Supabase está configurado; no modo mock fica vazio.
   */
  usuarioId?: string;
  /** Verdadeiro para visitante e identificado. */
  temSessao: boolean;
  /** Grava antes de mudar o estado. Lança se a gravação falhar. */
  entrar(email: string, nome?: string, usuarioId?: string): Promise<void>;
  /** Muda o estado primeiro; se a gravação falhar, segue sem lançar. */
  entrarComoVisitante(): Promise<void>;
  /**
   * Apaga do disco, limpa o estado e encerra no Supabase. Lança só se não
   * conseguir apagar do disco; servidor fora do ar não prende na conta.
   */
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
  const [controle] = useState(() => criarControleSessao(sessaoInicial, setSessao));

  // Confere com o Supabase uma vez por abertura do app; o controle ignora a
  // segunda montagem do StrictMode.
  useEffect(() => controle.iniciar(), [controle]);

  const valor = useMemo<ContextoSessao>(() => {
    const identificado = sessao?.modo === "identificado";
    return {
      estado: sessao?.modo ?? "nenhuma",
      email: identificado ? sessao.email : undefined,
      nome: identificado ? sessao.nome : undefined,
      usuarioId: identificado ? sessao.usuarioId : undefined,
      temSessao: sessao !== null,
      entrar: controle.entrar,
      entrarComoVisitante: controle.entrarComoVisitante,
      sair: controle.sair,
    };
  }, [sessao, controle]);

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
