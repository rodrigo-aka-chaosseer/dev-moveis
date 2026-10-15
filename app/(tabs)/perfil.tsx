import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { BlocoDocumento } from "@/components/perfil/BlocoDocumento";
import { CampoDocumento } from "@/components/perfil/CampoDocumento";
import { MolduraDocumento } from "@/components/perfil/MolduraDocumento";
import { usePreferencias } from "@/preferencias/PreferenciasProvider";
import { INTERESSES, nomeCidade } from "@/preferencias/dados";
import { useSessao } from "@/sessao/SessaoProvider";
import { MIN_TOUCH, colors, fonts, radius, spacing } from "@/theme/tokens";

function iniciais(nome: string) {
  return nome
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((parte) => parte[0]?.toUpperCase())
    .join("");
}

export default function Perfil() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { estado, email, nome, sair } = useSessao();
  const { interesses, cidadeId, pronto, erro } = usePreferencias();
  const [saindo, setSaindo] = useState(false);
  const [erroSaida, setErroSaida] = useState<string | null>(null);

  const identificado = estado === "identificado";
  const nomeExibicao = nome ?? "Explorador Raízes";
  const cidade = nomeCidade(cidadeId);
  const interessesSelecionados = INTERESSES.filter((item) =>
    interesses.includes(item.id),
  );

  async function encerrarSessao() {
    if (saindo) return;
    setSaindo(true);
    setErroSaida(null);

    try {
      await sair();
      router.replace("/");
    } catch {
      setErroSaida(
        "Não foi possível sair com segurança. Tente novamente para evitar que a conta reabra sozinha.",
      );
      setSaindo(false);
    }
  }

  return (
    <View style={styles.tela}>
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={[
          styles.conteudo,
          { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 36 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.tituloTela}>
          <Text style={styles.sobretitulo}>SEU ESPAÇO</Text>
          <Text style={styles.titulo}>Perfil</Text>
          <Text style={styles.subtitulo}>
            Sua identidade e as escolhas que guiam cada descoberta.
          </Text>
        </View>

        <MolduraDocumento>
          <BlocoDocumento primeiro>
            <View style={styles.cabecalhoDocumento}>
              <Text style={styles.selo}>Passaporte cultural</Text>
              <Ionicons color={colors.documentInk} name="compass-outline" size={20} />
            </View>

            {identificado ? (
              <View style={styles.identidade}>
                <View accessibilityElementsHidden style={styles.disco}>
                  <Text style={styles.iniciais}>{iniciais(nomeExibicao)}</Text>
                </View>
                <View style={styles.camposIdentidade}>
                  <CampoDocumento rotulo="Nome" valor={nomeExibicao} />
                  <CampoDocumento rotulo="E-mail" valor={email ?? "Não informado"} />
                </View>
              </View>
            ) : (
              <View style={styles.avisoVisitante}>
                <View style={styles.iconeVisitante}>
                  <Ionicons color={colors.accentDark} name="person-outline" size={22} />
                </View>
                <View style={styles.avisoVisitanteTexto}>
                  <Text style={styles.avisoVisitanteTitulo}>
                    Você está explorando como visitante
                  </Text>
                  <Text style={styles.avisoVisitanteDescricao}>
                    Entre para manter uma conta e sincronizar suas escolhas quando o
                    serviço estiver disponível.
                  </Text>
                </View>
              </View>
            )}

            {!identificado ? (
              <Pressable
                accessibilityRole="button"
                onPress={() => router.push("/login")}
                style={({ pressed }) => [styles.botaoPrimario, pressed && styles.botaoPressionado]}
              >
                <Text style={styles.botaoPrimarioTexto}>Criar conta / Entrar</Text>
              </Pressable>
            ) : null}
          </BlocoDocumento>

          <BlocoDocumento titulo="Preferências">
            {!pronto ? (
              <Text style={styles.textoVazio}>Carregando suas escolhas…</Text>
            ) : (
              <>
                <View style={styles.linhaCidade}>
                  <View style={styles.iconeCidade}>
                    <Ionicons color={colors.accent} name="location-outline" size={18} />
                  </View>
                  <View style={styles.cidadeTexto}>
                    <Text style={styles.rotuloCidade}>Cidade escolhida</Text>
                    <Text style={styles.valorCidade}>{cidade ?? "Ainda não escolhida"}</Text>
                  </View>
                </View>

                {interessesSelecionados.length > 0 ? (
                  <View style={styles.preferencias}>
                    {interessesSelecionados.map((interesse) => (
                      <View key={interesse.id} style={styles.etiqueta}>
                        <Text style={styles.etiquetaIcone}>{interesse.icone}</Text>
                        <Text style={styles.etiquetaTexto}>{interesse.nome}</Text>
                      </View>
                    ))}
                  </View>
                ) : (
                  <Text style={styles.textoVazio}>Nenhum interesse selecionado.</Text>
                )}
              </>
            )}

            {erro ? <Text style={styles.erro}>{erro}</Text> : null}

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Editar interesses e cidade"
              onPress={() => router.push("/onboarding")}
              style={({ pressed }) => [styles.botaoEditar, pressed && styles.botaoEditarPressionado]}
            >
              <Ionicons color={colors.documentInk} name="pencil-outline" size={17} />
              <Text style={styles.botaoEditarTexto}>Editar</Text>
            </Pressable>
          </BlocoDocumento>

          <BlocoDocumento titulo="Sessão">
            <Text style={styles.sessaoTexto}>
              {identificado
                ? "Ao sair, esta conta não será aberta automaticamente na próxima vez."
                : "A sessão de visitante termina automaticamente à meia-noite."}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ busy: saindo, disabled: saindo }}
              disabled={saindo}
              onPress={encerrarSessao}
              style={({ pressed }) => [
                styles.botaoSair,
                pressed && styles.botaoSairPressionado,
                saindo && styles.botaoDesabilitado,
              ]}
            >
              <Ionicons color={colors.error} name="log-out-outline" size={18} />
              <Text style={styles.botaoSairTexto}>{saindo ? "Saindo…" : "Sair da conta"}</Text>
            </Pressable>
            {erroSaida ? (
              <Text accessibilityLiveRegion="assertive" style={styles.erro}>{erroSaida}</Text>
            ) : null}
          </BlocoDocumento>
        </MolduraDocumento>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: colors.paper },
  conteudo: { paddingHorizontal: spacing.pageX },
  tituloTela: { marginBottom: 22 },
  sobretitulo: { fontFamily: fonts.semibold, fontSize: 11, letterSpacing: 1.4, color: colors.accentDark },
  titulo: { marginTop: 6, fontFamily: fonts.extrabold, fontSize: 31, color: colors.text },
  subtitulo: { maxWidth: 330, marginTop: 6, fontFamily: fonts.regular, fontSize: 14, lineHeight: 21, color: colors.textMuted },
  cabecalhoDocumento: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 20 },
  selo: { fontFamily: fonts.extrabold, fontSize: 11, letterSpacing: 2.1, textTransform: "uppercase", color: colors.documentInk },
  identidade: { flexDirection: "row", alignItems: "center", gap: 16 },
  disco: { width: 64, height: 64, borderRadius: 32, alignItems: "center", justifyContent: "center", backgroundColor: colors.earth },
  iniciais: { fontFamily: fonts.extrabold, fontSize: 20, letterSpacing: 0.5, color: colors.surface },
  camposIdentidade: { flex: 1, gap: 12 },
  avisoVisitante: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  iconeVisitante: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", backgroundColor: colors.accentTint },
  avisoVisitanteTexto: { flex: 1 },
  avisoVisitanteTitulo: { fontFamily: fonts.semibold, fontSize: 15, lineHeight: 20, color: colors.documentInk },
  avisoVisitanteDescricao: { marginTop: 4, fontFamily: fonts.regular, fontSize: 12, lineHeight: 18, color: colors.inkMuted },
  botaoPrimario: { minHeight: 48, marginTop: 18, borderRadius: radius.button, alignItems: "center", justifyContent: "center", backgroundColor: colors.accent },
  botaoPrimarioTexto: { fontFamily: fonts.semibold, fontSize: 14, color: colors.onDark },
  botaoPressionado: { transform: [{ scale: 0.98 }], opacity: 0.9 },
  linhaCidade: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 14 },
  iconeCidade: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center", backgroundColor: colors.accentSoft },
  cidadeTexto: { flex: 1 },
  rotuloCidade: { fontFamily: fonts.regular, fontSize: 10, textTransform: "uppercase", letterSpacing: 0.8, color: colors.inkMuted },
  valorCidade: { marginTop: 2, fontFamily: fonts.semibold, fontSize: 15, color: colors.documentInk },
  preferencias: { flexDirection: "row", flexWrap: "wrap", gap: 7 },
  etiqueta: { flexDirection: "row", alignItems: "center", gap: 5, borderWidth: 1, borderColor: colors.stampEmpty, borderRadius: 14, paddingHorizontal: 10, paddingVertical: 6 },
  etiquetaIcone: { fontSize: 12, color: colors.documentInk },
  etiquetaTexto: { fontFamily: fonts.regular, fontSize: 12, color: colors.documentInk },
  textoVazio: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 19, color: colors.inkMuted },
  botaoEditar: { minHeight: MIN_TOUCH, marginTop: 18, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, borderWidth: 1.5, borderColor: colors.documentInk, borderRadius: radius.document },
  botaoEditarPressionado: { backgroundColor: "rgba(92, 61, 46, 0.07)" },
  botaoEditarTexto: { fontFamily: fonts.semibold, fontSize: 14, color: colors.documentInk },
  sessaoTexto: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 18, color: colors.inkMuted },
  botaoSair: { minHeight: MIN_TOUCH, marginTop: 14, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderWidth: 1, borderColor: colors.error, borderRadius: radius.button },
  botaoSairPressionado: { backgroundColor: colors.errorSoft },
  botaoSairTexto: { fontFamily: fonts.semibold, fontSize: 14, color: colors.error },
  botaoDesabilitado: { opacity: 0.55 },
  erro: { marginTop: 12, fontFamily: fonts.semibold, fontSize: 12, lineHeight: 18, color: colors.error },
});
