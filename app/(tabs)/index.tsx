import { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, type Href } from "expo-router";
import { Tela, Botao, Secao, CartaoLugar, Estado, v } from "../../src/components/visual/Guia";
import { useSessao } from "../../src/sessao/SessaoProvider";
import { usePreferencias } from "../../src/preferencias/PreferenciasProvider";
import { CIDADES } from "../../src/preferencias/dados";
import { useLocais } from "../../src/locais/useLocais";
import { useLocalizacao } from "../../src/localizacao";
import { ordenarPorProximidade } from "../../src/locais/proximidade";
import { colors, fonts } from "../../src/theme/tokens";

export default function Inicio() {
  const router = useRouter();
  const { nome } = useSessao();
  const { cidadeId, escolherCidade, interesses, pronto, erro: erroPreferencias } = usePreferencias();
  const { locais, carregando, erro, recarregar } = useLocais(cidadeId);
  const { coordenadas } = useLocalizacao();
  const ordenados = useMemo(() => cidadeId ? ordenarPorProximidade(locais, cidadeId, coordenadas) : [], [locais, cidadeId, coordenadas]);
  const afinidades = ordenados.filter((local) => interesses.some((interesse) => interesse === local.categoria || (interesse === "eventos" && local.categoria === "evento")));
  const destaques = afinidades.length ? afinidades : ordenados;
  return <Tela>
    <View style={s.topo}><Text style={s.marca}>Raízes</Text><Pressable accessibilityRole="button" accessibilityLabel="Abrir perfil" onPress={() => router.push("/(tabs)/perfil")} style={s.avatar}><Ionicons name="person-outline" size={21} color={colors.earth} /></Pressable></View>
    <View style={{ gap: 7 }}><Text style={v.legenda}>OLÁ{nome ? `, ${nome.split(" ")[0].toUpperCase()}` : ""}. A CIDADE ESPERA POR VOCÊ.</Text><Text style={s.titulo}>Qual vai ser a sua{"\n"}próxima descoberta?</Text></View>
    <View style={v.etiquetas}>{CIDADES.map((cidade) => <Pressable key={cidade.id} accessibilityRole="button" accessibilityState={{ selected: cidadeId === cidade.id }} onPress={() => escolherCidade(cidade.id)} style={[s.cidade, cidadeId === cidade.id && s.cidadeAtiva]}><Ionicons name="location-outline" size={15} color={cidadeId === cidade.id ? colors.onDark : colors.earth} /><Text style={[v.etiquetaTexto, cidadeId === cidade.id && { color: colors.onDark }]}>{cidade.nome}</Text></Pressable>)}</View>
    <Pressable accessibilityRole="button" accessibilityLabel="Buscar lugares no Explorar" onPress={() => router.push("/(tabs)/explorar")} style={s.busca}><Ionicons name="search-outline" size={21} color={colors.textMuted} /><Text style={[v.descricao, { flex: 1 }]}>Um museu, uma história, um novo lugar…</Text><Ionicons name="arrow-forward" size={19} color={colors.accentDark} /></Pressable>
    <View style={s.atalhos}>{([
      ["compass-outline", "Explorar", "/(tabs)/explorar"], ["map-outline", "No mapa", "/(tabs)/mapa"], ["trail-sign-outline", "Roteiros", "/(tabs)/roteiros"],
    ] as const).map(([icone, rotulo, rota]) => <Pressable key={rotulo} accessibilityRole="button" onPress={() => router.push(rota as Href)} style={s.atalho}><Ionicons name={icone} size={20} color={colors.accentDark} /><Text style={s.rotulo}>{rotulo}</Text></Pressable>)}</View>
    <Secao titulo={afinidades.length ? "Escolhidos para seu olhar" : "Lugares que contam histórias"} acao="Ver todos" onPress={() => router.push("/(tabs)/explorar")} />
    {!pronto || carregando ? <Estado titulo="Preparando suas descobertas…" carregando /> : erro ? <><Estado titulo="Não conseguimos carregar" descricao={erro} /><Botao texto="Tentar novamente" onPress={recarregar} secundario /></> : !cidadeId ? <><Estado titulo="Escolha por onde começar" descricao="Selecione Salvador ou Recife acima para descobrir os lugares da cidade." /><Botao texto="Personalizar meus interesses" onPress={() => router.push("/onboarding")} secundario /></> : !locais.length ? <Estado titulo="Mais histórias em breve" descricao="Ainda não temos lugares nesta cidade. Experimente outro destino." /> : destaques.slice(0, 3).map((local) => <CartaoLugar key={local.id} local={local} />)}
    {coordenadas && ordenados.length ? <><Secao titulo="Pertinho de você" /><CartaoLugar local={ordenados[0]} /></> : null}
    <View style={s.convite}><Ionicons name="sparkles-outline" size={24} color={colors.accentDark} /><View style={{ flex: 1, gap: 5 }}><Text style={v.secaoTitulo}>Mais a sua cara</Text><Text style={v.descricao}>Conte o que você gosta de conhecer.</Text></View><Pressable accessibilityRole="button" accessibilityLabel="Escolher interesses" style={s.avatar} onPress={() => router.push("/onboarding")}><Ionicons name="arrow-forward" size={20} color={colors.accentDark} /></Pressable></View>
    {erroPreferencias ? <Text style={v.erro}>{erroPreferencias}</Text> : null}
  </Tela>;
}
const s = StyleSheet.create({ topo: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, marca: { fontFamily: fonts.extrabold, color: colors.earth, fontSize: 35, letterSpacing: -2 }, avatar: { width: 46, height: 46, borderRadius: 23, backgroundColor: colors.paper, justifyContent: "center", alignItems: "center" }, titulo: { fontFamily: fonts.extrabold, color: colors.earth, fontSize: 26, lineHeight: 33, letterSpacing: -0.8 }, cidade: { flexDirection: "row", alignItems: "center", gap: 6, minHeight: 44, paddingHorizontal: 16, borderRadius: 24, backgroundColor: colors.surface }, cidadeAtiva: { backgroundColor: colors.earth }, busca: { flexDirection: "row", alignItems: "center", gap: 10, padding: 17, borderRadius: 18, backgroundColor: colors.surface }, atalhos: { flexDirection: "row", gap: 10 }, atalho: { flex: 1, flexDirection: "row", gap: 7, alignItems: "center", justifyContent: "center", minHeight: 48, borderRadius: 16, backgroundColor: colors.accentSoft }, rotulo: { fontFamily: fonts.semibold, fontSize: 11, color: colors.earth }, convite: { backgroundColor: colors.paper, borderRadius: 24, padding: 18, gap: 12, flexDirection: "row", alignItems: "center" } });
