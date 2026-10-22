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

export function formatarDistancia(km: number): string {
  if (km < 1) {
    return `${Math.round(km * 1000)} m`;
  }
  return `${km.toFixed(1).replace(".", ",")} km`;
}
