import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useSessao } from "../src/sessao/SessaoProvider";
import { cadastrar } from "../src/sessao/autenticar";
import {
  normalizarCadastro,
  validarCadastro,
  type DadosCadastro,
  type ErrosCadastro,
} from "../src/sessao/validarCadastro";
import {
  colors,
  fonts,
  MIN_TOUCH,
  radius,
  spacing,
} from "../src/theme/tokens";

const INICIAL: DadosCadastro = {
  nome: "",
  email: "",
  senha: "",
  confirmarSenha: "",
};

export default function Cadastro() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { entrar } = useSessao();
  const [dados, setDados] = useState(INICIAL);
  const [erros, setErros] = useState<ErrosCadastro>({});
  const [erroGeral, setErroGeral] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [emailConfirmacao, setEmailConfirmacao] = useState<string | null>(null);
  const emailRef = useRef<TextInput>(null);
  const senhaRef = useRef<TextInput>(null);
  const confirmarRef = useRef<TextInput>(null);

  function alterar(campo: keyof DadosCadastro, valor: string) {
    setDados((atuais) => ({ ...atuais, [campo]: valor }));
    setErros((atuais) => ({ ...atuais, [campo]: undefined }));
    setErroGeral(null);
  }

  async function enviar() {
    if (enviando) return;
    const encontrados = validarCadastro(dados);
    setErros(encontrados);
    setErroGeral(null);
    if (Object.keys(encontrados).length > 0) return;

    setEnviando(true);
    const normalizados = normalizarCadastro(dados);
    const resultado = await cadastrar(normalizados);

    if (!resultado.ok) {
      setErroGeral(resultado.mensagem);
      setEnviando(false);
      return;
    }

    if (resultado.precisaConfirmarEmail) {
      setEmailConfirmacao(resultado.email);
      setEnviando(false);
      return;
    }

    try {
      await entrar(resultado.email, resultado.nome);
      router.replace("/onboarding");
    } catch {
      setErroGeral("A conta foi criada, mas não foi possível iniciar a sessão.");
      setEnviando(false);
    }
  }

  if (emailConfirmacao) {
    return (
      <View
        style={[
          styles.sucesso,
          {
            paddingTop: Math.max(insets.top, 24),
            paddingBottom: Math.max(insets.bottom, 24),
          },
        ]}
      >
        <StatusBar style="dark" />
        <View style={styles.sucessoIcone}>
          <Ionicons name="mail-outline" size={40} color={colors.accent} />
        </View>
        <Text style={styles.sucessoTitulo}>Confira seu e-mail</Text>
        <Text style={styles.sucessoTexto}>
          Enviamos uma confirmação para {emailConfirmacao}. Abra o link e
          depois entre com sua nova conta.
        </Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.replace("/login")}
          style={styles.botao}
        >
          <Text style={styles.botaoTexto}>Voltar para entrar</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.tela}
    >
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={[
          styles.conteudo,
          {
            paddingTop: Math.max(insets.top, 16),
            paddingBottom: Math.max(insets.bottom, 24),
          },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Voltar para o login"
          onPress={() => router.back()}
          style={styles.voltar}
        >
          <Ionicons name="chevron-back" size={26} color={colors.text} />
        </Pressable>

        <Text style={styles.eyebrow}>SUA CONTA</Text>
        <Text style={styles.titulo}>Crie seu acesso ao Raízes</Text>
        <Text style={styles.subtitulo}>
          Guarde preferências e prepare sua experiência cultural.
        </Text>

        <View style={styles.formulario}>
          <Campo
            rotulo="Nome"
            valor={dados.nome}
            erro={erros.nome}
            placeholder="Como você quer ser chamado?"
            autoComplete="name"
            textContentType="name"
            returnKeyType="next"
            onChangeText={(valor) => alterar("nome", valor)}
            onSubmitEditing={() => emailRef.current?.focus()}
          />
          <Campo
            referencia={emailRef}
            rotulo="E-mail"
            valor={dados.email}
            erro={erros.email}
            placeholder="voce@exemplo.com"
            autoComplete="email"
            textContentType="emailAddress"
            keyboardType="email-address"
            autoCapitalize="none"
            returnKeyType="next"
            onChangeText={(valor) => alterar("email", valor)}
            onSubmitEditing={() => senhaRef.current?.focus()}
          />
          <Campo
            referencia={senhaRef}
            rotulo="Senha"
            valor={dados.senha}
            erro={erros.senha}
            placeholder="Pelo menos 8 caracteres"
            autoComplete="new-password"
            textContentType="newPassword"
            secureTextEntry={!mostrarSenha}
            autoCapitalize="none"
            returnKeyType="next"
            onChangeText={(valor) => alterar("senha", valor)}
            onSubmitEditing={() => confirmarRef.current?.focus()}
            acao={
              <BotaoOlho
                mostrar={mostrarSenha}
                onPress={() => setMostrarSenha((atual) => !atual)}
              />
            }
          />
          <Campo
            referencia={confirmarRef}
            rotulo="Confirmar senha"
            valor={dados.confirmarSenha}
            erro={erros.confirmarSenha}
            placeholder="Digite a senha novamente"
            autoComplete="new-password"
            textContentType="newPassword"
            secureTextEntry={!mostrarSenha}
            autoCapitalize="none"
            returnKeyType="done"
            onChangeText={(valor) => alterar("confirmarSenha", valor)}
            onSubmitEditing={enviar}
          />
        </View>

        {erroGeral ? (
          <View accessibilityLiveRegion="assertive" style={styles.aviso}>
            <Ionicons name="alert-circle-outline" size={19} color={colors.error} />
            <Text style={styles.avisoTexto}>{erroGeral}</Text>
          </View>
        ) : null}

        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: enviando, busy: enviando }}
          disabled={enviando}
          onPress={enviar}
          style={({ pressed }) => [
            styles.botao,
            enviando && styles.desabilitado,
            pressed && styles.pressionado,
          ]}
        >
          {enviando ? <ActivityIndicator color={colors.onDark} /> : null}
          <Text style={styles.botaoTexto}>
            {enviando ? "Criando conta…" : "Criar minha conta"}
          </Text>
        </Pressable>

        <View style={styles.jaTemConta}>
          <Text style={styles.jaTemContaTexto}>Já tem uma conta?</Text>
          <Pressable accessibilityRole="link" onPress={() => router.replace("/login")}>
            <Text style={styles.link}>Entrar</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

