import { StyleSheet, Text, View, type ViewProps } from "react-native";

import { colors, fonts } from "@/theme/tokens";

type Props = ViewProps & {
  titulo?: string;
  primeiro?: boolean;
};

export function BlocoDocumento({ titulo, primeiro, children, style, ...props }: Props) {
  return (
    <View style={[styles.bloco, !primeiro && styles.comDivisoria, style]} {...props}>
      {titulo ? <Text style={styles.titulo}>{titulo}</Text> : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  bloco: {
    paddingHorizontal: 18,
    paddingVertical: 20,
  },
  comDivisoria: {
    borderTopWidth: 1,
    borderTopColor: colors.documentInk,
  },
  titulo: {
    fontFamily: fonts.semibold,
    fontSize: 10,
    letterSpacing: 1.6,
    textTransform: "uppercase",
    color: colors.inkMuted,
    marginBottom: 14,
  },
});
