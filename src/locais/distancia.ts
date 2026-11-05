export function distanciaKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const radianos = Math.PI / 180;
  const dLat = (lat2 - lat1) * radianos;
  const dLon = (lon2 - lon1) * radianos;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * radianos) * Math.cos(lat2 * radianos) * Math.sin(dLon / 2) ** 2;
  const limitado = Math.min(1, Math.max(0, a));
  return 6371 * 2 * Math.atan2(Math.sqrt(limitado), Math.sqrt(1 - limitado));
}

/** Mantida para quem já importa daqui; a regra mora em src/formatos. */
export { formatarDistanciaKm as formatarDistancia } from "../formatos/formatos";
