import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { Platform } from "react-native";

const url = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim();
const chavePublica = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim();

export const supabaseConfigurado = Boolean(url && chavePublica);

if (__DEV__ && Boolean(url) !== Boolean(chavePublica)) {
  console.warn(
    "Configuração incompleta do Supabase: informe URL e chave pública juntas. O app continuará no modo local.",
  );
}

export const supabase: SupabaseClient | null = supabaseConfigurado
  ? createClient(url!, chavePublica!, {
      auth: {
        storage: Platform.OS === "web" ? undefined : AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    })
  : null;
