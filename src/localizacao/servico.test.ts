import { beforeEach, describe, expect, it, vi } from "vitest";

const location = vi.hoisted(() => ({
  requestForegroundPermissionsAsync: vi.fn(),
  hasServicesEnabledAsync: vi.fn(),
  getCurrentPositionAsync: vi.fn(),
}));

vi.mock("expo-location", () => ({
  ...location,
  PermissionStatus: { GRANTED: "granted" },
  Accuracy: { Balanced: 3 },
}));

// O mock do módulo nativo precisa ser registrado antes de carregar o serviço.
// eslint-disable-next-line import/first
import { solicitarLocalizacaoAtual } from "./servico";

describe("solicitarLocalizacaoAtual", () => {
  beforeEach(() => vi.clearAllMocks());

  it("informa quando o sistema não pode perguntar novamente", async () => {
    location.requestForegroundPermissionsAsync.mockResolvedValue({ status: "denied", canAskAgain: false });
    await expect(solicitarLocalizacaoAtual()).resolves.toEqual({
      tipo: "permissao_negada",
      podePerguntarNovamente: false,
    });
  });

  it("diferencia GPS desligado", async () => {
    location.requestForegroundPermissionsAsync.mockResolvedValue({ status: "granted", canAskAgain: true });
    location.hasServicesEnabledAsync.mockResolvedValue(false);
    await expect(solicitarLocalizacaoAtual()).resolves.toEqual({ tipo: "servico_desativado" });
  });

  it("obtém a posição quando permissão e serviço estão disponíveis", async () => {
    location.requestForegroundPermissionsAsync.mockResolvedValue({ status: "granted", canAskAgain: true });
    location.hasServicesEnabledAsync.mockResolvedValue(true);
    location.getCurrentPositionAsync.mockResolvedValue({
      coords: { latitude: -12.97, longitude: -38.5, accuracy: 20 },
      timestamp: 123,
    });
    await expect(solicitarLocalizacaoAtual()).resolves.toMatchObject({
      tipo: "sucesso",
      coordenadas: { latitude: -12.97, longitude: -38.5, precisaoMetros: 20 },
    });
  });

  it("trata falhas sem derrubar o aplicativo", async () => {
    location.requestForegroundPermissionsAsync.mockRejectedValue(new Error("falhou"));
    await expect(solicitarLocalizacaoAtual()).resolves.toEqual({ tipo: "erro" });
  });
});
