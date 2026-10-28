/**
 * Regras da sessão sem React, para dar para testar no Vitest. O
 * `SessaoProvider` só guarda o estado que este controle anuncia.
 *
 * Com Supabase configurado, quem manda é o `supabase.auth`: a sessão local de
 * conta identificada é um espelho dele. Na abertura ela é conferida com
 * `getSession()` e, depois, acompanha `onAuthStateChange`. Visitante nunca
 * passa pelo Supabase.
 *
 * O espelho só é criado pela tela de login ou de cadastro (`entrar`). Evento
 * do Supabase pode corrigir o id ou encerrar uma conta já aberta, mas nunca
 * abre conta sozinho: é isso que impede o app de entrar de novo depois do
 * logout.
 */
import type { AuthChangeEvent, Session } from "@supabase/supabase-js";
import { isAuthRetryableFetchError } from "@supabase/supabase-js";

import { supabase } from "../lib/supabase";
import { apagarSessao, gravarSessao, type Sessao } from "./armazenamento";
import { encerrarAutenticacao, lerNome } from "./autenticar";

export type ControleSessao = {
  atual(): Sessao | null;
  /** Grava antes de anunciar. Lança se a gravação falhar. */
  entrar(email: string, nome?: string, usuarioId?: string): Promise<void>;
  /** Anuncia primeiro; se a gravação falhar, segue sem lançar. */
  entrarComoVisitante(): Promise<void>;
  /**
   * Apaga do disco, anuncia e só então encerra no Supabase. Lança se não
   * conseguir apagar do disco; falha do servidor não prende ninguém na conta.
   */
  sair(): Promise<void>;
  /** Liga a conferência com o Supabase. Devolve a função de desligar. */
  iniciar(): () => void;
};

type SituacaoServidor =
  | { tipo: "ativa"; sessao: Session }
  | { tipo: "ausente" }
  | { tipo: "indisponivel" };

export function criarControleSessao(
  inicial: Sessao | null,
  aoMudar: (sessao: Sessao | null) => void,
): ControleSessao {
  let atual = inicial;
  // Toda mudança soma um. Resposta do servidor que chega depois de uma
  // mudança (login, logout) é descartada em vez de desfazer a mudança.
  let versao = 0;
  let conferida = false;

  function definir(nova: Sessao | null) {
    atual = nova;
    versao += 1;
    aoMudar(nova);
  }

  function encerrarEspelho() {
    // Memória primeiro: um login feito enquanto o disco apaga grava depois e
    // não é apagado por engano.
    definir(null);
    apagarSessao().catch((erro) => {
      console.warn("Não foi possível apagar a sessão local encerrada.", erro);
    });
  }

  function sincronizarComServidor(sessaoServidor: Session) {
    if (atual?.modo !== "identificado") return;
    const usuario = sessaoServidor.user;
    if (atual.usuarioId === usuario.id) return;

    const mesmaConta = atual.usuarioId === undefined;
    const corrigida: Sessao = {
      ...atual,
      usuarioId: usuario.id,
      email: usuario.email ?? atual.email,
      nome: mesmaConta ? atual.nome : lerNome(usuario.user_metadata),
    };
    definir(corrigida);
    gravarSessao(corrigida).catch((erro) => {
      console.warn("Não foi possível gravar o id da conta.", erro);
    });
  }

  async function conferirNaAbertura() {
    if (conferida) return;
    conferida = true;
    if (!supabase || atual?.modo !== "identificado") return;

    const versaoInicio = versao;
    const situacao = await lerSituacaoServidor();
    if (versao !== versaoInicio) return;

    if (situacao.tipo === "ativa") {
      sincronizarComServidor(situacao.sessao);
    } else if (situacao.tipo === "ausente") {
      encerrarEspelho();
    }
    // "indisponivel": sem rede não dá para saber. A conta continua aberta e
    // o `onAuthStateChange` encerra se o servidor recusar depois.
  }

  function aoEventoAuth(evento: AuthChangeEvent, sessaoServidor: Session | null) {
    if (atual?.modo !== "identificado") return;

    if (evento === "SIGNED_OUT") {
      encerrarEspelho();
      return;
    }
    if ((evento === "SIGNED_IN" || evento === "TOKEN_REFRESHED") && sessaoServidor) {
      sincronizarComServidor(sessaoServidor);
    }
  }

  return {
    atual: () => atual,

    async entrar(email, nome, usuarioId) {
      const nova: Sessao = {
        modo: "identificado",
        email,
        nome,
        usuarioId,
        entradoEm: new Date().toISOString(),
      };
      await gravarSessao(nova);
      definir(nova);
    },

    async entrarComoVisitante() {
      const nova: Sessao = {
        modo: "visitante",
        entradoEm: new Date().toISOString(),
      };
      definir(nova);

      // Perder a sessão de visitante só faz a abertura aparecer de novo na
      // próxima vez. Não vale bloquear quem só quer olhar.
      try {
        await gravarSessao(nova);
      } catch (erro) {
        console.warn("Não foi possível gravar a sessão de visitante.", erro);
      }
    },

    // Apaga do disco antes de limpar a memória: se só a memória fosse limpa e
    // o disco falhasse, a pessoa "sairia" e voltaria logada na próxima abertura.
    async sair() {
      const eraIdentificado = atual?.modo === "identificado";
      await apagarSessao();
      definir(null);
      if (eraIdentificado) await encerrarAutenticacao();
    },

    iniciar() {
      if (!supabase) return () => {};

      const { data } = supabase.auth.onAuthStateChange(aoEventoAuth);
      void conferirNaAbertura();
      return () => data.subscription.unsubscribe();
    },
  };
}

async function lerSituacaoServidor(): Promise<SituacaoServidor> {
  if (!supabase) return { tipo: "indisponivel" };
  try {
    const { data, error } = await supabase.auth.getSession();
    if (data.session) return { tipo: "ativa", sessao: data.session };
    if (error && isAuthRetryableFetchError(error)) return { tipo: "indisponivel" };
    return { tipo: "ausente" };
  } catch {
    return { tipo: "indisponivel" };
  }
}
