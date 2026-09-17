import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { CIDADES, INTERESSES, type CidadeId, type InteresseId } from "./dados";

const CHAVE_PREFERENCIAS = "raizes.preferencias.v1";

type Preferencias = {
  interesses: InteresseId[];
  cidadeId: CidadeId | null;
};

const VAZIAS: Preferencias = { interesses: [], cidadeId: null };

function lerRegistro(valor: unknown): Preferencias {
  if (typeof valor !== "object" || valor === null) return VAZIAS;
  const registro = valor as Record<string, unknown>;
  const ids = new Set<string>(INTERESSES.map((item) => item.id));
  const interesses = Array.isArray(registro.interesses)
    ? registro.interesses.filter(
        (id): id is InteresseId => typeof id === "string" && ids.has(id),
      )
    : [];
  const cidadeId = CIDADES.find((cidade) => cidade.id === registro.cidadeId)?.id ?? null;
  return { interesses: [...new Set(interesses)], cidadeId };
}

type ContextoPreferencias = Preferencias & {
  pronto: boolean;
  erro: string | null;
  alternarInteresse(id: InteresseId): void;
  escolherCidade(id: CidadeId): void;
  aguardarGravacao(): Promise<void>;
};

const Contexto = createContext<ContextoPreferencias | null>(null);

export function PreferenciasProvider({ children }: { children: ReactNode }) {
  const [preferencias, setPreferencias] = useState<Preferencias>(VAZIAS);
  const [pronto, setPronto] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const atual = useRef<Preferencias>(VAZIAS);
  const fila = useRef<Promise<void>>(Promise.resolve());

  useEffect(() => {
    let ativo = true;
    AsyncStorage.getItem(CHAVE_PREFERENCIAS)
      .then((bruto) => {
        if (!ativo) return;
        const valor = bruto === null ? VAZIAS : lerRegistro(JSON.parse(bruto));
        atual.current = valor;
        setPreferencias(valor);
      })
      .catch(() => {
        if (ativo) setErro("Não foi possível carregar suas preferências.");
      })
      .finally(() => {
        if (ativo) setPronto(true);
      });
    return () => { ativo = false; };
  }, []);

  function atualizar(novas: Preferencias) {
    atual.current = novas;
    setPreferencias(novas);
    setErro(null);
    // Serializa as gravações: um toque rápido não pode sobrescrever a escolha
    // mais recente com uma operação antiga que terminou depois.
    fila.current = fila.current.catch(() => {}).then(() =>
      AsyncStorage.setItem(CHAVE_PREFERENCIAS, JSON.stringify(novas)),
    );
    fila.current.catch(() => setErro("Não foi possível salvar suas preferências."));
  }

  function alternarInteresse(id: InteresseId) {
    if (!pronto) return;
    const interesses = atual.current.interesses.includes(id)
      ? atual.current.interesses.filter((item) => item !== id)
      : [...atual.current.interesses, id];
    atualizar({ ...atual.current, interesses });
  }

  function escolherCidade(id: CidadeId) {
    if (!pronto) return;
    atualizar({ ...atual.current, cidadeId: id });
  }

  return (
    <Contexto.Provider value={{
      ...preferencias,
      pronto,
      erro,
      alternarInteresse,
      escolherCidade,
      aguardarGravacao: () => fila.current,
    }}>
      {children}
    </Contexto.Provider>
  );
}

export function usePreferencias(): ContextoPreferencias {
  const contexto = useContext(Contexto);
  if (contexto === null) throw new Error("usePreferencias precisa do PreferenciasProvider.");
  return contexto;
}
