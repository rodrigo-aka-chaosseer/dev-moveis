import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export function supabaseUrlDefinida(): boolean {
  return Boolean(process.env.EXPO_PUBLIC_SUPABASE_URL?.trim());
}

export function chaveSupabase(): string | undefined {
  const chave =
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
    process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();
  return chave || undefined;
}

export function criarClienteSupabase(): SupabaseClient {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim();
  const chave = chaveSupabase();
  if (!url || !chave) {
    throw new Error("Supabase não configurado.");
  }
  return createClient(url, chave);
}
