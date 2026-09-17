import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { locaisDaCidade } from "../../src/explorar/catalogo";
import { usePreferencias } from "../../src/preferencias/PreferenciasProvider";
import { CIDADES, INTERESSES, nomeCidade } from "../../src/preferencias/dados";
import { colors, fonts, radius, spacing } from "../../src/theme/tokens";

export default function Explorar() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { cidadeId, interesses, pronto, erro, escolherCidade } = usePreferencias();
  const locais = locaisDaCidade(cidadeId);
  const nomesInteresses = INTERESSES.filter((item) => interesses.includes(item.id)).map((item) => item.nome);

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + 24 }]}>
        <Text style={styles.eyebrow}>RAÍZES · EXPLORAR</Text>
        <Text style={styles.title}>Descubra uma cidade</Text>
        <Text style={styles.subtitle}>Seu destino define os lugares mostrados abaixo.</Text>

        {!pronto ? <Text style={styles.muted}>Carregando preferências…</Text> : <>
          <Text style={styles.sectionTitle}>Cidade de destino</Text>
          <View style={styles.cityRow}>
            {CIDADES.map((cidade) => {
              const selecionada = cidadeId === cidade.id;
              return <Pressable
                key={cidade.id}
                accessibilityRole="button"
                accessibilityLabel={`${cidade.nome}, ${cidade.uf}`}
                accessibilityState={{ selected: selecionada }}
                onPress={() => escolherCidade(cidade.id)}
                style={[styles.cityChip, selecionada && styles.cityChipSelected]}
              >
                <Text style={[styles.cityChipText, selecionada && styles.cityChipTextSelected]}>{cidade.nome}, {cidade.uf}</Text>
              </Pressable>;
            })}
          </View>

          <View style={styles.interestHeader}>
            <Text style={styles.sectionTitle}>Seus interesses</Text>
            <Pressable accessibilityRole="button" onPress={() => router.push("/onboarding")}
              style={styles.editButton}>
              <Text style={styles.editText}>Editar escolhas</Text>
            </Pressable>
          </View>
          <Text style={styles.interests}>{nomesInteresses.length ? nomesInteresses.join(" · ") : "Nenhum interesse selecionado ainda."}</Text>

          <Text style={styles.sectionTitle}>Lugares {nomeCidade(cidadeId) ? `em ${nomeCidade(cidadeId)}` : ""}</Text>
          {!cidadeId ? <View style={styles.empty}>
            <Text style={styles.emptyTitle}>Escolha uma cidade para começar</Text>
            <Text style={styles.muted}>Você também pode completar as escolhas no onboarding.</Text>
            <Pressable accessibilityRole="button" onPress={() => router.push("/onboarding")} style={styles.startButton}>
              <Text style={styles.startButtonText}>Escolher cidade e interesses</Text>
            </Pressable>
          </View> : locais.map((local) => (
            <View key={local.id} style={styles.place}>
              <Text style={styles.placeName}>{local.nome}</Text>
              <Text style={styles.placeCategory}>{INTERESSES.find((item) => item.id === local.categoria)?.nome}</Text>
            </View>
          ))}
          <Text style={styles.demoNotice}>Locais de demonstração com coordenadas aproximadas. O catálogo curado ainda não está conectado.</Text>
          {erro && <Text accessibilityLiveRegion="polite" style={styles.error}>{erro}</Text>}
        </>}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface },
  content: { paddingHorizontal: spacing.pageX, paddingBottom: 36 },
  eyebrow: { fontFamily: fonts.semibold, fontSize: 11, letterSpacing: 1.2, color: colors.accent },
  title: { marginTop: 8, fontFamily: fonts.extrabold, fontSize: 27, color: colors.text },
  subtitle: { marginTop: 6, fontFamily: fonts.regular, fontSize: 14, lineHeight: 21, color: colors.textMuted },
  sectionTitle: { marginTop: 27, marginBottom: 12, fontFamily: fonts.semibold, fontSize: 17, color: colors.text },
  cityRow: { flexDirection: "row", flexWrap: "wrap", gap: 9 },
  cityChip: { minHeight: 44, justifyContent: "center", paddingHorizontal: 16, borderWidth: 1.5, borderColor: colors.surface3, borderRadius: radius.button, backgroundColor: colors.surface2 },
  cityChipSelected: { borderColor: colors.accent, backgroundColor: colors.accentSoft },
  cityChipText: { fontFamily: fonts.semibold, fontSize: 13, color: colors.text },
  cityChipTextSelected: { color: colors.accentDark },
  interestHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  editButton: { minHeight: 44, justifyContent: "center" },
  editText: { fontFamily: fonts.semibold, fontSize: 13, color: colors.accentDark },
  interests: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 21, color: colors.textMuted },
  place: { padding: 16, marginBottom: 10, borderRadius: radius.card, backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.surface3 },
  placeName: { fontFamily: fonts.semibold, fontSize: 15, color: colors.text },
  placeCategory: { marginTop: 4, fontFamily: fonts.regular, fontSize: 12, color: colors.textMuted },
  empty: { padding: 18, borderRadius: radius.card, backgroundColor: colors.surface2 },
  emptyTitle: { fontFamily: fonts.semibold, fontSize: 15, color: colors.text },
  muted: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 20, color: colors.textMuted },
  startButton: { marginTop: 16, minHeight: 44, borderRadius: radius.button, alignItems: "center", justifyContent: "center", backgroundColor: colors.accent },
  startButtonText: { fontFamily: fonts.semibold, fontSize: 14, color: colors.onDark },
  demoNotice: { marginTop: 10, fontFamily: fonts.regular, fontSize: 11, lineHeight: 17, color: colors.textMuted },
  error: { marginTop: 12, fontFamily: fonts.semibold, fontSize: 13, color: colors.error },
});
