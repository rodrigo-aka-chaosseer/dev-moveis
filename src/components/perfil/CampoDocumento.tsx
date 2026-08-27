import { StyleSheet, Text, View } from "react-native";

import { colors, fonts } from "@/theme/tokens";

type Props = {
  rotulo: string;
  valor: string;
};

/** Par rótulo/valor no formato de campo preenchido de documento oficial. */
export function CampoDocumento({ rotulo, valor }: Props) {
  return (
    <View style={styles.campo}>
      <Text style={styles.rotulo}>{rotulo}</Text>
      <Text style={styles.valor}>{valor}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  campo: {
    gap: 3,
  },
  rotulo: {
    fontFamily: fonts.semibold,
    fontSize: 9,
    letterSpacing: 1.3,
    textTransform: "uppercase",
    color: colors.inkMuted,
  },
  valor: {
    fontFamily: fonts.semibold,
    fontSize: 15,
    color: colors.documentInk,
  },
});