type CampoProps = React.ComponentProps<typeof TextInput> & {
  rotulo: string;
  valor: string;
  erro?: string;
  referencia?: React.RefObject<TextInput | null>;
  acao?: React.ReactNode;
};

function Campo({
  rotulo,
  valor,
  erro,
  referencia,
  acao,
  ...props
}: CampoProps) {
  return (
    <View style={styles.campo}>
      <Text style={styles.rotulo}>{rotulo}</Text>
      <View style={[styles.entradaLinha, erro && styles.entradaErro]}>
        <TextInput
          ref={referencia}
          value={valor}
          placeholderTextColor={colors.textMuted}
          style={styles.entrada}
          {...props}
        />
        {acao}
      </View>
      {erro ? <Text style={styles.erroCampo}>{erro}</Text> : null}
    </View>
  );
}

function BotaoOlho({
  mostrar,
  onPress,
}: {
  mostrar: boolean;
  onPress(): void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={mostrar ? "Ocultar senha" : "Mostrar senha"}
      onPress={onPress}
      style={styles.olho}
    >
      <Ionicons
        name={mostrar ? "eye-off-outline" : "eye-outline"}
        size={22}
        color={colors.textMuted}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: colors.surface },
  conteudo: {
    flexGrow: 1,
    paddingHorizontal: spacing.pageX,
  },
  voltar: {
    width: MIN_TOUCH,
    height: MIN_TOUCH,
    marginLeft: -10,
    alignItems: "center",
    justifyContent: "center",
  },
  eyebrow: {
    marginTop: 18,
    fontFamily: fonts.semibold,
    fontSize: 11,
    letterSpacing: 1.2,
    color: colors.accent,
  },
  titulo: {
    marginTop: 8,
    fontFamily: fonts.extrabold,
    fontSize: 28,
    lineHeight: 35,
    color: colors.text,
  },
  subtitulo: {
    marginTop: 8,
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 21,
    color: colors.textMuted,
  },
  formulario: { marginTop: 28, gap: 18 },
  campo: { gap: 4 },
  rotulo: {
    fontFamily: fonts.semibold,
    fontSize: 12,
    letterSpacing: 0.4,
    textTransform: "uppercase",
    color: colors.textMuted,
  },
  entradaLinha: {
    minHeight: 50,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: radius.input,
    backgroundColor: colors.surface,
    paddingHorizontal: 14,
  },
  entradaErro: { borderBottomWidth: 2, borderBottomColor: colors.error },
  entrada: {
    flex: 1,
    minHeight: 48,
    fontFamily: fonts.regular,
    fontSize: 16,
    color: colors.text,
  },
  olho: {
    width: MIN_TOUCH,
    height: MIN_TOUCH,
    alignItems: "center",
    justifyContent: "center",
  },
  erroCampo: { fontFamily: fonts.semibold, fontSize: 12, color: colors.error },
  aviso: {
    marginTop: 20,
    padding: 12,
    flexDirection: "row",
    gap: 8,
    borderRadius: radius.input,
    backgroundColor: colors.errorSoft,
  },
  avisoTexto: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 19,
    color: colors.error,
  },
  botao: {
    minHeight: 52,
    marginTop: 24,
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.button,
    backgroundColor: colors.accent,
  },
  botaoTexto: {
    fontFamily: fonts.semibold,
    fontSize: 16,
    color: colors.onDark,
  },
  desabilitado: { opacity: 0.65 },
  pressionado: { opacity: 0.86 },
  jaTemConta: {
    minHeight: MIN_TOUCH,
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  jaTemContaTexto: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.textMuted,
  },
  link: { fontFamily: fonts.semibold, fontSize: 13, color: colors.accentDark },
  sucesso: {
    flex: 1,
    paddingHorizontal: spacing.pageX,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface2,
  },
  sucessoIcone: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.accentSoft,
  },
  sucessoTitulo: {
    marginTop: 24,
    fontFamily: fonts.extrabold,
    fontSize: 27,
    color: colors.text,
  },
  sucessoTexto: {
    marginTop: 12,
    textAlign: "center",
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 22,
    color: colors.textMuted,
  },
});
