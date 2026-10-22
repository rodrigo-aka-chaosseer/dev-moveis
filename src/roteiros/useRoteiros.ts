import { useCallback, useEffect, useState } from "react";

import type { CidadeId } from "../preferencias/dados";
import { buscarRoteiroPorId, listarRoteiros, type Roteiro } from "./listarRoteiros";

const ERRO_LISTA = "Não foi possível carregar os roteiros.";
const ERRO_UM = "Não foi possível carregar este roteiro.";

/** Mesmo desenho de `useLocais`: trocar de cidade não mostra a lista anterior. */
export function useRoteiros(cidadeId: CidadeId | null) {
  const [tentativa, setTentativa] = useState(0);
  const [pedido, setPedido] = useState<{
    cidadeId: CidadeId;
    roteiros: Roteiro[];
    erro: string | null;
  } | null>(null);

  const recarregar = useCallback(() => {
    setPedido(null);
    setTentativa((valor) => valor + 1);
  }, []);

  useEffect(() => {
    if (!cidadeId) return;
    let ativo = true;

    listarRoteiros(cidadeId)
      .then((dados) => {
        if (ativo) setPedido({ cidadeId, roteiros: dados, erro: null });
      })
      .catch(() => {
        if (ativo) setPedido({ cidadeId, roteiros: [], erro: ERRO_LISTA });
      });

    return () => {
      ativo = false;
    };
  }, [cidadeId, tentativa]);

  if (!cidadeId) {
    return { roteiros: [], carregando: false, erro: null, recarregar };
  }

  const destaCidade = pedido?.cidadeId === cidadeId;
  return {
    roteiros: destaCidade ? pedido.roteiros : [],
    recarregar,
    carregando: !destaCidade,
    erro: destaCidade ? pedido.erro : null,
  };
}

export function useRoteiro(id: string | undefined) {
  const [pedido, setPedido] = useState<{
    id: string;
    roteiro: Roteiro | null;
    erro: string | null;
  } | null>(null);

  useEffect(() => {
    if (!id) return;
    let ativo = true;

    buscarRoteiroPorId(id)
      .then((dados) => {
        if (ativo) setPedido({ id, roteiro: dados, erro: null });
      })
      .catch(() => {
        if (ativo) setPedido({ id, roteiro: null, erro: ERRO_UM });
      });

    return () => {
      ativo = false;
    };
  }, [id]);

  if (!id) {
    return { roteiro: null, carregando: false, erro: ERRO_UM };
  }

  const desteId = pedido?.id === id;
  return {
    roteiro: desteId ? pedido.roteiro : null,
    carregando: !desteId,
    erro: desteId ? pedido.erro : null,
  };
}
