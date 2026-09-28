import { useEffect, useState } from "react";

import type { LocalLista } from "../mocks/locais";
import { buscarLocalPorId, listarLocais } from "./listarLocais";

const ERRO_LISTA = "Não foi possível carregar os lugares.";
const ERRO_UM = "Não foi possível carregar este lugar.";

export function useLocais() {
  const [locais, setLocais] = useState<LocalLista[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    let ativo = true;

    listarLocais()
      .then((dados) => {
        if (!ativo) return;
        setLocais(dados);
      })
      .catch(() => {
        if (!ativo) return;
        setErro(ERRO_LISTA);
      });

    return () => {
      ativo = false;
    };
  }, []);

  return {
    locais: locais ?? [],
    carregando: locais === null && erro === null,
    erro,
  };
}

export function useLocal(id: string | undefined) {
  const [pedido, setPedido] = useState<{
    id: string;
    local: LocalLista | null;
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
