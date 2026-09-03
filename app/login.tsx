import { useEffect, useRef, useState } from "react";
import {
  AccessibilityInfo,
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
  type TextStyle,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useSessao } from "../src/sessao/SessaoProvider";
import {
  credenciaisSaoValidas,
  normalizarEmail,
  validarLogin,
  type ErrosLogin,
} from "../src/sessao/validarLogin";
import {
  colors,
  fonts,
  gradients,
  MIN_TOUCH,
  radius,
  spacing,
} from "../src/theme/tokens";

// A mesma foto da abertura, com véu terracota: o login lembra de onde veio.
const FUNDO = require("../assets/images/splash-bg.jpg");

// Caminhos explícitos: `app/index.tsx` e `app/(tabs)/index.tsx` disputam "/".
// A conta identificada abre o perfil; quem entra como visitante continua na
// exploração, pois esse fluxo não passou pela validação de credenciais.
const DESTINO_APOS_LOGIN = "/(tabs)/perfil";
const DESTINO_VISITANTE = "/(tabs)/explorar";

// Em repouso o bloco terracota ocupa quase metade da tela e a marca é grande.
// Quando a pessoa toca num campo, ele encolhe para dar lugar ao teclado.
const DURACAO_TRANSICAO_MS = 280;
const PROPORCAO_BLOCO_ALTO = 0.44;

// Entrada escalonada: cada peça chega 80 ms depois da anterior, subindo 20 px.
const ENTRADA_INTERVALO_MS = 80;
const ENTRADA_DURACAO_MS = 280;
const ENTRADA_DESLOCAMENTO = 20;

// Opacidade e transform rodam na thread nativa no aparelho. A web não tem
// esse módulo e avisaria no console a cada animação.
const DRIVER_NATIVO = Platform.OS !== "web";

// Mola firme para o botão: assenta rápido, sem quicar.
const MOLA_BOTAO = { friction: 8, tension: 200, useNativeDriver: DRIVER_NATIVO } as const;

// Tempo do check de sucesso na tela antes de navegar.
const SUCESSO_PAUSA_MS = 420;

type Campo = "email" | "senha";

// Na web o navegador desenha um anel de foco próprio em volta do campo, e a
// linha inferior já mostra o foco. "none" não está no tipo do React Native,
// que só conhece os valores nativos, por isso o cast.
const semAnelDoNavegador =
  Platform.OS === "web"
    ? ({ outlineStyle: "none" } as unknown as TextStyle)
    : null;

function saudacaoPelaHora(hora: number): string {
  if (hora >= 5 && hora < 12) return "Bom dia.";
  if (hora >= 12 && hora < 18) return "Boa tarde.";
  return "Boa noite.";
}

// Retorno tátil é um extra: na web não existe e em aparelho sem motor a
// chamada rejeita. Nunca pode derrubar o fluxo de entrada.
function vibrar(acao: () => Promise<void>) {
  acao().catch(() => {});
}

function useReduzirMovimento(): boolean {
  const [reduzir, setReduzir] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduzir);
    const assinatura = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      setReduzir,
    );
    return () => assinatura.remove();
  }, []);

  return reduzir;
}

