/**
 * Sincronização das preferências com a tabela `preferencias` do Supabase, sem
 * React, para dar para testar no Vitest. O `PreferenciasProvider` só avisa
 * quando a conta entra, sai ou quando a pessoa muda algo.
 *
 * O aparelho continua sendo a fonte do que a tela mostra: a sincronização é
 * melhor esforço. Falha de rede vira `console.warn`, nunca erro na tela, e não
 * desfaz a escolha local; a próxima alteração tenta de novo.
 *
 * Sobem só `interesses` e `onboarding_concluido`. A cidade fica no aparelho
 * (a tabela não tem coluna para ela) e necessidade de acessibilidade não é
 * coletada (dado sensível, decisão 6): vai sempre `[]`.
 *
 * Visitante e modo mock nunca chegam aqui: só existe `usuarioId` com conta
 * identificada e Supabase configurado, e mesmo assim toda chamada confere
 * `supabase` antes.
 */
import { supabase } from "../lib/supabase";
import { filtrarInteresses, type InteresseId, type Preferencias } from "./dados";

export type PreferenciasServidor = {
  interesses: InteresseId[];
  onboardingConcluido: boolean;
};

/** A linha da conta, ou null quando ainda não existe. Lança em erro. */
export async function buscarPreferencias(
  usuarioId: string,
): Promise<PreferenciasServidor | null> {
  if (!supabase) throw new Error("Supabase não configurado.");

  const { data, error } = await supabase
    .from("preferencias")
    .select("interesses, onboarding_concluido")
    .eq("usuario_id", usuarioId)
    .maybeSingle();
  if (error) throw error;
  if (!data || typeof data !== "object") return null;

  const linha = data as { interesses?: unknown; onboarding_concluido?: unknown };
  return {
    interesses: filtrarInteresses(linha.interesses),
    onboardingConcluido: linha.onboarding_concluido === true,
  };
}

/** Cria ou atualiza a linha da conta. Lança em erro. */
export async function enviarPreferencias(
  usuarioId: string,
  preferencias: PreferenciasServidor,
): Promise<void> {
  if (!supabase) throw new Error("Supabase não configurado.");

  const { error } = await supabase.from("preferencias").upsert(
    {
      usuario_id: usuarioId,
      interesses: preferencias.interesses,
      onboarding_concluido: preferencias.onboardingConcluido,
      temas_diversidade: [],
      necessidades_acessibilidade: [],
    },
    { onConflict: "usuario_id" },
  );
  if (error) throw error;
}

/**
 * O que fazer ao entrar com conta. Onboarding concluído no servidor: os
 * interesses de lá substituem os locais. Sem linha ou sem onboarding
 * concluído: o aparelho manda e as preferências locais sobem.
 *
 * Regra da cidade: a cidade só existe no aparelho, e o onboarding local só
 * pode estar concluído com cidade escolhida. Num aparelho sem cidade, os
 * interesses vêm do servidor mas o onboarding local fica false até a pessoa
 * escolher a cidade.
 */
export function mesclarComServidor(
  local: Preferencias,
  servidor: PreferenciasServidor | null,
): { preferencias: Preferencias; enviar: boolean } {
  if (servidor?.onboardingConcluido) {
    return {
      preferencias: {
        ...local,
        interesses: servidor.interesses,
        onboardingConcluido: local.cidadeId !== null,
      },
      enviar: false,
    };
  }
  return { preferencias: local, enviar: true };
}

export type Sincronizador = {
  /** A conta apareceu. Devolve a função que a encerra (logout, troca). */
  entrar(usuarioId: string): () => void;
  /** A pessoa mudou interesses ou concluiu o onboarding. */
  aoAlterar(): void;
};

type Conta = {
  usuarioId: string;
  mesclada: boolean;
  mesclando: boolean;
  /** A pessoa mexeu depois de entrar: o aparelho é mais novo que o servidor. */
  alteradaAposEntrar: boolean;
  /**
   * O servidor já tem o onboarding concluído. O envio nunca o desfaz: um
   * aparelho sem cidade tem o onboarding local false, mas a conta já
   * respondeu as perguntas em outro aparelho.
   */
  concluidaNoServidor: boolean;
  envioPendente: boolean;
  fila: Promise<void>;
};

export function criarSincronizador(opcoes: {
  /** As preferências locais de agora. */
  atual(): Preferencias;
  /** Grava no aparelho o que veio do servidor, sem contar como alteração. */
  aplicar(preferencias: Preferencias): void;
}): Sincronizador {
  // Cada entrada cria um objeto novo. Resposta ou envio de uma conta que já
  // saiu (logout, troca de conta, login e logout rápidos) é descartado
  // comparando com este objeto, não com o id.
  let conta: Conta | null = null;

  function ativa(alvo: Conta) {
    return conta === alvo;
  }

  async function mesclar(alvo: Conta) {
    if (alvo.mesclando) return;
    alvo.mesclando = true;
    let servidor: PreferenciasServidor | null;
    try {
      servidor = await buscarPreferencias(alvo.usuarioId);
    } catch (erro) {
      alvo.mesclando = false;
      if (ativa(alvo)) {
        console.warn("Não foi possível buscar as preferências da conta.", erro);
      }
      return;
    }
    alvo.mesclando = false;
    if (!ativa(alvo)) return;

    alvo.mesclada = true;
    if (servidor?.onboardingConcluido) alvo.concluidaNoServidor = true;

    // A pessoa mexeu enquanto a resposta não chegava (ou depois de uma busca
    // que falhou): a escolha dela é a mais nova e sobe por cima do servidor.
    if (alvo.alteradaAposEntrar) {
      enfileirarEnvio(alvo);
      return;
    }

    const { preferencias, enviar } = mesclarComServidor(opcoes.atual(), servidor);
    if (!enviar) opcoes.aplicar(preferencias);
    else enfileirarEnvio(alvo);
  }

  // Um envio por vez por conta, sempre com o estado do momento em que sai:
  // um envio antigo não chega depois e sobrescreve a escolha mais recente, e
  // vários toques seguidos viram um só envio.
  function enfileirarEnvio(alvo: Conta) {
    if (alvo.envioPendente) return;
    alvo.envioPendente = true;
    alvo.fila = alvo.fila.then(async () => {
      alvo.envioPendente = false;
      if (!ativa(alvo)) return;
      const local = opcoes.atual();
      const concluido = local.onboardingConcluido || alvo.concluidaNoServidor;
      try {
        await enviarPreferencias(alvo.usuarioId, {
          interesses: local.interesses,
          onboardingConcluido: concluido,
        });
        if (concluido) alvo.concluidaNoServidor = true;
      } catch (erro) {
        if (ativa(alvo)) {
          console.warn("Não foi possível sincronizar as preferências.", erro);
        }
      }
    });
  }

  return {
    entrar(usuarioId) {
      if (!supabase) return () => {};
      const nova: Conta = {
        usuarioId,
        mesclada: false,
        mesclando: false,
        alteradaAposEntrar: false,
        concluidaNoServidor: false,
        envioPendente: false,
        fila: Promise.resolve(),
      };
      conta = nova;
      void mesclar(nova);
      return () => {
        if (conta === nova) conta = null;
      };
    },

    aoAlterar() {
      const alvo = conta;
      if (!supabase || !alvo) return;
      alvo.alteradaAposEntrar = true;
      // Sem saber o que o servidor tem, enviar direto poderia desfazer o
      // onboarding concluído lá. Busca de novo; a alteração sobe em seguida.
      if (!alvo.mesclada) {
        void mesclar(alvo);
        return;
      }
      enfileirarEnvio(alvo);
    },
  };
}
