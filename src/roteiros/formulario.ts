import type { CidadeId, InteresseId } from "../preferencias/dados";
import type {
  NecessidadeAcessibilidade,
  Ritmo,
} from "./ia/gerarRoteiroIa";

export const OPCOES_TEMPO = [
  { minutos: 60, rotulo: "1 hora" },
  { minutos: 120, rotulo: "2 horas" },
  { minutos: 240, rotulo: "4 horas" },
  { minutos: 480, rotulo: "Dia inteiro" },
] as const;

export const OPCOES_ORCAMENTO = [
  { centavos: 0, rotulo: "Só gratuitos" },
  { centavos: 5_000, rotulo: "Até R$ 50" },
  { centavos: 10_000, rotulo: "Até R$ 100" },
  { centavos: null, rotulo: "Sem limite" },
] as const;

export const OPCOES_RITMO: readonly {
  id: Ritmo;
  rotulo: string;
  descricao: string;
}[] = [
  { id: "tranquilo", rotulo: "Tranquilo", descricao: "Poucas paradas e mais tempo em cada uma" },
  { id: "moderado", rotulo: "Moderado", descricao: "Equilíbrio entre tempo e quantidade de lugares" },
  { id: "intenso", rotulo: "Intenso", descricao: "Mais paradas para aproveitar o dia" },
];

export const OPCOES_ACESSIBILIDADE: readonly {
  id: NecessidadeAcessibilidade;
  rotulo: string;
}[] = [
  { id: "cadeira_de_rodas", rotulo: "Cadeira de rodas" },
  { id: "baixa_visao", rotulo: "Baixa visão" },
  { id: "sensibilidade_sensorial", rotulo: "Sensibilidade sensorial" },
];

export type FormularioRoteiro = {
  cidadeId: CidadeId | null;
  interesses: InteresseId[];
  tempoDisponivelMin: number;
  orcamentoCentavos: number | null;
  ritmo: Ritmo;
  acessibilidade: NecessidadeAcessibilidade[];
};

/** Regras mínimas do formulário e limites aceitos pelo contrato da IA. */
export function formularioRoteiroValido(formulario: FormularioRoteiro): boolean {
  return (
    formulario.cidadeId !== null &&
    formulario.interesses.length > 0 &&
    Number.isInteger(formulario.tempoDisponivelMin) &&
    formulario.tempoDisponivelMin >= 60 &&
    formulario.tempoDisponivelMin <= 720 &&
    (formulario.orcamentoCentavos === null ||
      (Number.isInteger(formulario.orcamentoCentavos) && formulario.orcamentoCentavos >= 0))
  );
}
