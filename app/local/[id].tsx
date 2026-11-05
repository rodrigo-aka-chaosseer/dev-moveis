import { fotosLocais } from "../../src/mocks/fotos";
import { useState } from "react";
import { Linking, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { SecaoAcessibilidade, SecaoAmbienteSensorial } from "../../src/components/local/SecoesAcessibilidade";
import { Carregando, ErroCarregar, Vazio } from "../../src/components/visual/Estados";
import { TituloPagina } from "../../src/components/visual/TituloPagina";
import { Tela, Botao, Capa, v } from "../../src/components/visual/Guia";
import { useLocal } from "../../src/locais/useLocais";
import { rotuloCategoria, rotuloFonte, rotuloHorarios, rotuloPreco, rotuloTempo } from "../../src/locais/listarLocais";
import { ordenarPorProximidade } from "../../src/locais/proximidade";
import { useLocalizacao } from "../../src/localizacao";
import { interessesQueCombinam } from "../../src/preferencias/afinidade";
import { INTERESSES } from "../../src/preferencias/dados";
import { usePreferencias } from "../../src/preferencias/PreferenciasProvider";
import { colors, fonts } from "../../src/theme/tokens";

export default function DetalheLocal() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { local, carregando, erro, recarregar } = useLocal(Array.isArray(id) ? id[0] : id);
  const { coordenadas } = useLocalizacao();
  const { interesses } = usePreferencias();
  const [historiaExpandida, setHistoriaExpandida] = useState(false);
  const voltar = () => { if (router.canGoBack()) router.back(); else router.replace("/(tabs)/explorar"); };
  if (carregando) return <Tela><Carregando titulo="Preparando essa descoberta…" /></Tela>;
  if (erro) return <Tela><ErroCarregar mensagem={erro} onTentarDeNovo={recarregar} secundaria={{ texto: "Voltar a explorar", onPress: voltar }} /></Tela>;
  if (!local) return <Tela><Vazio icone="location-outline" titulo="Lugar indisponível" mensagem="Este lugar não está mais disponível no catálogo." acao={{ texto: "Voltar a explorar", onPress: voltar }} /></Tela>;
  const lugar = ordenarPorProximidade([local], local.cidadeId, coordenadas)[0];
  const afinidades = interessesQueCombinam(lugar, interesses);
  return <Tela>
    <Stack.Screen options={{ title: lugar.nome }} />
    <TituloPagina titulo={lugar.nome} />
    <View style={s.topo}><Pressable accessibilityRole="button" accessibilityLabel="Voltar" onPress={voltar} style={s.voltar}><Ionicons name="arrow-back" size={22} color={colors.earth} /></Pressable><Text style={v.legenda}>UMA NOVA DESCOBERTA</Text><Ionicons name="compass-outline" size={22} color={colors.earth} /></View>
    <Text style={v.legenda}>{rotuloCategoria(lugar.categoria)}</Text><Text accessibilityRole="header" style={v.titulo}>{lugar.nome}</Text>
    <View style={s.fatos}>{([
      ["navigate-outline", lugar.distancia.replace(" (aprox. pelo centro da cidade)", " · aprox.")],
      ["wallet-outline", rotuloPreco(lugar) || "Preço a confirmar"],
      ["time-outline", rotuloTempo(lugar)],
    ] as const).map(([icone, texto]) => <View key={icone} style={s.fato}><Ionicons name={icone} size={22} color={colors.accentDark} /><Text style={s.fatoTexto}>{texto}</Text></View>)}</View>
    <View style={s.capa}><Capa local={lugar} grande /></View>
    <View style={[v.bloco, { backgroundColor: colors.paper }]}>
      <Text accessibilityRole="header" style={v.secaoTitulo}>Sobre</Text>
      <Text style={[v.descricao, { color: colors.earth }]}>{lugar.porQueConhecer}</Text>
      <Text numberOfLines={historiaExpandida ? undefined : 4} style={s.historia}>{lugar.historia}</Text>
      {lugar.historia.length > 180 ? <Pressable accessibilityRole="button" accessibilityState={{ expanded: historiaExpandida }} onPress={() => setHistoriaExpandida((valor) => !valor)} style={v.linkToque}><Text style={v.link}>{historiaExpandida ? "Ler menos" : "Ler mais"}</Text></Pressable> : null}
      {lugar.tags.length ? <View style={v.etiquetas}>{lugar.tags.map((tag) => <View key={tag} style={v.etiqueta}><Text style={v.etiquetaTexto}>{tag}</Text></View>)}</View> : null}
    </View>
    {afinidades.length ? <View style={v.bloco}><Text style={v.secaoTitulo}>Combina com você</Text><View style={v.etiquetas}>{afinidades.map((id) => { const item = INTERESSES.find((interesse) => interesse.id === id); return item ? <View key={id} style={[v.etiqueta, s.etiquetaAfinidade]}><Ionicons name="sparkles" size={13} color={colors.accentDark} /><Text style={[v.etiquetaTexto, s.etiquetaAfinidadeTexto]}>{item.icone}  {item.nome}</Text></View> : null; })}</View></View> : null}
    {lugar.avisoVisitacao ? <View style={v.bloco}><Text style={v.secaoTitulo}>Antes de visitar</Text><Text style={v.descricao}>{lugar.avisoVisitacao}</Text></View> : null}
    <SecaoAcessibilidade acessibilidade={local.acessibilidade} />
    <SecaoAmbienteSensorial ambiente={local.ambienteSensorial} />
    <View style={v.bloco}><Text accessibilityRole="header" style={v.secaoTitulo}>Como chegar</Text><View style={s.linha}><Ionicons name="location-outline" size={18} color={colors.accentDark} /><Text style={[v.descricao, { flex: 1 }]}>{lugar.endereco}</Text></View>{rotuloHorarios(lugar) ? <Text style={v.descricao}>{rotuloHorarios(lugar)}</Text> : null}<Botao texto="Explorar o mapa" secundario onPress={() => router.push("/(tabs)/mapa")} /></View>
    <Text style={[v.descricao, { fontSize: 11 }]}>{rotuloFonte(lugar)}</Text>
    {!lugar.imagemUrl && fotosLocais[lugar.id] ? <Pressable accessibilityRole="link" style={{ minHeight: 44, justifyContent: "center" }} onPress={() => { void Linking.openURL(fotosLocais[lugar.id].pagina); }}><Text style={v.descricao}>Fotografia: {fotosLocais[lugar.id].autor} · {fotosLocais[lugar.id].licenca}. Ver original e licença ↗</Text></Pressable> : null}
  </Tela>;
}
const s = StyleSheet.create({ topo: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, voltar: { width: 46, height: 46, borderRadius: 23, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center" }, capa: { borderRadius: 26, overflow: "hidden" }, linha: { flexDirection: "row", gap: 8, alignItems: "center" }, fatos: { flexDirection: "row", flexWrap: "wrap", gap: 10 }, fato: { flexGrow: 1, flexBasis: 96, minHeight: 92, padding: 16, backgroundColor: colors.surface, borderRadius: 22, gap: 8 }, fatoTexto: { fontFamily: fonts.semibold, color: colors.earth, fontSize: 12, lineHeight: 17 }, historia: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 23, color: colors.earth }, etiquetaAfinidade: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: colors.accentSoft }, etiquetaAfinidadeTexto: { color: colors.accentDark } });
