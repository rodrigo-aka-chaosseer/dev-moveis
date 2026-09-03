import { useEffect } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { SafeAreaProvider } from "react-native-safe-area-context";
import {
  useFonts,
  PlusJakartaSans_400Regular,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_800ExtraBold,
} from "@expo-google-fonts/plus-jakarta-sans";

import {
  SessaoProvider,
  useSessao,
  useSessaoInicial,
} from "../src/sessao/SessaoProvider";

// Segura a splash nativa até a fonte carregar. Sem isso dá pra ver o título
// piscando na fonte do sistema antes da Jakarta entrar. Também espera a
// sessão gravada: quem já entrou vai direto para as abas sem ver a abertura
// piscar antes.
SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_800ExtraBold,
  });
  const sessao = useSessaoInicial();

  // Se a fonte falhar, o app abre mesmo assim com a fonte do sistema. A
  // sessão nunca falha: storage quebrado vira "ninguém entrou".
  const pronto = (fontsLoaded || fontError !== null) && sessao.pronta;

  useEffect(() => {
    if (pronto) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [pronto]);

  if (!pronto) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <SessaoProvider sessaoInicial={sessao.sessaoInicial}>
        <StatusBar style="light" />
        <Rotas />
      </SessaoProvider>
    </SafeAreaProvider>
  );
}

// As guardas tiram da pilha o que não faz sentido para o estado atual: com
// sessão, a abertura some e "voltar" a partir das abas não cai nela; sem
// sessão, as abas não existem e um link direto para /mapa cai na abertura.
// O login fica sem guarda de propósito: ele precisa continuar montado depois
// de a sessão mudar, para mostrar o sucesso antes de navegar, e o visitante
// precisa alcançá-lo para entrar com conta. A ordem importa: quando a
// abertura some, o expo-router cai na primeira rota disponível, as abas.
function Rotas() {
  const { temSessao } = useSessao();

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={!temSessao}>
        <Stack.Screen name="index" />
      </Stack.Protected>
      <Stack.Protected guard={temSessao}>
        <Stack.Screen name="(tabs)" />
      </Stack.Protected>
      <Stack.Screen name="login" />
      <Stack.Screen name="onboarding" />
    </Stack>
  );
}