export default function Login() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { height: alturaTela } = useWindowDimensions();
  const { entrar, entrarComoVisitante } = useSessao();
  const reduzirMovimento = useReduzirMovimento();

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [focado, setFocado] = useState<Campo | null>(null);
  const [erros, setErros] = useState<ErrosLogin>({});
  const [erroGeral, setErroGeral] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [saudacao] = useState(() => saudacaoPelaHora(new Date().getHours()));

  const emailRef = useRef<TextInput>(null);
  const senhaRef = useRef<TextInput>(null);

  // 0 = bloco alto (repouso), 1 = bloco curto (digitando). Fica curto enquanto
  // houver algo digitado, para o toque no "olho" não fazer a tela pular.
  const compacto = focado !== null || email.length > 0 || senha.length > 0;
  const [progresso] = useState(() => new Animated.Value(0));

  // Uma por peça da tela, na ordem em que entram: texto do bloco, e-mail,
  // senha, botão, visitante.
  const [entrada] = useState(() =>
    Array.from({ length: 5 }, () => new Animated.Value(0)),
  );
  const [escalaBotao] = useState(() => new Animated.Value(1));
  const [escalaCheck] = useState(() => new Animated.Value(0));
  const [tremorEmail] = useState(() => new Animated.Value(0));
  const [tremorSenha] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (reduzirMovimento) {
      entrada.forEach((valor) => valor.setValue(1));
      return;
    }
    Animated.stagger(
      ENTRADA_INTERVALO_MS,
      entrada.map((valor) =>
        Animated.timing(valor, {
          toValue: 1,
          duration: ENTRADA_DURACAO_MS,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: DRIVER_NATIVO,
        }),
      ),
    ).start();
  }, [entrada, reduzirMovimento]);

  useEffect(() => {
    Animated.timing(progresso, {
      toValue: compacto ? 1 : 0,
      duration: reduzirMovimento ? 0 : DURACAO_TRANSICAO_MS,
      easing: Easing.out(Easing.cubic),
      // Altura e tamanho de fonte são layout: o driver nativo não anima.
      useNativeDriver: false,
    }).start();
  }, [compacto, progresso, reduzirMovimento]);

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
    fontSize: progresso.interpolate({ inputRange: [0, 1], outputRange: [24, 15] }),
    lineHeight: progresso.interpolate({ inputRange: [0, 1], outputRange: [32, 22] }),
  };

  function estiloEntrada(indice: number) {
    return {
      opacity: entrada[indice],
      transform: [
        {
          translateY: entrada[indice].interpolate({
            inputRange: [0, 1],
            outputRange: [ENTRADA_DESLOCAMENTO, 0],
          }),
        },
      ],
    };
  }

  function tremer(valor: Animated.Value) {
    if (reduzirMovimento) return;
    // Amplitude que cai (8, 8, 5, 5, 0): parece oscilação de verdade, não vibração.
    const passos = [8, -8, 5, -5, 0].map((x) =>
      Animated.timing(valor, { toValue: x, duration: 40, useNativeDriver: DRIVER_NATIVO }),
    );
    Animated.sequence(passos).start();
  }

  function limparErro(campo: Campo) {
    setErros((atuais) => ({ ...atuais, [campo]: undefined }));
    setErroGeral(null);
  }

  async function enviar() {
    if (enviando) return;

    const encontrados = validarLogin({ email, senha });
    setErros(encontrados);
    setErroGeral(null);
    if (encontrados.email || encontrados.senha) {
      if (encontrados.email) tremer(tremorEmail);
      if (encontrados.senha) tremer(tremorSenha);
      vibrar(() =>
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error),
      );
      // A região viva do texto só funciona no Android; no iOS o VoiceOver
      // precisa ouvir o erro explicitamente, e o foco vai para o primeiro
      // campo com problema.
      AccessibilityInfo.announceForAccessibility(
        [encontrados.email, encontrados.senha].filter(Boolean).join(" "),
      );
      (encontrados.email ? emailRef : senhaRef).current?.focus();
      return;
    }

    if (!credenciaisSaoValidas({ email, senha })) {
      const mensagem = "E-mail ou senha incorretos.";
      setErroGeral(mensagem);
      tremer(tremorEmail);
      tremer(tremorSenha);
      vibrar(() =>
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error),
      );
      AccessibilityInfo.announceForAccessibility(mensagem);
      emailRef.current?.focus();
      return;
    }

    setEnviando(true);
    try {
      // BACKEND: aqui entra a autenticação (email, senha) → usuário e token.
      // A senha vai na requisição e continua sem ser gravada no aparelho.
      // Hoje `entrar` só guarda o e-mail; a senha morre com este componente.
      await entrar(normalizarEmail(email));

      // Sucesso visível antes de navegar: o check cresce, o aparelho confirma.
      setSucesso(true);
      vibrar(() =>
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
      );
      if (!reduzirMovimento) {
        Animated.spring(escalaCheck, {
          toValue: 1,
          friction: 6,
          tension: 180,
          useNativeDriver: DRIVER_NATIVO,
        }).start();
        await new Promise((resolve) => setTimeout(resolve, SUCESSO_PAUSA_MS));
      } else {
        escalaCheck.setValue(1);
      }
      // `enviando` fica ligado de propósito: a tela some com o replace e um
      // segundo toque no botão durante a transição não pode entrar de novo.
      router.replace(DESTINO_APOS_LOGIN);
    } catch {
      const mensagem = "Não deu para guardar sua entrada. Tenta de novo.";
      setErroGeral(mensagem);
      AccessibilityInfo.announceForAccessibility(mensagem);
      vibrar(() =>
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error),
      );
      setEnviando(false);
    }
  }

  async function entrarSemConta() {
    if (enviando) return;
    setEnviando(true);
    vibrar(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));
    await entrarComoVisitante();
    router.replace(DESTINO_VISITANTE);
  }

  function voltar() {
    // Aberto por link direto não há para onde voltar; a abertura é o lugar.
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/");
    }
  }

  function pressionarBotao() {
    vibrar(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));
    if (reduzirMovimento) return;
    Animated.spring(escalaBotao, { toValue: 0.96, ...MOLA_BOTAO }).start();
  }

  function soltarBotao() {
    if (reduzirMovimento) return;
    Animated.spring(escalaBotao, { toValue: 1, ...MOLA_BOTAO }).start();
  }

  return (
    <View style={styles.screen}>
      <Image
        source={FUNDO}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        contentPosition="top"
        transition={300}
        accessible={false}
      />
      <LinearGradient
        colors={gradients.loginVeil.colors}
        locations={gradients.loginVeil.locations}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

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
              accessibilityState={{ disabled: enviando }}
              disabled={enviando}
              onPress={voltar}
              hitSlop={8}
              style={({ pressed }) => [
                styles.voltar,
                pressed && styles.voltarPressionado,
              ]}
            >
              <Ionicons name="chevron-back" size={26} color={colors.onDark} />
            </Pressable>

            <Animated.View style={[styles.blocoTexto, estiloEntrada(0)]}>
              <Text style={styles.saudacao}>{saudacao}</Text>
              <Animated.Text style={[styles.marca, marcaAnimada]}>
                Raízes
              </Animated.Text>
              <Animated.Text style={[styles.frase, fraseAnimada]}>
                Quem chega, chega com nome.
              </Animated.Text>
            </Animated.View>
          </Animated.View>

          <View
            style={[
              styles.folha,
              { paddingBottom: Math.max(insets.bottom, spacing.stackLg) + 8 },
            ]}
          >
            <Animated.View
              style={[
                styles.campo,
                estiloEntrada(1),
                { transform: [{ translateX: tremorEmail }] },
              ]}
            >
              <Text style={styles.rotulo}>E-mail</Text>
              <View
                style={[
                  styles.linha,
                  focado === "email" && styles.linhaFoco,
                  erros.email !== undefined && styles.linhaErro,
                ]}
              >
                <TextInput
                  ref={emailRef}
                  style={[styles.entrada, semAnelDoNavegador]}
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
                  placeholderTextColor={colors.textMuted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="email"
                  textContentType="emailAddress"
                  returnKeyType="next"
                  submitBehavior="submit"
                  editable={!enviando}
                />
              </View>
              {erros.email !== undefined && (
                <Text style={styles.erroCampo} accessibilityLiveRegion="polite">
                  {erros.email}
                </Text>
              )}
            </Animated.View>

            <Animated.View
              style={[
                styles.campo,
                estiloEntrada(2),
                { transform: [{ translateX: tremorSenha }] },
              ]}
            >
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
                  style={[styles.entrada, semAnelDoNavegador]}
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
                  placeholderTextColor={colors.textMuted}
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
            </Animated.View>

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

            <Animated.View style={estiloEntrada(3)}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Entrar na cidade"
                accessibilityState={{ disabled: enviando, busy: enviando }}
                disabled={enviando}
                onPressIn={pressionarBotao}
                onPressOut={soltarBotao}
                onPress={enviar}
              >
                <Animated.View
                  style={[
                    styles.primarioWrapper,
                    { transform: [{ scale: escalaBotao }] },
                  ]}
                >
                  <LinearGradient
                    colors={[colors.accent, colors.accentDark]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.primario}
                  >
                    {sucesso ? (
                      <Animated.View
                        style={{ transform: [{ scale: escalaCheck }] }}
                      >
                        <Ionicons
                          name="checkmark"
                          size={28}
                          color={colors.onDark}
                        />
                      </Animated.View>
                    ) : enviando ? (
                      <ActivityIndicator color={colors.onDark} />
                    ) : (
                      <Text style={styles.primarioRotulo}>Entrar na cidade</Text>
                    )}
                  </LinearGradient>
                </Animated.View>
              </Pressable>
            </Animated.View>

            <Animated.View style={estiloEntrada(4)}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Só dar uma olhada por hoje, sem conta"
                accessibilityState={{ disabled: enviando }}
                disabled={enviando}
                onPress={entrarSemConta}
                style={({ pressed }) => [
                  styles.visitante,
                  pressed && styles.visitantePressionado,
                ]}
              >
                <Text style={styles.visitanteRotulo}>
                  Só dar uma olhada por hoje
                </Text>
              </Pressable>

              <Text style={styles.nota}>
                Sua entrada fica só neste aparelho e funciona sem internet.
              </Text>
            </Animated.View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    // Cor do pé do véu atrás de tudo: a área da barra de status e o "puxão"
    // do scroll no iOS não ficam brancos.
    backgroundColor: colors.earth,
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
  saudacao: {
    fontFamily: fonts.semibold,
    fontSize: 12,
    letterSpacing: 0.48,
    textTransform: "uppercase",
    color: colors.onDarkSoft,
  },
  // Tamanho e entrelinha de marca e frase são animados no componente.
  marca: {
    fontFamily: fonts.extrabold,
    letterSpacing: -0.48,
    color: colors.onDark,
  },
  frase: {
    fontFamily: fonts.regular,
    color: colors.onDark,
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
    // Mais alto que o mínimo de toque para a linha inferior respirar. minHeight
    // e não height: fonte ampliada por acessibilidade precisa crescer o campo.
    minHeight: 48,
    paddingVertical: 0,
    fontFamily: fonts.regular,
    fontSize: 17,
    color: colors.text,
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
  primario: {
    minHeight: 52,
    borderRadius: radius.button,
    alignItems: "center",
    justifyContent: "center",
  },
  primarioRotulo: {
    fontFamily: fonts.semibold,
    fontSize: 16,
    color: colors.onDark,
  },
  // Mesmo peso do botão principal: quem só quer olhar não é cliente de
  // segunda classe. 48 como o botão fantasma da abertura.
  visitante: {
    minHeight: 48,
    marginTop: spacing.stackMd,
    borderRadius: radius.button,
    borderWidth: 1.5,
    borderColor: colors.surface3,
    alignItems: "center",
    justifyContent: "center",
  },
  visitantePressionado: {
    transform: [{ scale: 0.98 }],
    backgroundColor: colors.surface2,
  },
  visitanteRotulo: {
    fontFamily: fonts.semibold,
    fontSize: 15,
    color: colors.text,
  },
  nota: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
    color: colors.textMuted,
    marginTop: spacing.stackMd,
  },
});
