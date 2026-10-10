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
import { usePreferencias } from "../src/preferencias/PreferenciasProvider";
import { CIDADES, INTERESSES } from "../src/preferencias/dados";

export default function Onboarding() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { interesses, cidadeId, pronto, erro, alternarInteresse, escolherCidade, concluirOnboarding } = usePreferencias();
  const [etapa, setEtapa] = useState<1 | 2>(1);
  const [continuando, setContinuando] = useState(false);
  const [erroContinuar, setErroContinuar] = useState<string | null>(null);

  async function continuar() {
    if (etapa === 1) {
      setEtapa(2);
      return;
    }
    if (!cidadeId || continuando) return;
    setContinuando(true);
    setErroContinuar(null);
    try {
      await concluirOnboarding();
      router.replace("/(tabs)/explorar");
    } catch {
      setErroContinuar("Não foi possível salvar a cidade. Tente novamente.");
      setContinuando(false);
    }
  }

  const quantidade = interesses.length;
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
          accessibilityLabel={etapa === 2 ? "Voltar aos interesses" : "Voltar"}
          hitSlop={8}
          onPress={() => {
            if (etapa === 2) setEtapa(1);
            else if (router.canGoBack()) router.back();
            else router.replace("/(tabs)/explorar");
          }}
          style={({ pressed }) => [
            styles.backButton,
            pressed && styles.backButtonPressed,
          ]}
        >
          <Text style={styles.backIcon}>‹</Text>
        </Pressable>

        <View
          accessibilityRole="progressbar"
          accessibilityValue={{ min: 0, max: 2, now: etapa }}
          style={styles.progressTrack}
        >
          <View style={[styles.progressFill, { width: etapa === 1 ? "50%" : "100%" }]} />
        </View>

        <Text style={styles.stepLabel}>{etapa} de 2</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {!pronto ? <Text style={styles.summary}>Carregando preferências…</Text> : etapa === 1 ? <>
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
            const selecionado = interesses.includes(interesse.id);

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
        {quantidade > 0 && (
          <Text style={styles.selectedList}>
            {INTERESSES.filter((item) => interesses.includes(item.id)).map((item) => item.nome).join(" · ")}
          </Text>
        )}
        </> : <>
          <View style={styles.intro}>
            <Text style={styles.eyebrow}>SEU DESTINO</Text>
            <Text style={styles.title}>Qual cidade você quer conhecer?</Text>
            <Text style={styles.subtitle}>Escolha uma cidade para ver os lugares dela em Explorar. Você poderá trocar depois.</Text>
          </View>
          <View style={styles.cityList}>
            {CIDADES.map((cidade) => {
              const selecionada = cidadeId === cidade.id;
              return <Pressable
                key={cidade.id}
                accessibilityRole="button"
                accessibilityLabel={`${cidade.nome}, ${cidade.uf}`}
                accessibilityState={{ selected: selecionada }}
                onPress={() => escolherCidade(cidade.id)}
                style={({ pressed }) => [styles.city, selecionada && styles.interestSelected, pressed && styles.interestPressed]}
              >
                <Text style={[styles.cityName, selecionada && styles.interestLabelSelected]}>{cidade.nome}, {cidade.uf}</Text>
                <Text style={[styles.cityCheck, selecionada && styles.cityCheckSelected]}>{selecionada ? "✓" : ""}</Text>
              </Pressable>;
            })}
          </View>
        </>}
        {(erro || erroContinuar) && <Text accessibilityLiveRegion="polite" style={styles.error}>{erroContinuar || erro}</Text>}
      </ScrollView>

      <View
        style={[
          styles.footer,
          { paddingBottom: Math.max(insets.bottom, 16) },
        ]}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: !pronto || (etapa === 2 && !cidadeId) || continuando }}
          disabled={!pronto || (etapa === 2 && !cidadeId) || continuando}
          onPress={continuar}
          style={[styles.futureButton, (!pronto || (etapa === 2 && !cidadeId)) && styles.buttonDisabled]}
        >
          <Text style={styles.futureButtonLabel}>{etapa === 1 ? "Continuar" : "Explorar cidade"}</Text>
        </Pressable>
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
  selectedList: {
    marginTop: 10,
    textAlign: "center",
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 20,
    color: colors.text,
  },
  cityList: { gap: 12 },
  city: {
    minHeight: 64,
    borderRadius: radius.card,
    borderWidth: 1.5,
    borderColor: colors.surface3,
    backgroundColor: colors.surface2,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cityName: { fontFamily: fonts.semibold, fontSize: 16, color: colors.text },
  cityCheck: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: colors.surface3,
    textAlign: "center",
    color: colors.onDark,
  },
  cityCheckSelected: { backgroundColor: colors.accent, borderColor: colors.accent },
  error: { marginTop: 16, fontFamily: fonts.semibold, fontSize: 13, color: colors.error },
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
  },
  buttonDisabled: { opacity: 0.45 },
  futureButtonLabel: {
    fontFamily: fonts.semibold,
    fontSize: 16,
    color: colors.onDark,
  },
});
