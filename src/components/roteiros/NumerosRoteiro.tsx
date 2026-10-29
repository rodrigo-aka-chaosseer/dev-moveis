import { StyleSheet, Text, View } from "react-native";

import { rotuloCusto, rotuloDistanciaMetros, rotuloDuracao } from "../../roteiros/calculos";
import { colors, fonts } from "../../theme/tokens";

type Totais = { duracaoMin: number; distanciaMetros: number; custoCentavos: number | null };

/**
 * Paradas, duração, distância e custo: os quatro números do protótipo. Serve
 * para roteiro temático e para o gerado pela IA, por isso recebe só os totais.
 */
export function NumerosRoteiro({
  roteiro,
  paradas,
  fundo = colors.surface2,
}: {
  roteiro: Totais;
  paradas: number;
  fundo?: string;
}) {
  const numeros = [
    { valor: String(paradas), rotulo: "Paradas" },
    { valor: rotuloDuracao(roteiro.duracaoMin), rotulo: "Duração" },
    { valor: rotuloDistanciaMetros(roteiro.distanciaMetros), rotulo: "Distância" },
    { valor: rotuloCusto(roteiro.custoCentavos), rotulo: "Custo" },
  ];

  return (
    <View style={s.linha}>
      {numeros.map((numero) => (
        <View
          key={numero.rotulo}
          accessible
          accessibilityLabel={`${numero.rotulo}: ${numero.valor === "—" ? "a confirmar" : numero.valor}`}
          style={[s.numero, { backgroundColor: fundo }]}
        >
          <Text style={s.valor} numberOfLines={1}>{numero.valor}</Text>
          <Text style={s.rotulo}>{numero.rotulo}</Text>
        </View>
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  linha: { flexDirection: "row", gap: 6 },
  numero: { flex: 1, alignItems: "center", paddingVertical: 12, paddingHorizontal: 4, borderRadius: 16 },
  valor: { fontFamily: fonts.extrabold, fontSize: 15, color: colors.accentDark, fontVariant: ["tabular-nums"] },
  rotulo: { fontFamily: fonts.regular, fontSize: 10, color: colors.textMuted, marginTop: 2 },
});
