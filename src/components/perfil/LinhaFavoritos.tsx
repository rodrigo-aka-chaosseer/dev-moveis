import { Pressable, StyleSheet, Text, View } from "react-native";

import { MIN_TOUCH, colors, fonts } from "@/theme/tokens";
import type { GrupoFavoritos } from "@/mocks/perfil";

type Props = GrupoFavoritos & {
  onPress?: () => void;
};

/** Linha de favoritos agrupada por viagem. */
export function LinhaFavoritos({ cidade, uf, quantidade, onPress }: Props) {
  const plural = quantidade === 1 ? "lugar salvo" : "lugares salvos";

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${cidade}, ${uf}. ${quantidade} ${plural}.`}
      onPress={onPress}
      style={({ pressed }) => [styles.linha, pressed && styles.pressionada]}
    >
      <View style={styles.texto}>
        <Text style={styles.cidade}>
          {cidade} <Text style={styles.uf}>{uf}</Text>
        </Text>
        <Text style={styles.contagem}>
          {quantidade} {plural}
        </Text>
      </View>
      <View style={styles.chevron} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  linha: {
    minHeight: MIN_TOUCH,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
  },
  pressionada: {
    opacity: 0.55,
  },
  texto: {
    gap: 2,
    flexShrink: 1,
  },
  cidade: {
    fontFamily: fonts.semibold,
    fontSize: 15,
    color: colors.documentInk,
  },
  uf: {
    fontFamily: fonts.semibold,
    fontSize: 11,
    color: colors.inkMuted,
  },
  contagem: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.inkMuted,
  },
  // Seta desenhada com bordas: evita trazer biblioteca de ícone só por isto.
  chevron: {
    width: 9,
    height: 9,
    borderRightWidth: 1.5,
    borderTopWidth: 1.5,
    borderColor: colors.inkMuted,
    transform: [{ rotate: "45deg" }],
    marginLeft: 12,
  },
});
