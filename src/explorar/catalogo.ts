import { CIDADES, type InteresseId, type CidadeId } from "../preferencias/dados";

// Exemplos locais para exercitar o filtro antes da integração com o catálogo.
// As coordenadas são aproximadas e não devem ser tratadas como dados de visitação.
export const LOCAIS_DEMONSTRACAO = [
  { id: "pelourinho", nome: "Pelourinho", categoria: "historia", latitude: -12.9730, longitude: -38.5090 },
  { id: "mercado-modelo", nome: "Mercado Modelo", categoria: "cultura", latitude: -12.9737, longitude: -38.5138 },
  { id: "feira-sao-joaquim", nome: "Feira de São Joaquim", categoria: "gastronomia", latitude: -12.9500, longitude: -38.5015 },
  { id: "marco-zero", nome: "Praça do Marco Zero", categoria: "historia", latitude: -8.0631, longitude: -34.8711 },
  { id: "casa-cultura", nome: "Casa da Cultura", categoria: "cultura", latitude: -8.0654, longitude: -34.8816 },
  { id: "mercado-sao-jose", nome: "Mercado de São José", categoria: "gastronomia", latitude: -8.0704, longitude: -34.8774 },
] as const satisfies readonly {
  id: string;
  nome: string;
  categoria: InteresseId;
  latitude: number;
  longitude: number;
}[];

type LocalDemonstracao = (typeof LOCAIS_DEMONSTRACAO)[number];

function distanciaKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const radianos = Math.PI / 180;
  const dLat = (lat2 - lat1) * radianos;
  const dLon = (lon2 - lon1) * radianos;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * radianos) * Math.cos(lat2 * radianos) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function locaisDaCidade(cidadeId: CidadeId | null): LocalDemonstracao[] {
  const cidade = CIDADES.find((item) => item.id === cidadeId);
  if (!cidade) return [];
  return LOCAIS_DEMONSTRACAO.filter(
    (local) => distanciaKm(cidade.latitude, cidade.longitude, local.latitude, local.longitude) <= 30,
  );
}
