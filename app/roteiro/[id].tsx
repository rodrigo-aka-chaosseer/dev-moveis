import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  rotuloCategoria,
  rotuloFonte,
  rotuloHorarios,
  rotuloPreco,
  rotuloTempo,
} from "../../src/locais/listarLocais";
import { useLocal } from "../../src/locais/useLocais";
import { colors, fonts, MIN_TOUCH, radius, spacing } from "../../src/theme/tokens";

export default function DetalheLocal() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { local, carregando, erro } = useLocal(Array.isArray(id) ? id[0] : id);

  if (carregando) {
    return (
      <View style={styles.estado}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  if (erro || !local) {
    return (
      <View style={[styles.estado, { paddingTop: insets.top }]}>
        <Text style={styles.erro}>{erro ?? "Lugar não encontrado."}</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Voltar"
          onPress={() => router.back()}
          style={styles.voltarTexto}
        >
          <Text style={styles.voltarRotulo}>Voltar</Text>
        </Pressable>
      </View>
    );
  }

  const horario = rotuloHorarios(local);
  const preco = rotuloPreco(local);
  const pills = [horario, preco, rotuloTempo(local)].filter(Boolean);

  return (
    <View style={styles.tela}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
      >
        <View style={styles.hero}>
          <Image
            source={{ uri: local.imagemUrl ?? undefined }}
            style={styles.heroFoto}
            contentFit="cover"
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Voltar"
            onPress={() => router.back()}
            style={[styles.voltar, { top: insets.top + 8 }]}
          >
            <Ionicons name="chevron-back" size={22} color={colors.onDark} />
          </Pressable>
        </View>

        <View style={styles.corpo}>
          <View style={styles.meta}>
            <Text style={styles.categoria}>{rotuloCategoria(local.categoria)}</Text>
            <Text style={styles.distancia}>{local.distancia}</Text>
          </View>
          <Text style={styles.nome}>{local.nome}</Text>

          {pills.length > 0 ? (
            <View style={styles.pills}>
              {pills.map((pill) => (
                <Text key={pill} style={styles.pill}>
                  {pill}
                </Text>
              ))}
            </View>
          ) : null}

          <View style={[styles.secao, styles.destaque]}>
            <Text style={styles.secaoTitulo}>Por que conhecer?</Text>
            <Text style={styles.destaqueTexto}>{local.porQueConhecer}</Text>
          </View>

          {local.avisoVisitacao ? (
            <View style={styles.secao}>
              <Text style={styles.secaoTitulo}>Aviso de visitação</Text>
              <Text style={styles.secaoTexto}>{local.avisoVisitacao}</Text>
            </View>
          ) : null}

          <View style={styles.secao}>
            <Text style={styles.secaoTitulo}>História</Text>
            <Text style={styles.secaoTexto}>{local.historia}</Text>
          </View>

          {local.tags.length > 0 ? (
            <View style={styles.secao}>
              <Text style={styles.secaoTitulo}>Diversidade relacionada</Text>
              <View style={styles.tags}>
                {local.tags.map((tag) => (
                  <Text key={tag} style={styles.tagAccent}>
                    {tag}
                  </Text>
                ))}
              </View>
            </View>
          ) : null}

          <View style={styles.fonte}>
            <Text style={styles.fonteTexto}>{rotuloFonte(local)}</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  tela: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  estado: {
    flex: 1,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.pageX,
    gap: spacing.stackMd,
  },
  erro: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.error,
    textAlign: "center",
  },
  voltarTexto: {
    minHeight: MIN_TOUCH,
    justifyContent: "center",
  },
  voltarRotulo: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    color: colors.accent,
  },
  hero: {
    height: 280,
    position: "relative",
    backgroundColor: colors.earth,
  },
  heroFoto: {
    width: "100%",
    height: "100%",
  },
  voltar: {
    position: "absolute",
    left: spacing.pageX,
    width: MIN_TOUCH,
    height: MIN_TOUCH,
    borderRadius: MIN_TOUCH / 2,
    alignItems: "center",
    justifyContent: "center",
  },
  corpo: {
    paddingHorizontal: spacing.pageX,
    paddingTop: 20,
  },
  meta: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  categoria: {
    fontFamily: fonts.semibold,
    fontSize: 12,
    color: colors.accent,
  },
  distancia: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textMuted,
  },
  nome: {
    fontFamily: fonts.extrabold,
    fontSize: 26,
    color: colors.text,
    letterSpacing: -0.4,
    marginBottom: 14,
  },
  pills: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 20,
  },
  pill: {
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.surface3,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    fontFamily: fonts.semibold,
    fontSize: 12,
    color: colors.textMuted,
    overflow: "hidden",
  },
  secao: {
    marginBottom: 24,
  },
  secaoTitulo: {
    fontFamily: fonts.extrabold,
    fontSize: 16,
    color: colors.text,
    marginBottom: 8,
  },
  secaoTexto: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 22,
    color: colors.textMuted,
  },
  destaque: {
    backgroundColor: colors.accentSoft,
    borderRadius: radius.card,
    padding: 16,
    borderLeftWidth: 3,
    borderLeftColor: colors.accent,
  },
  destaqueTexto: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 22,
    color: colors.text,
  },
  tags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  tagAccent: {
    backgroundColor: colors.accentSoft,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    fontFamily: fonts.semibold,
    fontSize: 10,
    color: colors.accentDark,
    overflow: "hidden",
  },
  fonte: {
    backgroundColor: colors.surface2,
    borderRadius: radius.button,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  fonteTexto: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: colors.tabInactive,
  },
});
