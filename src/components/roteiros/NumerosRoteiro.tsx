import { StyleSheet, Text, View } from "react-native";

import { rotuloCusto, rotuloDistanciaMetros, rotuloDuracao } from "../../roteiros/calculos";
import { paradasDisponiveis, type Roteiro } from "../../roteiros/listarRoteiros";
import { colors, fonts } from "../../theme/tokens";

/** Paradas, duração, distância e custo: os quatro números do protótipo. */
export function NumerosRoteiro({ roteiro, fundo = colors.surface2 }: { roteiro: Roteiro; fundo?: string }) {
  const numeros = [
    { valor: String(paradasDisponiveis(roteiro).length), rotulo: "Paradas" },
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
