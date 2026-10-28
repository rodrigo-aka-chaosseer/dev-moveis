import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter, type Href } from "expo-router";
import { Tela, Botao, Estado, v } from "../../src/components/visual/Guia";
import { FotoParada } from "../../src/components/roteiros/FotoParada";
import { NumerosRoteiro } from "../../src/components/roteiros/NumerosRoteiro";
import { rotuloCategoria } from "../../src/locais/listarLocais";
import { nomeCidade } from "../../src/preferencias/dados";
import { rotuloDuracao } from "../../src/roteiros/calculos";
import type { ParadaRoteiro } from "../../src/roteiros/listarRoteiros";
import { useRoteiro } from "../../src/roteiros/useRoteiros";
import { colors, fonts } from "../../src/theme/tokens";

export default function DetalheRoteiro() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { roteiro, carregando, erro } = useRoteiro(Array.isArray(id) ? id[0] : id);
  const voltar = () => { if (router.canGoBack()) router.back(); else router.replace("/(tabs)/roteiros"); };

  if (carregando) return <Tela><Estado titulo="Traçando o caminho…" carregando /></Tela>;
  if (erro || !roteiro) return <Tela><Estado titulo="Roteiro indisponível" descricao={erro ?? "Este roteiro não existe ou não está mais publicado."} icone="trail-sign-outline" /><Botao texto="Voltar aos roteiros" onPress={voltar} /></Tela>;

  return <Tela>
    <View style={s.topo}><Pressable accessibilityRole="button" accessibilityLabel="Voltar" onPress={voltar} style={s.voltar}><Ionicons name="arrow-back" size={22} color={colors.earth} /></Pressable><Text style={v.legenda}>ROTEIRO TEMÁTICO</Text><Ionicons name="trail-sign-outline" size={22} color={colors.earth} /></View>
    <View style={{ gap: 8 }}>
      {roteiro.cidadeId ? <Text style={v.legenda}>{nomeCidade(roteiro.cidadeId)}</Text> : null}
      <Text accessibilityRole="header" style={v.titulo}>{roteiro.titulo}</Text>
      {roteiro.descricao ? <Text style={v.descricao}>{roteiro.descricao}</Text> : null}
    </View>
    <NumerosRoteiro roteiro={roteiro} fundo={colors.surface} />
    {roteiro.paradas.length === 0
      ? <Estado titulo="Ainda sem paradas" descricao="Este roteiro ainda não tem lugares publicados." icone="trail-sign-outline" />
      : <View>{roteiro.paradas.map((parada, indice) => <Parada key={parada.ordem} parada={parada} numero={indice + 1} ultima={indice === roteiro.paradas.length - 1} onAbrir={(localId) => router.push(`/local/${localId}` as Href)} />)}</View>}
    <Text style={[v.descricao, { fontSize: 11 }]}>Distância em linha reta entre as paradas. Horários são sugestões.{roteiro.custoCentavos == null ? " Custo “—”: há entrada com preço a confirmar no local." : ""}</Text>
  </Tela>;
}

function Parada({ parada, numero, ultima, onAbrir }: { parada: ParadaRoteiro; numero: number; ultima: boolean; onAbrir: (localId: string) => void }) {
  const local = parada.local;
  return <View style={s.parada}>
    <View style={s.trilho}>
      <View style={[s.ponto, !local && { backgroundColor: colors.tabInactive }]}><Text style={s.numero}>{numero}</Text></View>
      {!ultima ? <View style={s.linha} /> : null}
    </View>
    <View style={{ flex: 1, minWidth: 0, gap: 6, paddingBottom: ultima ? 0 : 16 }}>
      {parada.horaSugerida ? <Text style={s.hora}>{parada.horaSugerida} · {rotuloDuracao(parada.duracaoMin)}</Text> : null}
      {local
        ? <Pressable accessibilityRole="button" accessibilityLabel={`Parada ${numero}: ${local.nome}. Abrir o lugar`} onPress={() => onAbrir(local.id)} style={({ pressed }) => [s.cartao, pressed && { opacity: 0.8 }]}>
            <FotoParada local={local} />
            <View style={{ flex: 1, minWidth: 0, gap: 3 }}>
              <Text style={s.nome} numberOfLines={2}>{local.nome}</Text>
              <Text style={s.categoria}>{rotuloCategoria(local.categoria)}</Text>
              <Text style={v.descricao} numberOfLines={2}>{local.porQueConhecer}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.accentDark} />
          </Pressable>
        : <View style={[s.cartao, { backgroundColor: colors.paper }]}>
            <View style={{ flex: 1, gap: 3 }}>
              <Text style={[s.nome, { color: colors.textMuted }]}>Lugar indisponível</Text>
              <Text style={v.descricao}>Este lugar saiu do catálogo e não faz mais parte do roteiro.</Text>
            </View>
          </View>}
    </View>
  </View>;
}

const s = StyleSheet.create({
  topo: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  voltar: { width: 46, height: 46, borderRadius: 23, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center" },
  parada: { flexDirection: "row", gap: 12 },
  trilho: { width: 26, alignItems: "center" },
  ponto: { width: 26, height: 26, borderRadius: 13, backgroundColor: colors.accent, alignItems: "center", justifyContent: "center" },
  numero: { fontFamily: fonts.extrabold, fontSize: 12, color: colors.onDark },
  linha: { flex: 1, width: 2, marginVertical: 3, backgroundColor: colors.accentTint },
  hora: { fontFamily: fonts.semibold, fontSize: 12, color: colors.accentDark, fontVariant: ["tabular-nums"], marginTop: 4 },
  cartao: { flexDirection: "row", alignItems: "center", gap: 12, padding: 12, borderRadius: 20, backgroundColor: colors.surface },
  nome: { fontFamily: fonts.semibold, fontSize: 15, color: colors.text },
  categoria: { fontFamily: fonts.semibold, fontSize: 11, color: colors.accentDark },
});
