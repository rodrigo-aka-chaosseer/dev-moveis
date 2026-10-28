import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { useEffect } from "react";
import {
  ActivityIndicator,
  AppState,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useLocalizacao, type EstadoLocalizacao } from "../src/localizacao";
import {
  colors,
  fonts,
  MIN_TOUCH,
  radius,
  spacing,
} from "../src/theme/tokens";

const TEXTOS: Record<
  EstadoLocalizacao,
  { titulo: string; descricao: string }
> = {
  ocioso: {
    titulo: "Descubra o que está perto de você",
    descricao:
      "Com sua localização, o Raízes poderá destacar lugares culturais próximos. Você pode mudar essa permissão depois.",
  },
  carregando: {
    titulo: "Buscando sua localização…",
    descricao:
      "Isso pode levar alguns segundos. Mantenha a localização do aparelho ativada.",
  },
  disponivel: {
    titulo: "Localização encontrada",
    descricao:
      "Tudo certo. Sua posição já está disponível para as próximas experiências do aplicativo.",
  },
  permissao_negada: {
    titulo: "Tudo bem, você decide",
    descricao:
      "A localização não foi autorizada. Você pode tentar novamente ou continuar usando o Raízes sem ela.",
  },
  servico_desativado: {
    titulo: "Ative a localização do aparelho",
    descricao:
      "O acesso foi autorizado, mas o GPS está desligado. Ative-o nas configurações rápidas e tente novamente.",
  },
  erro: {
    titulo: "Não conseguimos obter sua localização",
    descricao:
      "Pode ter sido uma instabilidade ou falta de sinal. Tente novamente em alguns instantes.",
  },
};

export default function Localizacao() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    estado,
    coordenadas,
    podePerguntarNovamente,
    solicitar,
  } = useLocalizacao();
  const carregando = estado === "carregando";
  const disponivel = estado === "disponivel";
  const permissaoBloqueada =
    estado === "permissao_negada" && !podePerguntarNovamente;
  const texto = TEXTOS[estado];

  useEffect(() => {
    if (!permissaoBloqueada) return;

    const assinatura = AppState.addEventListener("change", (proximoEstado) => {
      if (proximoEstado === "active") {
        solicitar();
      }
    });
    return () => assinatura.remove();
  }, [permissaoBloqueada, solicitar]);

  function entrarNoApp() {
    router.replace("/(tabs)/explorar");
  }

  async function acaoPrincipal() {
    if (disponivel) {
      entrarNoApp();
      return;
    }
    if (permissaoBloqueada) {
      await Linking.openSettings().catch(() => {});
      return;
    }
    await solicitar();
  }

  const rotuloBotao = disponivel
    ? "Explorar agora"
    : carregando
      ? "Obtendo localização…"
      : permissaoBloqueada
        ? "Abrir configurações"
        : estado === "ocioso"
          ? "Usar minha localização"
          : "Tentar novamente";

  return (
    <View
      style={[
        styles.tela,
        {
          paddingTop: Math.max(insets.top, 20),
          paddingBottom: Math.max(insets.bottom, 16),
        },
      ]}
    >
      <StatusBar style="dark" />
      <View style={styles.topo}>
        <Text style={styles.etapa}>QUASE PRONTO</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Continuar sem compartilhar localização"
          onPress={entrarNoApp}
          hitSlop={8}
        >
          <Text style={styles.pular}>Agora não</Text>
        </Pressable>
      </View>

      <View style={styles.conteudo}>
        <View
          accessible
          accessibilityLabel={
            carregando ? "Obtendo localização" : "Ícone de localização"
          }
          style={[styles.icone, disponivel && styles.iconeSucesso]}
        >
          {carregando ? (
            <ActivityIndicator color={colors.accent} size="large" />
          ) : (
            <Ionicons
              name={disponivel ? "checkmark" : "location-outline"}
              size={42}
              color={disponivel ? colors.onDark : colors.accent}
            />
          )}
        </View>

        <Text accessibilityLiveRegion="polite" style={styles.titulo}>
          {texto.titulo}
        </Text>
        <Text style={styles.descricao}>{texto.descricao}</Text>

        {coordenadas ? (
          <View accessibilityLiveRegion="polite" style={styles.coordenadas}>
            <Text style={styles.coordenadasTitulo}>POSIÇÃO ATUAL</Text>
            <Text style={styles.coordenadasTexto}>
              {coordenadas.latitude.toFixed(5)},{" "}
              {coordenadas.longitude.toFixed(5)}
            </Text>
          </View>
        ) : null}

        {permissaoBloqueada ? (
          <Text style={styles.ajuda}>
            Nas configurações, permita o acesso à localização enquanto o app
            estiver em uso. Depois, volte e toque em “Tentar novamente”.
          </Text>
        ) : null}
      </View>

      <View style={styles.acoes}>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: carregando }}
          disabled={carregando}
          onPress={acaoPrincipal}
          style={({ pressed }) => [
            styles.botao,
            carregando && styles.botaoDesabilitado,
            pressed && styles.botaoPressionado,
          ]}
        >
          {carregando ? (
            <ActivityIndicator color={colors.onDark} size="small" />
          ) : null}
          <Text style={styles.botaoTexto}>{rotuloBotao}</Text>
        </Pressable>
        {!disponivel ? (
          <Pressable
            accessibilityRole="button"
            onPress={entrarNoApp}
            style={styles.secundario}
          >
            <Text style={styles.secundarioTexto}>Continuar sem localização</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tela: {
    flex: 1,
    paddingHorizontal: spacing.pageX,
    backgroundColor: colors.surface2,
  },
  topo: {
    minHeight: MIN_TOUCH,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  etapa: {
    fontFamily: fonts.semibold,
    fontSize: 11,
    letterSpacing: 1.2,
    color: colors.accent,
  },
  pular: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    color: colors.textMuted,
  },
  conteudo: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 24,
  },
  icone: {
    width: 92,
    height: 92,
    marginBottom: 28,
    borderRadius: 46,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.accentSoft,
    borderWidth: 1,
    borderColor: colors.accentTint,
  },
  iconeSucesso: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  titulo: {
    maxWidth: 330,
    textAlign: "center",
    fontFamily: fonts.extrabold,
    fontSize: 27,
    lineHeight: 34,
    color: colors.text,
  },
  descricao: {
    maxWidth: 340,
    marginTop: 12,
    textAlign: "center",
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 22,
    color: colors.textMuted,
  },
  coordenadas: {
    width: "100%",
    marginTop: 24,
    padding: 16,
    alignItems: "center",
    borderRadius: radius.card,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.surface3,
  },
  coordenadasTitulo: {
    fontFamily: fonts.semibold,
    fontSize: 10,
    letterSpacing: 1,
    color: colors.textMuted,
  },
  coordenadasTexto: {
    marginTop: 6,
    fontFamily: fonts.semibold,
    fontSize: 15,
    color: colors.text,
  },
  ajuda: {
    marginTop: 18,
    textAlign: "center",
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 19,
    color: colors.textMuted,
  },
  acoes: {
    gap: 8,
  },
  botao: {
    minHeight: 52,
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.button,
    backgroundColor: colors.accent,
  },
  botaoDesabilitado: {
    opacity: 0.7,
  },
  botaoPressionado: {
    opacity: 0.85,
    transform: [{ scale: 0.99 }],
  },
  botaoTexto: {
    fontFamily: fonts.semibold,
    fontSize: 16,
    color: colors.onDark,
  },
  secundario: {
    minHeight: MIN_TOUCH,
    alignItems: "center",
    justifyContent: "center",
  },
  secundarioTexto: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    color: colors.textMuted,
  },
});
