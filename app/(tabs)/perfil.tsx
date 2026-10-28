import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Tela, Cabecalho, Botao, Secao, v } from "../../src/components/visual/Guia";
import { usePreferencias } from "../../src/preferencias/PreferenciasProvider";
import { INTERESSES, nomeCidade } from "../../src/preferencias/dados";
import { useSessao } from "../../src/sessao/SessaoProvider";
import { colors, fonts } from "../../src/theme/tokens";

export default function Perfil() {
  const router = useRouter();
  const { estado, nome, email, sair } = useSessao();
  const { cidadeId, interesses, pronto, erro } = usePreferencias();
  const [saindo, setSaindo] = useState(false);
  const [erroSaida, setErroSaida] = useState<string | null>(null);
  const identificado = estado === "identificado";
  const exibicao = identificado ? nome ?? "Explorador" : "visitante";
  async function encerrar() {
    setSaindo(true); setErroSaida(null);
    try { await sair(); router.replace("/"); }
    catch { setErroSaida("Não foi possível encerrar. Tente novamente."); setSaindo(false); }
  }
  return <Tela fundo={colors.profileBackground}>
    <Cabecalho legenda="DO SEU JEITO" titulo="Seu espaço" descricao="Cada descoberta começa com você." />
    <View style={s.identidade}><View style={s.avatar}>{identificado ? <Text style={s.iniciais}>{exibicao.slice(0, 1).toUpperCase()}</Text> : <Ionicons name="person-outline" size={30} color={colors.accentDark} />}</View><View style={{ flex: 1, gap: 4 }}><Text style={s.nome}>Olá, {exibicao}.</Text><Text style={v.descricao}>{identificado ? email : "Que bom ter você por aqui."}</Text></View></View>
    {!identificado ? <View style={s.convite}><Ionicons name="sparkles-outline" size={24} color={colors.accentDark} /><Text style={v.secaoTitulo}>Guarde suas descobertas</Text><Text style={v.descricao}>Crie seu acesso para continuar sua jornada cultural.</Text><Botao texto="Entrar ou criar conta" onPress={() => router.push("/login")} /></View> : null}
    <Secao titulo="Suas preferências" />
    <View style={v.bloco}>
      <Pressable accessibilityRole="button" accessibilityLabel="Editar cidade e interesses" onPress={() => router.push("/onboarding")} style={s.linha}>
        <View style={s.icone}><Ionicons name="location-outline" size={22} color={colors.accentDark} /></View><View style={{ flex: 1, gap: 3 }}><Text style={v.descricao}>Cidade para explorar</Text><Text style={s.valor}>{pronto ? nomeCidade(cidadeId) ?? "Escolha sua cidade" : "Carregando…"}</Text></View><Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
      </Pressable>
      <View style={s.divisor} /><Text style={v.descricao}>O que desperta sua curiosidade</Text>
      <View style={v.etiquetas}>{INTERESSES.filter((item) => interesses.includes(item.id)).map((item) => <View key={item.id} style={[v.etiqueta, { backgroundColor: colors.surface2 }]}><Text style={v.etiquetaTexto}>{item.icone}  {item.nome}</Text></View>)}</View>
      <Pressable accessibilityRole="button" style={s.editar} onPress={() => router.push("/onboarding")}><Ionicons name="options-outline" size={18} color={colors.accentDark} /><Text style={v.link}>{interesses.length ? "Editar preferências" : "Escolher meus interesses"}</Text></Pressable>
      {erro ? <Text style={v.erro}>{erro}</Text> : null}
    </View>
    <View style={s.nota}><Ionicons name="compass-outline" size={20} color={colors.earth} /><Text style={[v.descricao, { flex: 1 }]}>Novos olhares, novas histórias. Continue explorando a cidade.</Text></View>
    <Pressable accessibilityRole="button" disabled={saindo} style={s.sair} onPress={encerrar}><Ionicons name="log-out-outline" size={18} color={colors.textMuted} /><Text style={v.descricao}>{saindo ? "Encerrando…" : identificado ? "Sair da conta" : "Encerrar visita"}</Text></Pressable>
    {erroSaida ? <Text accessibilityRole="alert" style={v.erro}>{erroSaida}</Text> : null}
  </Tela>;
}
const s = StyleSheet.create({
  identidade: { flexDirection: "row", gap: 16, alignItems: "center", paddingVertical: 10 }, avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: colors.accentTint, alignItems: "center", justifyContent: "center" }, iniciais: { color: colors.accentDark, fontFamily: fonts.extrabold, fontSize: 30 },
  nome: { fontFamily: fonts.semibold, fontSize: 23, letterSpacing: -0.7, color: colors.text }, convite: { padding: 22, backgroundColor: colors.paper, borderRadius: 26, gap: 12 }, linha: { flexDirection: "row", gap: 12, alignItems: "center", minHeight: 56 }, icone: { width: 46, height: 46, backgroundColor: colors.surface2, borderRadius: 16, alignItems: "center", justifyContent: "center" }, valor: { fontFamily: fonts.semibold, fontSize: 16, color: colors.text }, divisor: { height: 1, backgroundColor: colors.surface2 }, editar: { flexDirection: "row", gap: 10, minHeight: 44, alignItems: "center" }, nota: { flexDirection: "row", alignItems: "center", gap: 14, padding: 8 }, sair: { alignSelf: "center", flexDirection: "row", gap: 8, minHeight: 48, alignItems: "center" },
});
