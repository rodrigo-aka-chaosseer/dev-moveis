import { calcularRoteiro } from "../roteiros/calculos";
import { locais } from "./locais";

/**
 * Roteiros temáticos montados à mão com o catálogo curado, no formato de
 * `roteiros` + `roteiro_paradas` (docs/banco/esquema.sql). Valem só quando o
 * Supabase não está configurado; os totais saem de `calcularRoteiro`.
 */
const ROTEIROS_CURADOS = [
  {
    id: "caminhos-afro-salvador",
    titulo: "Caminhos afro-brasileiros",
    descricao: "Museu, arte da diáspora e a igreja da irmandade negra, a pé pelo Pelourinho.",
    paradas: ["mafro-ufba", "casa-benin", "igreja-rosario-pretos"],
  },
  {
    id: "carnaval-e-literatura-salvador",
    titulo: "Carnaval e literatura",
    descricao: "Do Carnaval no Centro Histórico à casa de Jorge Amado e Zélia Gattai.",
    paradas: ["casa-carnaval-bahia", "casa-rio-vermelho"],
  },
  {
    id: "frevo-sertao-recife",
    titulo: "Frevo, sertão e artesanato",
    descricao: "Dois museus no Recife Antigo e o artesanato da antiga Casa de Detenção.",
    paradas: ["paco-frevo", "cais-sertao", "casa-cultura-pernambuco"],
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
    { ordem: 1, localId: "casa-benin", horaSugerida: "09:00", duracaoMin: 60 },
    { ordem: 2, localId: "local-arquivado-demonstracao", horaSugerida: "10:15", duracaoMin: 45 },
  ],
};

export const roteiros: RoteiroMock[] = [
  ...roteirosCurados,
  ROTEIRO_INDISPONIVEL_DEMONSTRACAO,
];
