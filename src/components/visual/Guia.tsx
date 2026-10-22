import type { ComponentProps, ReactNode } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, type Href } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { fotosLocais } from "../../mocks/fotos";
import type { LocalLista } from "../../mocks/locais";
import { rotuloCategoria, rotuloPreco } from "../../locais/listarLocais";
import { colors, fonts } from "../../theme/tokens";

type Icone = ComponentProps<typeof Ionicons>["name"];
export const iconesCategoria: Record<string, Icone> = {
  cultura: "sparkles-outline", historia: "library-outline", patrimonio: "business-outline",
  gastronomia: "restaurant-outline", musica: "musical-notes-outline", arte: "color-palette-outline",
  religiao: "sunny-outline", comunidade: "people-outline", natureza: "leaf-outline", evento: "calendar-outline",
};
export function Tela({ children, fundo }: { children: ReactNode; fundo?: string }) {
  const insets = useSafeAreaInsets();
  return <><StatusBar style="dark" /><ScrollView style={[v.tela, fundo ? { backgroundColor: fundo } : undefined]} showsVerticalScrollIndicator={false}
    contentContainerStyle={[v.conteudo, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 32 }]}>{children}</ScrollView></>;
}
export function Cabecalho({ legenda, titulo, descricao }: { legenda: string; titulo: string; descricao?: string }) {
  return <View style={v.cabecalho}><Text style={v.legenda}>{legenda}</Text><Text accessibilityRole="header" style={v.titulo}>{titulo}</Text>{descricao ? <Text style={v.descricao}>{descricao}</Text> : null}</View>;
}
export function Botao({ texto, onPress, secundario = false, disabled = false }: { texto: string; onPress: () => void; secundario?: boolean; disabled?: boolean }) {
  return <Pressable accessibilityRole="button" disabled={disabled} accessibilityState={{ disabled }} onPress={onPress}
    style={({ pressed }) => [v.botao, secundario && v.botaoSuave, (pressed || disabled) && { opacity: 0.65 }]}>
    <Text style={[v.botaoTexto, secundario && { color: colors.accentDark }]}>{texto}</Text><Ionicons name="arrow-forward" size={18} color={secundario ? colors.accentDark : colors.onDark} /></Pressable>;
}
export function Secao({ titulo, acao, onPress }: { titulo: string; acao?: string; onPress?: () => void }) {
  return <View style={v.secao}><Text accessibilityRole="header" style={v.secaoTitulo}>{titulo}</Text>{acao ? <Pressable accessibilityRole="button" onPress={onPress} style={v.linkToque}><Text style={v.link}>{acao}</Text></Pressable> : null}</View>;
}
export function Estado({ titulo, descricao, icone = "compass-outline", carregando = false }: { titulo: string; descricao?: string; icone?: Icone; carregando?: boolean }) {
  return <View accessibilityLiveRegion="polite" style={v.estado}>{carregando ? <ActivityIndicator accessibilityLabel={titulo} color={colors.accent} /> : <View style={v.disco}><Ionicons name={icone} size={28} color={colors.accentDark} /></View>}<Text style={v.secaoTitulo}>{titulo}</Text>{descricao ? <Text style={[v.descricao, { textAlign: "center" }]}>{descricao}</Text> : null}</View>;
}
export function Capa({ local, grande = false }: { local: LocalLista; grande?: boolean }) {
  const foto = fotosLocais[local.id];
  const source = local.imagemUrl ? { uri: local.imagemUrl } : foto?.source;
  return <View style={[v.capa, grande && { height: 240 }]}>
    {source ? <Image source={source} accessibilityLabel={`Foto de ${local.nome}`} style={StyleSheet.absoluteFill} contentFit="cover" transition={180} /> : <View accessible={false} style={v.ilustracao}>
      <View style={v.orbita} /><View style={v.sol} /><Ionicons name={iconesCategoria[local.categoria] ?? "compass-outline"} size={grande ? 80 : 60} color={colors.earth} />
    </View>}
    {!local.imagemUrl && foto ? <Text style={v.credito}>{foto.autor} · {foto.licenca}</Text> : null}
    <View style={v.categoria}><Text style={v.categoriaTexto}>{rotuloCategoria(local.categoria)}</Text></View>
  </View>;
}
export function CartaoLugar({ local }: { local: LocalLista }) {
  const router = useRouter();
  return <Pressable accessibilityRole="button" accessibilityLabel={`Conhecer ${local.nome}`} onPress={() => router.push(`/roteiro/${local.id}` as Href)} style={({ pressed }) => [v.cartao, pressed && { opacity: 0.8 }]}>
    <Capa local={local} /><View style={v.cartaoCorpo}><Text style={v.cartaoTitulo}>{local.nome}</Text><Text numberOfLines={2} style={v.descricao}>{local.porQueConhecer}</Text>
      <View style={v.meta}><Ionicons name="location-outline" size={14} color={colors.accentDark} /><Text style={v.metaTexto}>{local.distancia.replace(" (aprox. pelo centro da cidade)", " · aprox.")}</Text><Text style={v.preco}>{rotuloPreco(local) || `~${local.tempoMedioMin} min`}</Text></View>
    </View></Pressable>;
}
export const v = StyleSheet.create({
  tela: { flex: 1, backgroundColor: colors.surface2 }, conteudo: { paddingHorizontal: 24, gap: 18 },
  cabecalho: { gap: 8, marginBottom: 4 }, legenda: { fontFamily: fonts.semibold, color: colors.accentDark, fontSize: 10, letterSpacing: 2, textTransform: "uppercase" },
  titulo: { fontFamily: fonts.extrabold, color: colors.text, fontSize: 32, letterSpacing: -1.2, lineHeight: 39 },
  descricao: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 21, color: colors.textMuted },
  botao: { minHeight: 52, backgroundColor: colors.accent, borderRadius: 18, paddingHorizontal: 20, paddingVertical: 14, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  botaoSuave: { backgroundColor: colors.accentTint }, botaoTexto: { flexShrink: 1, fontFamily: fonts.semibold, color: colors.onDark, fontSize: 14 },
  secao: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8, marginTop: 8 }, secaoTitulo: { fontFamily: fonts.semibold, color: colors.text, fontSize: 19, letterSpacing: -0.5 },
  linkToque: { minHeight: 44, justifyContent: "center" }, link: { fontFamily: fonts.semibold, color: colors.accentDark, fontSize: 12 },
  estado: { padding: 24, alignItems: "center", gap: 12, backgroundColor: colors.surface, borderRadius: 24 }, disco: { width: 64, height: 64, borderRadius: 32, alignItems: "center", justifyContent: "center", backgroundColor: colors.accentTint },
  cartao: { backgroundColor: colors.surface, borderRadius: 24, overflow: "hidden", marginBottom: 2 }, cartaoCorpo: { padding: 18, gap: 10 }, cartaoTitulo: { fontFamily: fonts.semibold, color: colors.text, fontSize: 19, letterSpacing: -0.5 },
  capa: { height: 160, backgroundColor: colors.paper, overflow: "hidden" }, ilustracao: { flex: 1, alignItems: "center", justifyContent: "center" },
  orbita: { position: "absolute", width: 230, height: 230, borderWidth: 1, borderColor: colors.stampEmpty, borderRadius: 115, transform: [{ translateX: 90 }, { translateY: 45 }] },
  sol: { position: "absolute", width: 110, height: 110, borderRadius: 55, backgroundColor: colors.accentTint, transform: [{ translateX: -50 }, { translateY: -30 }] },
  credito: { position: "absolute", right: 8, bottom: 6, maxWidth: "90%", color: colors.onDark, backgroundColor: "rgba(28,25,23,0.65)", borderRadius: 4, paddingHorizontal: 5, paddingVertical: 2, fontSize: 8 },
  categoria: { position: "absolute", left: 16, top: 16, backgroundColor: colors.surface, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 7 }, categoriaTexto: { color: colors.earth, fontSize: 10, fontFamily: fonts.semibold },
  meta: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 2 }, metaTexto: { flex: 1, fontSize: 11, color: colors.textMuted, fontFamily: fonts.regular }, preco: { color: colors.accentDark, fontSize: 11, fontFamily: fonts.semibold },
  bloco: { backgroundColor: colors.surface, padding: 20, borderRadius: 24, gap: 14 }, etiquetas: { flexDirection: "row", flexWrap: "wrap", gap: 8 }, etiqueta: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 24, backgroundColor: colors.surface },
  etiquetaAtiva: { backgroundColor: colors.earth }, etiquetaTexto: { fontFamily: fonts.semibold, fontSize: 12, color: colors.earth }, erro: { color: colors.error, fontSize: 13, lineHeight: 20 },
});
