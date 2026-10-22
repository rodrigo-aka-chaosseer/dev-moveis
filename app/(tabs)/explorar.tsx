import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Tela, Cabecalho, CartaoLugar, Estado, v } from "../../src/components/visual/Guia";
import { useLocais } from "../../src/locais/useLocais";
import { ordenarPorProximidade } from "../../src/locais/proximidade";
import { useLocalizacao } from "../../src/localizacao";
import { usePreferencias } from "../../src/preferencias/PreferenciasProvider";
import { CIDADES, INTERESSES, nomeCidade } from "../../src/preferencias/dados";
import { colors, fonts } from "../../src/theme/tokens";

const normalizar = (texto: string) => texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
export default function Explorar() {
  const router = useRouter();
  const { cidadeId, escolherCidade, pronto, erro: erroPreferencias } = usePreferencias();
  const { locais, carregando, erro, recarregar } = useLocais(cidadeId);
  const { coordenadas } = useLocalizacao();
  const [busca, setBusca] = useState("");
  const [categoria, setCategoria] = useState<string | null>(null);
  const ordenados = useMemo(() => cidadeId ? ordenarPorProximidade(locais, cidadeId, coordenadas) : [], [locais, cidadeId, coordenadas]);
  const filtrados = ordenados.filter((local) => (!categoria || local.categoria === categoria || (categoria === "eventos" && local.categoria === "evento")) && normalizar(`${local.nome} ${local.tags.join(" ")} ${local.categoria}`).includes(normalizar(busca.trim())));
  return <Tela>
    <Cabecalho legenda="SIGA SUA CURIOSIDADE" titulo="Encontre seu próximo lugar." descricao="Cultura, encontros e histórias pelo caminho." />
    <View style={v.etiquetas}>{CIDADES.map((cidade) => <Pressable key={cidade.id} accessibilityRole="button" accessibilityState={{ selected: cidadeId === cidade.id }} onPress={() => escolherCidade(cidade.id)} style={[v.etiqueta, cidadeId === cidade.id && v.etiquetaAtiva]}><Text style={[v.etiquetaTexto, cidadeId === cidade.id && { color: colors.onDark }]}>{cidade.nome}, {cidade.uf}</Text></Pressable>)}</View>
    <View style={s.busca}><Ionicons name="search-outline" size={21} color={colors.textMuted} /><TextInput accessibilityLabel="Buscar lugares" placeholder="Busque um lugar ou uma história" placeholderTextColor={colors.textMuted} value={busca} onChangeText={setBusca} style={s.entrada} />{busca ? <Pressable accessibilityRole="button" accessibilityLabel="Limpar busca" onPress={() => setBusca("")} style={s.limpar}><Ionicons name="close" size={20} color={colors.textMuted} /></Pressable> : null}</View>
    <View style={v.etiquetas}><Pressable accessibilityRole="button" accessibilityState={{ selected: !categoria }} onPress={() => setCategoria(null)} style={[v.etiqueta, !categoria && { backgroundColor: colors.accentTint }]}><Text style={v.etiquetaTexto}>Tudo</Text></Pressable>{INTERESSES.map((item) => <Pressable key={item.id} accessibilityRole="button" accessibilityState={{ selected: categoria === item.id }} onPress={() => setCategoria(categoria === item.id ? null : item.id)} style={[v.etiqueta, categoria === item.id && { backgroundColor: colors.accentTint }]}><Text style={v.etiquetaTexto}>{item.icone}  {item.nome}</Text></Pressable>)}</View>
    <View style={v.secao}><Text style={v.secaoTitulo}>{cidadeId ? `Descubra ${nomeCidade(cidadeId)?.split(",")[0]}` : "Por onde vamos?"}</Text><Pressable accessibilityRole="button" onPress={() => router.push("/(tabs)/mapa")} style={v.linkToque}><Text style={v.link}>Ver no mapa ↗</Text></Pressable></View>
    {cidadeId ? <Text style={v.descricao}>{coordenadas ? "Mais perto de você · distâncias em linha reta" : "Distâncias aproximadas pelo centro da cidade"}</Text> : null}
    {!pronto || carregando ? <Estado titulo="Encontrando lugares…" carregando /> : erro ? <><Estado titulo="Não conseguimos carregar" descricao={erro} icone="cloud-offline-outline" /><Pressable accessibilityRole="button" onPress={recarregar} style={v.botao}><Text style={v.botaoTexto}>Tentar novamente</Text></Pressable></> : !cidadeId ? <Estado titulo="Escolha uma cidade" descricao="Selecione seu destino acima e comece a explorar." /> : !locais.length ? <Estado titulo="Novas histórias estão a caminho" descricao={`Ainda não temos lugares em ${nomeCidade(cidadeId)}.`} /> : !filtrados.length ? <Estado titulo="Nenhum lugar por aqui" descricao="Experimente outro termo ou outra categoria." icone="search-outline" /> : filtrados.map((local) => <CartaoLugar key={local.id} local={local} />)}
    {erroPreferencias ? <Text accessibilityRole="alert" style={v.erro}>{erroPreferencias}</Text> : null}
  </Tela>;
}
const s = StyleSheet.create({ busca: { flexDirection: "row", alignItems: "center", backgroundColor: colors.surface, borderRadius: 18, paddingHorizontal: 16, minHeight: 56, gap: 10 }, entrada: { flex: 1, minWidth: 0, minHeight: 56, fontFamily: fonts.regular, fontSize: 13, color: colors.text }, limpar: { minHeight: 44, minWidth: 32, justifyContent: "center", alignItems: "center" } });
