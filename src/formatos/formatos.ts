/**
 * Números do banco em linguagem de quem usa o app (H2). Toda tela formata
 * distância, duração e custo por aqui, para "800 m", "1h30" e "R$ 25"
 * aparecerem iguais no Explorar, no detalhe e nos Roteiros.
 */

/** 0,8 → "800 m"; 2,34 → "2,3 km". Valor inválido ou negativo vira "—". */
export function formatarDistanciaKm(km: number): string {
  if (!Number.isFinite(km) || km < 0) return "—";
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1).replace(".", ",")} km`;
}

export function formatarDistanciaMetros(metros: number): string {
  return formatarDistanciaKm(metros / 1000);
}

/** 45 → "45 min"; 60 → "1h"; 90 → "1h30"; 255 → "4h15". */
export function formatarDuracao(minutos: number): string {
  if (!Number.isFinite(minutos) || minutos <= 0) return "—";
  const total = Math.round(minutos);
  if (total < 60) return `${total} min`;
  const horas = Math.floor(total / 60);
  const resto = total % 60;
  return resto ? `${horas}h${String(resto).padStart(2, "0")}` : `${horas}h`;
}

/**
 * 0 → "Gratuito"; 2500 → "R$ 25"; 1250 → "R$ 12,50". Preço desconhecido
 * (null) vira o texto pedido pela tela, nunca "null" nem "R$ 0".
 */
export function formatarCusto(
  centavos: number | null | undefined,
  desconhecido = "Preço não informado",
): string {
  if (centavos == null || !Number.isFinite(centavos) || centavos < 0) return desconhecido;
  if (centavos === 0) return "Gratuito";
  const reais = centavos / 100;
  return Number.isInteger(reais) ? `R$ ${reais}` : `R$ ${reais.toFixed(2).replace(".", ",")}`;
}
