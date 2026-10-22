import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Tela, Cabecalho, Botao, v } from "../../src/components/visual/Guia";
import { colors } from "../../src/theme/tokens";

export default function Roteiros() {
  const router = useRouter();
  return <Tela><Cabecalho legenda="CADA PARADA, UMA HISTÓRIA" titulo="Caminhos para descobrir." descricao="Um tema, vários lugares e um novo jeito de viver a cidade." />
    <View style={[v.bloco, { backgroundColor: colors.paper, padding: 28, minHeight: 260, justifyContent: "center" }]}><View style={v.disco}><Ionicons name="trail-sign-outline" size={32} color={colors.accentDark} /></View><Text style={v.secaoTitulo}>Estamos traçando novos caminhos</Text><Text style={v.descricao}>Os roteiros temáticos ainda não estão disponíveis. Enquanto isso, descubra os lugares do catálogo e escolha sua próxima parada.</Text></View>
    <Botao texto="Encontrar lugares" onPress={() => router.push("/(tabs)/explorar")} />
    <View style={v.bloco}><Ionicons name="map-outline" size={24} color={colors.earth} /><Text style={v.secaoTitulo}>Prefere olhar ao redor?</Text><Text style={v.descricao}>Veja onde estão os lugares culturais da cidade.</Text><Botao texto="Abrir o mapa" secundario onPress={() => router.push("/(tabs)/mapa")} /></View>
  </Tela>;
}
