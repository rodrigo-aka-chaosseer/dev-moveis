import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, type Href } from "expo-router";
import { Tela, Cabecalho, Botao, Estado, v } from "../../src/components/visual/Guia";
import { NumerosRoteiro } from "../../src/components/roteiros/NumerosRoteiro";
import { usePreferencias } from "../../src/preferencias/PreferenciasProvider";
import { nomeCidade } from "../../src/preferencias/dados";
import { paradasDisponiveis, type Roteiro } from "../../src/roteiros/listarRoteiros";
import { useRoteiros } from "../../src/roteiros/useRoteiros";
import { colors, fonts } from "../../src/theme/tokens";

export default function Roteiros() {
  const router = useRouter();
  const { cidadeId, pronto } = usePreferencias();
  const { roteiros, carregando, erro, recarregar } = useRoteiros(cidadeId);
  const cidade = nomeCidade(cidadeId)?.split(",")[0];

  return <Tela>
    <Cabecalho legenda="CADA PARADA, UMA HISTÓRIA" titulo="Caminhos para descobrir." descricao={cidade ? `Roteiros temáticos por ${cidade}, com tempo, distância e custo de cada caminho.` : "Um tema, vários lugares e um novo jeito de viver a cidade."} />
    {!pronto || carregando ? <Estado titulo="Traçando os caminhos…" carregando />
      : erro ? <><Estado titulo="Não conseguimos carregar" descricao={erro} icone="cloud-offline-outline" /><Botao texto="Tentar novamente" onPress={recarregar} secundario /></>
      : !cidadeId ? <><Estado titulo="Escolha uma cidade" descricao="Selecione Salvador ou Recife na Início ou no Explorar para ver os roteiros." /><Botao texto="Escolher no Explorar" onPress={() => router.push("/(tabs)/explorar")} /></>
      : !roteiros.length ? <><Estado titulo="Estamos traçando novos caminhos" descricao={`Ainda não temos roteiros temáticos em ${cidade}. Enquanto isso, descubra os lugares do catálogo.`} icone="trail-sign-outline" /><Botao texto="Encontrar lugares" onPress={() => router.push("/(tabs)/explorar")} /></>
      : roteiros.map((roteiro) => <CartaoRoteiro key={roteiro.id} roteiro={roteiro} onPress={() => router.push(`/roteiro/${roteiro.id}` as Href)} />)}
  </Tela>;
}

function CartaoRoteiro({ roteiro, onPress }: { roteiro: Roteiro; onPress: () => void }) {
  const disponiveis = paradasDisponiveis(roteiro);
  const fora = roteiro.paradas.length - disponiveis.length;
  return <Pressable accessibilityRole="button" accessibilityLabel={`Roteiro ${roteiro.titulo}, ${disponiveis.length} paradas`} onPress={onPress} style={({ pressed }) => [v.bloco, pressed && { opacity: 0.8 }]}>
    <Text style={v.secaoTitulo}>{roteiro.titulo}</Text>
    {roteiro.descricao ? <Text style={v.descricao}>{roteiro.descricao}</Text> : null}
    <NumerosRoteiro roteiro={roteiro} />
    <View style={s.paradas}>{disponiveis.map((parada, indice) => <View key={parada.ordem} style={s.parada}><View style={s.ponto}><Text style={s.numero}>{indice + 1}</Text></View><Text numberOfLines={1} style={s.nome}>{parada.local.nome}</Text></View>)}</View>
    {fora ? <Text style={s.aviso}>{fora === 1 ? "1 parada saiu do roteiro porque o lugar não está mais publicado." : `${fora} paradas saíram do roteiro porque os lugares não estão mais publicados.`}</Text> : null}
    <View style={s.ver}><Text style={v.link}>Ver roteiro</Text><Ionicons name="arrow-forward" size={16} color={colors.accentDark} /></View>
  </Pressable>;
}

const s = StyleSheet.create({ paradas: { gap: 8 }, parada: { flexDirection: "row", alignItems: "center", gap: 10 }, ponto: { width: 24, height: 24, borderRadius: 12, backgroundColor: colors.accent, alignItems: "center", justifyContent: "center" }, numero: { fontFamily: fonts.extrabold, fontSize: 11, color: colors.onDark }, nome: { flex: 1, fontFamily: fonts.semibold, fontSize: 13, color: colors.earth }, aviso: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 18, color: colors.accentDark }, ver: { flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-end", minHeight: 32 } });
