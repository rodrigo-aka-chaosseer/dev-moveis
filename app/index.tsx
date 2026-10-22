import { useState } from "react";
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSessao } from "../src/sessao/SessaoProvider";
import { Botao, v } from "../src/components/visual/Guia";
import { colors, fonts } from "../src/theme/tokens";
import foto from "../assets/images/cidade-abertura.creditos.json";

export default function Abertura() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { entrarComoVisitante } = useSessao();
  const [entrando, setEntrando] = useState(false);
  async function explorar() {
    setEntrando(true);
    await entrarComoVisitante();
    router.replace("/(tabs)");
  }
  return <ScrollView style={s.tela} contentContainerStyle={s.conteudo} bounces={false}>
    <StatusBar style="light" />
    <View style={s.fundo}>
      <Image source={require("../assets/images/cidade-abertura.jpg")} style={StyleSheet.absoluteFill} contentFit="cover" contentPosition="center" accessible={false} />
      <View pointerEvents="none" style={[StyleSheet.absoluteFill, s.veu]} />
      <LinearGradient colors={["rgba(28,25,23,0.12)", "rgba(28,25,23,0.65)"]} style={StyleSheet.absoluteFill} pointerEvents="none" />
      <View style={[s.marcaBloco, { paddingTop: insets.top + 28 }]}>
        <Text accessibilityRole="header" style={s.marca}>Raízes</Text>
        <View style={s.selo}><Text style={s.seloTexto}>CULTURA QUE CONECTA</Text></View>
      </View>
      <Pressable accessibilityRole="link" accessibilityLabel="Créditos da fotografia do Pelourinho" onPress={() => { void Linking.openURL(foto.pagina); }} style={s.creditoToque}>
        <Text style={s.credito}>Pelourinho · {foto.autor} · {foto.licenca}</Text>
      </Pressable>
    </View>
    <View style={[s.folha, { paddingBottom: insets.bottom + 24 }]}>
      <Text style={v.legenda}>DESCUBRA. SINTA. PERTENÇA.</Text>
      <Text style={s.titulo}>Um novo olhar para cada lugar.</Text>
      <Text style={s.descricao}>Conheça as histórias, as pessoas e a cultura que fazem uma cidade ser única.</Text>
      <Botao texto={entrando ? "Preparando seu caminho…" : "Explorar sem conta"} disabled={entrando} onPress={explorar} />
      <Botao texto="Entrar ou criar conta" secundario onPress={() => router.push("/login")} />
    </View>
  </ScrollView>;
}
const s = StyleSheet.create({
  tela: { flex: 1, backgroundColor: colors.paper },
  conteudo: { flexGrow: 1 },
  fundo: { flex: 1, minHeight: 320, backgroundColor: colors.earth },
  veu: { backgroundColor: "rgba(28,25,23,0.42)" },
  marcaBloco: { paddingHorizontal: 28, paddingBottom: 70, gap: 6 },
  marca: { fontFamily: fonts.extrabold, fontSize: 58, lineHeight: 70, letterSpacing: -2.5, color: colors.onDark },
  selo: { alignSelf: "flex-start", paddingHorizontal: 12, paddingVertical: 7, backgroundColor: colors.onDarkSoft, borderRadius: 20 },
  seloTexto: { fontFamily: fonts.semibold, fontSize: 9, letterSpacing: 1.2, color: colors.earth },
  creditoToque: { position: "absolute", bottom: 30, right: 16, minHeight: 44, justifyContent: "center" },
  credito: { fontSize: 8, color: colors.onDarkMuted },
  folha: { backgroundColor: colors.paper, marginTop: -28, borderTopLeftRadius: 30, borderTopRightRadius: 30, paddingTop: 26, paddingHorizontal: 28, gap: 16 },
  titulo: { fontFamily: fonts.extrabold, fontSize: 32, lineHeight: 38, letterSpacing: -1.2, color: colors.text },
  descricao: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 22, color: colors.textMuted },
});
