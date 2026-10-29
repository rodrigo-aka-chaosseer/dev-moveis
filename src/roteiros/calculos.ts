import { distanciaKm, formatarDistancia } from "../locais/distancia";
import type { LocalLista } from "../mocks/locais";

/** Passo de quem caminha olhando a cidade: 4,5 km/h. */
const METROS_POR_MINUTO_A_PE = 75;

export type ParadaCalculada = {
  local: LocalLista;
  /** "HH:MM" de 5 em 5 min, contando visita e caminhada das paradas anteriores. */
  horaSugerida: string;
  duracaoMin: number;
};

export type RoteiroCalculado = {
  paradas: ParadaCalculada[];
  /** Visitas + caminhada entre paradas, arredondado para cima de 5 em 5. */
  duracaoMin: number;
  /** Linha reta entre paradas consecutivas, arredondada de 10 em 10. */
  distanciaMetros: number;
  /** null quando algum lugar não tem preço cadastrado. */
  custoCentavos: number | null;
};

/**
 * Totais de um roteiro a partir dos lugares, na ordem da visita. É como o
 * catálogo local chega aos mesmos campos que `roteiros` guarda no banco
 * (duracao_min, distancia_metros, custo_centavos, hora_sugerida).
 */
export function calcularRoteiro(locais: LocalLista[], inicio = "09:00"): RoteiroCalculado {
  return calcularParadas(
    locais.map((local) => ({ local, duracaoMin: local.tempoMedioMin })),
    inicio,
  );
}

/**
 * Mesma conta de `calcularRoteiro`, mas com a duração de cada parada vinda de
 * fora (a IA pode sugerir mais ou menos tempo que o tempo médio do lugar).
 * É a conta que o servidor faz em `totais` (supabase/functions/_shared).
 */
export function calcularParadas(
  itens: { local: LocalLista; duracaoMin: number }[],
  inicio = "09:00",
): RoteiroCalculado {
  let metros = 0;
  let relogio = paraMinutos(inicio);
  const paradas: ParadaCalculada[] = [];

  itens.forEach(({ local, duracaoMin }, indice) => {
    if (indice > 0) {
      const anterior = itens[indice - 1].local;
      const trecho =
        distanciaKm(anterior.latitude, anterior.longitude, local.latitude, local.longitude) * 1000;
      metros += trecho;
      // Horário redondo: "11:25" se lê melhor que "11:23" e dá folga na caminhada.
      relogio = Math.ceil((relogio + trecho / METROS_POR_MINUTO_A_PE) / 5) * 5;
    }
    paradas.push({ local, horaSugerida: paraHora(relogio), duracaoMin });
    relogio += duracaoMin;
  });

  const precos = itens.map(({ local }) => (local.gratuito ? 0 : local.precoCentavos));
  const custoCentavos = precos.some((preco) => preco == null)
    ? null
    : precos.reduce<number>((soma, preco) => soma + (preco ?? 0), 0);

  return {
    paradas,
    duracaoMin: Math.ceil((relogio - paraMinutos(inicio)) / 5) * 5,
    distanciaMetros: Math.round(metros / 10) * 10,
    custoCentavos,
  };
}

export function rotuloDuracao(minutos: number): string {
  if (minutos < 60) return `${minutos} min`;
  const horas = Math.floor(minutos / 60);
  const resto = minutos % 60;
  return resto ? `${horas}h${String(resto).padStart(2, "0")}` : `${horas}h`;
}

export function rotuloCusto(centavos: number | null): string {
  if (centavos == null) return "—";
  if (centavos === 0) return "Gratuito";
  return `R$ ${Math.round(centavos / 100)}`;
}

export function rotuloDistanciaMetros(metros: number): string {
  return formatarDistancia(metros / 1000);
}

function paraMinutos(hora: string) {
  const [h, m] = hora.split(":").map(Number);
  return h * 60 + (m || 0);
}

function paraHora(minutos: number) {
  const h = Math.floor(minutos / 60) % 24;
  const m = minutos % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}
