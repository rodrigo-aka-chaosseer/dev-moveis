import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Image } from "expo-image";
import { StatusBar } from "expo-status-bar";
import { useRouter, type Href } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { linhaResumo } from "../../src/locais/listarLocais";
import { useLocais } from "../../src/locais/useLocais";
import type { LocalLista } from "../../src/mocks/locais";
import { usePreferencias } from "../../src/preferencias/PreferenciasProvider";
import { CIDADES, INTERESSES, nomeCidade } from "../../src/preferencias/dados";
import { colors, fonts, MIN_TOUCH, radius, spacing } from "../../src/theme/tokens";

export default function Explorar() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { cidadeId, interesses, pronto, erro: erroPreferencias, escolherCidade } =
    usePreferencias();
  const { locais, carregando, erro } = useLocais(cidadeId);
  const nomesInteresses = INTERESSES.filter((item) => interesses.includes(item.id)).map(
    (item) => item.nome,
  );

  return (
    <View style={styles.tela}>
      <StatusBar style="dark" />
      <View style={[styles.topo, { paddingTop: Math.max(insets.top, 16) }]}>
        <Text style={styles.titulo}>Explorar</Text>
      </View>

      {!pronto ? (
        <View style={styles.estado}>
          <ActivityIndicator color={colors.accent} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[
            styles.lista,
            { paddingBottom: 24 + insets.bottom },
          ]}
        >
          <Text style={styles.secao}>Cidade de destino</Text>
          <View style={styles.cidades}>
            {CIDADES.map((cidade) => {
              const selecionada = cidadeId === cidade.id;
              return (
                <Pressable
                  key={cidade.id}
                  accessibilityRole="button"
                  accessibilityLabel={`${cidade.nome}, ${cidade.uf}`}
                  accessibilityState={{ selected: selecionada }}
                  onPress={() => escolherCidade(cidade.id)}
                  style={[styles.cidade, selecionada && styles.cidadeAtiva]}
                >
                  <Text style={[styles.cidadeTexto, selecionada && styles.cidadeTextoAtivo]}>
                    {cidade.nome}, {cidade.uf}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.interessesTopo}>
            <Text style={styles.secao}>Seus interesses</Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push("/onboarding")}
              style={styles.editar}
            >
              <Text style={styles.editarTexto}>Editar escolhas</Text>
            </Pressable>
          </View>
          <Text style={styles.interesses}>
            {nomesInteresses.length
              ? nomesInteresses.join(" · ")
              : "Nenhum interesse selecionado ainda."}
          </Text>

          <Text style={styles.secao}>
            Destaques culturais{nomeCidade(cidadeId) ? ` em ${nomeCidade(cidadeId)}` : ""}
          </Text>

          {!cidadeId ? (
            <Text style={styles.vazio}>Escolha uma cidade para começar.</Text>
          ) : carregando ? (
            <ActivityIndicator color={colors.accent} />
          ) : erro ? (
            <Text style={styles.erro}>{erro}</Text>
          ) : locais.length === 0 ? (
            <Text style={styles.vazio}>
              Ainda não temos lugares em {nomeCidade(cidadeId)}.
            </Text>
          ) : (
            locais.map((local) => <CartaoLocal key={local.id} local={local} />)
          )}

          {erroPreferencias ? (
            <Text accessibilityLiveRegion="polite" style={styles.erro}>
              {erroPreferencias}
            </Text>
          ) : null}
        </ScrollView>
      )}
    </View>
  );
}

function CartaoLocal({ local }: { local: LocalLista }) {
  const router = useRouter();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={local.nome}
      onPress={() => router.push(`/roteiro/${local.id}` as Href)}
      style={({ pressed }) => [styles.item, pressed && styles.itemPressionado]}
    >
      <Image
        source={{ uri: local.imagemUrl ?? undefined }}
        style={styles.foto}
        contentFit="cover"
      />
      <View style={styles.itemTexto}>
        <Text style={styles.itemTitulo}>{local.nome}</Text>
        <Text style={styles.itemResumo}>{linhaResumo(local)}</Text>
        <View style={styles.tags}>
          {local.tags.map((tag) => (
            <Text key={tag} style={styles.tag}>
              {tag}
            </Text>
          ))}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tela: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  topo: {
    paddingHorizontal: spacing.pageX,
    paddingBottom: spacing.stackLg,
    borderBottomWidth: 1,
    borderBottomColor: colors.surface3,
    backgroundColor: colors.surface,
  },
  titulo: {
    fontFamily: fonts.extrabold,
    fontSize: 22,
    color: colors.text,
  },
  secao: {
    fontFamily: fonts.extrabold,
    fontSize: 16,
    color: colors.text,
    marginBottom: 10,
  },
  lista: {
    paddingHorizontal: spacing.pageX,
    paddingTop: 16,
    gap: 16,
  },
  cidades: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 9,
  },
  cidade: {
    minHeight: MIN_TOUCH,
    justifyContent: "center",
    paddingHorizontal: 16,
    borderWidth: 1.5,
    borderColor: colors.surface3,
    borderRadius: radius.button,
    backgroundColor: colors.surface2,
  },
  cidadeAtiva: {
    borderColor: colors.accent,
    backgroundColor: colors.accentSoft,
  },
  cidadeTexto: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    color: colors.text,
  },
  cidadeTextoAtivo: {
    color: colors.accentDark,
  },
  interessesTopo: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  editar: {
    minHeight: MIN_TOUCH,
    justifyContent: "center",
  },
  editarTexto: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    color: colors.accentDark,
  },
  interesses: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 21,
    color: colors.textMuted,
    marginTop: -8,
  },
  item: {
    flexDirection: "row",
    gap: 14,
    minHeight: MIN_TOUCH,
  },
  itemPressionado: {
    opacity: 0.7,
  },
  foto: {
    width: 88,
    height: 88,
    borderRadius: radius.card,
    backgroundColor: colors.surface3,
  },
  itemTexto: {
    flex: 1,
    justifyContent: "center",
  },
  itemTitulo: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    color: colors.text,
    marginBottom: 4,
  },
  itemResumo: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 6,
  },
  tags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  tag: {
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.surface3,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    fontFamily: fonts.semibold,
    fontSize: 10,
    color: colors.textMuted,
    overflow: "hidden",
  },
  estado: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.pageX,
  },
  erro: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.error,
    textAlign: "center",
  },
  vazio: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.textMuted,
  },
});
