import { useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colors, fonts, radius, spacing } from "../src/theme/tokens";

const INTERESSES = [
  { id: "gastronomia", nome: "Gastronomia", icone: "🍴" },
  { id: "historia", nome: "História", icone: "▤" },
  { id: "cultura", nome: "Cultura", icone: "✦" },
  { id: "musica", nome: "Música", icone: "♫" },
  { id: "arte", nome: "Arte", icone: "◉" },
  { id: "eventos", nome: "Eventos", icone: "□" },
  { id: "natureza", nome: "Natureza", icone: "♧" },
] as const;

type InteresseId = (typeof INTERESSES)[number]["id"];

export default function Onboarding() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [selecionados, setSelecionados] = useState<Set<InteresseId>>(
    () => new Set(),
  );

  function alternarInteresse(id: InteresseId) {
    setSelecionados((atuais) => {
      const proximos = new Set(atuais);

      if (proximos.has(id)) {
        proximos.delete(id);
      } else {
        proximos.add(id);
      }

      return proximos;
    });
  }

  const quantidade = selecionados.size;
  const resumo =
    quantidade === 0
      ? "Nenhum interesse selecionado"
      : `${quantidade} ${quantidade === 1 ? "interesse selecionado" : "interesses selecionados"}`;

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />

      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Voltar para a tela de abertura"
          hitSlop={8}
          onPress={() => router.back()}
          style={({ pressed }) => [
            styles.backButton,
            pressed && styles.backButtonPressed,
          ]}
        >
          <Text style={styles.backIcon}>‹</Text>
        </Pressable>

        <View
          accessibilityRole="progressbar"
          accessibilityValue={{ min: 0, max: 1, now: 1 }}
          style={styles.progressTrack}
        >
          <View style={styles.progressFill} />
        </View>

        <Text style={styles.stepLabel}>1 de 1</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.intro}>
          <Text style={styles.eyebrow}>SUAS PREFERÊNCIAS</Text>
          <Text style={styles.title}>O que você gosta de conhecer?</Text>
          <Text style={styles.subtitle}>
            Selecione quantos interesses quiser. Você poderá alterar essa
            escolha depois.
          </Text>
        </View>

        <View accessibilityLabel="Interesses culturais" style={styles.grid}>
          {INTERESSES.map((interesse) => {
            const selecionado = selecionados.has(interesse.id);

            return (
              <Pressable
                key={interesse.id}
                accessibilityRole="button"
                accessibilityLabel={interesse.nome}
                accessibilityHint="Toque para selecionar ou remover este interesse"
                accessibilityState={{ selected: selecionado }}
                onPress={() => alternarInteresse(interesse.id)}
                style={({ pressed }) => [
                  styles.interest,
                  selecionado && styles.interestSelected,
                  pressed && styles.interestPressed,
                ]}
              >
                <View
                  accessible={false}
                  style={[
                    styles.iconBox,
                    selecionado && styles.iconBoxSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.icon,
                      selecionado && styles.iconSelected,
                    ]}
                  >
                    {interesse.icone}
                  </Text>
                </View>

                <Text
                  numberOfLines={1}
                  style={[
                    styles.interestLabel,
                    selecionado && styles.interestLabelSelected,
                  ]}
                >
                  {interesse.nome}
                </Text>

                <View
                  accessible={false}
                  style={[
                    styles.check,
                    selecionado && styles.checkSelected,
                  ]}
                >
                  {selecionado && <Text style={styles.checkMark}>✓</Text>}
                </View>
              </Pressable>
            );
          })}
        </View>

        <Text accessibilityLiveRegion="polite" style={styles.summary}>
          {resumo}
        </Text>
      </ScrollView>

      <View
        style={[
          styles.footer,
          { paddingBottom: Math.max(insets.bottom, 16) },
        ]}
      >
        <View style={styles.futureButton} accessibilityElementsHidden>
          <Text style={styles.futureButtonLabel}>Continuar</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  header: {
    minHeight: 76,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: spacing.pageX,
    paddingBottom: 12,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  backButtonPressed: {
    backgroundColor: colors.surface2,
    transform: [{ scale: 0.96 }],
  },
  backIcon: {
    marginTop: -4,
    fontFamily: fonts.regular,
    fontSize: 38,
    lineHeight: 40,
    color: colors.text,
  },
  progressTrack: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    overflow: "hidden",
    backgroundColor: colors.surface2,
  },
  progressFill: {
    width: "100%",
    height: "100%",
    borderRadius: 2,
    backgroundColor: colors.accent,
  },
  stepLabel: {
    fontFamily: fonts.semibold,
    fontSize: 12,
    color: colors.textMuted,
  },
  content: {
    paddingHorizontal: spacing.pageX,
    paddingTop: 18,
    paddingBottom: 24,
  },
  intro: {
    marginBottom: 24,
  },
  eyebrow: {
    marginBottom: 10,
    fontFamily: fonts.semibold,
    fontSize: 11,
    letterSpacing: 1.25,
    color: colors.accent,
  },
  title: {
    maxWidth: 320,
    fontFamily: fonts.extrabold,
    fontSize: 27,
    lineHeight: 34,
    letterSpacing: -0.54,
    color: colors.text,
  },
  subtitle: {
    maxWidth: 330,
    marginTop: 9,
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 22,
    color: colors.textMuted,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  interest: {
    width: "48.4%",
    minHeight: 70,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    paddingHorizontal: 12,
    paddingVertical: 11,
    borderWidth: 1.5,
    borderColor: colors.surface3,
    borderRadius: radius.card,
    backgroundColor: colors.surface2,
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  interestSelected: {
    borderColor: colors.accent,
    backgroundColor: colors.accentSoft,
    shadowColor: colors.accent,
    shadowOpacity: 0.14,
    shadowRadius: 9,
    elevation: 3,
  },
  interestPressed: {
    transform: [{ scale: 0.97 }],
  },
  iconBox: {
    width: 29,
    height: 29,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
  },
  iconBoxSelected: {
    backgroundColor: colors.accentTint,
  },
  icon: {
    fontFamily: fonts.semibold,
    fontSize: 18,
    lineHeight: 21,
    color: colors.textMuted,
  },
  iconSelected: {
    color: colors.accent,
  },
  interestLabel: {
    flex: 1,
    fontFamily: fonts.semibold,
    fontSize: 12,
    letterSpacing: -0.12,
    color: colors.text,
  },
  interestLabelSelected: {
    color: colors.accentDark,
  },
  check: {
    width: 18,
    height: 18,
    borderRadius: 9,
  },
  checkSelected: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.accent,
  },
  checkMark: {
    marginTop: -1,
    fontFamily: fonts.semibold,
    fontSize: 11,
    lineHeight: 13,
    color: colors.onDark,
  },
  summary: {
    marginTop: 20,
    textAlign: "center",
    fontFamily: fonts.semibold,
    fontSize: 12,
    color: colors.textMuted,
  },
  footer: {
    paddingHorizontal: spacing.pageX,
    paddingTop: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.surface3,
    backgroundColor: colors.surface,
  },
  futureButton: {
    height: 52,
    borderRadius: radius.button,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.accent,
    opacity: 0.45,
  },
  futureButtonLabel: {
    fontFamily: fonts.semibold,
    fontSize: 16,
    color: colors.onDark,
  },
});
