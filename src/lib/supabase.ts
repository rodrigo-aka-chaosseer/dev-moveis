/**
 * Cliente do Supabase. Existe só quando o `.env` tem a URL e a chave
 * pública do projeto (ver `.env.example`). Sem `.env`, `supabase` é `null`
 * e o app continua rodando com o mock local, para ninguém do grupo ficar
 * travado por configuração.
 *
 * A chave pública (`sb_publishable_...` ou `anon`) pode ir para o aparelho:
 * o que protege o dado é a Row Level Security no banco, não a chave.
 * A chave `service_role`/`sb_secret_...` nunca entra neste repositório.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { Platform } from "react-native";

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const chavePublica = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const supabaseConfigurado = Boolean(url && chavePublica);

export const supabase: SupabaseClient | null = supabaseConfigurado
  ? createClient(url!, chavePublica!, {
      auth: {
        // Na web o supabase-js usa localStorage sozinho. No aparelho,
        // AsyncStorage guarda a sessão entre aberturas do app.
        // BACKEND: trocar por expo-secure-store quando o build nativo existir.
        storage: Platform.OS === "web" ? undefined : AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    })
  : null;
