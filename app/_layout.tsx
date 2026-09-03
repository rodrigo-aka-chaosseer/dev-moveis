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

import { SessaoProvider, useSessaoInicial } from "../src/sessao/SessaoProvider";

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
        <Stack screenOptions={{ headerShown: false }} />
      </SessaoProvider>
    </SafeAreaProvider>
  );
}
