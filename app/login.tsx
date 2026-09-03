import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useSessao } from "../src/sessao/SessaoProvider";
import {
  normalizarEmail,
  validarLogin,
  type ErrosLogin,
} from "../src/sessao/validarLogin";
import { colors, fonts, MIN_TOUCH, radius, spacing } from "../src/theme/tokens";

// Caminho explícito: `app/index.tsx` e `app/(tabs)/index.tsx` disputam "/".
// Quando o "Continuar" da seleção de interesses passar a levar às abas, este
// destino vira "/onboarding" e a sequência fica abertura → login → interesses.
const DESTINO_APOS_ENTRAR = "/(tabs)/explorar";

// Em repouso o bloco terracota ocupa quase metade da tela e a marca é grande.
// Quando a pessoa toca num campo, ele encolhe para dar lugar ao teclado.
const DURACAO_TRANSICAO_MS = 280;
const PROPORCAO_BLOCO_ALTO = 0.44;

type Campo = "email" | "senha";

export default function Login() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { height: alturaTela } = useWindowDimensions();
  const { entrar, entrarComoVisitante } = useSessao();

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [focado, setFocado] = useState<Campo | null>(null);
  const [erros, setErros] = useState<ErrosLogin>({});
  const [erroGeral, setErroGeral] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const senhaRef = useRef<TextInput>(null);

  // 0 = bloco alto (repouso), 1 = bloco curto (digitando). Fica curto enquanto
  // houver algo digitado, para o toque no "olho" não fazer a tela pular.
  const compacto = focado !== null || email.length > 0 || senha.length > 0;
  const [progresso] = useState(() => new Animated.Value(0));

  useEffect(() => {
    Animated.timing(progresso, {
      toValue: compacto ? 1 : 0,
      duration: DURACAO_TRANSICAO_MS,
      easing: Easing.out(Easing.cubic),
      // Altura e tamanho de fonte são layout: o driver nativo não anima.
      useNativeDriver: false,
    }).start();
  }, [compacto, progresso]);

  const alturaBlocoAlto = Math.round(alturaTela * PROPORCAO_BLOCO_ALTO);
  const blocoAnimado = {
    minHeight: progresso.interpolate({
      inputRange: [0, 1],
      outputRange: [alturaBlocoAlto, 0],
    }),
  };
  const marcaAnimada = {
    fontSize: progresso.interpolate({ inputRange: [0, 1], outputRange: [44, 24] }),
    lineHeight: progresso.interpolate({ inputRange: [0, 1], outputRange: [48, 28] }),
  };
  const fraseAnimada = {
    fontSize: progresso.interpolate({ inputRange: [0, 1], outputRange: [22, 15] }),
    lineHeight: progresso.interpolate({ inputRange: [0, 1], outputRange: [30, 22] }),
  };

  function limparErro(campo: Campo) {
    setErros((atuais) => ({ ...atuais, [campo]: undefined }));
    setErroGeral(null);
  }

  async function enviar() {
    if (enviando) return;

    const encontrados = validarLogin({ email, senha });
    setErros(encontrados);
    setErroGeral(null);
    if (encontrados.email || encontrados.senha) return;

    setEnviando(true);
    try {
      // BACKEND: aqui entra a autenticação (email, senha) → usuário e token.
      // A senha vai na requisição e continua sem ser gravada no aparelho.
      // Hoje `entrar` só guarda o e-mail; a senha morre com este componente.
      await entrar(normalizarEmail(email));
      router.replace(DESTINO_APOS_ENTRAR);
    } catch {
      setErroGeral("Não deu para guardar sua entrada. Tenta de novo.");
    } finally {
      setEnviando(false);
    }
  }

  async function entrarSemConta() {
    if (enviando) return;
    await entrarComoVisitante();
    router.replace(DESTINO_APOS_ENTRAR);
  }

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          bounces={false}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View
            style={[styles.bloco, blocoAnimado, { paddingTop: insets.top + 8 }]}
          >
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Voltar para a abertura"
              onPress={() => router.back()}
              hitSlop={8}
              style={({ pressed }) => [
                styles.voltar,
                pressed && styles.voltarPressionado,
              ]}
            >
              <Ionicons name="chevron-back" size={26} color={colors.onDark} />
            </Pressable>

            <View style={styles.blocoTexto}>
              <Animated.Text style={[styles.marca, marcaAnimada]}>
                Raízes
              </Animated.Text>
              <Animated.Text style={[styles.frase, fraseAnimada]}>
                Quem chega, chega com nome.
              </Animated.Text>
            </View>
          </Animated.View>

          <View
            style={[
              styles.folha,
              { paddingBottom: Math.max(insets.bottom, spacing.stackLg) + 8 },
            ]}
          >
            <View style={styles.campo}>
              <Text style={styles.rotulo}>E-mail</Text>
              <View
                style={[
                  styles.linha,
                  focado === "email" && styles.linhaFoco,
                  erros.email !== undefined && styles.linhaErro,
                ]}
              >
                <TextInput
                  style={styles.entrada}
                  value={email}
                  onChangeText={(texto) => {
                    setEmail(texto);
                    limparErro("email");
                  }}
                  onFocus={() => setFocado("email")}
                  onBlur={() => setFocado(null)}
                  onSubmitEditing={() => senhaRef.current?.focus()}
                  accessibilityLabel="E-mail"
                  placeholder="voce@exemplo.com"
                  placeholderTextColor={colors.tabInactive}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="email"
                  textContentType="emailAddress"
                  returnKeyType="next"
                  blurOnSubmit={false}
                  editable={!enviando}
                />
              </View>
              {erros.email !== undefined && (
                <Text style={styles.erroCampo} accessibilityLiveRegion="polite">
                  {erros.email}
                </Text>
              )}
            </View>

            <View style={styles.campo}>
              <Text style={styles.rotulo}>Senha</Text>
              <View
                style={[
                  styles.linha,
                  focado === "senha" && styles.linhaFoco,
                  erros.senha !== undefined && styles.linhaErro,
                ]}
              >
                <TextInput
                  ref={senhaRef}
                  style={styles.entrada}
                  value={senha}
                  onChangeText={(texto) => {
                    setSenha(texto);
                    limparErro("senha");
                  }}
                  onFocus={() => setFocado("senha")}
                  onBlur={() => setFocado(null)}
                  onSubmitEditing={enviar}
                  accessibilityLabel="Senha"
                  placeholder="Sua senha"
                  placeholderTextColor={colors.tabInactive}
                  secureTextEntry={!mostrarSenha}
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="password"
                  textContentType="password"
                  returnKeyType="done"
                  editable={!enviando}
                />
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={
                    mostrarSenha ? "Ocultar senha" : "Mostrar senha"
                  }
                  onPress={() => setMostrarSenha((atual) => !atual)}
                  style={styles.olho}
                >
                  <Ionicons
                    name={mostrarSenha ? "eye-off-outline" : "eye-outline"}
                    size={22}
                    color={colors.textMuted}
                  />
                </Pressable>
              </View>
              {erros.senha !== undefined && (
                <Text style={styles.erroCampo} accessibilityLiveRegion="polite">
                  {erros.senha}
                </Text>
              )}
            </View>

            {erroGeral !== null && (
              <View style={styles.aviso} accessibilityLiveRegion="assertive">
                <Ionicons
                  name="alert-circle-outline"
                  size={18}
                  color={colors.error}
                />
                <Text style={styles.avisoTexto}>{erroGeral}</Text>
              </View>
            )}

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Entrar na cidade"
              accessibilityState={{ disabled: enviando, busy: enviando }}
              disabled={enviando}
              onPress={enviar}
              style={({ pressed }) => [
                styles.primarioWrapper,
                pressed && styles.primarioPressionado,
              ]}
            >
              <LinearGradient
                colors={[colors.accent, colors.accentDark]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.primario}
              >
                {enviando ? (
                  <ActivityIndicator color={colors.onDark} />
                ) : (
                  <Text style={styles.primarioRotulo}>Entrar na cidade</Text>
                )}
              </LinearGradient>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Só dar uma olhada por hoje, sem conta"
              disabled={enviando}
              onPress={entrarSemConta}
              style={({ pressed }) => [
                styles.visitante,
                pressed && styles.visitantePressionado,
              ]}
            >
              <Text style={styles.visitanteRotulo}>Só dar uma olhada por hoje</Text>
            </Pressable>

            <Text style={styles.nota}>
              Por enquanto sua entrada fica só neste aparelho.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    // Terracota atrás de tudo: a área da barra de status e o "puxão" do
    // scroll no iOS ficam da cor do bloco, não brancos.
    backgroundColor: colors.accent,
  },
  flex: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
  },
  bloco: {
    paddingHorizontal: spacing.pageX,
    // A folha sobe `radius.sheet` por cima do bloco; o padding compensa para
    // a frase não ficar escondida atrás dela.
    paddingBottom: 40 + radius.sheet,
  },
  blocoTexto: {
    // Empurra marca e frase para o pé do bloco quando ele está alto.
    flex: 1,
    justifyContent: "flex-end",
    gap: spacing.stackSm,
  },
  voltar: {
    width: MIN_TOUCH,
    height: MIN_TOUCH,
    marginLeft: -10,
    marginBottom: spacing.stackLg,
    borderRadius: radius.button,
    alignItems: "center",
    justifyContent: "center",
  },
  voltarPressionado: {
    backgroundColor: colors.borderOnDark,
  },
  // Tamanho e entrelinha de marca e frase são animados no componente.
  marca: {
    fontFamily: fonts.extrabold,
    letterSpacing: -0.48,
    color: colors.onDark,
  },
  frase: {
    fontFamily: fonts.regular,
    color: colors.onAccentMuted,
    maxWidth: 300,
  },
  folha: {
    flex: 1,
    marginTop: -radius.sheet,
    paddingTop: 32,
    paddingHorizontal: spacing.pageX,
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    backgroundColor: colors.surface,
  },
  campo: {
    marginBottom: 22,
  },
  rotulo: {
    fontFamily: fonts.semibold,
    fontSize: 12,
    letterSpacing: 0.48,
    textTransform: "uppercase",
    color: colors.textMuted,
    marginBottom: 2,
  },
  linha: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: colors.inputBorder,
  },
  linhaFoco: {
    borderBottomWidth: 2,
    borderBottomColor: colors.inputBorderFocus,
  },
  linhaErro: {
    borderBottomWidth: 2,
    borderBottomColor: colors.error,
  },
  entrada: {
    flex: 1,
    // Mais alto que o mínimo de toque para a linha inferior respirar.
    height: 48,
    paddingVertical: 0,
    fontFamily: fonts.regular,
    fontSize: 17,
    color: colors.text,
    // Sem o anel azul do navegador na exportação web; a linha já mostra o foco.
    outlineWidth: 0,
  },
  olho: {
    width: MIN_TOUCH,
    height: MIN_TOUCH,
    marginRight: -10,
    alignItems: "center",
    justifyContent: "center",
  },
  erroCampo: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    lineHeight: 18,
    color: colors.error,
    marginTop: 6,
  },
  aviso: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.stackSm,
    padding: spacing.stackMd,
    marginBottom: spacing.stackLg,
    borderRadius: radius.input,
    backgroundColor: colors.errorSoft,
  },
  avisoTexto: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.error,
  },
  primarioWrapper: {
    marginTop: spacing.stackSm,
    borderRadius: radius.button,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 16,
    elevation: 6,
  },
  primarioPressionado: {
    transform: [{ scale: 0.97 }],
    shadowOpacity: 0.12,
  },
  primario: {
    height: 52,
    borderRadius: radius.button,
    alignItems: "center",
    justifyContent: "center",
  },
  primarioRotulo: {
    fontFamily: fonts.semibold,
    fontSize: 16,
    color: colors.onDark,
  },
  visitante: {
    minHeight: MIN_TOUCH,
    marginTop: spacing.stackSm,
    alignItems: "center",
    justifyContent: "center",
  },
  visitantePressionado: {
    opacity: 0.6,
  },
  visitanteRotulo: {
    fontFamily: fonts.semibold,
    fontSize: 15,
    color: colors.textMuted,
  },
  nota: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
    color: colors.textMuted,
    marginTop: spacing.stackSm,
  },
});
