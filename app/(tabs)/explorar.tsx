import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { SeletorCidade } from "../../src/components/cidade/SeletorCidade";
import { Carregando, ErroCarregar, Vazio } from "../../src/components/visual/Estados";
import { Tela, Cabecalho, CartaoLugar, v } from "../../src/components/visual/Guia";
import {
  descreverFiltros,
  filtrarExplorar,
  SEM_FILTROS,
  temFiltro,
  type FiltrosExplorar,
} from "../../src/explorar/filtros";
import { useLocais } from "../../src/locais/useLocais";
import { ordenarPorProximidade } from "../../src/locais/proximidade";
import { useLocalizacao } from "../../src/localizacao";
import { usePreferencias } from "../../src/preferencias/PreferenciasProvider";
import { CIDADES, INTERESSES, nomeCidade } from "../../src/preferencias/dados";
import { colors, fonts } from "../../src/theme/tokens";

export default function Explorar() {
  const router = useRouter();
  const { cidadeId, escolherCidade, pronto, erro: erroPreferencias } = usePreferencias();
  const { locais, carregando, erro, recarregar } = useLocais(cidadeId);
  const { coordenadas } = useLocalizacao();
  const [filtros, setFiltros] = useState<FiltrosExplorar>(SEM_FILTROS);

  const ordenados = useMemo(() => cidadeId ? ordenarPorProximidade(locais, cidadeId, coordenadas) : [], [locais, cidadeId, coordenadas]);
  const filtrados = filtrarExplorar(ordenados, filtros);
  const cidade = nomeCidade(cidadeId);
  const filtrando = temFiltro(filtros);
  const descricaoFiltros = descreverFiltros(filtros);
  const outraCidade = CIDADES.find((item) => item.id !== cidadeId);
  const limpar = () => setFiltros(SEM_FILTROS);

  return <Tela>
    <Cabecalho legenda="SIGA SUA CURIOSIDADE" titulo="Encontre seu próximo lugar." descricao="Cultura, encontros e histórias pelo caminho." />
    <SeletorCidade variante="etiquetas" />
    <View style={s.busca}><Ionicons name="search-outline" size={21} color={colors.textMuted} /><TextInput accessibilityLabel="Buscar lugares" placeholder="Busque um lugar ou uma história" placeholderTextColor={colors.textMuted} value={filtros.busca} onChangeText={(busca) => setFiltros((atual) => ({ ...atual, busca }))} style={s.entrada} />{filtros.busca ? <Pressable accessibilityRole="button" accessibilityLabel="Limpar busca" onPress={() => setFiltros((atual) => ({ ...atual, busca: "" }))} style={s.limpar}><Ionicons name="close" size={20} color={colors.textMuted} /></Pressable> : null}</View>
    <View style={v.etiquetas}><Pressable accessibilityRole="button" accessibilityState={{ selected: !filtros.interesse }} onPress={() => setFiltros((atual) => ({ ...atual, interesse: null }))} style={[v.etiqueta, !filtros.interesse && { backgroundColor: colors.accentTint }]}><Text style={v.etiquetaTexto}>Tudo</Text></Pressable>{INTERESSES.map((item) => <Pressable key={item.id} accessibilityRole="button" accessibilityState={{ selected: filtros.interesse === item.id }} onPress={() => setFiltros((atual) => ({ ...atual, interesse: atual.interesse === item.id ? null : item.id }))} style={[v.etiqueta, filtros.interesse === item.id && { backgroundColor: colors.accentTint }]}><Text style={v.etiquetaTexto}>{item.icone}  {item.nome}</Text></Pressable>)}</View>

    <View accessibilityLiveRegion="polite" style={s.filtroAtivo}>
      <Ionicons name="funnel-outline" size={18} color={colors.accentDark} />
      <Text style={s.filtroTexto}>
        {cidade ? <>Mostrando lugares de <Text style={s.forte}>{cidade}</Text>{filtrando ? <> com <Text style={s.forte}>{descricaoFiltros.join(" e ")}</Text></> : null}</> : "Escolha uma cidade para ver os lugares."}
      </Text>
      {filtrando ? <Pressable accessibilityRole="button" onPress={limpar} style={v.linkToque}><Text style={v.link}>Limpar filtros</Text></Pressable> : null}
    </View>

    <View style={v.secao}><Text style={v.secaoTitulo}>{cidade ? `Descubra ${cidade.split(",")[0]}` : "Por onde vamos?"}</Text><Pressable accessibilityRole="button" onPress={() => router.push("/(tabs)/mapa")} style={v.linkToque}><Text style={v.link}>Ver no mapa ↗</Text></Pressable></View>
    {cidadeId && filtrados.length ? <Text style={v.descricao}>{coordenadas ? "Mais perto de você · distâncias em linha reta" : "Distâncias aproximadas pelo centro da cidade"}</Text> : null}

    {!pronto || carregando ? <Carregando titulo="Encontrando lugares…" />
      : erro ? <ErroCarregar mensagem={erro} onTentarDeNovo={recarregar} />
      : !cidadeId ? <Vazio icone="location-outline" titulo="Escolha uma cidade" mensagem="Toque em uma das cidades acima para começar a explorar." />
      : !locais.length ? <Vazio icone="map-outline" titulo={`Nenhum lugar cadastrado em ${cidade}`} mensagem="Ainda não publicamos lugares nesta cidade. Veja outra cidade enquanto isso." acao={outraCidade ? { texto: `Ver ${outraCidade.nome}`, onPress: () => escolherCidade(outraCidade.id) } : undefined} />
      : !filtrados.length ? <Vazio icone="search-outline" titulo="Nenhum lugar com esses filtros" mensagem={`Nada em ${cidade} combina com ${descricaoFiltros.join(" e ")}. Limpe os filtros para ver todos os lugares da cidade.`} acao={{ texto: "Limpar filtros", onPress: limpar }} />
      : filtrados.map((local) => <CartaoLugar key={local.id} local={local} />)}
    {erroPreferencias ? <Text accessibilityRole="alert" style={v.erro}>{erroPreferencias}</Text> : null}
  </Tela>;
}
const s = StyleSheet.create({ busca: { flexDirection: "row", alignItems: "center", backgroundColor: colors.surface, borderRadius: 18, paddingHorizontal: 16, minHeight: 56, gap: 10 }, entrada: { flex: 1, minWidth: 0, minHeight: 56, fontFamily: fonts.regular, fontSize: 13, color: colors.text }, limpar: { minHeight: 44, minWidth: 32, justifyContent: "center", alignItems: "center" }, filtroAtivo: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 14, paddingVertical: 4, minHeight: 52, borderRadius: 16, backgroundColor: colors.accentSoft }, filtroTexto: { flex: 1, fontFamily: fonts.regular, fontSize: 13, lineHeight: 19, color: colors.earth }, forte: { fontFamily: fonts.semibold, color: colors.accentDark } });
