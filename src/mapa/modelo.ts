import type { LocalLista } from "../mocks/locais";
import { CIDADES, type CidadeId } from "../preferencias/dados";

export type CoordenadaMapa = { latitude: number; longitude: number };

export type PropsMapa = {
  cidadeId: CidadeId;
  locais: LocalLista[];
  coordenadas: CoordenadaMapa | null;
  selecionadoId: string | null;
  selecionar: (id: string) => void;
};

export function regiaoDosLocais(cidadeId: CidadeId, locais: CoordenadaMapa[]) {
  const pontos = locais.length ? locais : [CIDADES.find((cidade) => cidade.id === cidadeId)!];
  const latitudes = pontos.map((ponto) => ponto.latitude);
  const longitudes = pontos.map((ponto) => ponto.longitude);
  const minLat = Math.min(...latitudes);
  const maxLat = Math.max(...latitudes);
  const minLon = Math.min(...longitudes);
  const maxLon = Math.max(...longitudes);
  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLon + maxLon) / 2,
    latitudeDelta: Math.max(0.02, (maxLat - minLat) * 1.4),
    longitudeDelta: Math.max(0.02, (maxLon - minLon) * 1.4),
  };
}
