import { Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { colors, fonts } from "../src/theme/tokens";

/**
 * Placeholder da RAÍZES-02 (seleção de interesses).
 * Existe só pra tela de abertura ter pra onde navegar. Pode substituir
 * o conteúdo inteiro sem se preocupar com nada daqui.
 */
export default function Onboarding() {
  const router = useRouter();

  return (
    <View style={styles.screen}>
      <Text style={styles.text}>Seleção de interesses</Text>
      <Pressable onPress={() => router.replace("/(tabs)" as never)} style={styles.button}>
        <Text style={styles.buttonText}>Continuar</Text>
      </Pressable>
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
  button: {
    marginTop: 20,
    minHeight: 44,
    paddingHorizontal: 24,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.accent,
  },
  buttonText: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    color: colors.onDark,
  },
});
