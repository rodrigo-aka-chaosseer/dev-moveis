import { StyleSheet, Text, View, type ViewProps } from "react-native";

import { colors, fonts } from "@/theme/tokens";

type Props = ViewProps & {
  titulo?: string;
  /** O primeiro bloco não leva divisória: a moldura externa já fecha o topo. */
  primeiro?: boolean;
};

/**
 * Um bloco empilhado do documento. Os blocos dividem a mesma linha: só o
 * segundo em diante desenha a divisória superior, senão ela sai dobrada.
 */
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
