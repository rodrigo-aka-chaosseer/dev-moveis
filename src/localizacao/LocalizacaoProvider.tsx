import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  solicitarLocalizacaoAtual,
  type CoordenadasUsuario,
} from "./servico";

export type EstadoLocalizacao =
  | "ocioso"
  | "carregando"
  | "disponivel"
  | "permissao_negada"
  | "servico_desativado"
  | "erro";

type ContextoLocalizacao = {
  estado: EstadoLocalizacao;
  coordenadas: CoordenadasUsuario | null;
  podePerguntarNovamente: boolean;
  solicitar(): Promise<void>;
};

const Contexto = createContext<ContextoLocalizacao | null>(null);

export function LocalizacaoProvider({ children }: { children: ReactNode }) {
  const [estado, setEstado] = useState<EstadoLocalizacao>("ocioso");
  const [coordenadas, setCoordenadas] = useState<CoordenadasUsuario | null>(null);
  const [podePerguntarNovamente, setPodePerguntarNovamente] = useState(true);

  const solicitar = useCallback(async () => {
    setEstado("carregando");
    const resultado = await solicitarLocalizacaoAtual();

    if (resultado.tipo === "sucesso") {
      setCoordenadas(resultado.coordenadas);
      setPodePerguntarNovamente(true);
      setEstado("disponivel");
      return;
    }

    setCoordenadas(null);
    if (resultado.tipo === "permissao_negada") {
      setPodePerguntarNovamente(resultado.podePerguntarNovamente);
    }
    setEstado(resultado.tipo);
  }, []);

  const valor = useMemo(
    () => ({ estado, coordenadas, podePerguntarNovamente, solicitar }),
    [coordenadas, estado, podePerguntarNovamente, solicitar],
  );

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function useLocalizacao(): ContextoLocalizacao {
  const contexto = useContext(Contexto);
  if (contexto === null) {
    throw new Error("useLocalizacao precisa do LocalizacaoProvider.");
  }
  return contexto;
}
