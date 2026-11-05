/**
 * Nome de cada tela para a aba do navegador e o leitor de tela (H2): nunca
 * o nome técnico da rota ("roteiro/[id]"). Lugar e roteiro trocam este
 * título pelo nome real quando carregam.
 */
const POR_ROTA: Record<string, string> = {
  "/explorar": "Explorar",
  "/mapa": "Mapa",
  "/roteiros": "Roteiros",
  "/perfil": "Perfil",
  "/roteiro/criar": "Criar roteiro",
  "/login": "Entrar",
  "/cadastro": "Criar conta",
  "/onboarding": "Suas preferências",
  "/localizacao": "Sua localização",
};

export const NOME_APP = "Raízes";

export function tituloDaRota(caminho: string, temSessao: boolean): string {
  const limpo = caminho.replace(/\/+$/, "") || "/";
  if (limpo === "/") return temSessao ? "Início" : NOME_APP;
  if (POR_ROTA[limpo]) return POR_ROTA[limpo];
  if (limpo.startsWith("/local/")) return "Lugar";
  if (limpo.startsWith("/roteiro/")) return "Roteiro";
  return NOME_APP;
}

/** "Casa do Benin · Raízes"; a tela de abertura fica só "Raízes". */
export function tituloDocumento(titulo: string): string {
  return titulo === NOME_APP ? NOME_APP : `${titulo} · ${NOME_APP}`;
}
