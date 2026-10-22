import type { LocalLista } from "../mocks/locais";
import { CIDADES, type CidadeId } from "../preferencias/dados";
import { distanciaKm, formatarDistancia } from "./distancia";

type Coordenadas = { latitude: number; longitude: number };

/** Recalcula também os mocks, sem alterar a lista original ou consultar a rede. */
export function ordenarPorProximidade(
  locais: LocalLista[],
  cidadeId: CidadeId,
  coordenadas: Coordenadas | null,
) {
  const cidade = CIDADES.find((item) => item.id === cidadeId)!;
  const origem = coordenadas ?? cidade;
  return locais
    .map((local) => {
      const distanciaKmLocal = distanciaKm(
        origem.latitude, origem.longitude, local.latitude, local.longitude,
      );
      return {
        ...local,
        distanciaKm: distanciaKmLocal,
        distancia: coordenadas
          ? formatarDistancia(distanciaKmLocal)
          : `${formatarDistancia(distanciaKmLocal)} (aprox. pelo centro da cidade)`,
      };
    })
    .sort((a, b) => a.distanciaKm - b.distanciaKm);
}