import { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, type Href } from "expo-router";
import { SeletorCidade } from "../../src/components/cidade/SeletorCidade";
import { Carregando, ErroCarregar, Vazio } from "../../src/components/visual/Estados";
import { Tela, Secao, CartaoLugar, v } from "../../src/components/visual/Guia";
import { useSessao } from "../../src/sessao/SessaoProvider";
import { usePreferencias } from "../../src/preferencias/PreferenciasProvider";
import { useLocais } from "../../src/locais/useLocais";
import { useLocalizacao } from "../../src/localizacao";
import { ordenarPorProximidade } from "../../src/locais/proximidade";
import { colors, fonts } from "../../src/theme/tokens";

export default function Inicio() {
  const router = useRouter();
  const { nome, estado } = useSessao();
  const { cidadeId, interesses, onboardingConcluido, pronto, erro: erroPreferencias } = usePreferencias();
  const { locais, carregando, erro, recarregar } = useLocais(cidadeId);
  const { coordenadas } = useLocalizacao();
  const ordenados = useMemo(() => cidadeId ? ordenarPorProximidade(locais, cidadeId, coordenadas) : [], [locais, cidadeId, coordenadas]);
  const afinidades = ordenados.filter((local) => interesses.some((interesse) => interesse === local.categoria || (interesse === "eventos" && local.categoria === "evento")));
  const destaques = afinidades.length ? afinidades : ordenados;
  return <Tela>
    <View style={s.topo}><Text style={s.marca}>Raízes</Text><Pressable accessibilityRole="button" accessibilityLabel="Abrir perfil" onPress={() => router.push("/(tabs)/perfil")} style={s.avatar}><Ionicons name="person-outline" size={21} color={colors.earth} /></Pressable></View>
    <View style={{ gap: 7 }}><Text style={v.legenda}>OLÁ{nome ? `, ${nome.split(" ")[0].toUpperCase()}` : ""}. A CIDADE ESPERA POR VOCÊ.</Text><Text style={s.titulo}>Qual vai ser a sua{"\n"}próxima descoberta?</Text></View>
    <SeletorCidade variante="etiquetas" />
    {estado === "visitante" ? <View style={s.convite}><Ionicons name="person-outline" size={24} color={colors.accentDark} /><View style={{ flex: 1, gap: 5 }}><Text style={v.secaoTitulo}>Explorando como visitante</Text><Text style={v.descricao}>A sessão de visitante termina à meia-noite. Crie uma conta para guardar suas escolhas.</Text></View><Pressable accessibilityRole="button" accessibilityLabel="Criar conta ou entrar" style={s.avatar} onPress={() => router.push("/login")}><Ionicons name="arrow-forward" size={20} color={colors.accentDark} /></Pressable></View> : null}
    <Pressable accessibilityRole="button" accessibilityLabel="Buscar lugares no Explorar" onPress={() => router.push("/(tabs)/explorar")} style={s.busca}><Ionicons name="search-outline" size={21} color={colors.textMuted} /><Text style={[v.descricao, { flex: 1 }]}>Um museu, uma história, um novo lugar…</Text><Ionicons name="arrow-forward" size={19} color={colors.accentDark} /></Pressable>
    <View style={s.atalhos}>{([
      ["compass-outline", "Explorar", "/(tabs)/explorar"], ["map-outline", "No mapa", "/(tabs)/mapa"], ["trail-sign-outline", "Roteiros", "/(tabs)/roteiros"],
    ] as const).map(([icone, rotulo, rota]) => <Pressable key={rotulo} accessibilityRole="button" onPress={() => router.push(rota as Href)} style={s.atalho}><Ionicons name={icone} size={20} color={colors.accentDark} /><Text style={s.rotulo}>{rotulo}</Text></Pressable>)}</View>
    <Secao titulo={afinidades.length ? "Escolhidos para seu olhar" : "Lugares que contam histórias"} acao="Ver todos" onPress={() => router.push("/(tabs)/explorar")} />
    {!pronto || carregando ? <Carregando titulo="Preparando suas descobertas…" /> : erro ? <ErroCarregar mensagem={erro} onTentarDeNovo={recarregar} /> : !cidadeId ? <Vazio icone="location-outline" titulo="Comece por Palmas" mensagem="Selecione Palmas acima para descobrir os lugares do nosso piloto." acao={{ texto: "Personalizar meus interesses", onPress: () => router.push("/onboarding") }} /> : !locais.length ? <Vazio icone="map-outline" titulo="Nenhum lugar cadastrado" mensagem="Ainda não publicamos lugares para o piloto em Palmas." /> : destaques.slice(0, 3).map((local) => <CartaoLugar key={local.id} local={local} />)}
    {coordenadas && ordenados.length ? <><Secao titulo="Pertinho de você" /><CartaoLugar local={ordenados[0]} /></> : null}
    {pronto && !onboardingConcluido ? <View style={s.convite}><Ionicons name="sparkles-outline" size={24} color={colors.accentDark} /><View style={{ flex: 1, gap: 5 }}><Text style={v.secaoTitulo}>{interesses.length ? "Termine suas preferências" : "Mais a sua cara"}</Text><Text style={v.descricao}>{interesses.length ? "Falta confirmar a cidade no primeiro acesso." : "Conte o que você gosta de conhecer."}</Text></View><Pressable accessibilityRole="button" accessibilityLabel={interesses.length ? "Terminar preferências" : "Escolher interesses"} style={s.avatar} onPress={() => router.push("/onboarding")}><Ionicons name="arrow-forward" size={20} color={colors.accentDark} /></Pressable></View> : null}
    {erroPreferencias ? <Text style={v.erro}>{erroPreferencias}</Text> : null}
  </Tela>;
}
const s = StyleSheet.create({ topo: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, marca: { fontFamily: fonts.extrabold, color: colors.earth, fontSize: 35, letterSpacing: -2 }, avatar: { width: 46, height: 46, borderRadius: 23, backgroundColor: colors.paper, justifyContent: "center", alignItems: "center" }, titulo: { fontFamily: fonts.extrabold, color: colors.earth, fontSize: 26, lineHeight: 33, letterSpacing: -0.8 }, busca: { flexDirection: "row", alignItems: "center", gap: 10, padding: 17, borderRadius: 18, backgroundColor: colors.surface }, atalhos: { flexDirection: "row", gap: 10 }, atalho: { flex: 1, flexDirection: "row", gap: 7, alignItems: "center", justifyContent: "center", minHeight: 48, borderRadius: 16, backgroundColor: colors.accentSoft }, rotulo: { fontFamily: fonts.semibold, fontSize: 11, color: colors.earth }, convite: { backgroundColor: colors.paper, borderRadius: 24, padding: 18, gap: 12, flexDirection: "row", alignItems: "center" } });
