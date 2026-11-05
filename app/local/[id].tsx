import { fotosLocais } from "../../src/mocks/fotos";
import { Linking, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { SecaoAcessibilidade, SecaoAmbienteSensorial } from "../../src/components/local/SecoesAcessibilidade";
import { Carregando, ErroCarregar, Vazio } from "../../src/components/visual/Estados";
import { TituloPagina } from "../../src/components/visual/TituloPagina";
import { Tela, Botao, Capa, Secao, v } from "../../src/components/visual/Guia";
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
    <View style={s.capa}><Capa local={lugar} grande /></View>
    <Text style={v.legenda}>{rotuloCategoria(lugar.categoria)}</Text><Text accessibilityRole="header" style={v.titulo}>{lugar.nome}</Text>
    <View style={s.linha}><Ionicons name="location-outline" size={18} color={colors.accentDark} /><Text style={[v.descricao, { flex: 1 }]}>{lugar.endereco}</Text></View>
    <View style={s.fatos}>{([
      ["wallet-outline", rotuloPreco(lugar) || "Preço não informado"], ["time-outline", rotuloTempo(lugar)],
    ] as const).map(([icone, texto]) => <View key={icone} style={s.fato}><Ionicons name={icone} size={22} color={colors.accentDark} /><Text style={s.fatoTexto}>{texto}</Text></View>)}</View>
    <View style={[v.bloco, { backgroundColor: colors.paper }]}><Ionicons name="sparkles-outline" size={23} color={colors.accentDark} /><Text style={v.secaoTitulo}>Por que vale conhecer</Text><Text style={[v.descricao, { color: colors.earth }]}>{lugar.porQueConhecer}</Text></View>
    {afinidades.length ? <View style={v.bloco}><Text style={v.secaoTitulo}>Combina com você</Text><View style={v.etiquetas}>{afinidades.map((id) => { const item = INTERESSES.find((interesse) => interesse.id === id); return item ? <View key={id} style={[v.etiqueta, s.etiquetaAfinidade]}><Ionicons name="sparkles" size={13} color={colors.accentDark} /><Text style={[v.etiquetaTexto, s.etiquetaAfinidadeTexto]}>{item.icone}  {item.nome}</Text></View> : null; })}</View></View> : null}
    {lugar.avisoVisitacao ? <View style={v.bloco}><Text style={v.secaoTitulo}>Antes de visitar</Text><Text style={v.descricao}>{lugar.avisoVisitacao}</Text></View> : null}
    <SecaoAcessibilidade acessibilidade={local.acessibilidade} />
    <SecaoAmbienteSensorial ambiente={local.ambienteSensorial} />
    <Secao titulo="Histórias que ficam" /><Text style={s.historia}>{lugar.historia}</Text>
    <View style={v.bloco}><Text style={v.secaoTitulo}>Planeje sua visita</Text><Text style={v.descricao}>{rotuloHorarios(lugar) || "Horários não informados. Consulte a fonte antes de visitar."}</Text><Text style={v.descricao}>{lugar.distancia} · em linha reta</Text><Botao texto="Explorar o mapa" secundario onPress={() => router.push("/(tabs)/mapa")} /></View>
    {lugar.tags.length ? <View style={v.etiquetas}>{lugar.tags.map((tag) => <View key={tag} style={v.etiqueta}><Text style={v.etiquetaTexto}>{tag}</Text></View>)}</View> : null}
    <Text style={[v.descricao, { fontSize: 11 }]}>{rotuloFonte(lugar)}</Text>
    {!lugar.imagemUrl && fotosLocais[lugar.id] ? <Pressable accessibilityRole="link" style={{ minHeight: 44, justifyContent: "center" }} onPress={() => { void Linking.openURL(fotosLocais[lugar.id].pagina); }}><Text style={v.descricao}>Fotografia: {fotosLocais[lugar.id].autor} · {fotosLocais[lugar.id].licenca}. Ver original e licença ↗</Text></Pressable> : null}
  </Tela>;
}
const s = StyleSheet.create({ topo: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, voltar: { width: 46, height: 46, borderRadius: 23, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center" }, capa: { borderRadius: 26, overflow: "hidden" }, linha: { flexDirection: "row", gap: 8, alignItems: "center" }, fatos: { flexDirection: "row", gap: 12 }, fato: { flex: 1, padding: 20, backgroundColor: colors.surface, borderRadius: 22, gap: 10 }, fatoTexto: { fontFamily: fonts.semibold, color: colors.earth, fontSize: 14 }, historia: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 26, color: colors.earth }, etiquetaAfinidade: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: colors.accentSoft }, etiquetaAfinidadeTexto: { color: colors.accentDark } });
