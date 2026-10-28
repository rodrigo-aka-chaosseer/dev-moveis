import { Capa } from "../../src/components/visual/Guia";
import { useMemo, useState } from "react";
import { ActivityIndicator, Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter, type Href } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocais } from "../../src/locais/useLocais";
import { linhaResumo } from "../../src/locais/listarLocais";
import { ordenarPorProximidade } from "../../src/locais/proximidade";
import { useLocalizacao } from "../../src/localizacao";
import MapaLugares from "../../src/mapa/MapaLugares";
import { usePreferencias } from "../../src/preferencias/PreferenciasProvider";
import { CIDADES, nomeCidade } from "../../src/preferencias/dados";
import { colors, fonts, MIN_TOUCH, spacing } from "../../src/theme/tokens";

export default function Mapa() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { cidadeId, escolherCidade, pronto, erro: erroPreferencias } = usePreferencias();
  const { locais, carregando, erro, recarregar } = useLocais(cidadeId);
  const { coordenadas, estado, solicitar, podePerguntarNovamente } = useLocalizacao();
  const [selecionadoId, selecionar] = useState<string | null>(null);
  const ordenados = useMemo(
    () => cidadeId ? ordenarPorProximidade(locais, cidadeId, coordenadas) : [],
    [locais, cidadeId, coordenadas],
  );
  // A seleção só pode apontar para um lugar da cidade e da resposta atuais.
  const selecionado = ordenados.find((local) => local.id === selecionadoId);
  const mensagemLocalizacao = estado === "permissao_negada"
    ? "Localização não autorizada. Você ainda pode explorar os lugares da cidade."
    : estado === "servico_desativado"
      ? "GPS desligado. Ative a localização do aparelho ou explore pela cidade."
      : estado === "erro"
        ? "Não foi possível obter sua localização. Os lugares da cidade continuam disponíveis."
        : coordenadas
          ? "Sua posição aparece em azul. Distâncias em linha reta da sua localização."
          : "Sem localização: distâncias aproximadas pelo centro da cidade.";

  return (
    <ScrollView style={styles.tela} contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24 }}>
      <Text style={styles.titulo}>Mapa</Text>
      {!pronto ? <ActivityIndicator accessibilityLabel="Carregando preferências" color={colors.accent} /> : (
        <>
          <View style={styles.cidades}>
            {CIDADES.map((cidade) => (
              <Pressable key={cidade.id} accessibilityRole="button" accessibilityState={{ selected: cidadeId === cidade.id }}
                style={[styles.cidade, cidadeId === cidade.id && styles.ativa]}
                onPress={() => { selecionar(null); void escolherCidade(cidade.id); }}>
                <Text style={styles.texto}>{cidade.nome}, {cidade.uf}</Text>
              </Pressable>
            ))}
          </View>
          {erroPreferencias ? <Text accessibilityRole="alert" style={styles.erro}>{erroPreferencias}</Text> : null}
          <Text accessibilityLiveRegion="polite" style={styles.aviso}>{mensagemLocalizacao}</Text>
          {estado === "carregando" ? <ActivityIndicator accessibilityLabel="Obtendo localização" color={colors.accent} /> : (
            <Pressable accessibilityRole="button" style={styles.botao} onPress={() => {
              if (estado === "permissao_negada" && !podePerguntarNovamente) {
                void Linking.openSettings().catch(() => {});
              } else { void solicitar(); }
            }}>
              <Text style={styles.link}>{estado === "permissao_negada" && !podePerguntarNovamente ? "Abrir configurações de localização" : "Atualizar minha localização"}</Text>
            </Pressable>
          )}
          {!cidadeId ? <Text style={styles.aviso}>Escolha uma cidade para ver os lugares no mapa.</Text>
            : carregando ? <ActivityIndicator accessibilityLabel="Carregando lugares" color={colors.accent} />
              : erro ? <View><Text accessibilityRole="alert" style={styles.erro}>{erro}</Text>
                <Pressable accessibilityRole="button" style={styles.botao} onPress={recarregar}><Text style={styles.link}>Tentar novamente</Text></Pressable>
              </View>
                : <>
                  <MapaLugares cidadeId={cidadeId} locais={locais} coordenadas={coordenadas}
                    selecionadoId={selecionado?.id ?? null} selecionar={selecionar} />
                  {locais.length === 0 ? <Text style={styles.aviso}>Ainda não temos lugares em {nomeCidade(cidadeId)}.</Text> : null}
                  {ordenados.length ? <Text style={styles.subtitulo}>Lugares em {nomeCidade(cidadeId)}</Text> : null}
                  {ordenados.map((local) => {
                    const aberto = selecionado?.id === local.id;
                    return <View key={local.id} style={styles.item}>
                      <Pressable accessibilityRole="button" accessibilityLabel={`Ver resumo de ${local.nome}`}
                        accessibilityState={{ expanded: aberto, selected: aberto }}
                        onPress={() => selecionar(aberto ? null : local.id)}>
                        <View style={{ borderRadius: 16, overflow: "hidden", marginBottom: 12 }}><Capa local={local} /></View>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}><Text style={[styles.nome, { flex: 1 }]}>{local.nome}</Text><Text style={styles.link}>{aberto ? "−" : "+"}</Text></View>
                        <Text style={styles.texto}>{linhaResumo(local)}</Text>
                      </Pressable>
                      {aberto ? <View accessibilityLiveRegion="polite" style={styles.resumo}>
                        <Text style={styles.texto}>{local.porQueConhecer}</Text>
                        <Pressable accessibilityRole="button" style={styles.botao} onPress={() => router.push(`/local/${local.id}` as Href)}>
                          <Text style={styles.link}>Ver detalhes de {local.nome}</Text>
                        </Pressable>
                      </View> : null}
                    </View>;
                  })}
                </>}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: colors.surface2 },
  titulo: { fontFamily: fonts.semibold, fontSize: 32, letterSpacing: -1, color: colors.text, marginHorizontal: spacing.pageX, marginBottom: 16 },
  cidades: { flexDirection: "row", flexWrap: "wrap", gap: 8, paddingHorizontal: spacing.pageX },
  cidade: { padding: 12, minHeight: MIN_TOUCH, borderRadius: 22, backgroundColor: colors.surface },
  ativa: { backgroundColor: colors.accentTint },
  aviso: { marginHorizontal: spacing.pageX, marginVertical: 12, color: colors.textMuted },
  erro: { marginHorizontal: spacing.pageX, marginVertical: 12, color: colors.error },
  botao: { paddingHorizontal: spacing.pageX, paddingVertical: 12, minHeight: MIN_TOUCH, justifyContent: "center" },
  link: { color: colors.accentDark, fontFamily: fonts.semibold },
  texto: { color: colors.text, lineHeight: 22 },
  nome: { color: colors.text, fontFamily: fonts.semibold, fontSize: 16 },
  resumo: { marginTop: 12, padding: 16, gap: 8, borderRadius: 24, backgroundColor: colors.paper },
  subtitulo: { marginHorizontal: spacing.pageX, marginTop: 16, color: colors.text, fontFamily: fonts.semibold },
  item: { marginHorizontal: spacing.pageX, paddingVertical: 16, minHeight: MIN_TOUCH, borderRadius: 20, backgroundColor: colors.surface, paddingHorizontal: 18, marginTop: 10, gap: 6 },
});
