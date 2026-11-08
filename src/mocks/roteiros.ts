import { calcularRoteiro } from "../roteiros/calculos";
import { locais } from "./locais";

/**
 * Roteiros temáticos montados à mão com o catálogo curado, no formato de
 * `roteiros` + `roteiro_paradas` (docs/banco/esquema.sql). Valem só quando o
 * Supabase não está configurado; os totais saem de `calcularRoteiro`.
 */
const ROTEIROS_CURADOS = [
  {
    id: "memoria-e-cultura-palmas",
    titulo: "Memória e cultura de Palmas",
    descricao: "Da criação do Tocantins aos espaços culturais da capital.",
    paradas: ["palacinho", "praca-dos-girassois", "memorial-coluna-prestes", "espaco-cultural-jose-gomes-sobrinho"],
  },
  {
    id: "natureza-e-sabores-palmas",
    titulo: "Natureza e sabores de Palmas",
    descricao: "Parques, feira e a orla para viver diferentes paisagens da cidade.",
    paradas: ["parque-povos-indigenas", "parque-cesamar", "feira-304-sul", "praia-da-graciosa"],
  },
];

export type ParadaMock = {
  ordem: number;
  localId: string;
  horaSugerida: string;
  duracaoMin: number;
};

export type RoteiroMock = {
  id: string;
  titulo: string;
  descricao: string;
  duracaoMin: number;
  distanciaMetros: number;
  custoCentavos: number | null;
  paradas: ParadaMock[];
};

const roteirosCurados: RoteiroMock[] = ROTEIROS_CURADOS.map((roteiro) => {
  const lugares = roteiro.paradas.map((id) => {
    const local = locais.find((item) => item.id === id);
    if (!local) throw new Error(`Roteiro ${roteiro.id} aponta para lugar inexistente: ${id}`);
    return local;
  });
  const calculado = calcularRoteiro(lugares);

  return {
    id: roteiro.id,
    titulo: roteiro.titulo,
    descricao: roteiro.descricao,
    duracaoMin: calculado.duracaoMin,
    distanciaMetros: calculado.distanciaMetros,
    custoCentavos: calculado.custoCentavos,
    paradas: calculado.paradas.map((parada, indice) => ({
      ordem: indice + 1,
      localId: parada.local.id,
      horaSugerida: parada.horaSugerida,
      duracaoMin: parada.duracaoMin,
    })),
  };
});

/** Cenário sintético para demonstrar uma parada cujo lugar foi arquivado. */
const ROTEIRO_INDISPONIVEL_DEMONSTRACAO: RoteiroMock = {
  id: "demonstracao-parada-indisponivel",
  titulo: "Demonstração: parada indisponível",
  descricao: "Roteiro de teste para visualizar a recuperação quando um lugar sai do catálogo.",
  duracaoMin: 105,
  distanciaMetros: 900,
  custoCentavos: 0,
  paradas: [
    { ordem: 1, localId: "palacinho", horaSugerida: "09:00", duracaoMin: 60 },
    { ordem: 2, localId: "local-arquivado-demonstracao", horaSugerida: "10:15", duracaoMin: 45 },
  ],
};

export const roteiros: RoteiroMock[] = [
  ...roteirosCurados,
  ROTEIRO_INDISPONIVEL_DEMONSTRACAO,
];

