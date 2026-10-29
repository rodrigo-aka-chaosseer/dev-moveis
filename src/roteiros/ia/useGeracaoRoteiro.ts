import { useCallback, useRef, useState } from "react";

import { listarLocaisDetalhados, type LocalDetalhe } from "../../locais/listarLocais";
import { ErroGerarRoteiro, ERRO_GENERICO, gerarRoteiroIa, type NecessidadeAcessibilidade } from "./gerarRoteiroIa";
import {
  ErroPreferenciasRecomendacao,
  padronizarPreferencias,
  selecionarCandidatosLocais,
  type PreferenciasRecomendacao,
} from "./prepararCandidatos";
import {
  ErroAjusteRoteiro,
  montarRoteiroGerado,
  pedidoComAcessibilidade,
  pedidoMaisCurto,
  pedidoMaisEconomico,
  priorizarOutrosLugares,
  removerParada,
  trocarParada,
  type RoteiroGerado,
} from "./roteiroGerado";

export const ERRO_SEM_CANDIDATOS =
  "Nenhum lugar do catálogo combina com essas escolhas. Tente outros interesses, mais tempo ou outro orçamento.";

export const ERRO_CATALOGO =
  "Não conseguimos carregar os lugares da cidade. Confira a internet e tente de novo.";

/** Por que a tela está gerando: muda só o texto do carregamento. */
export type MotivoGeracao = "primeira" | "outra" | "mais_curto" | "mais_economico" | "acessibilidade";

export type EstadoGeracao =
  | { fase: "parado" }
  | { fase: "gerando"; motivo: MotivoGeracao }
  | { fase: "erro"; mensagem: string }
  | { fase: "pronto"; roteiro: RoteiroGerado };

/**
 * Liga o formulário (#53) à geração por IA (#49/#50) e guarda o roteiro para
 * a tela mostrar (#52) e ajustar (#51) sem voltar ao formulário.
 */
export function useGeracaoRoteiro() {
  const [estado, setEstado] = useState<EstadoGeracao>({ fase: "parado" });
  const [preferencias, setPreferencias] = useState<PreferenciasRecomendacao | null>(null);
  const [candidatos, setCandidatos] = useState<LocalDetalhe[]>([]);
  const [aviso, setAviso] = useState<string | null>(null);
  const pedidoAtual = useRef(0);
  const roteiroAnterior = useRef<RoteiroGerado | null>(null);

  const gerar = useCallback(
    async (novas: PreferenciasRecomendacao, motivo: MotivoGeracao = "primeira") => {
      const numero = ++pedidoAtual.current;
      setAviso(null);
      setEstado({ fase: "gerando", motivo });
      setPreferencias(novas);

      try {
        const pedido = padronizarPreferencias(novas);
        const catalogo = await listarLocaisDetalhados(pedido.cidadeId).catch(() => {
          throw new ErroGerarRoteiro(ERRO_CATALOGO);
        });
        const selecionados = selecionarCandidatosLocais(catalogo, pedido);
        if (selecionados.length === 0) throw new ErroGerarRoteiro(ERRO_SEM_CANDIDATOS);

        const anterior = roteiroAnterior.current;
        const ordenados = anterior ? priorizarOutrosLugares(selecionados, anterior) : selecionados;
        const ia = await gerarRoteiroIa({ ...pedido, candidatos: ordenados });
        const roteiro = montarRoteiroGerado(ia, catalogo);
        if (numero !== pedidoAtual.current) return;

        const ids = new Set(selecionados.map((item) => item.id));
        setCandidatos(catalogo.filter((local) => ids.has(local.id)));
        roteiroAnterior.current = roteiro;
        setEstado({ fase: "pronto", roteiro });
      } catch (erro) {
        if (numero !== pedidoAtual.current) return;
        setEstado({ fase: "erro", mensagem: mensagemDe(erro) });
      }
    },
    [],
  );

  const tentarDeNovo = useCallback(() => {
    if (preferencias) void gerar(preferencias, "primeira");
  }, [gerar, preferencias]);

  const outraSugestao = useCallback(() => {
    if (preferencias) void gerar(preferencias, "outra");
  }, [gerar, preferencias]);

  const roteiro = estado.fase === "pronto" ? estado.roteiro : null;
  const opcoes = {
    maisCurto: preferencias && roteiro ? pedidoMaisCurto(preferencias, roteiro) : null,
    maisEconomico: preferencias && roteiro ? pedidoMaisEconomico(preferencias, roteiro) : null,
  };

  const ajustar = useCallback(
    (tipo: "mais_curto" | "mais_economico") => {
      const novo = tipo === "mais_curto" ? opcoes.maisCurto : opcoes.maisEconomico;
      if (novo) void gerar(novo, tipo);
    },
    [gerar, opcoes.maisCurto, opcoes.maisEconomico],
  );

  const priorizarAcessibilidade = useCallback(
    (necessidade: NecessidadeAcessibilidade) => {
      const novo = preferencias ? pedidoComAcessibilidade(preferencias, necessidade) : null;
      if (novo) void gerar(novo, "acessibilidade");
    },
    [gerar, preferencias],
  );

  /** Ajuste feito no app, sem nova chamada à IA. */
  const editar = useCallback(
    (mudanca: (atual: RoteiroGerado) => RoteiroGerado) => {
      if (estado.fase !== "pronto") return;
      try {
        const roteiro = mudanca(estado.roteiro);
        roteiroAnterior.current = roteiro;
        setAviso(null);
        setEstado({ fase: "pronto", roteiro });
      } catch (erro) {
        setAviso(mensagemDe(erro));
      }
    },
    [estado],
  );

  const remover = useCallback((localId: string) => editar((atual) => removerParada(atual, localId)), [editar]);

  const trocar = useCallback(
    (localId: string, novo: LocalDetalhe) =>
      editar((atual) => trocarParada(atual, localId, novo, preferencias?.acessibilidade ?? [])),
    [editar, preferencias],
  );

  const voltarAoFormulario = useCallback(() => {
    pedidoAtual.current++;
    roteiroAnterior.current = null;
    setAviso(null);
    setEstado({ fase: "parado" });
  }, []);

  return {
    estado,
    preferencias,
    candidatos,
    aviso,
    podeEncurtar: opcoes.maisCurto !== null,
    podeEconomizar: opcoes.maisEconomico !== null,
    gerar,
    tentarDeNovo,
    outraSugestao,
    ajustar,
    priorizarAcessibilidade,
    remover,
    trocar,
    voltarAoFormulario,
  };
}

function mensagemDe(erro: unknown): string {
  if (
    erro instanceof ErroGerarRoteiro ||
    erro instanceof ErroPreferenciasRecomendacao ||
    erro instanceof ErroAjusteRoteiro
  ) {
    return erro.message;
  }
  return ERRO_GENERICO;
}
