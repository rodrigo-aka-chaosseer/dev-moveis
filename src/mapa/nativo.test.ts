import { createElement } from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import MapaLugares from "./MapaLugares.native";
import { locais } from "../mocks/locais";

const mocks = vi.hoisted(() => ({
  constantes: { executionEnvironment: "standalone", expoConfig: { extra: { mapaAndroidConfigurado: true } } },
  animar: vi.fn(), selecionar: vi.fn(),
}));
vi.mock("react-native", () => ({
  ActivityIndicator: "ActivityIndicator", Pressable: "Pressable", Text: "Text", View: "View", Platform: { OS: "android" },
  StyleSheet: { create: (styles: unknown) => styles, absoluteFill: {} },
}));
vi.mock("expo-constants", () => ({ default: mocks.constantes, ExecutionEnvironment: { StoreClient: "storeClient" } }));
vi.mock("react-native-maps", async () => {
  const { createElement, forwardRef, useImperativeHandle } = await import("react");
  const MapView = forwardRef((props: { children?: import("react").ReactNode }, ref) => {
    useImperativeHandle(ref, () => ({ animateToRegion: mocks.animar }));
    return createElement("MapView", props, props.children);
  });
  return { default: MapView, Marker: "Marker" };
});
let tela: ReactTestRenderer;
const tipo = (nome: string) => nome as unknown as Parameters<ReactTestRenderer["root"]["findByType"]>[0];
const lista = locais.filter((local) => local.cidadeId === "salvador");
async function montar(coordenadas: { latitude: number; longitude: number } | null = null) {
  await act(async () => { tela = create(createElement(MapaLugares, {
    cidadeId: "salvador", locais: lista, coordenadas, selecionadoId: null, selecionar: mocks.selecionar,
  })); });
}
beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  mocks.constantes.expoConfig.extra.mapaAndroidConfigurado = true;
  vi.clearAllMocks(); vi.useFakeTimers();
});
afterEach(async () => { if (tela) await act(async () => tela.unmount()); vi.useRealTimers(); });

describe("mapa nativo", () => {
  it("cria um marcador por lugar e encaminha a seleção", async () => {
    await montar();
    const marcadores = tela.root.findAllByType(tipo("Marker"));
    expect(marcadores).toHaveLength(lista.length);
    await act(async () => marcadores[0].props.onPress());
    expect(mocks.selecionar).toHaveBeenCalledWith(lista[0].id);
  });
  it("só mostra o marcador do usuário quando há coordenadas", async () => {
    const coordenadas = { latitude: -12.97, longitude: -38.5 };
    await montar(coordenadas);
    const usuario = tela.root.findAllByType(tipo("Marker")).find((marker) => marker.props.identifier === "posicao-usuario");
    expect(usuario?.props.coordinate).toEqual(coordenadas);
  });
  it("oferece nova tentativa se os tiles não carregarem mesmo após mapReady", async () => {
    await montar();
    await act(async () => tela.root.findByType(tipo("MapView")).props.onMapReady());
    await act(async () => { vi.advanceTimersByTime(15000); });
    expect(JSON.stringify(tela.toJSON())).toContain("O mapa demorou para carregar");
    await act(async () => tela.root.findByType(tipo("Pressable")).props.onPress());
    expect(JSON.stringify(tela.toJSON())).not.toContain("O mapa demorou para carregar");
    await act(async () => tela.root.findByType(tipo("MapView")).props.onMapLoaded());
    expect(tela.root.findAllByType(tipo("ActivityIndicator"))).toHaveLength(0);
  });
  it("não monta Google Maps em build Android sem chave", async () => {
    mocks.constantes.expoConfig.extra.mapaAndroidConfigurado = false;
    await montar();
    expect(tela.root.findAllByType(tipo("MapView"))).toHaveLength(0);
    expect(JSON.stringify(tela.toJSON())).toContain("Mapa indisponível nesta versão");
  });
});
