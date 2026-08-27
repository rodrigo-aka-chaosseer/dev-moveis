import { StyleSheet, Text, View } from "react-native";

import { colors, fonts } from "@/theme/tokens";
import type { Carimbo } from "@/mocks/perfil";

/**
 * Um carimbo do passaporte. Dois estados, sempre visíveis lado a lado na tela:
 * conquistado traz a data e vem levemente torto, como carimbo batido à mão;
 * pendente é um contorno tracejado, sem inclinação.
 */
export function CarimboDiversidade({ rotulo, carimbadoEm }: Carimbo) {
  const conquistado = carimbadoEm !== null;

  return (
    <View
      style={styles.celula}
      accessible
      accessibilityRole="image"
      accessibilityLabel={
        conquistado
          ? `Diversidade ${rotulo}, carimbada em ${carimbadoEm}`
          : `Diversidade ${rotulo}, ainda não carimbada`
      }
    >
      <View style={[styles.disco, conquistado ? styles.discoCheio : styles.discoVazio]}>
        {conquistado ? (
          <>
            <View style={styles.anelInterno} />
            <Text style={styles.data}>{carimbadoEm}</Text>
          </>
        ) : null}
      </View>
      <Text style={[styles.rotulo, !conquistado && styles.rotuloPendente]}>{rotulo}</Text>
    </View>
  );
}

const DISCO = 78;

const styles = StyleSheet.create({
  celula: {
    width: "48%",
    alignItems: "center",
    gap: 9,
  },
  disco: {
    width: DISCO,
    height: DISCO,
    borderRadius: DISCO / 2,
    alignItems: "center",
    justifyContent: "center",
  },
  discoCheio: {
    borderWidth: 2,
    borderColor: colors.accentDark,
    transform: [{ rotate: "-5deg" }],
  },
  // borderRadius precisa estar no mesmo View da borda tracejada: sem isso o
  // Android desenha a linha cheia.
  discoVazio: {
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: colors.stampEmpty,
    borderRadius: DISCO / 2,
  },
  anelInterno: {
    position: "absolute",
    top: 6,
    left: 6,
    right: 6,
    bottom: 6,
    borderRadius: (DISCO - 12) / 2,
    borderWidth: 1,
    borderColor: colors.accentDark,
    opacity: 0.45,
  },
  data: {
    fontFamily: fonts.semibold,
    fontSize: 10,
    letterSpacing: 0.6,
    textTransform: "uppercase",
    color: colors.accentDark,
  },
  rotulo: {
    fontFamily: fonts.semibold,
    fontSize: 11,
    lineHeight: 15,
    textAlign: "center",
    color: colors.documentInk,
  },
  rotuloPendente: {
    color: colors.inkMuted,
  },
});
