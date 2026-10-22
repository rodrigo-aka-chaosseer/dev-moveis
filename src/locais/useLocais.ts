import { useCallback, useEffect, useState } from "react";

import type { LocalLista } from "../mocks/locais";
import type { CidadeId } from "../preferencias/dados";
import { buscarLocalPorId, listarLocais, type LocalDetalhe } from "./listarLocais";

const ERRO_LISTA = "Não foi possível carregar os lugares.";
const ERRO_UM = "Não foi possível carregar este lugar.";

export function useLocais(cidadeId: CidadeId | null) {
  const [tentativa, setTentativa] = useState(0);
  const [pedido, setPedido] = useState<{
    cidadeId: CidadeId;
    locais: LocalLista[];
    erro: string | null;
  } | null>(null);

  const recarregar = useCallback(() => { setPedido(null); setTentativa((valor) => valor + 1); }, []);

  useEffect(() => {
    if (!cidadeId) {
      return;
    }

    let ativo = true;

    listarLocais(cidadeId)
      .then((dados) => {
        if (!ativo) return;
        setPedido({ cidadeId, locais: dados, erro: null });
      })
      .catch(() => {
        if (!ativo) return;
        setPedido({ cidadeId, locais: [], erro: ERRO_LISTA });
      });

    return () => {
      ativo = false;
    };
  }, [cidadeId, tentativa]);

  if (!cidadeId) {
    return { locais: [], carregando: false, erro: null, recarregar };
  }

  // Trocar de cidade não pode mostrar por um instante a lista da anterior.
  const destaCidade = pedido?.cidadeId === cidadeId;

  return {
    locais: destaCidade ? pedido.locais : [],
    recarregar,
    carregando: !destaCidade,
    erro: destaCidade ? pedido.erro : null,
  };
}

export function useLocal(id: string | undefined) {
  const [pedido, setPedido] = useState<{
    id: string;
    local: LocalDetalhe | null;
    erro: string | null;
  } | null>(null);

  useEffect(() => {
    if (!id) {
      return;
    }

    let ativo = true;

    buscarLocalPorId(id)
      .then((dados) => {
        if (!ativo) return;
        setPedido({ id, local: dados, erro: null });
      })
      .catch(() => {
        if (!ativo) return;
        setPedido({ id, local: null, erro: ERRO_UM });
      });

    return () => {
      ativo = false;
    };
  }, [id]);

  if (!id) {
    return { local: null, carregando: false, erro: ERRO_UM };
  }

  const desteId = pedido?.id === id;

  return {
    local: desteId ? pedido.local : null,
    carregando: !desteId,
    erro: desteId ? pedido.erro : null,
  };
}
