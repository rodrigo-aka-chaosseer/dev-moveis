import { Image } from "expo-image";
import { StyleSheet, View, type ViewProps } from "react-native";

import { colors, radius } from "@/theme/tokens";

const TEXTURA = require("../../../assets/images/textura-fibra.png");

/**
 * A moldura do passaporte: borda externa firme, papel de fibra por dentro.
 *
 * A textura fica em posição absoluta atrás do conteúdo, com opacidade baixa e
 * sem receber toque. `overflow: hidden` é obrigatório para ela respeitar o
 * canto da moldura.
 */
export function MolduraDocumento({ children, style, ...props }: ViewProps) {
  return (
    <View style={[styles.moldura, style]} {...props}>
      <Image
        source={TEXTURA}
        style={[StyleSheet.absoluteFill, styles.textura]}
        contentFit="cover"
        // A textura é guardada em tons de cinza; o tint pinta a fibra na tinta
        // do documento para ela ler como papel, não como risco de lápis.
        tintColor={colors.documentInk}
        pointerEvents="none"
        accessible={false}
      />
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
  textura: {
    opacity: 0.16,
  },
});
