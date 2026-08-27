import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colors, fonts, gradients, radius, spacing } from "../src/theme/tokens";

const BACKGROUND = require("../assets/images/splash-bg.jpg");

export default function Abertura() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.screen}>
      <Image
        source={BACKGROUND}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        transition={300}
        accessible={false}
      />

      <LinearGradient
        colors={gradients.screenTop.colors}
        locations={gradients.screenTop.locations}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      <LinearGradient
        colors={gradients.screenBottom.colors}
        locations={gradients.screenBottom.locations}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      <View
        style={[
          styles.content,
          { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 },
        ]}
      >
        <View style={styles.brand}>
          <Text style={styles.mark}>Raízes</Text>
          <Text style={styles.eyebrow}>Descoberta cultural</Text>
        </View>

        <View style={styles.actions}>
          <Text style={styles.blurb}>
            Conheça uma cidade pelas pessoas, culturas e histórias que
            construíram sua identidade.
          </Text>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Começar a explorar"
            onPress={() => router.push("/onboarding")}
            style={({ pressed }) => [
              styles.primaryWrapper,
              pressed && styles.primaryPressed,
            ]}
          >
            <LinearGradient
              colors={[colors.accent, colors.accentDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.primary}
            >
              <Text style={styles.primaryLabel}>Começar a explorar</Text>
            </LinearGradient>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Explorar sem responder o questionário"
            onPress={() => router.push("/onboarding")}
            style={({ pressed }) => [styles.ghost, pressed && styles.ghostPressed]}
          >
            <Text style={styles.ghostLabel}>Explorar sem responder</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    flex: 1,
    justifyContent: "space-between",
    paddingHorizontal: spacing.pageX,
  },
  brand: {
    gap: 9,
  },
  mark: {
    fontFamily: fonts.extrabold,
    fontSize: 42,
    lineHeight: 46,
    letterSpacing: -0.84,
    color: colors.onDark,
  },
  eyebrow: {
    fontFamily: fonts.semibold,
    fontSize: 12,
    letterSpacing: 0.48,
    textTransform: "uppercase",
    color: colors.onDarkMuted,
  },
  actions: {
    gap: 10,
  },
  blurb: {
    fontFamily: fonts.regular,
    fontSize: 15,
    lineHeight: 24,
    color: colors.onDarkSoft,
    maxWidth: 268,
    marginBottom: 8,
  },
  primaryWrapper: {
    borderRadius: radius.button,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 16,
    elevation: 6,
  },
  primaryPressed: {
    transform: [{ scale: 0.97 }],
    shadowOpacity: 0.12,
  },
  primary: {
    height: 52,
    borderRadius: radius.button,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryLabel: {
    fontFamily: fonts.semibold,
    fontSize: 16,
    color: colors.onDark,
  },
  // 48 e não 41 como no protótipo: abaixo de 44 o toque erra com frequência.
  ghost: {
    height: 48,
    borderRadius: radius.button,
    borderWidth: 1.5,
    borderColor: colors.borderOnDark,
    alignItems: "center",
    justifyContent: "center",
  },
  ghostPressed: {
    transform: [{ scale: 0.98 }],
    borderColor: "rgba(255, 255, 255, 0.3)",
    backgroundColor: "rgba(255, 255, 255, 0.06)",
  },
  ghostLabel: {
    fontFamily: fonts.semibold,
    fontSize: 15,
    color: colors.onDarkMuted,
  },
});
