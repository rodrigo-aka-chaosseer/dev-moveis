import { StyleSheet, View, type ViewProps } from "react-native";

import { colors, radius } from "@/theme/tokens";

/** Moldura compartilhada pelos blocos do passaporte cultural. */
export function MolduraDocumento({ children, style, ...props }: ViewProps) {
  return (
    <View style={[styles.moldura, style]} {...props}>
      <View pointerEvents="none" style={styles.fibra} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  moldura: {
    backgroundColor: colors.documentPaper,
    borderWidth: 2,
    borderColor: colors.documentInk,
    borderRadius: radius.document,
    overflow: "hidden",
  },
  fibra: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: "rgba(92, 61, 46, 0.025)",
  },
});
