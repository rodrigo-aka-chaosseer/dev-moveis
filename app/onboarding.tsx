import { StyleSheet, Text, View } from "react-native";
import { colors, fonts } from "@/theme/tokens";

/**
 * Placeholder da RAÍZES-02 (seleção de interesses).
 * Existe só pra tela de abertura ter pra onde navegar. Pode substituir
 * o conteúdo inteiro sem se preocupar com nada daqui.
 */
export default function Onboarding() {
  return (
    <View style={styles.screen}>
      <Text style={styles.text}>Seleção de interesses</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.bg,
  },
  text: {
    fontFamily: fonts.semibold,
    fontSize: 16,
    color: colors.onDarkMuted,
  },
});
